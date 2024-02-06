import { TContact } from '@common/schemas';
import { BaseSchema, BaseSchemaOptions } from '@lib/common/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema(BaseSchemaOptions)
export class Contact extends BaseSchema implements TContact {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  message: string;
}

export type ContactDocument = HydratedDocument<Contact>;

export const ContactSchema = SchemaFactory.createForClass(Contact);
