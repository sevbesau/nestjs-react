import { contactRequestSchema } from '@common/schemas';
import { createZodDto } from 'nestjs-zod';

export class ContactRequestDto extends createZodDto(contactRequestSchema) {}

export const createContactSchema = contactRequestSchema.omit({
  captchaResponse: true,
});
