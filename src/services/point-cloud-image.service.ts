import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StreamImageService } from './stream-image.service';
import { DiagnosticsService } from './diagnostics.service';

@Injectable()
export class PointCloudImageService extends StreamImageService {

  private static readonly _enablePointCloudImageRoute = `http://${environment.serverAddress}:${environment.serverPort}/${environment.enablePointCloudImageRoute}`;
  private static readonly _streamPointCloudImageRoute = `ws://${environment.serverAddress}:${environment.serverPort}/${environment.pointCloudImageRoute}`;

  public constructor(httpClient: HttpClient, diagService: DiagnosticsService) {
    super(httpClient, diagService, PointCloudImageService._streamPointCloudImageRoute, PointCloudImageService._enablePointCloudImageRoute);
  }
}
