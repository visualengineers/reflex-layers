import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StreamImageService } from './stream-image.service';
import { DiagnosticsService } from './diagnostics.service';

@Injectable()
export class DepthImageService extends StreamImageService {

  private static readonly _enableDepthImageRoute = `http://${environment.serverAddress}:${environment.serverPort}/${environment.enableDepthImageRoute}`;
  private static readonly _streamDepthImageRoute = `ws://${environment.serverAddress}:${environment.serverPort}/${environment.depthImageRoute}`;

  public constructor(httpClient: HttpClient, diagService: DiagnosticsService) {
    super(httpClient, diagService, DepthImageService._streamDepthImageRoute, DepthImageService._enableDepthImageRoute);
  }
}
