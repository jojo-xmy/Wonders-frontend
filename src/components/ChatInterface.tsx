import React, { useEffect, useRef, useState } from 'react';
import { MessageRole } from '../types';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { Bot, Menu, X, Settings, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    messages,
    conversations,
    currentConversation,
    isLoading,
    sendStreamMessage,
    selectConversation,
    createNewConversation,
    deleteConversation,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async (message: string) => {
    try {
      await sendStreamMessage(message);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 检查是否有正在加载的消息
  const hasLoadingMessage = messages.some(
    (msg) => msg.role === MessageRole.ASSISTANT && !msg.content
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 侧边栏 */}
      <div
        className={clsx(
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-80' : 'w-0',
          'overflow-hidden'
        )}
      >
        <ConversationList
          conversations={conversations}
          currentConversation={currentConversation || undefined}
          onSelectConversation={selectConversation}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
        />
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 侧边栏切换按钮 */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* 标题 */}
              <div className="flex items-center space-x-2">
                <Bot className="text-blue-500" size={24} />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  AI 助手
                </h1>
              </div>
            </div>

            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <User size={16} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.is_anonymous ? '匿名用户' : user?.email || '用户'}
                </span>
              </button>

              {/* 用户菜单下拉 */}
              {showUserMenu && (
                <div className="absolute right-0 top-12 z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[160px]">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.is_anonymous ? '匿名用户' : user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.is_anonymous ? '临时会话' : '已登录'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Settings size={14} />
                    <span>设置</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <LogOut size={14} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 聊天消息区域 */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4"
        >
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              // 欢迎界面
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bot size={64} className="text-blue-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  欢迎使用 AI 助手
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                  我是您的智能助手，可以帮助您解答问题、提供建议、进行对话。
                  请在下方输入您的问题开始对话。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      💡 智能问答
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      询问任何问题，获得详细的解答和建议
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🔧 代码助手
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      编程问题、代码审查、技术方案讨论
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      📝 文本处理
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      文档编写、内容优化、翻译等文本任务
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🎯 创意灵感
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      头脑风暴、创意构思、方案设计
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // 消息列表
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isLoading={hasLoadingMessage && message.role === MessageRole.ASSISTANT && !message.content}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* 输入区域 */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? 'AI 正在回复中...' : '输入消息...'}
        />
      </div>

      {/* 点击外部关闭用户菜单 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;