import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_PIPE } from '@nestjs/core'; // ✅ Ajout
import { ValidationPipe } from '@nestjs/common'; // ✅ Ajout
import { Assignment, AssignmentSchema } from './entities/assignement.entity';
import { AssignmentsService } from './assignements.service';
import { AssignmentsController } from './assignements.controller';
import { Class, ClassSchema } from '../classes/entities/class.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Class.name, schema: ClassSchema }, // 👈 Add this
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
