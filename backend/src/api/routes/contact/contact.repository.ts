import { BaseRepository } from '@lib/database/repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Contact } from './contact.schema';
import { createContactSchema } from './dto/contact.create.dto';

@Injectable()
export class ContactRepository extends BaseRepository<
  Contact,
  typeof createContactSchema
> {
  constructor(@InjectModel(Contact.name) contactModel: Model<Contact>) {
    super(contactModel, createContactSchema);
  }
}
