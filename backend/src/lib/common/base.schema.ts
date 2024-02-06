import { SchemaOptions } from '@nestjs/mongoose';

export const BaseSchemaOptions: SchemaOptions = { timestamps: true };

export class BaseSchema {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
