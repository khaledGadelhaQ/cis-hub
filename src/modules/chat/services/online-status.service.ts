import { Injectable, Logger } from '@nestjs/common';

/**
 * Service to track user online/offline status across chat gateways
 * 
 * This service maintains the real-time presence status of users
 * and provides APIs to check if notifications should be sent
 */
@Injectable()
export class OnlineStatusService {
  private readonly logger = new Logger(OnlineStatusService.name);
  
  // Track online users across all gateways
  private readonly onlineUsers = new Map<string, {
    socketId: string;
    connectedAt: Date;
    lastActivity: Date;
    gateway: 'private' | 'group';
    currentRoom?: string; // For group chat - which room they're actively viewing
  }>();

  // Track users actively viewing specific chat rooms
  private readonly activeRoomUsers = new Map<string, Set<string>>(); // roomId -> Set<userId>

  /**
   * Mark user as online when they connect to a gateway
   */
  setUserOnline(userId: string, socketId: string, gateway: 'private' | 'group'): void {
    this.onlineUsers.set(userId, {
      socketId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      gateway,
    });

    this.logger.log(`User ${userId} connected to ${gateway} gateway`);
  }

  /**
   * Mark user as offline when they disconnect
   */
  setUserOffline(userId: string): void {
    const userStatus = this.onlineUsers.get(userId);
    if (userStatus) {
      // Remove from any active rooms
      if (userStatus.currentRoom) {
        this.leaveRoom(userId, userStatus.currentRoom);
      }
      
      this.onlineUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected from ${userStatus.gateway} gateway`);
    }
  }

  /**
   * Update user's last activity timestamp
   */
  updateActivity(userId: string): void {
    const userStatus = this.onlineUsers.get(userId);
    if (userStatus) {
      userStatus.lastActivity = new Date();
    }
  }

  /**
   * Mark user as actively viewing a specific room
   */
  joinRoom(userId: string, roomId: string): void {
    const userStatus = this.onlineUsers.get(userId);
    if (userStatus) {
      // Leave previous room if any
      if (userStatus.currentRoom) {
        this.leaveRoom(userId, userStatus.currentRoom);
      }

      // Join new room
      userStatus.currentRoom = roomId;
      
      if (!this.activeRoomUsers.has(roomId)) {
        this.activeRoomUsers.set(roomId, new Set());
      }
      this.activeRoomUsers.get(roomId)!.add(userId);

      this.logger.log(`User ${userId} joined room ${roomId}`);
    }
  }

  /**
   * Remove user from actively viewing a room
   */
  leaveRoom(userId: string, roomId: string): void {
    const userStatus = this.onlineUsers.get(userId);
    if (userStatus && userStatus.currentRoom === roomId) {
      userStatus.currentRoom = undefined;
    }

    const roomUsers = this.activeRoomUsers.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.activeRoomUsers.delete(roomId);
      }
    }

    this.logger.log(`User ${userId} left room ${roomId}`);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Check if user is actively viewing a specific room
   */
  isUserInRoom(userId: string, roomId: string): boolean {
    const userStatus = this.onlineUsers.get(userId);
    return userStatus?.currentRoom === roomId;
  }

  /**
   * Get all users actively viewing a room
   */
  getUsersInRoom(roomId: string): string[] {
    const roomUsers = this.activeRoomUsers.get(roomId);
    return roomUsers ? Array.from(roomUsers) : [];
  }

  /**
   * Check if user needs notification based on online status and room presence
   * This is the key method for determining notification delivery
   */
  shouldNotifyUser(userId: string, roomId?: string): boolean {
    if (!this.isUserOnline(userId)) {
      return true; // User is offline, definitely send notification
    }

    if (roomId && this.isUserInRoom(userId, roomId)) {
      return false; // User is online and actively viewing the room, skip notification
    }

    return true; // User is online but not in the specific room, send notification
  }

  /**
   * Get user's socket ID if they're online
   */
  getUserSocketId(userId: string): string | null {
    return this.onlineUsers.get(userId)?.socketId || null;
  }

  /**
   * Get online users count for monitoring
   */
  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * Get detailed status for debugging
   */
  getUserStatus(userId: string): {
    online: boolean;
    gateway?: string;
    currentRoom?: string;
    connectedAt?: Date;
    lastActivity?: Date;
  } {
    const userStatus = this.onlineUsers.get(userId);
    
    if (!userStatus) {
      return { online: false };
    }

    return {
      online: true,
      gateway: userStatus.gateway,
      currentRoom: userStatus.currentRoom,
      connectedAt: userStatus.connectedAt,
      lastActivity: userStatus.lastActivity,
    };
  }

  /**
   * Clean up inactive users (for maintenance)
   * Remove users who haven't been active for more than specified minutes
   */
  cleanupInactiveUsers(inactiveMinutes: number = 30): void {
    const cutoff = new Date(Date.now() - inactiveMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, status] of this.onlineUsers.entries()) {
      if (status.lastActivity < cutoff) {
        this.setUserOffline(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} inactive users`);
    }
  }
}
