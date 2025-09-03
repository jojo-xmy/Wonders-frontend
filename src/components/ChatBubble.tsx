import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check } from 'lucide-react';
import { ChatBubbleProps, MessageRole } from '../types';
import { useState } from 'react';
import clsx from 'clsx';

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isLoading = false }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === MessageRole.USER;
  const isAssistant = message.role === MessageRole.ASSISTANT;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={clsx(
        'flex w-full mb-4 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={clsx(
          'flex max-w-[85%] md:max-w-[70%]',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* 头像 */}
        <div
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isUser
              ? 'bg-blue-500 text-white ml-3'
              : 'bg-gray-600 text-white mr-3',
            isUser ? 'order-2' : 'order-1'
          )}
        >
          {isUser ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>

        {/* 消息内容 */}
        <div
          className={clsx(
            'relative group',
            isUser ? 'order-1' : 'order-2'
          )}
        >
          <div
            className={clsx(
              'px-4 py-3 rounded-2xl shadow-sm relative',
              isUser
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
            )}
          >
            {/* 消息内容 */}
            <div className="message-content">
              {isUser ? (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {isLoading && !message.content ? (
                    <div className="flex items-center space-x-2">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="text-gray-500 text-sm">AI正在思考...</span>
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          
                          if (!inline && language) {
                            return (
                              <div className="relative">
                                <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-md">
                                  <span className="text-gray-300 text-sm font-medium">
                                    {language}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(String(children).replace(/\n$/, ''))}
                                    className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                                  >
                                    {copied ? (
                                      <Check size={14} />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                    <span className="text-xs">
                                      {copied ? '已复制' : '复制'}
                                    </span>
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  style={oneDark as any}
                                  language={language}
                                  PreTag="div"
                                  className="!mt-0 !rounded-t-none"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          
                          return (
                            <code
                              className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return <p className="mb-2 last:mb-0">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                        },
                        blockquote({ children }) {
                          return (
                            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">
                              {children}
                            </blockquote>
                          );
                        },
                        h1({ children }) {
                          return <h1 className="text-xl font-bold mb-2">{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className="text-lg font-bold mb-2">{children}</h2>;
                        },
                        h3({ children }) {
                          return <h3 className="text-base font-bold mb-2">{children}</h3>;
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>

            {/* 复制按钮 (仅AI消息显示) */}
            {isAssistant && message.content && (
              <button
                onClick={() => handleCopy(message.content)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs flex items-center space-x-1"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            )}
          </div>

          {/* 时间戳 */}
          <div
            className={clsx(
              'text-xs text-gray-500 mt-1 px-1',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;