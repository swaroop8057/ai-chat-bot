import { z } from 'zod';
export const sendMessageSchema = z.object({
    body: z.object({
        message: z
            .string({
            required_error: 'Message content is required',
        })
            .trim()
            .min(1, 'Message cannot be empty')
            .max(10000, 'Message cannot exceed 10,000 characters'),
        conversationId: z
            .string()
            .uuid('Invalid conversation ID format')
            .optional()
            .nullable(),
        title: z.string().trim().max(100).optional(),
    }),
});
export const createConversationSchema = z.object({
    body: z.object({
        title: z.string().trim().min(1, 'Title cannot be empty').max(100).optional(),
    }),
});
export const updateConversationSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid conversation ID format'),
    }),
    body: z.object({
        title: z.string().trim().min(1, 'Title cannot be empty').max(100),
    }),
});
export const conversationIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid conversation ID format'),
    }),
});
