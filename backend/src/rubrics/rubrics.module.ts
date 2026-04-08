import { Module } from '@nestjs/common';
import { RubricsService } from './rubrics.service';
import { RubricsController } from './rubrics.controller';
import { Rubric, RubricSchema } from './entities/rubric.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rubric.name, schema: RubricSchema }]),
  ],
  controllers: [RubricsController],
  providers: [RubricsService],
})
export class RubricsModule {}
