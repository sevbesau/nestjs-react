import { updateUserRequestSchema } from '@common/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserDto extends createZodDto(updateUserRequestSchema) {}
