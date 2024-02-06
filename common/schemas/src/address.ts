import { z } from 'zod';

import { CITY_RE, STREET_RE, ZIP_RE } from './lib';

export const addressZodSchema = z.object({
  street: z.string().min(2).max(50).regex(STREET_RE),
  street2: z.string().min(2).max(50).optional().nullable(),
  zip: z.string().min(1).regex(ZIP_RE),
  city: z.string().min(1).regex(CITY_RE),
  extraInfo: z.string().optional(),
});

export type TAddress = z.infer<typeof addressZodSchema>;

export const createAddressSchema = addressZodSchema.pick({
  street: true,
  street2: true,
  zip: true,
  city: true,
  extraInfo: true,
});

export const sanitizedAddressSchema = addressZodSchema.pick({
  street: true,
  street2: true,
  zip: true,
  city: true,
  extraInfo: true,
});
