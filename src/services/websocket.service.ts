import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

export interface WebSocketNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface WebSocketConfig {
  token: string;
  shopId: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(config: WebSocketConfig) {
    this.config = {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      ...config,
    };

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_URL, {
      auth: {
        token: this.config.token,
        shopId: this.config.shopId,
      },
      reconnection: false, // Мы будем управлять реконнектом сами
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleDisconnect(reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.notifyListeners('error', error);
    });

    this.socket.on('notification', (notification: WebSocketNotification) => {
      this.notifyListeners('notification', notification);
    });

    this.socket.on(
      'notifications',
      (notifications: WebSocketNotification[]) => {
        this.notifyListeners('notifications', notifications);
      }
    );
  }

  private handleDisconnect(reason: string) {
    if (
      reason === 'io server disconnect' ||
      reason === 'io client disconnect'
    ) {
      // Преднамеренное отключение - не пытаемся переподключиться
      return;
    }

    if (!this.config) return;

    if (this.reconnectAttempts < (this.config.reconnectionAttempts || 5)) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts})`);
        this.connect(this.config!);
      }, this.config.reconnectionDelay || 5000);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('maxReconnectAttemptsReached', null);
    }
  }

  updateConfig(newConfig: Partial<WebSocketConfig>) {
    if (!this.config) return;

    const needsReconnect =
      newConfig.token !== this.config.token ||
      newConfig.shopId !== this.config.shopId;

    this.config = { ...this.config, ...newConfig };

    if (needsReconnect && this.socket) {
      this.disconnect();
      this.connect(this.config);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.config = null;
    this.reconnectAttempts = 0;
  }

  addListener<T = any>(event: string, callback: (data: T) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  removeListener<T = any>(event: string, callback: (data: T) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private notifyListeners<T = any>(event: string, data: T) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  markAsRead(notificationId: string) {
    this.socket?.emit('markAsRead', notificationId);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }
}
