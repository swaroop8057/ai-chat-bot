import { Router } from 'express';
import { dbService } from '../lib/database.js';
import { generateGeminiResponse } from '../lib/gemini.js';
import { validateRequest } from '../middleware/validate.js';
import { sendMessageSchema } from '../schemas/chat.schema.js';
const router = Router();
// POST /api/chat/message - Send message to AI and receive response
router.post('/message', validateRequest(sendMessageSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, conversationId, title } = req.body;
        let activeConversationId = conversationId;
        let isNewConversation = false;
        // 1. If no conversationId provided, create a new conversation
        if (!activeConversationId) {
            // Derive a clean title from the prompt (up to 40 characters)
            const autoTitle = title || (message.length > 40 ? `${message.substring(0, 37)}...` : message);
            const newConv = await dbService.createConversation(userId, autoTitle);
            activeConversationId = newConv.id;
            isNewConversation = true;
        }
        else {
            // Verify conversation belongs to user
            const existingConv = await dbService.getConversationById(activeConversationId, userId);
            if (!existingConv) {
                res.status(404).json({
                    success: false,
                    error: 'Conversation not found or access denied',
                });
                return;
            }
            // If conversation has default title "New Conversation", update it with the user prompt
            if (existingConv.title === 'New Conversation') {
                const autoTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;
                await dbService.updateConversationTitle(activeConversationId, userId, autoTitle);
            }
        }
        // 2. Fetch existing history for context before inserting current message
        const previousMessages = await dbService.getMessages(activeConversationId, userId);
        const historyContext = previousMessages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        // 3. Save User Message to Database
        const userMessage = await dbService.createMessage(activeConversationId, userId, 'user', message);
        // 4. Generate AI Response using Gemini API (@google/genai)
        let aiResponseText;
        try {
            aiResponseText = await generateGeminiResponse(historyContext, message);
        }
        catch (geminiError) {
            console.error('Gemini generation error:', geminiError);
            // Fallback message saved to DB so conversation remains in a clean state
            aiResponseText = `⚠️ I encountered an issue generating a response: ${geminiError.message || 'Unknown error'}. Please verify your Gemini API key.`;
        }
        // 5. Save AI Assistant Message to Database
        const assistantMessage = await dbService.createMessage(activeConversationId, userId, 'assistant', aiResponseText);
        // 6. Return response to frontend
        res.json({
            success: true,
            data: {
                conversationId: activeConversationId,
                isNewConversation,
                userMessage,
                assistantMessage,
            },
        });
    }
    catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process chat message',
        });
    }
});
export default router;
