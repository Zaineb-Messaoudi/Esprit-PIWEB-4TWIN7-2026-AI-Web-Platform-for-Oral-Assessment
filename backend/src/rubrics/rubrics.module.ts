import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rubric, RubricSchema } from './entities/rubric.entity';
import { RubricsService } from './rubrics.service';
import { RubricsController } from './rubrics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rubric.name, schema: RubricSchema }]),
  ],
  controllers: [RubricsController],
  providers: [RubricsService],
  exports: [RubricsService],
})
export class RubricsModule {}