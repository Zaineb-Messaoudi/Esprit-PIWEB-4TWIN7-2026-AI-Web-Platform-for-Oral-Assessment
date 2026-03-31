import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_PIPE } from '@nestjs/core'; // ✅ Ajout
import { ValidationPipe } from '@nestjs/common'; // ✅ Ajout
import { Assignment, AssignmentSchema } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }]),
  ],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    // ✅ Validation globale (optionnel)
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}