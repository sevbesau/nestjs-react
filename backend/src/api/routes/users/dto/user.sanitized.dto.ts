import { sanitizedUserSchema } from '@common/schemas';
import { createZodDto } from 'nestjs-zod';

export class SanitizedUserDto extends createZodDto(sanitizedUserSchema) {}
