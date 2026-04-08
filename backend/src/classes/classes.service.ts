import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Class, ClassDocument } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name)
    private classModel: Model<ClassDocument>,
  ) {}

  async create(dto: CreateClassDto): Promise<Class> {
    const created = new this.classModel(dto);
    return created.save();
  }

  async findAll(): Promise<Class[]> {
    return this.classModel.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} class`;
  }

  update(id: number, dto: any) {
    return `This action updates a #${id} class`;
  }

  remove(id: number) {
    return `This action removes a #${id} class`;
  }
}