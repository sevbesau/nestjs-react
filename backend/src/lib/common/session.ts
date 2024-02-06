import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { z } from 'zod';

export const sessionZodSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  version: z.coerce.number().int(),
});

export type Session = z.infer<typeof sessionZodSchema>;

export const GetSession = createParamDecorator(
  (_, context: ExecutionContext) => context.switchToHttp().getRequest().session,
);
