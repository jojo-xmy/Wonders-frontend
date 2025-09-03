// 用户相关类型
export interface User {
  id: string;
  email?: string;
  is_anonymous: boolean;
  created_at?: string;
  last_active?: string;
}

// 认证相关类型
export interface LoginRequest {
  email?: string;
  password?: string;
  supabase_token?: string;
  anonymous: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email?: string;
  is_anonymous: boolean;
  expires_in: number;
}

// 消息相关类型
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  conversation_id?: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  user_message_id: number;
  assistant_message_id: number;
  model_used: string;
  tokens_used?: number;
}

// 对话相关类型
export interface Conversation {
  conversation_id: string;
  last_message: string;
  last_updated: string;
}

export interface ConversationHistory {
  conversation_id: string;
  messages: ChatMessage[];
  total_messages: number;
}

// 流式响应类型
export interface StreamChunk {
  content?: string;
  full_content?: string;
  finished: boolean;
  error?: string;
  conversation_id?: string;
  user_message_id?: number;
  assistant_message_id?: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// 应用状态类型
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentConversation: string | null;
  conversations: Conversation[];
  messages: ChatMessage[];
}

// 组件Props类型
export interface ChatBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ConversationListProps {
  conversations: Conversation[];
  currentConversation?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
}

// 错误类型
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// 配置类型
export interface AppConfig {
  apiBaseUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  appName: string;
  version: string;
}

// Hook返回类型
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  conversations: Conversation[];
  currentConversation: string | null;
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  sendStreamMessage: (message: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  loadConversationHistory: (conversationId: string) => Promise<void>;
}