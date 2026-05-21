import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { DepthInformation } from 'src/shared/model/depth-information';
import { TouchPoint } from 'src/shared/model/touch-point';
import { scale } from 'src/shared/util/util';
import { LayerLogicServiceBase } from './layer-logic.service.base';
import { InteractionService } from './interaction.service';
import { TextureRepositoryService } from './texture-repository.service';

@Injectable()
export class LayerLogicService implements LayerLogicServiceBase, OnDestroy {
  private _touchPointSubscription?: Subscription;
  private _textureSubscription?: Subscription;

  private _currentLayer$: Subject<Number> = new Subject<Number>();
  private _currentDeepestPoint$: Subject<TouchPoint[]> = new Subject<TouchPoint[]>();
  private _depthInformation$: Subject<DepthInformation[]> = new Subject<DepthInformation[]>();
  private _transitionToOrFromBottom$: Subject<boolean> = new Subject<boolean>();

  // private _deepestPoint: TouchPoint = { posX: 0, posY: 0, posZ: 0, touchId: 0 };
  private _deepestPoint  : TouchPoint[] = new Array<TouchPoint>();
  private _step = 1.0;
  private _numLayers = 1;
  private _lastLayer: number = 0;
  private _depthInformation: DepthInformation[] = new Array<DepthInformation>();

  private _storedDepthInfo : DepthInformation[] = [];

   private _isAtBottom = false;

  constructor(
    private readonly _interactionService: InteractionService, 
    private readonly _textureService: TextureRepositoryService,
    ) {

    this._interactionService.startStreaming();

    this._touchPointSubscription = this._interactionService.Data.subscribe(points => {
      if (!(Array.isArray(points) && points.length > 0)) {
        this._depthInformation$.next([]);
        this._currentDeepestPoint$.next([]);
        return;
      }

      let filtered = points.filter(tp => (tp?.Position?.Z ?? 0) < 0);    

      this._depthInformation = [];
      this._deepestPoint = [];
      
      this._storedDepthInfo = [];


      if (filtered.length > 0) {
        this._deepestPoint = this.computeDeepestPoint(filtered);
       
        for (let pointIdx = 0; pointIdx < this._deepestPoint.length; pointIdx++) {
          this.processPoint(pointIdx);
        }
      }
      

      this._currentDeepestPoint$.next(this._deepestPoint);
      this._depthInformation$.next(this._depthInformation.reverse());
    });

    this._textureSubscription = this._textureService.NumLayers.subscribe((updatedNumber) => {
        this._step = 1.0 / updatedNumber;
        this._numLayers = updatedNumber;
    });

    
  }

  public getLayerChange(): Observable<Number> {
    return this._currentLayer$;
  }

  public getDeepestPoint(): Observable<TouchPoint[]> {
    return this._currentDeepestPoint$;
  }

  public getDepthInformation(): Observable<DepthInformation[]> {
    return this._depthInformation$;
  }

  public getBottomReachedTransition(): Observable<boolean> {
    return this._transitionToOrFromBottom$;
  }

  public ngOnDestroy(): void {
    this._interactionService.stopStreaming();
    this._touchPointSubscription?.unsubscribe();
    this._textureSubscription?.unsubscribe();
  }

  private processPoint(pointIdx: number): void {   

    let l: number = this.computeLayerIdx(this._deepestPoint[pointIdx]);
    if (l != this._lastLayer) {
      this._currentLayer$.next(this._lastLayer);
      this._lastLayer = l;
    }

    let d = this.computeDepthInformation(this._deepestPoint[pointIdx]);
    this._storedDepthInfo = [d];

    // if (this._depthInformation.length <= pointIdx || (d.layer != this._depthInformation[pointIdx].layer) || (d.inLayerDepth != this._depthInformation[pointIdx].inLayerDepth)) {
      this._depthInformation.push(d)
    //}

    // Point lays in the most bottom layer in the lower part of the layer
    // const atBottom = this._depthInformation[0].layer + 1 == this._numLayers && this._depthInformation[0].inLayerDepth > (0.49);
    // if (!this._isAtBottom && atBottom) {
    //   this._transitionToOrFromBottom$.next(true)
    //   this._isAtBottom = true;
    // } else if (this._isAtBottom && !atBottom) {
    //   this._transitionToOrFromBottom$.next(false)
    //   this._isAtBottom = false;
    // } else {
    //     // this._depthInformation$.next(this._depthInformation);
    // };
  }

  private computeLayerIdx(point: TouchPoint): number {
    const layerIdx = Math.floor(Math.abs(point.Position?.Z ?? 0) / this._step);
    return Math.min(Math.max(layerIdx, 0), this._numLayers - 1);
  }

  private computeDeepestPoint(points: TouchPoint[]): TouchPoint[] {
    return points.sort((tp1, tp2) => Math.abs(tp1?.Position?.Z ?? 0) - Math.abs(tp2?.Position?.Z ?? 0));
  }

  private computeDepthInformation(point: TouchPoint): DepthInformation {
    const layer = this.computeLayerIdx(point);
    let inLayerDepth = Math.abs(point?.Position?.Z ?? 0) - layer * this._step;

    //Map to range -0.5 0.5
    // console.log(`z: ${Math.abs(point.posZ)}, d: ${inLayerDepth}, old_min: 0, old_max : ${this._step}, new_min: -0.5, new_max: 0.5`);
    inLayerDepth = scale(inLayerDepth, 0, this._step, -0.5, 0.5);
    inLayerDepth = Math.round(inLayerDepth * 1000) / 1000; // round to three numbers after .
    return { 
      layer: layer, 
      inLayerDepth: inLayerDepth, 
      deadzone: 0,
      point: point 
    }
  }
}
