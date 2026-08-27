import { supabaseAdmin, isSupabaseConfigured } from './supabase.js';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// In-memory store fallback when Supabase is not connected or user is in demo mode
const memoryConversations: Map<string, Conversation> = new Map();
const memoryMessages: Map<string, Message[]> = new Map();

function isDemoUser(userId: string): boolean {
  return (
    userId === '00000000-0000-0000-0000-000000000001' ||
    userId.startsWith('demo-') ||
    userId === 'user' ||
    !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  );
}

export const dbService = {
  // ----------------- CONVERSATIONS -----------------
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('conversations')
          .select('*, messages(count)')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching conversations from Supabase:', error);
          throw error;
        }

        return (data || []).map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          title: c.title,
          created_at: c.created_at,
          updated_at: c.updated_at,
          message_count: c.messages?.[0]?.count || 0,
        }));
      } catch (err) {
        console.warn('Supabase getConversations failed, falling back to memory store:', err);
      }
    }

    // In-memory fallback
    const userConvs = Array.from(memoryConversations.values())
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return userConvs.map((c) => ({
      ...c,
      message_count: (memoryMessages.get(c.id) || []).length,
    }));
  },

  async getConversationById(id: string, userId: string): Promise<Conversation | null> {
    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('conversations')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }
        return data;
      } catch (err) {
        console.warn('Supabase getConversationById failed, checking memory store:', err);
      }
    }

    const conv = memoryConversations.get(id);
    if (!conv || conv.user_id !== userId) return null;
    return conv;
  },

  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const finalTitle = title?.trim() || 'New Conversation';
    const now = new Date().toISOString();

    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('conversations')
          .insert({
            user_id: userId,
            title: finalTitle,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating conversation in Supabase:', error);
          throw error;
        }
        return data;
      } catch (err) {
        console.warn('Supabase createConversation failed, falling back to memory store:', err);
      }
    }

    // Fallback uuid
    const id = crypto.randomUUID();
    const newConv: Conversation = {
      id,
      user_id: userId,
      title: finalTitle,
      created_at: now,
      updated_at: now,
    };
    memoryConversations.set(id, newConv);
    memoryMessages.set(id, []);
    return newConv;
  },

  async updateConversationTitle(id: string, userId: string, title: string): Promise<Conversation | null> {
    const now = new Date().toISOString();

    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('conversations')
          .update({ title: title.trim(), updated_at: now })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase updateConversationTitle failed, falling back to memory store:', err);
      }
    }

    const conv = memoryConversations.get(id);
    if (!conv || conv.user_id !== userId) return null;
    conv.title = title.trim();
    conv.updated_at = now;
    return conv;
  },

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('conversations')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase deleteConversation failed, falling back to memory store:', err);
      }
    }

    const conv = memoryConversations.get(id);
    if (!conv || conv.user_id !== userId) return false;
    memoryConversations.delete(id);
    memoryMessages.delete(id);
    return true;
  },

  // ----------------- MESSAGES -----------------
  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase getMessages failed, checking memory store:', err);
      }
    }

    return memoryMessages.get(conversationId) || [];
  },

  async createMessage(
    conversationId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<Message> {
    const now = new Date().toISOString();

    if (!isDemoUser(userId) && isSupabaseConfigured() && supabaseAdmin) {
      try {
        // Insert message
        const { data, error } = await supabaseAdmin
          .from('messages')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            role,
            content,
          })
          .select()
          .single();

        if (error) throw error;

        // Update conversation updated_at
        await supabaseAdmin
          .from('conversations')
          .update({ updated_at: now })
          .eq('id', conversationId);

        return data;
      } catch (err) {
        console.warn('Supabase createMessage failed, falling back to memory store:', err);
      }
    }

    const id = crypto.randomUUID();
    const newMsg: Message = {
      id,
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      created_at: now,
    };

    const list = memoryMessages.get(conversationId) || [];
    list.push(newMsg);
    memoryMessages.set(conversationId, list);

    const conv = memoryConversations.get(conversationId);
    if (conv) {
      conv.updated_at = now;
    }

    return newMsg;
  },

  // ----------------- STATS -----------------
  async getUserStats(userId: string) {
    const conversations = await this.getConversations(userId);
    const totalConversations = conversations.length;
    
    let totalMessages = 0;
    for (const c of conversations) {
      totalMessages += c.message_count || 0;
    }

    return {
      totalConversations,
      totalMessages,
      recentConversations: conversations.slice(0, 5),
    };
  },
};

