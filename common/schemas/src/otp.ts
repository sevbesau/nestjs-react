import { z } from 'zod';

export const otpZodSchema = z.object({
  password: z.string(),
  expiresAt: z.number(),
});

export type TOtp = z.infer<typeof otpZodSchema>;
