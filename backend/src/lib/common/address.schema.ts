import { TAddress } from '@common/schemas';
import { Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class Address extends Document implements TAddress {
  @Prop({ required: true })
  street: string;

  @Prop()
  street2?: string;

  @Prop({ required: true })
  zip: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  extraInfo?: string;
}
