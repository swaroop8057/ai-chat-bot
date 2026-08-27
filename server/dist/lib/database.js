import { supabaseAdmin, isSupabaseConfigured } from './supabase.js';
// In-memory store fallback when Supabase is not connected
const memoryConversations = new Map();
const memoryMessages = new Map();
export const dbService = {
    // ----------------- CONVERSATIONS -----------------
    async getConversations(userId) {
        if (isSupabaseConfigured() && supabaseAdmin) {
            const { data, error } = await supabaseAdmin
                .from('conversations')
                .select('*, messages(count)')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            if (error) {
                console.error('Error fetching conversations from Supabase:', error);
                throw error;
            }
            return (data || []).map((c) => ({
                id: c.id,
                user_id: c.user_id,
                title: c.title,
                created_at: c.created_at,
                updated_at: c.updated_at,
                message_count: c.messages?.[0]?.count || 0,
            }));
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
    async getConversationById(id, userId) {
        if (isSupabaseConfigured() && supabaseAdmin) {
            const { data, error } = await supabaseAdmin
                .from('conversations')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null; // Not found
                throw error;
            }
            return data;
        }
        const conv = memoryConversations.get(id);
        if (!conv || conv.user_id !== userId)
            return null;
        return conv;
    },
    async createConversation(userId, title) {
        const finalTitle = title?.trim() || 'New Conversation';
        const now = new Date().toISOString();
        if (isSupabaseConfigured() && supabaseAdmin) {
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
        }
        // Fallback uuid
        const id = crypto.randomUUID();
        const newConv = {
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
    async updateConversationTitle(id, userId, title) {
        const now = new Date().toISOString();
        if (isSupabaseConfigured() && supabaseAdmin) {
            const { data, error } = await supabaseAdmin
                .from('conversations')
                .update({ title: title.trim(), updated_at: now })
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        const conv = memoryConversations.get(id);
        if (!conv || conv.user_id !== userId)
            return null;
        conv.title = title.trim();
        conv.updated_at = now;
        return conv;
    },
    async deleteConversation(id, userId) {
        if (isSupabaseConfigured() && supabaseAdmin) {
            const { error } = await supabaseAdmin
                .from('conversations')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error)
                throw error;
            return true;
        }
        const conv = memoryConversations.get(id);
        if (!conv || conv.user_id !== userId)
            return false;
        memoryConversations.delete(id);
        memoryMessages.delete(id);
        return true;
    },
    // ----------------- MESSAGES -----------------
    async getMessages(conversationId, userId) {
        if (isSupabaseConfigured() && supabaseAdmin) {
            const { data, error } = await supabaseAdmin
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('user_id', userId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        return memoryMessages.get(conversationId) || [];
    },
    async createMessage(conversationId, userId, role, content) {
        const now = new Date().toISOString();
        if (isSupabaseConfigured() && supabaseAdmin) {
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
            if (error)
                throw error;
            // Update conversation updated_at
            await supabaseAdmin
                .from('conversations')
                .update({ updated_at: now })
                .eq('id', conversationId);
            return data;
        }
        const id = crypto.randomUUID();
        const newMsg = {
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
    async getUserStats(userId) {
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
