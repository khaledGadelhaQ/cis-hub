import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "prisma/prisma.service";
import { NotificationService } from "../../notifications/services/notification.service";
import { ChatEventEmitterService } from "./chat-event-emitter.service";
import { 
  ClassCreatedEventDto, 
  ClassUpdatedEventDto, 
  ClassDeletedEventDto 
} from "../dto/class-events.dto";
import { 
  SectionCreatedEventDto, 
  SectionUpdatedEventDto, 
  SectionDeletedEventDto 
} from "../dto/section-events.dto";
import { 
  ProfessorAssignedEventDto, 
  ProfessorRemovedEventDto 
} from "../dto/professor-events.dto";
import { 
  EnrollmentCreatedEventDto, 
  EnrollmentRemovedEventDto 
} from "../dto/enrollment-events.dto";
import { RoomType } from "../../../common/enums/room_type.enum";
import { RoomMemberRole } from "../../../common/enums/room_member_role.enum";

@Injectable()
export class ChatAutomationService {
  private readonly logger = new Logger(ChatAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService, // 🆕 Inject notification service
    private readonly chatEventEmitter: ChatEventEmitterService, // 🆕 Inject event emitter for notifications
  ) {}

  // ================================
  // CLASS EVENTS
  // ================================

  @OnEvent('class.created')
  async handleClassCreatedEvent(payload: ClassCreatedEventDto) {
    try {
      this.logger.log(`Creating chat room for class: ${payload.courseCode}`);

      // Create the chat room for the class
      const chatRoom = await this.prisma.chatRoom.create({
        data: {
          name: `${payload.courseName} - ${payload.departmentCode}:${payload.targetYear} `,
          description: `Chat room for ${payload.courseName} `,
          type: RoomType.CLASS,
          courseClassId: payload.classId,
          isActive: true,
          isMessagingEnabled: true,
        },
      });

      // Get all enrolled students and assigned professors for this class
      const enrollments = await this.prisma.courseEnrollment.findMany({
        where: { classId: payload.classId },
        select: { userId: true },
      });

      const professors = await this.prisma.classProfessor.findMany({
        where: { classId: payload.classId },
        select: { professorId: true },
      });

      // Combine all member IDs
      const memberIds = [
        ...enrollments.map(e => e.userId),
        ...professors.map(p => p.professorId),
      ];

      // 🆕 Emit room created event for notification subscriptions
      if (memberIds.length > 0) {
        await this.chatEventEmitter.emitRoomCreated({
          roomId: chatRoom.id,
          roomType: 'CLASS',
          memberIds,
          createdBy: 'system', // System-created room
          timestamp: new Date(),
        });

        this.logger.log(
          `Emitted room created event for class room ${chatRoom.id} with ${memberIds.length} members`
        );
      }

      this.logger.log(`Successfully created chat room ${chatRoom.id} for class ${payload.classId}`);
      return chatRoom;
    } catch (error) {
      this.logger.error(`Failed to create chat room for class ${payload.classId}:`, error);
      // Don't throw - we don't want to break the class creation
    }
  }

  @OnEvent('class.updated')
  async handleClassUpdatedEvent(payload: ClassUpdatedEventDto) {
    try {
      this.logger.log(`Updating chat room for class: ${payload.classId}`);

      // Update room name in case course details changed
      await this.prisma.chatRoom.updateMany({
        where: { 
          courseClassId: payload.classId,
          type: RoomType.CLASS,
        },
        data: {
          name: `${payload.courseCode} - ${payload.departmentCode}:${payload.targetYear} `,
          description: `Chat room for ${payload.courseName} `,
        },
      });

      this.logger.log(`Successfully updated chat room for class ${payload.classId}`);
    } catch (error) {
      this.logger.error(`Failed to update chat room for class ${payload.classId}:`, error);
    }
  }

  @OnEvent('class.deleted')
  async handleClassDeletedEvent(payload: ClassDeletedEventDto) {
    try {
      this.logger.log(`Deactivating chat room for deleted class: ${payload.classId}`);

      // Deactivate the room instead of deleting (preserve message history)
      await this.prisma.chatRoom.updateMany({
        where: { 
          courseClassId: payload.classId,
          type: RoomType.CLASS,
        },
        data: {
          isActive: false,
          isMessagingEnabled: false,
        },
      });

      this.logger.log(`Successfully deactivated chat room for class ${payload.classId}`);
    } catch (error) {
      this.logger.error(`Failed to deactivate chat room for class ${payload.classId}:`, error);
    }
  }

  // ================================
  // SECTION EVENTS
  // ================================

  @OnEvent('section.created')
  async handleSectionCreatedEvent(payload: SectionCreatedEventDto) {
    try {
      this.logger.log(`Creating/updating TA section room for: ${payload.courseCode} - TA ${payload.taFirstName} ${payload.taLastName}`);

      // Check if TA already has a room for this course
      let chatRoom = await this.prisma.chatRoom.findFirst({
        where: {
          taId: payload.taId,
          courseId: payload.courseId,
          type: RoomType.SECTION,
        },
      });

      if (chatRoom) {
        this.logger.log(`TA already has a room for this course, using existing room ${chatRoom.id}`);
      } else {
        // Create new section room for this TA + course combination
        chatRoom = await this.prisma.chatRoom.create({
          data: {
            name: `${payload.courseCode} - ${payload.departmentCode}:${payload.targetYear} - Eng. ${payload.taFirstName} ${payload.taLastName} Sections`,
            description: `Section groups for ${payload.courseName} taught by TA ${payload.taFirstName} ${payload.taLastName}`,
            type: RoomType.SECTION,
            taId: payload.taId,
            courseId: payload.courseId,
            isActive: true,
            isMessagingEnabled: true,
          },
        });

        // Add TA as ADMIN to the room
        await this.prisma.roomMember.create({
          data: {
            roomId: chatRoom.id,
            userId: payload.taId,
            role: RoomMemberRole.ADMIN,
          },
        });

        this.logger.log(`Successfully created section chat room ${chatRoom.id} for TA ${payload.taId}`);
      }

      return chatRoom;
    } catch (error) {
      this.logger.error(`Failed to create/update section room for TA ${payload.taId}:`, error);
    }
  }

  @OnEvent('section.updated')
  async handleSectionUpdatedEvent(payload: SectionUpdatedEventDto) {
    try {
      this.logger.log(`Handling section update for section ${payload.sectionId}`);

      // If TA changed, we need to move the section to a different room
      if (payload.previousTaId && payload.previousTaId !== payload.taId) {
        this.logger.log(`TA changed from ${payload.previousTaId} to ${payload.taId} for section ${payload.sectionId}`);

        // Find students in this section and move them to the new TA's room
        const sectionStudents = await this.prisma.courseEnrollment.findMany({
          where: {
            sectionId: payload.sectionId,
            role: 'STUDENT',
          },
          select: { userId: true },
        });

        // Remove students from old TA's room
        const oldRoom = await this.prisma.chatRoom.findFirst({
          where: {
            taId: payload.previousTaId,
            courseId: payload.courseId,
            type: RoomType.SECTION,
          },
        });

        if (oldRoom) {
          await this.prisma.roomMember.deleteMany({
            where: {
              roomId: oldRoom.id,
              userId: { in: sectionStudents.map(s => s.userId) },
            },
          });
        }

        // Add students to new TA's room (create room if needed)
        await this.handleSectionCreatedEvent(payload as SectionCreatedEventDto);
        
        // Add students to the new room
        for (const student of sectionStudents) {
          await this.addUserToSectionRoom(payload.courseId, payload.taId, student.userId);
        }
      }

      this.logger.log(`Successfully handled section update for section ${payload.sectionId}`);
    } catch (error) {
      this.logger.error(`Failed to handle section update for section ${payload.sectionId}:`, error);
    }
  }

  @OnEvent('section.deleted')
  async handleSectionDeletedEvent(payload: SectionDeletedEventDto) {
    try {
      this.logger.log(`Handling section deletion for section ${payload.sectionId}`);

      // Check if TA has other sections in this course
      const otherSections = await this.prisma.courseSection.findMany({
        where: {
          courseId: payload.courseId,
          taId: payload.taId,
          id: { not: payload.sectionId },
        },
      });

      if (otherSections.length === 0) {
        // TA has no other sections in this course, deactivate the room
        await this.prisma.chatRoom.updateMany({
          where: {
            taId: payload.taId,
            courseId: payload.courseId,
            type: RoomType.SECTION,
          },
          data: {
            isActive: false,
            isMessagingEnabled: false,
          },
        });

        this.logger.log(`Deactivated section room for TA ${payload.taId} in course ${payload.courseId}`);
      } else {
        this.logger.log(`TA still has other sections, keeping room active`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle section deletion for section ${payload.sectionId}:`, error);
    }
  }

  // ================================
  // PROFESSOR EVENTS
  // ================================

  @OnEvent('professor.assigned')
  async handleProfessorAssignedEvent(payload: ProfessorAssignedEventDto) {
    try {
      this.logger.log(`Adding professor ${payload.professorId} to class room for class ${payload.classId}`);

      // Use existing utility function with PROFESSOR role (maps to ADMIN)
      await this.addUserToClassRoom(payload.classId, payload.professorId, 'PROFESSOR');

      this.logger.log(`Successfully added professor ${payload.professorId} to class room`);
    } catch (error) {
      this.logger.error(`Failed to add professor ${payload.professorId} to class room:`, error);
    }
  }

  @OnEvent('professor.removed')
  async handleProfessorRemovedEvent(payload: ProfessorRemovedEventDto) {
    try {
      this.logger.log(`Removing professor ${payload.professorId} from class room for class ${payload.classId}`);

      // Find the class room
      const classRoom = await this.prisma.chatRoom.findFirst({
        where: {
          courseClassId: payload.classId,
          type: RoomType.CLASS,
        },
      });

      if (!classRoom) {
        this.logger.warn(`No chat room found for class ${payload.classId}`);
        return;
      }

      // Remove professor from the room
      await this.prisma.roomMember.deleteMany({
        where: {
          roomId: classRoom.id,
          userId: payload.professorId,
        },
      });

      this.logger.log(`Successfully removed professor ${payload.professorId} from class room ${classRoom.id}`);
    } catch (error) {
      this.logger.error(`Failed to remove professor ${payload.professorId} from class room:`, error);
    }
  }

  // ================================
  // ENROLLMENT EVENTS
  // ================================

  @OnEvent('enrollment.created')
  async handleEnrollmentCreatedEvent(payload: EnrollmentCreatedEventDto) {
    try {
      this.logger.log(`Adding user ${payload.userId} to chat rooms for enrollment ${payload.enrollmentId}`);

      // Add user to class room if classId is provided
      if (payload.classId) {
        await this.addUserToClassRoom(payload.classId, payload.userId, payload.role);
        
        // 🆕 Emit notification event for class enrollment
        await this.chatEventEmitter.emitUserEnrolledClass({
          classId: payload.classId,
          userId: payload.userId,
          courseCode: payload.courseCode || 'Unknown',
          timestamp: new Date(),
        });

        // 🆕 Emit user joined group event for topic subscription
        const classRoom = await this.prisma.chatRoom.findFirst({
          where: { courseClassId: payload.classId, type: RoomType.CLASS },
        });
        
        if (classRoom) {
          await this.chatEventEmitter.emitUserJoinedGroup({
            roomId: classRoom.id,
            userId: payload.userId,
            roomType: 'CLASS',
            timestamp: new Date(),
          });
        }
      }

      // Add user to section room if sectionId is provided
      if (payload.sectionId) {
        await this.addUserToSectionRoom(payload.courseId, payload.userId, payload.sectionId);
        
        // 🆕 Emit user joined group event for section room
        const section = await this.prisma.courseSection.findUnique({
          where: { id: payload.sectionId },
          select: { taId: true },
        });

        if (section) {
          const sectionRoom = await this.prisma.chatRoom.findFirst({
            where: {
              taId: section.taId,
              courseId: payload.courseId,
              type: RoomType.SECTION,
            },
          });

          if (sectionRoom) {
            await this.chatEventEmitter.emitUserJoinedGroup({
              roomId: sectionRoom.id,
              userId: payload.userId,
              roomType: 'SECTION',
              timestamp: new Date(),
            });
          }
        }
      }

      this.logger.log(`Successfully added user ${payload.userId} to chat rooms and notification topics`);
    } catch (error) {
      this.logger.error(`Failed to add user ${payload.userId} to chat rooms:`, error);
    }
  }

    @OnEvent('enrollment.removed')
  async handleEnrollmentRemovedEvent(payload: EnrollmentRemovedEventDto) {
    try {
      this.logger.log(`Removing user ${payload.userId} from chat rooms for enrollment ${payload.enrollmentId}`);

      // Find the class room and section room the user was removed from
      const roomsToRemoveFrom = await this.prisma.chatRoom.findMany({
        where: {
          OR: [
            // Class room
            payload.classId ? { courseClassId: payload.classId, type: RoomType.CLASS } : {},
            // Section room (if available)
            payload.sectionId
              ? {
                  courseId: payload.courseId,
                  type: RoomType.SECTION,
                  taId: {
                    in: await this.prisma.courseSection
                      .findUnique({
                        where: { id: payload.sectionId },
                        select: { taId: true },
                      })
                      .then(section => (section ? [section.taId] : [])),
                  },
                }
              : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
      });

      // Remove from room members and emit notification events
      for (const room of roomsToRemoveFrom) {
        await this.prisma.roomMember.deleteMany({
          where: {
            roomId: room.id,
            userId: payload.userId,
          },
        });

        // 🆕 Emit user left group event for topic unsubscription
        await this.chatEventEmitter.emitUserLeftGroup({
          roomId: room.id,
          userId: payload.userId,
          roomType: room.type === RoomType.CLASS ? 'CLASS' : 'SECTION',
          timestamp: new Date(),
        });
      }

      // 🆕 Emit notification event for enrollment removal
      if (payload.classId) {
        await this.chatEventEmitter.emitUserUnenrolledClass({
          classId: payload.classId,
          userId: payload.userId,
          courseCode: payload.courseCode || 'Unknown',
          timestamp: new Date(),
        });
      }

      this.logger.log(`Successfully removed user ${payload.userId} from chat rooms and notification topics`);
    } catch (error) {
      this.logger.error(`Failed to remove user ${payload.userId} from chat rooms:`, error);
    }
  }

  // ================================
  // HELPER METHODS
  // ================================

  private async addUserToClassRoom(classId: string, userId: string, role: string) {
    try {
      const classRoom = await this.prisma.chatRoom.findFirst({
        where: {
          courseClassId: classId,
          type: RoomType.CLASS,
        },
      });

      if (!classRoom) {
        this.logger.warn(`No class room found for class ${classId}`);
        return;
      }

      const memberRole = role === 'PROFESSOR' ? RoomMemberRole.ADMIN : RoomMemberRole.MEMBER;

      await this.prisma.roomMember.upsert({
        where: {
          roomId_userId: {
            roomId: classRoom.id,
            userId: userId,
          },
        },
        create: {
          roomId: classRoom.id,
          userId: userId,
          role: memberRole,
        },
        update: {
          role: memberRole,
        },
      });

      this.logger.log(`Added user ${userId} to class room ${classRoom.id} as ${memberRole}`);
    } catch (error) {
      this.logger.error(`Failed to add user ${userId} to class room:`, error);
    }
  }

  private async addUserToSectionRoom(courseId: string, userId: string, sectionId: string) {
    try {
      // Find the section to get the TA
      const section = await this.prisma.courseSection.findUnique({
        where: { id: sectionId },
        select: { taId: true },
      });

      if (!section) {
        this.logger.warn(`Section ${sectionId} not found`);
        return;
      }

      await this.addUserToTASectionRoom(courseId, section.taId, userId);
    } catch (error) {
      this.logger.error(`Failed to add user ${userId} to section room:`, error);
    }
  }

  private async addUserToTASectionRoom(courseId: string, taId: string, userId: string) {
    try {
      const sectionRoom = await this.prisma.chatRoom.findFirst({
        where: {
          taId: taId,
          courseId: courseId,
          type: RoomType.SECTION,
        },
      });

      if (!sectionRoom) {
        this.logger.warn(`No section room found for TA ${taId} in course ${courseId}`);
        return;
      }

      await this.prisma.roomMember.upsert({
        where: {
          roomId_userId: {
            roomId: sectionRoom.id,
            userId: userId,
          },
        },
        create: {
          roomId: sectionRoom.id,
          userId: userId,
          role: RoomMemberRole.MEMBER,
        },
        update: {
          role: RoomMemberRole.MEMBER,
        },
      });

      this.logger.log(`Added user ${userId} to section room ${sectionRoom.id}`);
    } catch (error) {
      this.logger.error(`Failed to add user ${userId} to TA section room:`, error);
    }
  }
}