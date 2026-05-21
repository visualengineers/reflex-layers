import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { LayerSettings } from "src/shared/interface/layer-settings";
import { DepthImageService } from "./depth-image.service";
import { PointCloudImageService } from "./point-cloud-image.service";
import { SettingsService } from "./settings.service";
import log from "electron-log";
import { AppSettings } from "src/shared/interface/app-settings";

@Injectable()
export class DepthImageServiceFacade {

  public Data: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private _settingsSubscription: Subscription;
  private _depthImageSubscription? : Subscription;
  private _streamNativeDepthImage = false;

  public constructor(
    private readonly _settingsService: SettingsService,
    private readonly _depthImageService: DepthImageService,
    private readonly _pointCloudImageService: PointCloudImageService) {

    this._settingsSubscription = this._settingsService.CurrentSettings.subscribe(
      {
        next: (settings) => this.settingsUpdated(settings),
        error: (error) => {
          console.error(error);
          log.error(error);
        }
      }
    );

    this.updateDepthImageSubscription();
  }

  private settingsUpdated(settings: AppSettings): void {
    if (settings.streamNativeDepthImage !== this._streamNativeDepthImage) {
      this._streamNativeDepthImage = settings.streamNativeDepthImage;
      this.updateDepthImageSubscription();
    }
  }

  private updateDepthImageSubscription() {
    this._depthImageSubscription?.unsubscribe();
    this._depthImageService.stopStreaming();
    this._pointCloudImageService.stopStreaming();

    if (this._streamNativeDepthImage) {
      this._depthImageService.startStreaming();
      this._depthImageSubscription = this._depthImageService.Data.subscribe(
        imgData => this.Data.next(imgData)
      );
    }
    else {
      this._pointCloudImageService.startStreaming();
      this._depthImageSubscription = this._pointCloudImageService.Data.subscribe(
        (imgData) => this.Data.next(imgData)
      );
    }
  }
}
