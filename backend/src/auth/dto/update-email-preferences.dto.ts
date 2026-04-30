import { IsBoolean } from 'class-validator';

export class UpdateEmailPreferencesDto {
  @IsBoolean()
  emailNotificationsEnabled: boolean;
}
