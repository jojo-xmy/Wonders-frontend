import { apiService } from './api';

// 通知事件类型
export enum NotificationType {
  MESSAGE_RECEIVED = 'message_received',
  CONVERSATION_UPDATED = 'conversation_updated',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  SYSTEM_NOTIFICATION = 'system_notification'
}

// 通知事件接口
export interface NotificationEvent {
  event_id: string;
  event_type: NotificationType;
  data: any;
  user_id?: string;
  conversation_id?: string;
  timestamp: string;
}

// 通知响应接口
export interface NotificationResponse {
  events: NotificationEvent[];
  count: number;
  timestamp: string;
}

// 通知监听器类型
export type NotificationListener = (event: NotificationEvent) => void;

// 通知服务类
class NotificationService {
  private listeners: Map<NotificationType, NotificationListener[]> = new Map();
  private globalListeners: NotificationListener[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastEventId: string | null = null;
  private pollingIntervalMs = 5000; // 5秒轮询间隔
  private eventSource: EventSource | null = null;
  private isSSESupported = false;

  constructor() {
    // 检测浏览器是否支持SSE
    this.isSSESupported = typeof EventSource !== 'undefined';
  }

  /**
   * 订阅特定类型的通知
   */
  subscribe(eventType: NotificationType, listener: NotificationListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);

    // 返回取消订阅函数
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 订阅所有通知
   */
  subscribeAll(listener: NotificationListener): () => void {
    this.globalListeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const index = this.globalListeners.indexOf(listener);
      if (index > -1) {
        this.globalListeners.splice(index, 1);
      }
    };
  }

  /**
   * 触发事件监听器
   */
  private triggerListeners(event: NotificationEvent) {
    // 触发特定类型监听器
    const typeListeners = this.listeners.get(event.event_type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Notification listener error:', error);
        }
      });
    }

    // 触发全局监听器
    this.globalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Global notification listener error:', error);
      }
    });
  }

  /**
   * 开始轮询通知（最小可行方案）
   */
  startPolling() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    console.log('Starting notification polling...');

    const poll = async () => {
      try {
        const response = await this.fetchRecentNotifications();
        
        // 处理新事件
        response.events.forEach(event => {
          // 只处理新事件（避免重复处理）
          if (!this.lastEventId || event.event_id > this.lastEventId) {
            this.triggerListeners(event);
          }
        });

        // 更新最后处理的事件ID
        if (response.events.length > 0) {
          this.lastEventId = response.events[response.events.length - 1].event_id;
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // 立即执行一次
    poll();

    // 设置定时轮询
    this.pollingInterval = setInterval(poll, this.pollingIntervalMs);
  }

  /**
   * 停止轮询
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Stopped notification polling');
  }

  /**
   * 启动SSE连接（未来扩展）
   */
  startSSE(): boolean {
    if (!this.isSSESupported) {
      console.warn('SSE not supported, falling back to polling');
      this.startPolling();
      return false;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
      const sseUrl = `${baseURL}/notifications/stream`;
      
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
      };
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 处理不同类型的SSE消息
          if (data.type === 'connected') {
            console.log('SSE connected for user:', data.user_id);
          } else if (data.type === 'heartbeat') {
            // 心跳消息，不需要处理
          } else if (data.event_type) {
            // 实际的通知事件
            this.triggerListeners(data as NotificationEvent);
          }
        } catch (error) {
          console.error('SSE message parsing error:', error);
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.stopSSE();
        // 回退到轮询
        setTimeout(() => this.startPolling(), 1000);
      };
      
      return true;
    } catch (error) {
      console.error('Failed to start SSE:', error);
      this.startPolling();
      return false;
    }
  }

  /**
   * 停止SSE连接
   */
  stopSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection closed');
    }
  }

  /**
   * 获取最近的通知
   */
  async fetchRecentNotifications(limit: number = 50): Promise<NotificationResponse> {
    try {
      const response = await apiService.getRecentNotifications(limit);
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * 启动通知服务（自动选择最佳方式）
   */
  start() {
    // 目前使用轮询作为最小可行方案
    // 未来可以根据配置或环境自动选择SSE
    this.startPolling();
    
    // 取消注释以下行来启用SSE（需要后端支持认证）
    // if (!this.startSSE()) {
    //   this.startPolling();
    // }
  }

  /**
   * 停止通知服务
   */
  stop() {
    this.stopPolling();
    this.stopSSE();
  }

  /**
   * 设置轮询间隔
   */
  setPollingInterval(intervalMs: number) {
    this.pollingIntervalMs = intervalMs;
    
    // 如果正在轮询，重启以应用新间隔
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      isSSEConnected: this.eventSource?.readyState === EventSource.OPEN,
      isSSESupported: this.isSSESupported,
      pollingInterval: this.pollingIntervalMs,
      lastEventId: this.lastEventId
    };
  }
}

// 导出单例实例
export const notificationService = new NotificationService();

// 导出类型和服务
export default NotificationService;