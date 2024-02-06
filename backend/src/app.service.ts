import { TConfig } from '@lib/config/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService<TConfig>) {}

  getApiName() {
    return this.configService.getOrThrow('API_NAME');
  }
}
