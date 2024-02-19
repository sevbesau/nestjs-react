import { validateOtpRequestSchema } from '@common/schemas';
import { createZodDto } from 'nestjs-zod';

export class ValidateOtpRequestDto extends createZodDto(
  validateOtpRequestSchema,
) {}
