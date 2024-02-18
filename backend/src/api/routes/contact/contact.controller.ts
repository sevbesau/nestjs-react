import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/auth.guard';
import { ContactService } from './contact.service';
import { ContactRequestDto } from './dto/contact.create.dto';

@Controller()
@ApiTags('contact')
@Public()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('')
  @ApiOperation({ summary: 'Send a contact email.' })
  contactUs(@Body() contactRequestDto: ContactRequestDto) {
    return this.contactService.newContactRequest(contactRequestDto);
  }
}
