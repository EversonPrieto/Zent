import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { ActivityModule } from './activity/activity.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { InvitesModule } from './invites/invites.module';
import { EmailModule } from './common/email/email.module';
import { LabelsModule } from './labels/labels.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { BillingModule } from './billing/billing.module';
import { LimitsModule } from './limits/limits.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmailModule,
    CloudinaryModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    ActivityModule,
    InvitesModule,
    LabelsModule,
    AttachmentsModule,
    BillingModule,
    LimitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
