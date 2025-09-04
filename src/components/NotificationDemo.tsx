import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType } from '../services/notificationService';
import { apiService } from '../services/api';

const NotificationDemo: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    serviceStatus,
    startService,
    stopService,
    clearNotifications
  } = useNotifications();
  
  const [testMessage, setTestMessage] = useState('这是一条测试消息');
  const [isLoading, setIsLoading] = useState(false);

  // 发送测试消息来触发通知
  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    try {
      await apiService.sendMessage({ message: testMessage });
      setTestMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 手动获取通知
  const fetchNotifications = async () => {
    try {
      const response = await apiService.getRecentNotifications(10);
      console.log('获取到的通知:', response);
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">通知系统演示</h2>
        
        {/* 服务状态 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">服务状态</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span>连接状态: {isConnected ? '已连接' : '未连接'}</span>
            </div>
            <div>
              <span>轮询状态: {serviceStatus.isPolling ? '运行中' : '已停止'}</span>
            </div>
            <div>
              <span>SSE状态: {serviceStatus.isSSEConnected ? '已连接' : '未连接'}</span>
            </div>
            <div>
              <span>轮询间隔: {serviceStatus.pollingInterval}ms</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <span>最后事件ID: {serviceStatus.lastEventId || '无'}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={startService}
            disabled={serviceStatus.isPolling}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            启动服务
          </button>
          <button
            onClick={stopService}
            disabled={!serviceStatus.isPolling}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            停止服务
          </button>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            手动获取通知
          </button>
          <button
            onClick={clearNotifications}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            清空通知
          </button>
        </div>

        {/* 测试消息发送 */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">发送测试消息</h3>
          <div className="flex space-x-3">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="输入测试消息..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
            />
            <button
              onClick={sendTestMessage}
              disabled={isLoading || !testMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            发送消息后，AI回复时会触发通知事件
          </p>
        </div>

        {/* 通知统计 */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-blue-800">总通知数</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-red-800">未读通知</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.event_type === NotificationType.MESSAGE_RECEIVED).length}
            </div>
            <div className="text-sm text-green-800">消息通知</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {notifications.filter(n => n.event_type === NotificationType.SYSTEM_NOTIFICATION).length}
            </div>
            <div className="text-sm text-yellow-800">系统通知</div>
          </div>
        </div>

        {/* 最近通知列表 */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold">最近通知 ({notifications.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>暂无通知</p>
                <p className="text-sm mt-2">发送一条测试消息来生成通知</p>
              </div>
            ) : (
              notifications.slice().reverse().map((notification, index) => (
                <div key={notification.event_id} className={`p-4 border-b border-gray-100 ${
                  index === 0 ? 'bg-blue-50' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          notification.event_type === NotificationType.MESSAGE_RECEIVED
                            ? 'bg-blue-100 text-blue-800'
                            : notification.event_type === NotificationType.SYSTEM_NOTIFICATION
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.event_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900">{notification.event_type}</h4>
                      {notification.data && notification.data.message && (
                        <p className="text-sm text-gray-600 mt-1">{notification.data.message}</p>
                      )}
                      {notification.data && Object.keys(notification.data).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <details>
                            <summary className="cursor-pointer">数据详情</summary>
                            <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;