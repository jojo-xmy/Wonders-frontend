import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  TokenResponse,
  ChatRequest,
  ChatResponse,
  ConversationHistory,
  Conversation,
  User,
  ApiError
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理错误
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token过期或无效，清除本地存储并重定向到登录
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        const apiError: ApiError = {
          message: error.response?.data?.detail || error.message || '请求失败',
          status: error.response?.status,
          code: error.response?.data?.code
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  // 认证相关API
  async login(request: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', request);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async validateToken(): Promise<{ valid: boolean; user_id: string; is_anonymous: boolean }> {
    const response = await this.client.get('/auth/validate');
    return response.data;
  }

  // 聊天相关API
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post<ChatResponse>('/chat/send', request);
    return response.data;
  }

  async getConversationHistory(conversationId: string, limit: number = 50): Promise<ConversationHistory> {
    const response = await this.client.get<ConversationHistory>(
      `/chat/history/${conversationId}?limit=${limit}`
    );
    return response.data;
  }

  async getUserConversations(limit: number = 20): Promise<{ conversations: Conversation[]; total: number }> {
    const response = await this.client.get(`/chat/conversations?limit=${limit}`);
    return response.data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.client.delete(`/chat/conversations/${conversationId}`);
  }

  async createNewConversation(): Promise<{ conversation_id: string; message: string }> {
    const response = await this.client.post('/chat/conversations/new');
    return response.data;
  }

  // 流式聊天API
  async sendStreamMessage(
    request: ChatRequest,
    onChunk: (chunk: any) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${this.baseURL}/chat/send-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
              
              if (data.finished) {
                onComplete();
                return;
              }
            } catch (e) {
              console.error('解析流数据失败:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // 获取API信息
  async getApiInfo(): Promise<any> {
    const response = await this.client.get('/info');
    return response.data;
  }

  // 设置认证token
  setAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  // 清除认证token
  clearAuthToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // 获取当前token
  getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

// 创建全局API服务实例
export const apiService = new ApiService();
export default apiService;