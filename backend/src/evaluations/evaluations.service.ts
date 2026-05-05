import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Evaluation,
  EvaluationCriterionScore,
  EvaluationDocument,
} from './entities/evaluation.entity';
import {
  CreateEvaluationDto,
  CriterionScoreInputDto,
} from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import {
  Submission,
  SubmissionDocument,
  SubmissionStatus,
} from '../submissions/entities/submission.entity';
import { Rubric, RubricDocument } from '../rubrics/entities/rubric.entity';
import {
  AIAnalysis,
  AIAnalysisDocument,
} from '../ai-analyses/entities/ai-analysis.entity';
import { Class, ClassDocument } from '../classes/entities/class.entity';
import { UserRole } from '../users/entities/user.entity';

type AuthActor = {
  userId: string;
  role: UserRole;
};

type CriterionDefinition = {
  name: string;
  description?: string;
  maxScore: number;
};

type EvaluationSummary = {
  criterionScores: EvaluationCriterionScore[];
  scores: Record<string, number>;
  maxRubricScore: number;
  totalAiScore: number;
  totalInstructorScore: number;
  totalFinalScore: number;
  overallScore: number;
};

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<EvaluationDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Rubric.name)
    private readonly rubricModel: Model<RubricDocument>,
    @InjectModel(AIAnalysis.name)
    private readonly aiAnalysisModel: Model<AIAnalysisDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
  ) {}

  // ─── Utility helpers ──────────────────────────────────────────────────────

  private toObjectId(
    id: string | Types.ObjectId,
    field = 'id',
  ): Types.ObjectId {
    if (id instanceof Types.ObjectId) return id;
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private asNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException('Scores must be valid numbers');
    }
    return value;
  }

  private clampPercentage(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private normalizeScore(
    value: unknown,
    maxScore: number,
    label: string,
  ): number | null {
    const numeric = this.asNullableNumber(value);
    if (numeric === null) return null;
    if (numeric < 0 || numeric > maxScore) {
      throw new BadRequestException(
        `${label} must be between 0 and ${maxScore}`,
      );
    }
    return this.round(numeric);
  }

  private average(
    values: Array<number | null | undefined>,
  ): number | undefined {
    const filtered = values.filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    );
    if (!filtered.length) return undefined;
    return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  }

  private extractNumericValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object') return undefined;

    const record = value as Record<string, unknown>;
    const preferredKeys = [
      'overallScore',
      'score',
      'value',
      'average',
      'confidence',
      'engagement',
    ];

    for (const key of preferredKeys) {
      const nested = this.extractNumericValue(record[key]);
      if (nested !== undefined) return nested;
    }
    for (const nested of Object.values(record)) {
      const numeric = this.extractNumericValue(nested);
      if (numeric !== undefined) return numeric;
    }
    return undefined;
  }

  private toCriterionScore(
    maxScore: number,
    percentage?: number,
  ): number | null {
    if (percentage === undefined) return null;
    return this.round((this.clampPercentage(percentage) / 100) * maxScore);
  }

  private computePacePercentage(speechRate?: number): number | undefined {
    if (speechRate === undefined || !Number.isFinite(speechRate))
      return undefined;
    const ideal = 135,
      tolerance = 25,
      maxDeviation = 85;
    const deviation = Math.abs(speechRate - ideal);
    if (deviation <= tolerance) return 100;
    return this.clampPercentage(
      100 - ((deviation - tolerance) / maxDeviation) * 100,
    );
  }

  private computePausePercentage(
    pauseFrequency?: number,
    averagePauseDuration?: number,
  ): number | undefined {
    const frequencyScore =
      pauseFrequency === undefined
        ? undefined
        : this.clampPercentage(100 - pauseFrequency * 6);
    const durationScore =
      averagePauseDuration === undefined
        ? undefined
        : this.clampPercentage(
            100 - Math.max(0, averagePauseDuration - 0.8) * 40,
          );
    return this.average([frequencyScore, durationScore]);
  }

  private computeFillerPercentage(
    fillerWords?: { word: string; count: number }[],
  ): number | undefined {
    if (!fillerWords?.length) return undefined;
    const total = fillerWords.reduce((sum, item) => sum + (item.count || 0), 0);
    return this.clampPercentage(100 - total * 8);
  }

  private computeBodyLanguagePercentage(
    aiAnalysis: AIAnalysisDocument | null,
  ): number | undefined {
    if (!aiAnalysis) return undefined;
    return this.average([
      this.extractNumericValue(aiAnalysis.bodyLanguage),
      this.extractNumericValue(aiAnalysis.emotionDetection),
    ]);
  }

  private inferAiScore(
    criterion: CriterionDefinition,
    aiAnalysis: AIAnalysisDocument | null,
  ): number | null {
    if (!aiAnalysis) return null;

    const text =
      `${criterion.name} ${criterion.description ?? ''}`.toLowerCase();
    const mentions = (...keywords: string[]) =>
      keywords.some((keyword) => text.includes(keyword));

    const pauseAverage = aiAnalysis.pauseDuration?.average;
    const pacePercentage = this.computePacePercentage(aiAnalysis.speechRate);
    const pausePercentage = this.computePausePercentage(
      aiAnalysis.pauseFrequency,
      pauseAverage,
    );
    const fillerPercentage = this.computeFillerPercentage(
      aiAnalysis.fillerWords,
    );
    const fluencyPercentage = this.average([
      pacePercentage,
      pausePercentage,
      fillerPercentage,
    ]);
    const bodyLanguagePercentage =
      this.computeBodyLanguagePercentage(aiAnalysis);

    let percentage: number | undefined;

    if (mentions('pronunciation', 'prononciation', 'articulation', 'accent')) {
      percentage = aiAnalysis.pronunciationScore;
    } else if (
      mentions('confidence', 'assurance', 'self confidence', 'confiance')
    ) {
      percentage = aiAnalysis.confidenceScore;
    } else if (
      mentions('fluency', 'fluidity', 'aisance', 'flow', 'coherence')
    ) {
      percentage = fluencyPercentage;
    } else if (
      mentions('speech rate', 'debit', 'débit', 'pace', 'rhythm', 'rythme')
    ) {
      percentage = pacePercentage;
    } else if (mentions('pause', 'silence', 'hesitation', 'hésitation')) {
      percentage = pausePercentage;
    } else if (mentions('filler', 'parasite', 'uh', 'um')) {
      percentage = fillerPercentage;
    } else if (
      mentions(
        'body language',
        'langage corporel',
        'gesture',
        'gestures',
        'posture',
        'eye contact',
        'regard',
      )
    ) {
      percentage = bodyLanguagePercentage;
    } else if (
      mentions('emotion', 'expressiveness', 'engagement', 'presence')
    ) {
      percentage = this.average([
        aiAnalysis.confidenceScore,
        bodyLanguagePercentage,
      ]);
    } else {
      percentage = this.average([
        aiAnalysis.pronunciationScore,
        aiAnalysis.confidenceScore,
        fluencyPercentage,
        bodyLanguagePercentage,
      ]);
    }

    return this.toCriterionScore(criterion.maxScore, percentage);
  }

  private lookupLegacyScore(
    scores: Record<string, number> | undefined,
    key: string,
  ): number | undefined {
    if (!scores) return undefined;

    const value = scores[key];
    return typeof value === 'number' ? value : undefined;
  }

  private assertKnownCriteria(
    rubric: RubricDocument,
    criterionScores?: CriterionScoreInputDto[],
    legacyScores?: Record<string, number>,
  ): void {
    const knownKeys = new Set(rubric.criteria.map((c) => c.key));

    for (const criterion of criterionScores ?? []) {
      if (!knownKeys.has(criterion.key)) {
        throw new BadRequestException(
          `Unknown rubric criterion key "${criterion.key}"`,
        );
      }
    }

    if (legacyScores) {
      for (const key of Object.keys(legacyScores)) {
        if (!knownKeys.has(key)) {
          throw new BadRequestException(
            `Unknown legacy criterion key "${key}"`,
          );
        }
      }
    }
  }

  private buildCriterionScores(
    rubric: RubricDocument,
    aiInsightsUsed: boolean,
    aiAnalysis: AIAnalysisDocument | null,
    criterionInputs?: CriterionScoreInputDto[],
    legacyScores?: Record<string, number>,
    existingCriterionScores: EvaluationCriterionScore[] = [],
  ): EvaluationCriterionScore[] {
    this.assertKnownCriteria(rubric, criterionInputs, legacyScores);

    const providedByKey = new Map(
      (criterionInputs ?? []).map((c) => [c.key, c]),
    );

    const existingByKey = new Map(
      existingCriterionScores.map((c) => [c.key, c]),
    );

    return rubric.criteria.map((criterion) => {
      const key = criterion.key;

      const provided = providedByKey.get(key);
      const existing = existingByKey.get(key);

      const aiScore = this.normalizeScore(
        aiInsightsUsed
          ? (existing?.aiScore ?? this.inferAiScore(criterion, aiAnalysis))
          : null,
        criterion.maxScore,
        `${criterion.name} AI score`,
      );

      const instructorScore = this.normalizeScore(
        provided?.instructorScore ?? existing?.instructorScore,
        criterion.maxScore,
        `${criterion.name} instructor score`,
      );

      const finalScore = this.normalizeScore(
        provided?.finalScore ??
          instructorScore ??
          existing?.finalScore ??
          aiScore,
        criterion.maxScore,
        `${criterion.name} final score`,
      );

      const overrideApplied =
        aiScore !== null &&
        finalScore !== null &&
        Math.abs(finalScore - aiScore) > 0.01;

      return {
        key,
        name: criterion.name,
        description: criterion.description ?? '',
        maxScore: criterion.maxScore,
        aiScore,
        instructorScore,
        finalScore,
        overrideApplied,
        overrideReason: provided?.overrideReason ?? existing?.overrideReason,
        comments: provided?.comments ?? existing?.comments ?? '',
      };
    });
  }

  private buildEvaluationSummary(
    rubric: RubricDocument,
    criterionScores: EvaluationCriterionScore[],
  ): EvaluationSummary {
    const scores = Object.fromEntries(
      criterionScores.map((criterion) => [
        criterion.name,
        criterion.finalScore ?? 0,
      ]),
    );
    const maxRubricScore = this.round(
      rubric.criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0),
    );
    const totalAiScore = this.round(
      criterionScores.reduce(
        (sum, criterion) => sum + (criterion.aiScore ?? 0),
        0,
      ),
    );
    const totalInstructorScore = this.round(
      criterionScores.reduce(
        (sum, criterion) => sum + (criterion.instructorScore ?? 0),
        0,
      ),
    );
    const totalFinalScore = this.round(
      criterionScores.reduce(
        (sum, criterion) => sum + (criterion.finalScore ?? 0),
        0,
      ),
    );
    const overallScore =
      maxRubricScore > 0
        ? this.round((totalFinalScore / maxRubricScore) * 100)
        : 0;

    return {
      criterionScores,
      scores,
      maxRubricScore,
      totalAiScore,
      totalInstructorScore,
      totalFinalScore,
      overallScore,
    };
  }

  // ─── Loaders ──────────────────────────────────────────────────────────────

  private async getSubmissionAndClass(submissionId: string | Types.ObjectId) {
    const submission = await this.submissionModel.findById(
      this.toObjectId(submissionId, 'submission id'),
    );
    if (!submission) throw new NotFoundException('Submission not found');

    const classDoc = await this.classModel.findById(submission.classId);
    if (!classDoc)
      throw new NotFoundException('Class not found for this submission');

    return { submission, classDoc };
  }

  private async getRubric(rubricId: string | Types.ObjectId) {
    const rubric = await this.rubricModel.findById(
      this.toObjectId(rubricId, 'rubric id'),
    );
    if (!rubric || !rubric.isActive)
      throw new NotFoundException('Rubric not found');
    if (!rubric.criteria.length) {
      throw new BadRequestException(
        'Rubric must contain at least one criterion before it can be used',
      );
    }
    return rubric;
  }

  private async getAiAnalysis(submissionId: Types.ObjectId) {
    return this.aiAnalysisModel.findOne({ submissionId }).exec();
  }

  // ─── Access guards ────────────────────────────────────────────────────────

  private assertCanManageEvaluation(
    classDoc: ClassDocument,
    actor: AuthActor,
  ): void {
    if (actor.role === UserRole.ADMIN) return;
    if (
      actor.role !== UserRole.INSTRUCTOR ||
      classDoc.instructorId.toString() !== actor.userId
    ) {
      throw new ForbiddenException(
        'Only the class instructor can manage this evaluation',
      );
    }
  }

  private assertCanReadEvaluation(
    evaluation: EvaluationDocument,
    submission: SubmissionDocument,
    classDoc: ClassDocument,
    actor: AuthActor,
  ): void {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.INSTRUCTOR) {
      if (classDoc.instructorId.toString() !== actor.userId) {
        throw new ForbiddenException(
          'You do not have access to this evaluation',
        );
      }
      return;
    }
    if (
      actor.role === UserRole.STUDENT &&
      submission.studentId.toString() === actor.userId &&
      evaluation.status === 'submitted'
    ) {
      return;
    }
    throw new ForbiddenException('You do not have access to this evaluation');
  }

  // ─── Pre-submission checks ────────────────────────────────────────────────

  private ensureReadyForSubmission(evaluation: EvaluationDocument): void {
    const missing = evaluation.criterionScores.filter(
      (criterion) =>
        criterion.finalScore === null || criterion.finalScore === undefined,
    );
    if (missing.length) {
      throw new BadRequestException(
        `Cannot submit evaluation. Missing final scores for: ${missing.map((c) => c.name).join(', ')}`,
      );
    }
  }

  private ensureCriterionScoresReadyForSubmission(
    criterionScores: EvaluationCriterionScore[],
  ): void {
    const missing = criterionScores.filter(
      (criterion) =>
        criterion.finalScore === null || criterion.finalScore === undefined,
    );
    if (missing.length) {
      throw new BadRequestException(
        `Cannot submit evaluation. Missing final scores for: ${missing.map((c) => c.name).join(', ')}`,
      );
    }
  }

  // ─── Submission sync ──────────────────────────────────────────────────────

  /**
   * Writes the evaluation result back to the submission.
   *
   * Grade priority:
   *  1. manualGrade  — explicit 0-20 instructor override
   *  2. finalGrade   — legacy computed value
   *  3. derived      — (totalFinalScore / maxRubricScore) * 20
   *
   * Status is taken from targetSubmissionStatus (defaults to GRADED).
   */
  private async syncSubmissionAfterSubmission(
    evaluation: EvaluationDocument,
  ): Promise<void> {
    const numericGrade =
      evaluation.grade ??
      (evaluation.maxRubricScore > 0
        ? this.round(
            (evaluation.totalFinalScore / evaluation.maxRubricScore) * 20,
          )
        : 0);

    const targetStatus =
      (evaluation.targetSubmissionStatus as SubmissionStatus) ??
      SubmissionStatus.GRADED;

    await this.submissionModel.findByIdAndUpdate(evaluation.submissionId, {
      grade: this.round(numericGrade),
      gradeFeedback: evaluation.writtenFeedback ?? '',
      status: targetStatus,
    });
  }

  // ─── Populate helper ──────────────────────────────────────────────────────

  private async populateEvaluation(id: string) {
    const evaluation = await this.evaluationModel
      .findById(this.toObjectId(id, 'evaluation id'))
      .populate('submissionId')
      .populate('instructorId', 'firstName lastName email username')
      .populate('rubricId')
      .exec();

    if (!evaluation) throw new NotFoundException(`Evaluation ${id} not found`);
    return evaluation;
  }

  // ─── Payload builder ──────────────────────────────────────────────────────

  private buildEvaluationPayload(
    dto: CreateEvaluationDto | UpdateEvaluationDto,
    rubric: RubricDocument,
    aiAnalysis: AIAnalysisDocument | null,
    existing?: EvaluationDocument,
  ) {
    const aiInsightsUsed =
      dto.aiInsightsUsed ?? existing?.aiInsightsUsed ?? !!aiAnalysis;

    const criterionScores = this.buildCriterionScores(
      rubric,
      aiInsightsUsed,
      aiAnalysis,
      dto.criterionScores,
      dto.scores,
      existing?.criterionScores ?? [],
    );
    const summary = this.buildEvaluationSummary(rubric, criterionScores);

    return {
      ...summary,
      writtenFeedback: dto.writtenFeedback ?? existing?.writtenFeedback ?? '',
      finalGrade:
        dto.finalGrade ?? existing?.finalGrade ?? summary.totalFinalScore,
      // manualGrade: null means "no override — use computed"
      grade:
        dto.grade !== undefined && dto.grade !== null
          ? dto.grade
          : (existing?.grade ??
            (summary.maxRubricScore > 0
              ? this.round(
                  (summary.totalFinalScore / summary.maxRubricScore) * 20,
                )
              : 0)),
      targetSubmissionStatus:
        dto.targetSubmissionStatus ??
        existing?.targetSubmissionStatus ??
        'graded',
      status: dto.status ?? existing?.status ?? 'draft',
      aiInsightsUsed,
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async create(dto: CreateEvaluationDto, actor: AuthActor) {
    const { submission, classDoc } = await this.getSubmissionAndClass(
      dto.submissionId,
    );
    this.assertCanManageEvaluation(classDoc, actor);

    const existing = await this.evaluationModel.findOne({
      submissionId: submission._id,
    });
    if (existing) {
      throw new ConflictException(
        'An evaluation already exists for this submission',
      );
    }

    const rubric = await this.getRubric(dto.rubricId);
    const aiAnalysis = await this.getAiAnalysis(submission._id);
    const payload = this.buildEvaluationPayload(dto, rubric, aiAnalysis);

    if (payload.status === 'submitted') {
      this.ensureCriterionScoresReadyForSubmission(payload.criterionScores);
    }

    const evaluation = await this.evaluationModel.create({
      submissionId: submission._id,
      instructorId: this.toObjectId(actor.userId, 'instructor id'),
      rubricId: rubric._id,
      ...payload,
      evaluationDate: new Date(),
    });

    if (evaluation.status === 'submitted') {
      await this.syncSubmissionAfterSubmission(evaluation);
    }

    return this.populateEvaluation(evaluation._id.toString());
  }

  async findAll(actor: AuthActor) {
    if (actor.role === UserRole.ADMIN) {
      return this.evaluationModel
        .find()
        .populate('submissionId')
        .populate('instructorId', 'firstName lastName email username')
        .populate('rubricId')
        .sort({ createdAt: -1 })
        .exec();
    }

    return this.evaluationModel
      .find({ instructorId: this.toObjectId(actor.userId, 'instructor id') })
      .populate('submissionId')
      .populate('rubricId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, actor: AuthActor) {
    const evaluation = await this.evaluationModel.findById(
      this.toObjectId(id, 'evaluation id'),
    );
    if (!evaluation) throw new NotFoundException(`Evaluation ${id} not found`);

    const { submission, classDoc } = await this.getSubmissionAndClass(
      evaluation.submissionId,
    );
    this.assertCanReadEvaluation(evaluation, submission, classDoc, actor);

    return this.populateEvaluation(id);
  }

  async findBySubmission(submissionId: string, actor: AuthActor) {
    const evaluation = await this.evaluationModel.findOne({
      submissionId: this.toObjectId(submissionId, 'submission id'),
    });

    if (!evaluation) {
      throw new NotFoundException(
        `No evaluation found for submission ${submissionId}`,
      );
    }

    const { submission, classDoc } = await this.getSubmissionAndClass(
      evaluation.submissionId,
    );
    this.assertCanReadEvaluation(evaluation, submission, classDoc, actor);

    return this.populateEvaluation(evaluation._id.toString());
  }

  /**
   * Returns all rubrics the instructor has access to, sorted so that
   * rubrics explicitly linked to the submission's assignment appear first
   * with an `isRecommended` flag.  Universal rubrics (no assignmentIds)
   * are also flagged as recommended since they apply everywhere.
   */
  async getAvailableRubrics(submissionId: string, actor: AuthActor) {
    const { submission } = await this.getSubmissionAndClass(submissionId);

    const query: Record<string, unknown> = { isActive: true };
    if (actor.role !== UserRole.ADMIN) {
      query.createdBy = this.toObjectId(actor.userId);
    }

    const rubrics = await this.rubricModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    const assignmentId = submission.assignmentId?.toString() ?? null;

    return rubrics
      .map((rubric) => {
        const obj = rubric.toObject<{ assignmentIds?: Types.ObjectId[] }>();
        const assignmentIds = obj.assignmentIds;
        const hasFilter =
          Array.isArray(assignmentIds) && assignmentIds.length > 0;
        const isRecommended =
          !hasFilter ||
          (assignmentId != null &&
            assignmentIds.some(
              (id: Types.ObjectId) => id.toString() === assignmentId,
            ));
        return { ...obj, isRecommended };
      })
      .sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended));
  }

  async findByInstructor(instructorId: string, actor: AuthActor) {
    if (
      actor.role !== UserRole.ADMIN &&
      actor.userId !== this.toObjectId(instructorId, 'instructor id').toString()
    ) {
      throw new ForbiddenException(
        'You do not have access to these evaluations',
      );
    }

    return this.evaluationModel
      .find({ instructorId: this.toObjectId(instructorId, 'instructor id') })
      .populate('submissionId')
      .populate('rubricId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStudent(studentId: string, actor: AuthActor) {
    if (actor.role === UserRole.STUDENT && actor.userId !== studentId) {
      throw new ForbiddenException(
        'You do not have access to these evaluations',
      );
    }
    if (actor.role !== UserRole.STUDENT && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the student or an admin can access this view',
      );
    }

    const allEvaluations = await this.evaluationModel
      .find({ status: 'submitted' })
      .populate('submissionId')
      .populate('instructorId', 'firstName lastName email username')
      .populate('rubricId')
      .sort({ createdAt: -1 })
      .exec();

    return allEvaluations.filter((evaluation) => {
      const submission =
        evaluation.submissionId as unknown as SubmissionDocument | null;
      if (!submission || !submission.studentId) return false;
      return submission.studentId.toString() === studentId;
    });
  }

  async update(id: string, dto: UpdateEvaluationDto, actor: AuthActor) {
    const evaluation = await this.evaluationModel.findById(
      this.toObjectId(id, 'evaluation id'),
    );
    if (!evaluation) throw new NotFoundException(`Evaluation ${id} not found`);

    const { submission, classDoc } = await this.getSubmissionAndClass(
      evaluation.submissionId,
    );
    this.assertCanManageEvaluation(classDoc, actor);

    const rubric = await this.getRubric(
      dto.rubricId ? dto.rubricId : evaluation.rubricId,
    );
    const aiAnalysis = await this.getAiAnalysis(submission._id);
    const payload = this.buildEvaluationPayload(
      dto,
      rubric,
      aiAnalysis,
      evaluation,
    );

    if (payload.status === 'submitted') {
      this.ensureCriterionScoresReadyForSubmission(payload.criterionScores);
    }

    evaluation.rubricId = rubric._id;
    evaluation.criterionScores = payload.criterionScores;
    evaluation.scores = payload.scores;
    evaluation.maxRubricScore = payload.maxRubricScore;
    evaluation.totalAiScore = payload.totalAiScore;
    evaluation.totalInstructorScore = payload.totalInstructorScore;
    evaluation.totalFinalScore = payload.totalFinalScore;
    evaluation.overallScore = payload.overallScore;
    evaluation.finalGrade = payload.finalGrade;
    evaluation.grade = payload.grade;
    evaluation.targetSubmissionStatus = payload.targetSubmissionStatus;
    evaluation.writtenFeedback = payload.writtenFeedback;
    evaluation.status = payload.status;
    evaluation.aiInsightsUsed = payload.aiInsightsUsed;

    await evaluation.save();

    if (evaluation.status === 'submitted') {
      await this.syncSubmissionAfterSubmission(evaluation);
    }

    return this.populateEvaluation(evaluation._id.toString());
  }

  async updateFeedback(id: string, writtenFeedback: string, actor: AuthActor) {
    const evaluation = await this.evaluationModel.findById(
      this.toObjectId(id, 'evaluation id'),
    );
    if (!evaluation) throw new NotFoundException(`Evaluation ${id} not found`);

    const { classDoc } = await this.getSubmissionAndClass(
      evaluation.submissionId,
    );
    this.assertCanManageEvaluation(classDoc, actor);

    evaluation.writtenFeedback = writtenFeedback;
    await evaluation.save();

    if (evaluation.status === 'submitted') {
      await this.syncSubmissionAfterSubmission(evaluation);
    }

    return this.populateEvaluation(evaluation._id.toString());
  }

  async submitEvaluation(id: string, actor: AuthActor) {
    const evaluation = await this.evaluationModel.findById(
      this.toObjectId(id, 'evaluation id'),
    );
    if (!evaluation) throw new NotFoundException(`Evaluation ${id} not found`);

    const { classDoc } = await this.getSubmissionAndClass(
      evaluation.submissionId,
    );
    this.assertCanManageEvaluation(classDoc, actor);
    this.ensureReadyForSubmission(evaluation);

    evaluation.status = 'submitted';
    evaluation.evaluationDate = new Date();
    await evaluation.save();
    await this.syncSubmissionAfterSubmission(evaluation);

    return this.populateEvaluation(evaluation._id.toString());
  }

  async remove(id: string, actor: AuthActor) {
    const evaluation = await this.evaluationModel.findById(
      this.toObjectId(id, 'evaluation id'),
    );
    if (!evaluation) throw new NotFoundException(`Evaluation ${id} not found`);

    const { classDoc } = await this.getSubmissionAndClass(
      evaluation.submissionId,
    );
    this.assertCanManageEvaluation(classDoc, actor);

    await this.evaluationModel.deleteOne({ _id: evaluation._id });
    return { message: `Evaluation ${id} deleted successfully` };
  }

  async getClassStatistics(classId: string, actor: AuthActor) {
    const classDoc = await this.classModel.findById(
      this.toObjectId(classId, 'class id'),
    );
    if (!classDoc) throw new NotFoundException('Class not found');
    this.assertCanManageEvaluation(classDoc, actor);

    const submissions = await this.submissionModel
      .find({ classId: classDoc._id, status: SubmissionStatus.GRADED })
      .exec();
    const submissionIds = submissions.map((s) => s._id);

    const evaluations = await this.evaluationModel
      .find({ submissionId: { $in: submissionIds }, status: 'submitted' })
      .populate('submissionId')
      .exec();

    const stats = {
      totalEvaluations: evaluations.length,
      averageOverallScore:
        this.average(evaluations.map((e) => e.overallScore)) ?? 0,
      averageAiScore: this.average(evaluations.map((e) => e.totalAiScore)) ?? 0,
      averageInstructorScore:
        this.average(evaluations.map((e) => e.totalInstructorScore)) ?? 0,
      overrideRate:
        (evaluations.filter((e) =>
          e.criterionScores.some((c) => c.overrideApplied),
        ).length /
          evaluations.length) *
        100,
      scoreDistribution: this.calculateScoreDistribution(evaluations),
      criterionAverages: this.calculateCriterionAverages(evaluations),
      aiInsightsUsageRate:
        (evaluations.filter((e) => e.aiInsightsUsed).length /
          evaluations.length) *
        100,
    };

    return stats;
  }

  private calculateScoreDistribution(evaluations: EvaluationDocument[]) {
    const ranges = [
      { label: '0-20%', min: 0, max: 20, count: 0 },
      { label: '21-40%', min: 21, max: 40, count: 0 },
      { label: '41-60%', min: 41, max: 60, count: 0 },
      { label: '61-80%', min: 61, max: 80, count: 0 },
      { label: '81-100%', min: 81, max: 100, count: 0 },
    ];
    evaluations.forEach((evaluation) => {
      const score = evaluation.overallScore;
      const range = ranges.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });
    return ranges;
  }

  private calculateCriterionAverages(evaluations: EvaluationDocument[]) {
    const criterionMap = new Map<string, number[]>();
    evaluations.forEach((evaluation) => {
      evaluation.criterionScores.forEach((criterion) => {
        if (criterion.finalScore != null) {
          if (!criterionMap.has(criterion.name))
            criterionMap.set(criterion.name, []);
          criterionMap.get(criterion.name)!.push(criterion.finalScore);
        }
      });
    });
    return Array.from(criterionMap.entries()).map(([name, scores]) => ({
      name,
      average: this.average(scores) ?? 0,
      count: scores.length,
    }));
  }
}
