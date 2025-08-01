import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationService } from './services/notification.service';
import { 
  RegisterDeviceTokenDto,
  UpdateNotificationPreferencesDto,
  UpdateChatNotificationSettingDto,
  SendChatNotificationDto,
  SendGroupNotificationDto,
  ManageTopicSubscriptionDto,
  GetNotificationHistoryDto,
} from './dto/notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // ================================
  // DEVICE TOKEN MANAGEMENT
  // ================================

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(
    @Request() req,
    @Body() tokenData: RegisterDeviceTokenDto,
  ) {
    await this.notificationService.registerDeviceToken(req.user.id, tokenData);
    return { message: 'Device token registered successfully' };
  }

  @Post('device-token/remove')
  @HttpCode(HttpStatus.OK)
  async removeDeviceToken(@Request() req) {
    await this.notificationService.removeDeviceToken(req.user.id);
    return { message: 'Device token removed successfully' };
  }

  // ================================
  // NOTIFICATION PREFERENCES
  // ================================

  @Get('preferences')
  async getNotificationPreferences(@Request() req) {
    const preferences = await this.notificationService.getNotificationPreferences(req.user.id);
    return { preferences };
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updateNotificationPreferences(
    @Request() req,
    @Body() preferences: UpdateNotificationPreferencesDto,
  ) {
    await this.notificationService.updateNotificationPreferences(req.user.id, preferences);
    return { message: 'Notification preferences updated successfully' };
  }

  // ================================
  // CHAT NOTIFICATION SETTINGS
  // ================================

  @Put('chat-settings')
  @HttpCode(HttpStatus.OK)
  async updateChatNotificationSetting(
    @Request() req,
    @Body() setting: UpdateChatNotificationSettingDto,
  ) {
    await this.notificationService.updateChatNotificationSetting(req.user.id, setting);
    return { message: 'Chat notification setting updated successfully' };
  }

  @Get('chat-settings/:chatId/:chatType/muted')
  async isChatMuted(
    @Request() req,
    @Param('chatId') chatId: string,
    @Param('chatType') chatType: 'private' | 'group',
  ) {
    const isMuted = await this.notificationService.isChatMuted(req.user.id, chatId, chatType);
    return { isMuted };
  }

  // ================================
  // NOTIFICATION HISTORY (Optional)
  // ================================

  @Get('history')
  async getNotificationHistory(
    @Request() req,
    @Query() query: GetNotificationHistoryDto,
  ) {
    // This would require implementing the history retrieval in the service
    // For now, return empty array
    return { 
      notifications: [], 
      total: 0,
      message: 'Notification history feature coming soon' 
    };
  }

  // ================================
  // TOPIC SUBSCRIPTION MANAGEMENT
  // ================================

  @Post('topics/subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async subscribeToTopic(
    @Request() req,
    @Body() data: { topicName: string },
  ) {
    await this.notificationService.subscribeToTopic(req.user.id, data.topicName);
    return { message: `Successfully subscribed to topic ${data.topicName}` };
  }

  @Post('topics/unsubscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unsubscribeFromTopic(
    @Request() req,
    @Body() data: { topicName: string },
  ) {
    await this.notificationService.unsubscribeFromTopic(req.user.id, data.topicName);
    return { message: `Successfully unsubscribed from topic ${data.topicName}` };
  }

  @Post('topics/manage')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async manageTopicSubscription(
    @Request() req,
    @Body() data: Omit<ManageTopicSubscriptionDto, 'userId'>,
  ) {
    await this.notificationService.manageTopicSubscription({
      userId: req.user.id,
      ...data,
    });
    return { 
      message: `Successfully ${data.subscribe ? 'subscribed to' : 'unsubscribed from'} topic ${data.topicName}` 
    };
  }

  // ================================
  // TESTING ENDPOINTS (Development only)
  // ================================

  @Post('test/chat-notification')
  @HttpCode(HttpStatus.OK)
  async testChatNotification(@Body() data: SendChatNotificationDto) {
    await this.notificationService.sendChatNotification(data);
    return { message: 'Test notification sent' };
  }

  @Post('test/group-notification')
  @HttpCode(HttpStatus.OK)
  async testGroupNotification(@Body() data: SendGroupNotificationDto) {
    await this.notificationService.sendGroupNotification(data);
    return { message: 'Test group notification sent to topic' };
  }
}
