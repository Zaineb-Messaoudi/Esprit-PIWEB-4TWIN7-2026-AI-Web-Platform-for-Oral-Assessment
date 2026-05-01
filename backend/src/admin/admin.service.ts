import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getAllUsers(role?: string) {
    if (role) return this.userModel.find({ role });
    return this.userModel.find();
  }

  async getUserById(id: string) {
    return this.userModel.findById(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.userModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );
  }

  async changeRole(id: string, role: string) {
    return this.userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    );
  }
}