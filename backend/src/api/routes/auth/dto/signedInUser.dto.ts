import { signedInUserResponseSchema } from '@common/schemas';
import { createZodDto } from 'nestjs-zod';

export class SignedInUserResponseDto extends createZodDto(
  signedInUserResponseSchema,
) {}
