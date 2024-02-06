import { z } from 'zod';

import { isValidObjectId } from './lib';

export const contactZodSchema = z.object({
  _id: isValidObjectId(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().nonempty().email(),
  message: z.string(),
});

export type TContact = z.infer<typeof contactZodSchema>;

/*
 * POST /contact
 */
export const contactRequestSchema = contactZodSchema
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    message: true,
  })
  .merge(
    z.object({
      captchaResponse: z.string(),
    }),
  );
