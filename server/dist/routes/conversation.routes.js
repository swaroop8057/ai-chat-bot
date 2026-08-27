import { Router } from 'express';
import { dbService } from '../lib/database.js';
import { validateRequest } from '../middleware/validate.js';
import { createConversationSchema, updateConversationSchema, conversationIdParamSchema, } from '../schemas/chat.schema.js';
const router = Router();
// GET /api/conversations/stats - Get user's conversation statistics for Dashboard
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await dbService.getUserStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve dashboard statistics',
        });
    }
});
// GET /api/conversations - List all conversations for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await dbService.getConversations(userId);
        res.json({
            success: true,
            data: conversations,
        });
    }
    catch (error) {
        console.error('Error listing conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve conversations',
        });
    }
});
// POST /api/conversations - Create a new conversation
router.post('/', validateRequest(createConversationSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;
        const newConversation = await dbService.createConversation(userId, title);
        res.status(201).json({
            success: true,
            data: newConversation,
        });
    }
    catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create conversation',
        });
    }
});
// GET /api/conversations/:id - Get conversation details and messages
router.get('/:id', validateRequest(conversationIdParamSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const conversation = await dbService.getConversationById(id, userId);
        if (!conversation) {
            res.status(404).json({
                success: false,
                error: 'Conversation not found',
            });
            return;
        }
        const messages = await dbService.getMessages(id, userId);
        res.json({
            success: true,
            data: {
                ...conversation,
                messages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve conversation details',
        });
    }
});
// PATCH /api/conversations/:id - Update conversation title
router.patch('/:id', validateRequest(updateConversationSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const { title } = req.body;
        const updated = await dbService.updateConversationTitle(id, userId, title);
        if (!updated) {
            res.status(404).json({
                success: false,
                error: 'Conversation not found',
            });
            return;
        }
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        console.error('Error updating conversation title:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update conversation',
        });
    }
});
// DELETE /api/conversations/:id - Delete conversation and its messages
router.delete('/:id', validateRequest(conversationIdParamSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const deleted = await dbService.deleteConversation(id, userId);
        if (!deleted) {
            res.status(404).json({
                success: false,
                error: 'Conversation not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Conversation deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete conversation',
        });
    }
});
export default router;
