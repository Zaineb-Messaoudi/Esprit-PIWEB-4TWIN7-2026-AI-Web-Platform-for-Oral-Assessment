import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@WebSocketGateway({
  cors: { origin: 'http://localhost:5173', credentials: true },
  namespace: '/sessions-live',
})
export class SessionsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // socketId → { sessionId, role, userId }
  private readonly meta = new Map<
    string,
    { sessionId: string; role: string; userId: string }
  >();

  // sessionId → teacher socket.id
  private readonly teachers = new Map<string, string>();

  // sessionId → current active student socket.id (for WebRTC relay)
  private readonly active = new Map<string, string>();

  // sessionId → Map<userId, socketId>
  private readonly studentSockets = new Map<string, Map<string, string>>();

  constructor(
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
  ) {}

  handleDisconnect(client: Socket): void {
    const info = this.meta.get(client.id);
    if (!info) return;

    if (this.teachers.get(info.sessionId) === client.id) {
      this.teachers.delete(info.sessionId);
    }

    if (this.active.get(info.sessionId) === client.id) {
      this.active.delete(info.sessionId);
    }

    const sessionStudents = this.studentSockets.get(info.sessionId);
    if (sessionStudents) {
      sessionStudents.delete(info.userId);
    }

    this.meta.delete(client.id);
  }

  @SubscribeMessage('join-session')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
      role: 'instructor' | 'student';
      userId: string;
    },
  ): Promise<void> {
    try {
      await this.sessionsService.findOne(data.sessionId);
    } catch {
      client.emit('error', { message: 'Session not found' });
      return;
    }

    client.join(`s:${data.sessionId}`);
    this.meta.set(client.id, data);

    if (data.role === 'instructor') {
      this.teachers.set(data.sessionId, client.id);
    } else {
      if (!this.studentSockets.has(data.sessionId)) {
        this.studentSockets.set(data.sessionId, new Map());
      }
      this.studentSockets.get(data.sessionId)!.set(data.userId, client.id);
    }

    client.emit('joined', { ok: true });
  }

  // Called by SessionsService after startSession() / nextStudent()
  notifyStudentTurn(
    sessionId: string,
    studentId: string,
    durationSeconds: number,
    mediaType: 'audio' | 'video' | 'both',
  ): void {
    const studentSocket = this.studentSockets.get(sessionId)?.get(studentId);
    const payload = { studentId, durationSeconds, mediaType };

    if (studentSocket) {
      this.server.to(studentSocket).emit('your-turn', payload);
    } else {
      // Student not connected yet — broadcast to room; student filters by own ID
      this.server.to(`s:${sessionId}`).emit('your-turn', payload);
    }
  }

  // Teacher manually triggers a student's turn from the LivePanel
  @SubscribeMessage('call-student')
  handleCall(
    @MessageBody()
    data: {
      sessionId: string;
      studentId: string;
      durationSeconds: number;
      mediaType: 'audio' | 'video' | 'both';
    },
  ): void {
    this.notifyStudentTurn(
      data.sessionId,
      data.studentId,
      data.durationSeconds,
      data.mediaType,
    );
  }

  // Student → Teacher: SDP offer
  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; offer: unknown },
  ): void {
    const tid = this.teachers.get(data.sessionId);
    if (!tid) return;
    this.active.set(data.sessionId, client.id);
    this.server.to(tid).emit('webrtc-offer', { offer: data.offer });
  }

  // Teacher → Student: SDP answer
  @SubscribeMessage('webrtc-answer')
  handleAnswer(
    @MessageBody() data: { sessionId: string; answer: unknown },
  ): void {
    const sid = this.active.get(data.sessionId);
    if (sid) {
      this.server.to(sid).emit('webrtc-answer', { answer: data.answer });
    }
  }

  // ICE relay — both directions
  @SubscribeMessage('ice-candidate')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
      candidate: unknown;
      to: 'teacher' | 'student';
    },
  ): void {
    const target =
      data.to === 'teacher'
        ? this.teachers.get(data.sessionId)
        : this.active.get(data.sessionId);

    if (target && target !== client.id) {
      this.server
        .to(target)
        .emit('ice-candidate', { candidate: data.candidate });
    }
  }

  // Teacher ends the current student's turn
  @SubscribeMessage('end-turn')
  handleEndTurn(@MessageBody() data: { sessionId: string }): void {
    const sid = this.active.get(data.sessionId);
    if (sid) {
      this.server.to(sid).emit('turn-ended', { reason: 'teacher-cut' });
      this.active.delete(data.sessionId);
    }
  }
}
