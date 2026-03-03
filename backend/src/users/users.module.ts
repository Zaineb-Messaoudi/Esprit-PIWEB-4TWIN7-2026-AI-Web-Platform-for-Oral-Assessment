import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity'; // Vérifie que le chemin est correct

@Module({
  imports: [
    // Enregistre le modèle User pour qu'il soit utilisable
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule] , // TRÈS IMPORTANT : permet à AuthModule d'utiliser UsersService
})
export class UsersModule {} // <-- Vérifie bien l'orthographe exacte