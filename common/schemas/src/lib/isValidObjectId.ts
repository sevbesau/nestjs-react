import mongoose from 'mongoose';
import { z } from 'zod';

export const isValidObjectId = () =>
  z.coerce.string().refine(mongoose.Types.ObjectId.isValid);
