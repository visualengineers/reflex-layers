import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from 'src/app/app.config';

export const appTestProviders = [
  ...(appConfig.providers ?? []),
  ...provideHttpClientTesting()
];
