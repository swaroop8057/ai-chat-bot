import { ApiResponse, Conversation, DashboardStats, Message, SendMessageResponse } from '../types/index.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic fetch wrapper with automatic Authorization header
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.error || (data.details ? data.details.map(d => d.message).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return (data.data !== undefined ? data.data : (data as any)) as T;
}

export const api = {
  // Check backend health
  async checkHealth() {
    try {
      const res = await fetch(`${API_URL}/health`);
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  },

  // Dashboard stats
  async getDashboardStats(token: string | null): Promise<DashboardStats> {
    return request<DashboardStats>('/conversations/stats', { method: 'GET' }, token);
  },

  // List user conversations
  async getConversations(token: string | null): Promise<Conversation[]> {
    return request<Conversation[]>('/conversations', { method: 'GET' }, token);
  },

  // Get conversation by ID with messages
  async getConversation(
    id: string,
    token: string | null
  ): Promise<Conversation & { messages: Message[] }> {
    return request<Conversation & { messages: Message[] }>(`/conversations/${id}`, { method: 'GET' }, token);
  },

  // Create a new conversation
  async createConversation(title: string | undefined, token: string | null): Promise<Conversation> {
    return request<Conversation>(
      '/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      },
      token
    );
  },

  // Rename conversation
  async updateConversation(
    id: string,
    title: string,
    token: string | null
  ): Promise<Conversation> {
    return request<Conversation>(
      `/conversations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      },
      token
    );
  },

  // Delete conversation
  async deleteConversation(id: string, token: string | null): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/conversations/${id}`,
      {
        method: 'DELETE',
      },
      token
    );
  },

  // Send message to Gemini through backend
  async sendMessage(
    message: string,
    conversationId?: string | null,
    title?: string,
    token?: string | null
  ): Promise<SendMessageResponse> {
    return request<SendMessageResponse>(
      '/chat/message',
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversationId: conversationId || undefined,
          title: title || undefined,
        }),
      },
      token
    );
  },
};
