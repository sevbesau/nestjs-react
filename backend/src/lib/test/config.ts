import { ConfigService } from '@nestjs/config';
import { mock, when } from 'ts-mockito';

export function createMockConfigService(configOptions: Record<string, string>) {
  const mockConfigService = mock(ConfigService);
  Object.entries(configOptions).forEach(([key, value]) =>
    when(mockConfigService.getOrThrow(key)).thenReturn(value),
  );
  return mockConfigService;
}
