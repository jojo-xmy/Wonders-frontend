import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationEvent, NotificationType } from '../services/notificationService';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    serviceStatus
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || notification.event_type === filter
  );

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString();
  };

  // 获取通知类型显示名称
  const getTypeDisplayName = (type: NotificationType): string => {
    const typeNames: Partial<Record<NotificationType, string>> = {
      [NotificationType.MESSAGE_RECEIVED]: '新消息',
      [NotificationType.CONVERSATION_UPDATED]: '对话更新',
      [NotificationType.SYSTEM_NOTIFICATION]: '系统通知'
    };
    return typeNames[type] || type;
  };

  // 获取通知类型颜色
  const getTypeColor = (type: NotificationType): string => {
    const colors: Partial<Record<NotificationType, string>> = {
      [NotificationType.MESSAGE_RECEIVED]: 'bg-blue-100 text-blue-800',
      [NotificationType.CONVERSATION_UPDATED]: 'bg-green-100 text-green-800',
      [NotificationType.SYSTEM_NOTIFICATION]: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`relative ${className}`}>
      {/* 通知按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        title="通知中心"
      >
        {/* 铃铛图标 */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* 未读数量徽章 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* 连接状态指示器 */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-gray-400'
        }`} title={isConnected ? '已连接' : '未连接'} />
      </button>

      {/* 通知面板 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* 头部 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">通知中心</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    全部已读
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  清空
                </button>
              </div>
            </div>
            
            {/* 过滤器 */}
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                全部
              </button>
              {Object.values(NotificationType).map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filter === type ? getTypeColor(type) : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {getTypeDisplayName(type)}
                </button>
              ))}
            </div>
          </div>

          {/* 通知列表 */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>暂无通知</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.event_id}
                  notification={notification}
                  isRead={false} // 这里可以根据实际需求判断是否已读
                  onMarkAsRead={() => markAsRead(notification.event_id)}
                  formatTime={formatTime}
                  getTypeDisplayName={getTypeDisplayName}
                  getTypeColor={getTypeColor}
                />
              ))
            )}
          </div>

          {/* 状态信息 */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>
                状态: {isConnected ? '已连接' : '未连接'} | 
                {serviceStatus.isPolling ? '轮询中' : '已停止'}
                {serviceStatus.isSSEConnected && ' | SSE已连接'}
              </span>
              <span>
                间隔: {serviceStatus.pollingInterval}ms
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 通知项组件
interface NotificationItemProps {
  notification: NotificationEvent;
  isRead: boolean;
  onMarkAsRead: () => void;
  formatTime: (timestamp: string) => string;
  getTypeDisplayName: (type: NotificationType) => string;
  getTypeColor: (type: NotificationType) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isRead,
  onMarkAsRead,
  formatTime,
  getTypeDisplayName,
  getTypeColor
}) => {
  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
        !isRead ? 'bg-blue-50' : ''
      }`}
      onClick={onMarkAsRead}
    >
      <div className="flex items-start space-x-3">
        {/* 未读指示器 */}
        {!isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          {/* 类型标签和时间 */}
          <div className="flex items-center justify-between mb-1">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              getTypeColor(notification.event_type)
            }`}>
              {getTypeDisplayName(notification.event_type)}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
          </div>
          
          {/* 通知内容 */}
          <p className="text-sm text-gray-900 mb-1">
            {notification.event_type}
          </p>
          {(notification.data?.message || notification.event_type) && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {notification.data?.message || notification.event_type}
            </p>
          )}
          
          {/* 数据详情 */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500">数据详情</summary>
              <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;