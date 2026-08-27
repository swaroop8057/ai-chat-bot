export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  recentConversations: Conversation[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
  message?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  isNewConversation: boolean;
  userMessage: Message;
  assistantMessage: Message;
}
