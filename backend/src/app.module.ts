import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ add this
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { RubricsModule } from './rubrics/rubrics.module';
import { AiAnalysesModule } from './ai-analyses/ai-analyses.module';
import { ForumPostsModule } from './forum-posts/forum-posts.module';
import { EmailNotificationsModule } from './email-notifications/email-notifications.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // ✅ add this block
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/platformdb'),
    UsersModule,
    ClassesModule,
    SubmissionsModule,
    EvaluationsModule,
    RubricsModule,
    AiAnalysesModule,
    ForumPostsModule,
    EmailNotificationsModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
