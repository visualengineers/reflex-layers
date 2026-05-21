import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import log from 'electron-log';
import { Subscription, concatMap } from 'rxjs';
import { IdleModeService } from 'src/services/idle-mode-service';
import { SettingsService } from 'src/services/settings.service';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { InteractionMetaphor } from 'src/shared/enum/interaction-metaphor';
import { TextureLayer } from 'src/shared/interface/texture-layer';

@Component({
    selector: 'app-idle-screen',
    templateUrl: './idle-screen.component.html',
    styleUrls: ['./idle-screen.component.scss'],
    imports: [
        CommonModule
    ]
})
export class IdleScreenComponent implements OnInit, OnDestroy {

  private _textureSubscription?: Subscription;
  private _idleSubscription?: Subscription;
  private _settingsSubscription?: Subscription;

  public IdleImages: Array<TextureLayer> = [];
  public ImageBasePath: string = '';
  public showGradient = false;
  public showBorder = false;

  public useLogo = false;
  public logoImage = '';

  public ShowIdleScreen = false;

  public constructor(
    private readonly _idleService: IdleModeService,
    private readonly _textureService: TextureRepositoryService,
    private readonly _settingsService: SettingsService) { }

  ngOnInit(): void {
    this._textureSubscription = this._textureService.SelectedTextureId.pipe(
      concatMap((id:number) => this._textureService.retrieveTextureResource(id))
    ).subscribe(
      result => {
        if (result?.idleLayers !== undefined) {
          this.ImageBasePath = `./assets/${result.folder}/`;
          this.IdleImages = result.idleLayers;
        }
        else {
          this.IdleImages = [];
        }
      },
      error => {
        console.error(error);
        log.error(error);
      }
    );

    this._idleSubscription = this._idleService.ShowIdleScreen.subscribe(
      (result) => {
        this.ShowIdleScreen = result;
      },
      (error) => {
        console.error(error);
        log.error(error);
      }
    );

    this._settingsSubscription = this._settingsService.CurrentSettings.subscribe(
      (result) => {
        this.showGradient = result.defaultLayerSettings?.interaction === InteractionMetaphor.PixelBlending;
        this.showBorder = result.defaultLayerSettings?.interaction === InteractionMetaphor.SingleTouchLens || result.defaultLayerSettings?.interaction === InteractionMetaphor.MultiTouchLens;
        this.logoImage = result.idleLogoImage;
        this.useLogo = result.useLogo && this.logoImage.length > 0;
      },
      (error) => {
        console.error(error);
        log.error(error);
      }
    );
  }

  public ngOnDestroy(): void {
    this._textureSubscription?.unsubscribe();
    this._idleSubscription?.unsubscribe();
    this._settingsSubscription?.unsubscribe();
  }
}
