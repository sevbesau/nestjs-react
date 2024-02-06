import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly KEY_LEN = 64;

  async compareHmacSignature(
    payload: Buffer,
    secret: string,
    signature: string,
  ) {
    const hmac = createHmac('sha256', secret).update(payload).digest('base64');
    const signatureBuffer = Buffer.from(signature);
    const hmacBuffer = Buffer.from(hmac);
    if (hmacBuffer.length != signatureBuffer.length) return false;
    return timingSafeEqual(hmacBuffer, signatureBuffer);
  }

  async saltAndHashString(str: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hashedBuffer = await this.hashAsync(str, salt);
    return `${salt}:${hashedBuffer.toString('hex')}`;
  }

  async compareSaltedAndHashedString(
    str: string,
    hashedStr: string,
  ): Promise<boolean> {
    const [salt, key] = hashedStr.split(':');
    if (!salt || !key) return false;
    const hashedBuffer = await this.hashAsync(str, salt);
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(hashedBuffer, keyBuffer);
  }

  private async hashAsync(str: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(str, salt, this.KEY_LEN, (err, hashedBuffer) => {
        if (err) return reject(err);
        return resolve(hashedBuffer);
      });
    });
  }
}
