import { IsString, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Event emitted when a user joins a chat room/group
 */
export class UserJoinedGroupEventDto {
  @IsString()
  roomId: string;

  @IsString()
  userId: string;

  @IsEnum(['GROUP', 'CLASS', 'SECTION'])
  roomType: 'GROUP' | 'CLASS' | 'SECTION';

  @Type(() => Date)
  timestamp: Date;
}

/**
 * Event emitted when a user leaves a chat room/group
 */
export class UserLeftGroupEventDto {
  @IsString()
  roomId: string;

  @IsString()
  userId: string;

  @IsEnum(['GROUP', 'CLASS', 'SECTION'])
  roomType: 'GROUP' | 'CLASS' | 'SECTION';

  @Type(() => Date)
  timestamp: Date;
}

/**
 * Event emitted when a new chat room is created
 */
export class RoomCreatedEventDto {
  @IsString()
  roomId: string;

  @IsEnum(['GROUP', 'CLASS', 'SECTION'])
  roomType: 'GROUP' | 'CLASS' | 'SECTION';

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @IsString()
  createdBy: string;

  @Type(() => Date)
  timestamp: Date;
}

/**
 * Event emitted when a chat room is deleted
 */
export class RoomDeletedEventDto {
  @IsString()
  roomId: string;

  @IsEnum(['GROUP', 'CLASS', 'SECTION'])
  roomType: 'GROUP' | 'CLASS' | 'SECTION';

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @IsString()
  deletedBy: string;

  @Type(() => Date)
  timestamp: Date;
}

/**
 * Event emitted when a user enrolls in a class (triggers class room subscription)
 */
export class UserEnrolledClassEventDto {
  @IsString()
  classId: string;

  @IsString()
  userId: string;

  @IsString()
  courseCode: string;

  @Type(() => Date)
  timestamp: Date;
}

/**
 * Event emitted when a user is removed from a class
 */
export class UserRemovedClassEventDto {
  @IsString()
  classId: string;

  @IsString()
  userId: string;

  @IsString()
  courseCode: string;

  @Type(() => Date)
  timestamp: Date;
}
