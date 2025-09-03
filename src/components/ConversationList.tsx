import React, { useState } from 'react';
import { MessageCircle, Plus, Trash2, MoreVertical } from 'lucide-react';
import { ConversationListProps } from '../types';
import clsx from 'clsx';

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setShowDeleteMenu(showDeleteMenu === conversationId ? null : conversationId);
  };

  const handleConfirmDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    onDeleteConversation(conversationId);
    setShowDeleteMenu(null);
  };

  const handleConversationClick = (conversationId: string) => {
    setShowDeleteMenu(null);
    onSelectConversation(conversationId);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            对话列表
          </h2>
          <button
            onClick={onNewConversation}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="新建对话"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p className="text-center text-sm">
              还没有对话记录
              <br />
              点击上方按钮开始新对话
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                className={clsx(
                  'relative group cursor-pointer rounded-lg p-3 mb-2 transition-all duration-200',
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  currentConversation === conversation.conversation_id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'border border-transparent'
                )}
                onClick={() => handleConversationClick(conversation.conversation_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 最后一条消息 */}
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {truncateMessage(conversation.last_message)}
                    </p>
                    
                    {/* 时间 */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(conversation.last_updated)}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => handleDeleteClick(e, conversation.conversation_id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      <MoreVertical size={14} className="text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* 删除确认菜单 */}
                    {showDeleteMenu === conversation.conversation_id && (
                      <div className="absolute right-0 top-6 z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[120px]">
                        <button
                          onClick={(e) => handleConfirmDelete(e, conversation.conversation_id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <Trash2 size={14} />
                          <span>删除对话</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 选中指示器 */}
                {currentConversation === conversation.conversation_id && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          共 {conversations.length} 个对话
        </p>
      </div>
    </div>
  );
};

export default ConversationList;