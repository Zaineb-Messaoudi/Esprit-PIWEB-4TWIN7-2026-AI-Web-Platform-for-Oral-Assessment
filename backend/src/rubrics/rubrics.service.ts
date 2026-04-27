import { Injectable } from '@nestjs/common';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';

@Injectable()
export class RubricsService {
  create(createRubricDto: CreateRubricDto) {
    return 'This action adds a new rubric';
  }

  findAll() {
    return `This action returns all rubrics`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rubric`;
  }

  update(id: number, updateRubricDto: UpdateRubricDto) {
    return `This action updates a #${id} rubric`;
  }

  remove(id: number) {
    return `This action removes a #${id} rubric`;
  }
}
