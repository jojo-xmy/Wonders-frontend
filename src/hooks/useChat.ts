import { useState, useCallback, useRef } from 'react';
import {
  ChatMessage,
  Conversation,
  UseChatReturn,
  MessageRole,
  StreamChunk
} from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 用于存储流式响应的临时消息ID
  const streamingMessageRef = useRef<number | null>(null);

  // 加载用户的所有对话
  const loadConversations = useCallback(async () => {
    try {
      const response = await apiService.getUserConversations();
      setConversations(response.conversations);
    } catch (error: any) {
      console.error('加载对话列表失败:', error);
      toast.error('加载对话列表失败');
    }
  }, []);

  // 加载指定对话的历史消息
  const loadConversationHistory = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      const history = await apiService.getConversationHistory(conversationId);
      setMessages(history.messages);
      setCurrentConversation(conversationId);
    } catch (error: any) {
      console.error('加载对话历史失败:', error);
      toast.error('加载对话历史失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 选择对话
  const selectConversation = useCallback(async (conversationId: string) => {
    if (conversationId === currentConversation) return;
    await loadConversationHistory(conversationId);
  }, [currentConversation, loadConversationHistory]);

  // 创建新对话
  const createNewConversation = useCallback(async () => {
    try {
      const response = await apiService.createNewConversation();
      setCurrentConversation(response.conversation_id);
      setMessages([]);
      
      // 刷新对话列表
      await loadConversations();
      
      toast.success('创建新对话成功');
    } catch (error: any) {
      console.error('创建新对话失败:', error);
      toast.error('创建新对话失败');
    }
  }, [loadConversations]);

  // 删除对话
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await apiService.deleteConversation(conversationId);
      
      // 从列表中移除
      setConversations(prev => prev.filter(conv => conv.conversation_id !== conversationId));
      
      // 如果删除的是当前对话，清空消息
      if (conversationId === currentConversation) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      toast.success('对话已删除');
    } catch (error: any) {
      console.error('删除对话失败:', error);
      toast.error('删除对话失败');
    }
  }, [currentConversation]);

  // 发送普通消息
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    try {
      setIsLoading(true);
      
      // 添加用户消息到界面
      const userMessage: ChatMessage = {
        id: Date.now(), // 临时ID
        role: MessageRole.USER,
        content: message.trim(),
        conversation_id: currentConversation || undefined,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 发送到后端
      const response = await apiService.sendMessage({
        message: message.trim(),
        conversation_id: currentConversation || undefined,
      });
      
      // 添加AI回复
      const assistantMessage: ChatMessage = {
        id: response.assistant_message_id,
        role: MessageRole.ASSISTANT,
        content: response.message,
        conversation_id: response.conversation_id,
        created_at: new Date().toISOString(),
      };
      
      // 更新消息列表，替换临时用户消息并添加AI回复
      setMessages(prev => {
        const newMessages = [...prev];
        // 更新用户消息ID
        newMessages[newMessages.length - 1] = {
          ...userMessage,
          id: response.user_message_id,
          conversation_id: response.conversation_id,
        };
        // 添加AI回复
        newMessages.push(assistantMessage);
        return newMessages;
      });
      
      // 更新当前对话ID
      if (!currentConversation) {
        setCurrentConversation(response.conversation_id);
        // 刷新对话列表
        await loadConversations();
      }
      
    } catch (error: any) {
      console.error('发送消息失败:', error);
      toast.error(error.message || '发送消息失败');
      
      // 移除失败的用户消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, loadConversations]);

  // 发送流式消息
  const sendStreamMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    try {
      setIsLoading(true);
      
      // 添加用户消息到界面
      const userMessage: ChatMessage = {
        id: Date.now(), // 临时ID
        role: MessageRole.USER,
        content: message.trim(),
        conversation_id: currentConversation || undefined,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 添加空的AI消息用于流式更新
      const tempAssistantId = Date.now() + 1;
      const assistantMessage: ChatMessage = {
        id: tempAssistantId,
        role: MessageRole.ASSISTANT,
        content: '',
        conversation_id: currentConversation || undefined,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      streamingMessageRef.current = tempAssistantId;
      
      let fullContent = '';
      let finalConversationId = currentConversation;
      let finalUserMessageId: number | undefined;
      let finalAssistantMessageId: number | undefined;
      
      // 发送流式请求
      await apiService.sendStreamMessage(
        {
          message: message.trim(),
          conversation_id: currentConversation || undefined,
        },
        // onChunk
        (chunk: StreamChunk) => {
          if (chunk.content) {
            fullContent += chunk.content;
            
            // 更新AI消息内容
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempAssistantId 
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          }
          
          if (chunk.conversation_id) {
            finalConversationId = chunk.conversation_id;
          }
          
          if (chunk.user_message_id) {
            finalUserMessageId = chunk.user_message_id;
          }
          
          if (chunk.assistant_message_id) {
            finalAssistantMessageId = chunk.assistant_message_id;
          }
        },
        // onError
        (error: Error) => {
          console.error('流式消息失败:', error);
          toast.error('发送消息失败');
          
          // 移除失败的消息
          setMessages(prev => prev.filter(msg => 
            msg.id !== tempAssistantId && msg.id !== userMessage.id
          ));
        },
        // onComplete
        () => {
          // 更新最终的消息ID和对话ID
          setMessages(prev => 
            prev.map(msg => {
              if (msg.id === userMessage.id && finalUserMessageId) {
                return {
                  ...msg,
                  id: finalUserMessageId,
                  conversation_id: finalConversationId,
                } as ChatMessage;
              }
              if (msg.id === tempAssistantId && finalAssistantMessageId) {
                return {
                  ...msg,
                  id: finalAssistantMessageId,
                  conversation_id: finalConversationId,
                } as ChatMessage;
              }
              return msg;
            })
          );
          
          // 更新当前对话ID
          if (!currentConversation && finalConversationId) {
            setCurrentConversation(finalConversationId);
            // 刷新对话列表
            loadConversations();
          }
          
          streamingMessageRef.current = null;
        }
      );
      
    } catch (error: any) {
      console.error('发送流式消息失败:', error);
      toast.error(error.message || '发送消息失败');
      
      // 移除失败的消息
      setMessages(prev => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, loadConversations]);

  return {
    messages,
    conversations,
    currentConversation,
    isLoading,
    sendMessage,
    sendStreamMessage,
    selectConversation,
    createNewConversation,
    deleteConversation,
    loadConversationHistory,
  };
};

export default useChat;