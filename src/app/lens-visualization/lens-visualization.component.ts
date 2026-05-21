import { Component, OnInit } from '@angular/core';
import { concatMap, fromEvent, Observable, Subscription } from 'rxjs';
import { LayerLogicServiceBase } from 'src/services/layer-logic.service.base';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { SettingsService } from 'src/services/settings.service';
import { DepthInformation } from 'src/shared/model/depth-information';
import { TextureResource } from 'src/shared/interface/texture-resource';
import { TextureResourceType } from 'src/shared/enum/texture-resource-type';
import { LayerSettings } from 'src/shared/interface/layer-settings';
import { IdleModeService } from 'src/services/idle-mode-service';
import { DefaultLensProperties, LensProperties } from 'src/shared/interface/lens-properties';
import { InteractionMetaphor } from 'src/shared/enum/interaction-metaphor';
import log from 'electron-log';
import { CommonModule } from '@angular/common';
import { LensComponent } from '../lens/lens.component';

@Component({
  selector: 'app-lens-visualization',
  templateUrl: './lens-visualization.component.html',
  styleUrls: ['./lens-visualization.component.scss'],
  imports: [
      CommonModule,
      LensComponent
    ],
    standalone: true
})
export class LensVisualizationComponent implements OnInit {

  public ShowLens = false;

  public BackgroundImage = '';
  public CurrentImage = '';
  public Images: string[] = [];

  private _descriptions: string[] = []
  private _maxNumLenses = 3;

  private _displayMultipleLenses = false;

  private srcHeight = 1080;
  private srcWidth = 1920;

  private _layerRadiusComplete = 33;
  private _layerRadiusStart = 30;
  private _layerBorderWidth = 0.1;

  public LensProperties: Array<LensProperties> = [];

  private _offsetX = 0;
  private _offsetY = 0;

  private _touchPointSubscription?: Subscription;
  private _resizeObservable$?: Observable<Event>;
  private _resizeSubscription?: Subscription;
  private _textureSubscription?: Subscription;
  private _settingsSubscription?: Subscription;

  constructor(
    private _layerService: LayerLogicServiceBase,
    private readonly _textureService: TextureRepositoryService,
    public readonly SettingsService: SettingsService,
    public readonly IdleService: IdleModeService) {
  }

  public ngOnInit(): void {
    this._touchPointSubscription = this._layerService.getDepthInformation().subscribe(info => {
      this.updateLensVisualization(info);
    });

    this._resizeObservable$ = fromEvent(window, 'resize')
    this._resizeSubscription = this._resizeObservable$.subscribe( evt => {
      this.updateSize();
    });

    this._textureSubscription = this._textureService.SelectedTextureId.pipe(
      concatMap((id:number) => this._textureService.retrieveTextureResource(id))
    ).subscribe(
      result => this.loadTextures(result),
      error => {
        console.error(error);
        log.error(error);
      }
    );

    this._settingsSubscription = this.SettingsService.CurrentSettings.subscribe(
      (updatedSettings) => {
        this.updateLens(updatedSettings.defaultLayerSettings);
        this._maxNumLenses = updatedSettings.defaultLayerSettings?.maxNumLenses ?? 1;
        this._displayMultipleLenses = updatedSettings.defaultLayerSettings?.interaction === InteractionMetaphor.MultiTouchLens;
      }
    );
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.updateSize();
  }

  public ngOnDestroy(): void {
    this._touchPointSubscription?.unsubscribe();
    this._resizeSubscription?.unsubscribe();
    this._textureSubscription?.unsubscribe();
    this._settingsSubscription?.unsubscribe();
  }

  private updateLensVisualization(info: DepthInformation[]): void {
    this.ShowLens = info.length > 0 && info[0]?.layer > 0;
    this.LensProperties = [];

    if (this.ShowLens) {

      const numLenses = Math.min(this._displayMultipleLenses ? this._maxNumLenses : 1, info.length);

      this.CurrentImage = '';

      for(let i = 0; i < numLenses; i++) {

        const layerIdx = this.ShowLens ? info[i].layer : 0;

        if ((this.Images.length <= layerIdx)) {
          return;
        }

        if (this.CurrentImage === '') {
          this.CurrentImage = this.Images[layerIdx];
        }

        let touchPositionX = ((info[i].point?.Position?.X ?? 0) - 0.5) * this.srcWidth;
        let touchPositionY = ((info[i].point?.Position?.Y ?? 0) - 0.5) * this.srcHeight;


        let props: LensProperties = {
          CanvasOffset: {
            X: -touchPositionX,
            Y: -touchPositionY
          },
          Description: this._descriptions[layerIdx],
          LayerBackground: DefaultLensProperties.LayerBackground,
          LensImage: this.Images[layerIdx],
          LensOffset: {
            X: touchPositionX + this._offsetX,
            Y: touchPositionY + this._offsetY
          },
          TouchPosition: {
            X: touchPositionX,
            Y: touchPositionY
          }
        };

        this.LensProperties.push(props);

        this.updateLayerVisualization(layerIdx, i);
      }
    }
  }

  private updateSize(): void {
    this.srcHeight = window.innerHeight;
    this.srcWidth = window.innerWidth;
  }

  private updateLens(updatedSettings: LayerSettings): void {
    this._offsetX = updatedSettings?.lensOffsetX ?? 0;
    this._offsetY = updatedSettings?.lensOffsetY ?? 0;
  }

  private loadTextures(resource?: TextureResource): void {
    if (resource === undefined || resource.type !== TextureResourceType.Texture2d || resource.layers.length <= 1) {
      return;
    }

    // this.Images = [];
    this.Images = [...resource.layers.map((res) => `url(assets/${resource.folder}/${res.file})`)];
    this.BackgroundImage = this.Images[0];

    // this._descriptions = [];
    this._descriptions = resource.layers.map((res) => res?.description ?? '');
    // this.LensProperties.Description = this._descriptions[0];

    this.updateLayerVisualization();
  }

  private updateLayerVisualization(layerIdx = -1, lensIdx = 0): void {

    if (!this.ShowLens || this.Images.length < 1) {
      if (this.LensProperties?.length <= lensIdx) {
        return;
      }
      this.LensProperties[lensIdx].LayerBackground = 'transparent';
      return;
    }

    const layerWidth = this._layerRadiusComplete / this.Images.length;

    this.LensProperties[lensIdx].LayerBackground = `conic-gradient(from ${this._layerRadiusStart}deg, #fff 0% ${this._layerBorderWidth.toFixed(1)}%,`;
    let currentProgress = this._layerBorderWidth;

    if (this.Images.length < 20) {

      for (let i = 0; i < this.Images.length; i++) {

        let color = i === layerIdx ? '#3895d366' : '#fff6';

        this.LensProperties[lensIdx].LayerBackground += ` ${color} ${currentProgress.toFixed(1)}% ${(currentProgress + layerWidth - this._layerBorderWidth).toFixed(1)}%,`;
        currentProgress += layerWidth;
        this.LensProperties[lensIdx].LayerBackground += ` #fff ${(currentProgress - this._layerBorderWidth).toFixed(1)}% ${this._layerBorderWidth.toFixed(1)}%,`;
      }
    }
    else {
      const currentLayerPercentage = layerWidth * layerIdx;
      this.LensProperties[lensIdx].LayerBackground += ` #fff6 ${this._layerBorderWidth.toFixed(1)}%  ${currentLayerPercentage.toFixed(1)}%,`;
      this.LensProperties[lensIdx].LayerBackground += ` #3895d366 ${currentLayerPercentage.toFixed(1)}%  ${(currentLayerPercentage + this._layerBorderWidth).toFixed(1)}%,`;
      this.LensProperties[lensIdx].LayerBackground += ` #fff6 ${(currentLayerPercentage + this._layerBorderWidth).toFixed(1)}%  ${(this._layerRadiusComplete - this._layerBorderWidth).toFixed(1)}%,`;

      this.LensProperties[lensIdx].LayerBackground += ` #fff ${(this._layerRadiusComplete - this._layerBorderWidth).toFixed(1)}% ${this._layerRadiusComplete.toFixed(1)}%,`;
    }

    this.LensProperties[lensIdx].LayerBackground += ` transparent ${(this._layerRadiusComplete + this._layerBorderWidth).toFixed(1)}% 100%)`;

  }
}
