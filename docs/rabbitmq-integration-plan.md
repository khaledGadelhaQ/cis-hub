# RabbitMQ Integration Plan for MU Compass API

## Executive Summary

This document outlines the plan to integrate RabbitMQ into the MU Compass API system, starting as a replacement for EventEmitter2 for learning purposes and production reliability, with a clear path for future scalability as the system grows.

## Current System Analysis

### Existing Architecture
- **Event System:** EventEmitter2 (in-memory, single-process)
- **Scale:** Estimated 5,000 users maximum
- **Deployment:** Single server initially
- **Event Types:** Academic workflows (enrollment, class creation, notifications)
- **Real-time:** WebSocket gateways for chat functionality

### Current Event Flow
```
Academic Action → EventEmitter2 → Event Handlers → Database/Notifications
     ↓                ↓                ↓                    ↓
 User Enrolls → enrollment.created → ChatAutomation → Create Chat Room
                                    → NotificationAuto → Topic Subscription
```

## Why RabbitMQ for This System?

### 1. **Learning & Production Benefits**
- **Learning Experience:** Hands-on experience with industry-standard message broker
- **Production Reliability:** Persistent messages survive server restarts
- **Future-Proofing:** Foundation for microservices when scaling beyond 5,000 users
- **Operational Skills:** Team gains valuable RabbitMQ operational knowledge

### 2. **Immediate Advantages (Single Server)**
- **Message Persistence:** Events survive application crashes
- **Reliable Processing:** Message acknowledgments ensure no lost events
- **Dead Letter Queues:** Failed events for debugging and retry
- **Monitoring:** Better observability than EventEmitter2
- **Testing:** Isolated testing with message inspection

### 3. **Academic System Specific Benefits**
- **Critical Events:** Enrollment events must not be lost
- **Semester Rush:** Handle enrollment spikes reliably
- **Audit Trail:** Message history for debugging student issues
- **Integration Ready:** Future university system integrations

## Implementation Plan

### Phase 1: Foundation Setup (Week 1-2)
**Goal:** Replace EventEmitter2 with RabbitMQ for existing events

#### Tasks:
1. **RabbitMQ Infrastructure**
   ```bash
   # Docker setup for development
   docker run -d --name rabbitmq \
     -p 5672:5672 -p 15672:15672 \
     -e RABBITMQ_DEFAULT_USER=admin \
     -e RABBITMQ_DEFAULT_PASS=password \
     rabbitmq:3-management
   ```

2. **NestJS Integration**
   ```typescript
   // Install dependencies
   npm install @nestjs/microservices amqplib amqp-connection-manager
   ```

3. **Create RabbitMQ Module**
   ```
   src/modules/messaging/
   ├── messaging.module.ts
   ├── services/
   │   ├── rabbitmq.service.ts
   │   └── message-publisher.service.ts
   └── decorators/
       └── message-handler.decorator.ts
   ```

4. **Replace Current Events**
   - `enrollment.created` → `academic.enrollment.created`
   - `enrollment.removed` → `academic.enrollment.removed`
   - `class.created` → `academic.class.created`
   - `section.created` → `academic.section.created`

#### Configuration:
```typescript
// Queue Configuration
const QUEUES = {
  ACADEMIC_EVENTS: 'academic.events',
  CHAT_AUTOMATION: 'chat.automation',
  NOTIFICATION_EVENTS: 'notification.events'
};

// Exchange Configuration
const EXCHANGES = {
  ACADEMIC: 'academic.exchange',
  CHAT: 'chat.exchange',
  NOTIFICATIONS: 'notifications.exchange'
};
```

### Phase 2: Enhanced Reliability (Week 3-4)
**Goal:** Add error handling, retries, and monitoring

#### Tasks:
1. **Dead Letter Queues**
   - Failed enrollment processing
   - Failed notification sending
   - Manual retry mechanisms

2. **Message Acknowledgments**
   - Ensure chat room creation before ACK
   - Ensure notification subscription before ACK

3. **Retry Logic**
   - Exponential backoff for failed events
   - Maximum retry limits
   - Alert on persistent failures

4. **Monitoring & Metrics**
   - Queue depth monitoring
   - Processing time metrics
   - Error rate tracking

### Phase 3: Advanced Features (Week 5-6)
**Goal:** Add advanced messaging patterns for complex workflows

#### Tasks:
1. **Message Priority**
   - High priority: Enrollment events
   - Medium priority: Chat events
   - Low priority: Analytics events

2. **Delayed Messages**
   - Welcome emails 1 hour after enrollment
   - Reminder notifications
   - Scheduled announcements

3. **Message Routing**
   - Department-based routing
   - Course-type based routing
   - User-role based routing

4. **Batch Processing**
   - Bulk enrollment processing
   - Batch notification sending
   - End-of-semester cleanup

## Technical Implementation Details

### Message Schema Design
```typescript
interface AcademicEvent {
  eventType: 'enrollment.created' | 'enrollment.removed' | 'class.created';
  eventId: string;
  timestamp: Date;
  userId: string;
  metadata: {
    classId?: string;
    courseId?: string;
    sectionId?: string;
    departmentCode?: string;
  };
  correlationId: string; // For tracing
}
```

### Queue Topology
```
Academic Exchange (Topic)
├── academic.enrollment.# → Enrollment Queue
├── academic.class.# → Class Management Queue
├── academic.section.# → Section Management Queue
└── academic.professor.# → Professor Assignment Queue

Chat Exchange (Topic)
├── chat.room.# → Room Management Queue
├── chat.member.# → Membership Queue
└── chat.notification.# → Chat Notifications Queue
```

### Error Handling Strategy
```typescript
class MessageProcessor {
  async processEnrollmentEvent(message: AcademicEvent) {
    try {
      await this.chatAutomation.handleEnrollment(message);
      await this.notificationAutomation.handleEnrollment(message);
      // ACK message only after all processing succeeds
      channel.ack(message);
    } catch (error) {
      if (message.retryCount < MAX_RETRIES) {
        // Requeue with delay
        await this.requeueWithDelay(message, error);
      } else {
        // Send to dead letter queue
        await this.sendToDeadLetter(message, error);
        channel.ack(message); // Remove from main queue
      }
    }
  }
}
```

## Scalability Path

### Current: Single Server (0-5,000 users)
```
┌─────────────────────────────────┐
│         Single Server           │
│  ┌─────────────┐ ┌─────────────┐│
│  │   NestJS    │ │  RabbitMQ   ││
│  │ Application │ │   Queues    ││
│  └─────────────┘ └─────────────┘│
│  ┌─────────────┐                │
│  │ PostgreSQL  │                │
│  └─────────────┘                │
└─────────────────────────────────┘
```

### Future: Microservices (5,000+ users)
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Academic   │    │    Chat     │    │Notification │
│  Service    │    │  Service    │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌─────────────────┐
                  │  RabbitMQ       │
                  │  Cluster        │
                  └─────────────────┘
```

## Migration Strategy

### Step 1: Parallel Implementation
- Keep EventEmitter2 running
- Add RabbitMQ handlers alongside
- Compare results for consistency

### Step 2: Gradual Switch
- Start with non-critical events
- Monitor for issues
- Gradually move critical events

### Step 3: Full Migration
- Remove EventEmitter2 dependencies
- Clean up old event handlers
- Performance optimization

## Operational Considerations

### Development Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

### Production Deployment
- **High Availability:** RabbitMQ cluster (future)
- **Persistence:** Durable queues and messages
- **Monitoring:** Prometheus + Grafana integration
- **Backup:** Queue configuration and message persistence
- **Security:** TLS encryption, user authentication

### Performance Tuning
```typescript
// Queue Configuration for 5,000 users
const QUEUE_CONFIG = {
  prefetchCount: 10, // Process 10 messages at a time
  messageBufferSize: 1000,
  connectionPoolSize: 5,
  heartbeatInterval: 60,
  acknowledgmentTimeout: 30000
};
```

## Monitoring & Observability

### Key Metrics to Track
1. **Queue Depth:** Messages waiting to be processed
2. **Processing Time:** Time to handle each event type
3. **Error Rate:** Failed message percentage
4. **Throughput:** Messages per second
5. **Consumer Health:** Active consumers per queue

### Alerting Thresholds
- Queue depth > 100 messages
- Error rate > 5%
- Processing time > 10 seconds
- No active consumers for > 1 minute

## Testing Strategy

### Unit Testing
```typescript
describe('RabbitMQ Message Processing', () => {
  it('should process enrollment events correctly', async () => {
    const message = createEnrollmentEvent();
    await messageProcessor.handle(message);
    expect(chatRoomCreated).toBe(true);
    expect(notificationSubscribed).toBe(true);
  });
});
```

### Integration Testing
- End-to-end event flow testing
- Failure scenario testing
- Performance testing under load

### Load Testing
- Simulate semester enrollment rush
- Test message throughput limits
- Verify system stability under load

## Timeline & Milestones

### Month 1: Foundation
- [ ] RabbitMQ setup and configuration
- [ ] Basic message publishing/consuming
- [ ] Replace 2-3 critical events
- [ ] Monitoring setup

### Month 2: Enhancement
- [ ] Error handling and dead letter queues
- [ ] Retry mechanisms
- [ ] Performance optimization
- [ ] Complete EventEmitter2 replacement

### Month 3: Advanced Features
- [ ] Message priority and routing
- [ ] Delayed message processing
- [ ] Comprehensive monitoring
- [ ] Load testing and optimization

## Risk Assessment & Mitigation

### Risks
1. **Learning Curve:** Team unfamiliar with RabbitMQ
2. **Operational Complexity:** Additional infrastructure to manage
3. **Single Point of Failure:** RabbitMQ becomes critical dependency
4. **Performance Impact:** Message serialization overhead

### Mitigation Strategies
1. **Training:** Team RabbitMQ training and documentation
2. **Gradual Rollout:** Non-critical events first
3. **Fallback Mechanism:** Ability to revert to EventEmitter2
4. **Performance Monitoring:** Continuous performance tracking

## Conclusion

Integrating RabbitMQ into the MU Compass API provides immediate benefits in reliability and future scalability, while offering valuable learning experience for the team. The single-server deployment keeps operational complexity manageable while building foundation for future growth.

The planned approach allows gradual adoption with minimal risk, ensuring system reliability while gaining expertise in production message broker operations. This investment in infrastructure will pay dividends as the system scales and integrates with other university systems.

**Recommendation:** Proceed with RabbitMQ integration following the phased approach outlined above, starting with non-critical events and gradually expanding to full replacement of EventEmitter2.
