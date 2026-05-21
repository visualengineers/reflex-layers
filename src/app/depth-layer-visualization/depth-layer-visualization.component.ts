import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IdleModeService } from 'src/services/idle-mode-service';
import { LayerLogicServiceBase } from 'src/services/layer-logic.service.base';
import { SettingsService } from 'src/services/settings.service';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { InteractionMetaphor } from 'src/shared/enum/interaction-metaphor';
import { DepthInformation } from 'src/shared/model/depth-information';

@Component({
  selector: 'app-depth-layer-visualization',
  templateUrl: './depth-layer-visualization.component.html',
  styleUrls: ['./depth-layer-visualization.component.scss'],
  imports: [
    CommonModule,
  ],
  standalone: true
})
export class DepthLayerVisualizationComponent implements OnInit, OnDestroy {

  private _touchPointSubscription? : Subscription;
  private _textureSubscription? : Subscription;
  private _experimentConditionSubscription?: Subscription;
  private _settingsSubscription?: Subscription;

  private _numPointsDisplay = 1;

  public PointPositions: Array<number> = [];
  public ShowDepthLayerVisualization = true;

  public Layers: Array<number> = [];
  public LayerSize : number = 100;
  public NumLayers = 0;

  public CurrentTransform: string = 'scaleY(0.0)';
  public borderRadius = '0';

  public constructor(
    private _interactionService: LayerLogicServiceBase,
    private readonly _textureService: TextureRepositoryService,
    public readonly SettingsService: SettingsService,
    public readonly IdleService: IdleModeService) {
   }


  public ngOnInit(): void {
    this._touchPointSubscription = this._interactionService.getDepthInformation().subscribe(info => {
      this.updatePoints(info);
    });

    this._textureSubscription = this._textureService.NumLayers.subscribe((updatedNumber) => {
      this.Layers = new Array<number>(updatedNumber + 1);
      this.LayerSize = (1.0 / (updatedNumber)) * 100;
      this.NumLayers = updatedNumber;
    });

    this._settingsSubscription = this.SettingsService.CurrentSettings.subscribe(
      (updatedSettings) => {
        this._numPointsDisplay = updatedSettings.defaultLayerSettings?.interaction === InteractionMetaphor.MultiTouchLens ? (updatedSettings.defaultLayerSettings?.maxNumLenses ?? 1) : 1;
      }
    );
  }

  public ngOnDestroy(): void {
    this._touchPointSubscription?.unsubscribe();
    this._experimentConditionSubscription?.unsubscribe();
    this._settingsSubscription?.unsubscribe();
    this._textureSubscription?.unsubscribe();
  }

  public updatePoints(info: DepthInformation[]) : void {
    const layer = info.length > 0 ? info[0].layer : 0;

    let z = info.map(i => Math.max(2, Math.min(Math.abs(i.point.Position?.Z ?? 0) * 100, 98)));

    if (z.length > this._numPointsDisplay) {
      z.length = this._numPointsDisplay;
    }

    this.PointPositions = z;

    this.CurrentTransform = layer >= 0
      ? `translateY(${(100 * layer).toFixed(2)}%) scaleY(${1.0})`
      : 'scaleY(0.0)';

      this.borderRadius = '0';
      if (layer === 0) {
        this.borderRadius = '3rem 3rem 0 0';
      }
      if (layer === (this.Layers.length-2)) {
        this.borderRadius = '0 0 3rem 3rem';
      }
  }

}
