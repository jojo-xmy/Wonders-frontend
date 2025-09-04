import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  notificationService, 
  NotificationEvent, 
  NotificationType, 
  NotificationListener 
} from '../services/notificationService';
import { useAuth } from './useAuth';

export interface UseNotificationsReturn {
  // 通知状态
  notifications: NotificationEvent[];
  unreadCount: number;
  isConnected: boolean;
  
  // 操作方法
  markAsRead: (eventId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  
  // 订阅方法
  subscribe: (eventType: NotificationType, listener: NotificationListener) => () => void;
  subscribeAll: (listener: NotificationListener) => () => void;
  
  // 服务控制
  startService: () => void;
  stopService: () => void;
  
  // 状态信息
  serviceStatus: {
    isPolling: boolean;
    isSSEConnected: boolean;
    isSSESupported: boolean;
    pollingInterval: number;
    lastEventId: string | null;
  };
}

export const useNotifications = (): UseNotificationsReturn => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [readEventIds, setReadEventIds] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(notificationService.getStatus());
  
  // 使用ref来避免useEffect依赖问题
  const notificationsRef = useRef(notifications);
  const readEventIdsRef = useRef(readEventIds);
  
  // 更新refs
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);
  
  useEffect(() => {
    readEventIdsRef.current = readEventIds;
  }, [readEventIds]);

  // 处理新通知事件
  const handleNotificationEvent = useCallback((event: NotificationEvent) => {
    setNotifications(prev => {
      // 检查是否已存在该事件（避免重复）
      const exists = prev.some(n => n.event_id === event.event_id);
      if (exists) {
        return prev;
      }
      
      // 添加新事件并保持最近100个
      const updated = [...prev, event].slice(-100);
      return updated;
    });
    
    // 更新连接状态
    setIsConnected(true);
  }, []);

  // 更新服务状态
  const updateServiceStatus = useCallback(() => {
    setServiceStatus(notificationService.getStatus());
  }, []);

  // 标记单个通知为已读
  const markAsRead = useCallback((eventId: string) => {
    setReadEventIds(prev => new Set(Array.from(prev).concat(eventId)));
  }, []);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(() => {
    const allEventIds = notificationsRef.current.map(n => n.event_id);
    setReadEventIds(new Set(allEventIds));
  }, []);

  // 清除所有通知
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setReadEventIds(new Set());
  }, []);

  // 订阅特定类型通知
  const subscribe = useCallback((eventType: NotificationType, listener: NotificationListener) => {
    return notificationService.subscribe(eventType, listener);
  }, []);

  // 订阅所有通知
  const subscribeAll = useCallback((listener: NotificationListener) => {
    return notificationService.subscribeAll(listener);
  }, []);

  // 启动通知服务
  const startService = useCallback(() => {
    notificationService.start();
    updateServiceStatus();
  }, [updateServiceStatus]);

  // 停止通知服务
  const stopService = useCallback(() => {
    notificationService.stop();
    setIsConnected(false);
    updateServiceStatus();
  }, [updateServiceStatus]);

  // 计算未读数量
  const unreadCount = notifications.filter(n => !readEventIds.has(n.event_id)).length;

  // 初始化和清理
  useEffect(() => {
    if (!isAuthenticated) {
      // 用户未认证时停止服务并清除通知
      stopService();
      clearNotifications();
      return;
    }

    // 订阅所有通知事件
    const unsubscribe = notificationService.subscribeAll(handleNotificationEvent);
    
    // 启动通知服务
    startService();
    
    // 定期更新服务状态
    const statusInterval = setInterval(updateServiceStatus, 1000);
    
    // 清理函数
    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [isAuthenticated, handleNotificationEvent, startService, stopService, clearNotifications, updateServiceStatus]);

  // 组件卸载时停止服务
  useEffect(() => {
    return () => {
      notificationService.stop();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    subscribe,
    subscribeAll,
    startService,
    stopService,
    serviceStatus
  };
};

export default useNotifications;