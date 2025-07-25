import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  ClassCreatedEventDto, 
  ClassUpdatedEventDto, 
  ClassDeletedEventDto 
} from '../dto/class-events.dto';
import { 
  SectionCreatedEventDto, 
  SectionUpdatedEventDto, 
  SectionDeletedEventDto 
} from '../dto/section-events.dto';
import { 
  ProfessorAssignedEventDto, 
  ProfessorRemovedEventDto 
} from '../dto/professor-events.dto';
import { 
  EnrollmentCreatedEventDto, 
  EnrollmentRemovedEventDto 
} from '../dto/enrollment-events.dto';

/**
 * Service for emitting chat automation events
 * 
 * This service should be used by academic modules (courses, classes, sections, enrollments)
 * to trigger automatic chat room creation and management
 * 
 */
@Injectable()
export class ChatEventEmitterService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ================================
  // CLASS EVENTS
  // ================================

  /**
   * Emit event when a new class is created
   * This will trigger automatic chat room creation for the class
   */
  async emitClassCreated(payload: ClassCreatedEventDto): Promise<void> {
    this.eventEmitter.emit('class.created', payload);
  }

  /**
   * Emit event when a class is updated
   * This will update the chat room details if needed
   */
  async emitClassUpdated(payload: ClassUpdatedEventDto): Promise<void> {
    this.eventEmitter.emit('class.updated', payload);
  }

  /**
   * Emit event when a class is deleted
   * This will deactivate the chat room (preserves message history)
   */
  async emitClassDeleted(payload: ClassDeletedEventDto): Promise<void> {
    this.eventEmitter.emit('class.deleted', payload);
  }

  // ================================
  // SECTION EVENTS
  // ================================

  /**
   * Emit event when a new section is created
   * This will create/update TA section rooms
   */
  async emitSectionCreated(payload: SectionCreatedEventDto): Promise<void> {
    this.eventEmitter.emit('section.created', payload);
  }

  /**
   * Emit event when a section is updated
   * This handles TA changes and room reassignments
   */
  async emitSectionUpdated(payload: SectionUpdatedEventDto): Promise<void> {
    this.eventEmitter.emit('section.updated', payload);
  }

  /**
   * Emit event when a section is deleted
   * This will deactivate TA rooms if no other sections exist
   */
  async emitSectionDeleted(payload: SectionDeletedEventDto): Promise<void> {
    this.eventEmitter.emit('section.deleted', payload);
  }

  // ================================
  // PROFESSOR EVENTS
  // ================================

  /**
   * Emit event when a professor is assigned to a class
   * This will add the professor as admin to the class chat room
   */
  async emitProfessorAssigned(payload: ProfessorAssignedEventDto): Promise<void> {
    this.eventEmitter.emit('professor.assigned', payload);
  }

  /**
   * Emit event when a professor is removed from a class
   * This will remove the professor from the class chat room
   */
  async emitProfessorRemoved(payload: ProfessorRemovedEventDto): Promise<void> {
    this.eventEmitter.emit('professor.removed', payload);
  }

  // ================================
  // ENROLLMENT EVENTS
  // ================================

  /**
   * Emit event when a user enrolls in a course
   * This will add the user to appropriate chat rooms (class and/or section)
   */
  async emitEnrollmentCreated(payload: EnrollmentCreatedEventDto): Promise<void> {
    this.eventEmitter.emit('enrollment.created', payload);
  }

  /**
   * Emit event when a user's enrollment is removed
   * This will remove the user from chat rooms
   */
  async emitEnrollmentRemoved(payload: EnrollmentRemovedEventDto): Promise<void> {
    this.eventEmitter.emit('enrollment.removed', payload);
  }

  // ================================
  // BATCH OPERATIONS (for existing data)
  // ================================

  /**
   * Helper method to emit multiple events at once
   * Useful for batch operations or data migrations
   */
  async emitBatchEvents(events: Array<{
    type: 'class.created' | 'section.created' | 'enrollment.created',
    payload: any
  }>): Promise<void> {
    for (const event of events) {
      this.eventEmitter.emit(event.type, event.payload);
      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
