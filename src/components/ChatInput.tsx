import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatInputProps } from '../types';
import clsx from 'clsx';

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = '输入消息...',
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // 最大高度
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // 处理发送消息
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // 重置文本框高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 中文输入法处理
    if (isComposing) return;

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter 换行
        return;
      } else {
        // Enter 发送消息
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  // 处理中文输入法
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 组件挂载时聚焦
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // 消息变化时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end space-x-3">
          {/* 文本输入区域 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={clsx(
                'w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                'px-4 py-3 pr-12 text-sm leading-5',
                'placeholder-gray-500 dark:placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-all duration-200',
                'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                minHeight: '44px',
                maxHeight: '200px',
              }}
            />
            
            {/* 发送按钮 */}
            <button
              onClick={handleSendMessage}
              disabled={disabled || !message.trim()}
              className={clsx(
                'absolute right-2 bottom-2 p-2 rounded-full transition-all duration-200',
                'flex items-center justify-center',
                message.trim() && !disabled
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              {disabled ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
        
        {/* 提示文本 */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          按 Enter 发送消息，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
};

export default ChatInput;