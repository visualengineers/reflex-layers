import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { DepthImageServiceFacade } from 'src/services/depth-image.facade.service';
import { DepthImageService } from 'src/services/depth-image.service';
import { DiagnosticsService } from 'src/services/diagnostics.service';
import { ElectronIpcService } from 'src/services/electron-ipc.service';
import { IdleModeService } from 'src/services/idle-mode-service';
import { InteractionService } from 'src/services/interaction.service';
import { LayerLogicService } from 'src/services/layer-logic.service';
import { LayerLogicServiceBase } from 'src/services/layer-logic.service.base';
import { PointCloudImageService } from 'src/services/point-cloud-image.service';
import { SettingsService } from 'src/services/settings.service';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { CommonModule, PlatformLocation } from '@angular/common';
import { FormsModule } from '@angular/forms';

export function getBaseUrl(platformLocation: PlatformLocation): string {
  return platformLocation.getBaseHrefFromDOM();
}

const  providers = [
  { provide: 'BASE_URL', useFactory: getBaseUrl, deps: [PlatformLocation] },
  { provide: TextureRepositoryService },
  { provide: DepthImageService },
  { provide: LayerLogicServiceBase, useClass: LayerLogicService },
  { provide: InteractionService },
  { provide: SettingsService },
  { provide: PointCloudImageService },
  { provide: DepthImageServiceFacade },
  { provide: ElectronIpcService },
  { provide: IdleModeService },
  { provide: DiagnosticsService }
]

export const appConfig: ApplicationConfig = {
  providers: [
    providers,
    importProvidersFrom(
      BrowserModule,
      CommonModule,
      FormsModule
    ),
    provideZoneChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi())
  ]
};
