import { signUpRequestSchema } from '@common/schemas';
import { createZodDto } from 'nestjs-zod';

export class SignUpDto extends createZodDto(signUpRequestSchema) {}
