import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsGateway } from './comments.gateway';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsGateway]
})
export class CommentsModule {}