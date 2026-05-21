import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { animationFrameScheduler, concatMap, flatMap, interval, map, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { InteractionService } from 'src/services/interaction.service';
import { DepthImageServiceFacade } from 'src/services/depth-image.facade.service';
import { LayerLogicServiceBase } from 'src/services/layer-logic.service.base';
import { SettingsService } from 'src/services/settings.service';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { InteractionMetaphor } from 'src/shared/enum/interaction-metaphor';
import { TextureResourceType } from 'src/shared/enum/texture-resource-type';
import { TextureResource } from 'src/shared/interface/texture-resource';
import { DepthInformation } from 'src/shared/model/depth-information';
import { hexToRgb } from 'src/shared/util/util';
import * as THREE from 'three';
import { DataTexture, PixelFormat, RedFormat, Texture, Vector2 } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import log from 'electron-log';
import { AppSettings } from 'src/shared/interface/app-settings';

@Component({
  selector: 'app-texture-blending',
  templateUrl: './texture-blending.component.html',
  styleUrls: ['./texture-blending.component.scss'],
  standalone: true
})
export class TextureBlendingComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('renderContainer')
  public container?: ElementRef;

  @HostListener('window:resize', [])
  onResize() {
    this._screenHeight = window.innerHeight;
    this._screenWidth = window.innerWidth;
    this._renderer?.setSize(this._screenWidth, this._screenHeight);

    this._shaderMaterialTexture2d.uniforms['viewportSize'].value = new THREE.Vector2(this._screenWidth, this._screenHeight);
    this._shaderMaterialTexture2d.uniformsNeedUpdate = true;
  }

  @Input()
  public selectedTextureIdx: number = 0;
  private _textureType = TextureResourceType.Texture2d;

  private _renderer?: THREE.WebGLRenderer;
  private readonly _textureLoader = new THREE.TextureLoader();
  private readonly _scene: THREE.Scene;
  private readonly _camera: THREE.Camera;

  private readonly _fullScreenQuad: THREE.Mesh;

  private readonly _planeWidth = 192;
	private readonly _planeHeight = 108;

  private _screenWidth = window.innerWidth;
  private _screenHeight = window.innerHeight;

  private _texArray: Array<Texture> = new Array<Texture>(15);
  private _texDataArray?: THREE.DataArrayTexture;

  private readonly _ktx2Loader = new KTX2Loader();

  public isActive = false;

  private readonly _shaderMaterialTexture2d: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: false,
    depthWrite: false,
    precision: 'highp',
    uniforms: {
      numImages: { value: 7 },
      layers: { value: this._texArray },
      depth: { value: DataTexture },
      showDepth: { value: 0.0 },
      minDepth: { value: 0.0 },
      maxDepth: { value: 1.0 },
      doOverrideDepth: { value: 0.0 },
      depthOverrideValue: { value: 0.0 },
      interpolateColor: { value: 1.0 },
      applyCalibration: { value: 0.0 },
      translate: { value: new THREE.Vector3( 0.0, 0.0, 0.0 ) },
      scale: { value: new THREE.Vector3( 1.0, 1.0, 1.0 ) },
      viewportSize: { value: new THREE.Vector2( this._planeWidth, this._planeHeight ) },
      size: { value: new THREE.Vector2( this._planeWidth, this._planeHeight ) },
      originalSize: { value: new THREE.Vector2( 512.0, 424.0 )}
    },
    glslVersion: THREE.GLSL3
  });

  private readonly _shaderMaterialTextureArray: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: false,
    depthWrite: false,
    precision: 'highp',
    uniforms: {
      numImages: { value: 10 },
      layers: { value: this._texDataArray },
      depth: { value: Texture },
      showDepth: { value: 0.0 },
      minDepth: { value: 0.0 },
      maxDepth: { value: 1.0 },
      doOverrideDepth: { value: 0.0 },
      depthOverrideValue: { value: 0.0 },
      interpolateColor: { value: 1.0 },
      useRedChannelOnly: { value: 0.0 },
      applyCalibration: { value: 0.0 },
      translate: { value: new THREE.Vector3( 0.0, 0.0, 0.0 ) },
      scale: { value: new THREE.Vector3( 1.0, 1.0, 1.0 ) },
      viewportSize: { value: new THREE.Vector2( this._planeWidth, this._planeHeight ) },
      size: { value: new THREE.Vector2( this._planeWidth, this._planeHeight ) },
      originalSize: { value: new THREE.Vector2( 512.0, 424.0 )}
    },
    glslVersion: THREE.GLSL3
  });

  private readonly _shaderMaterialTextureArrayLens: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: false,
    depthWrite: false,
    precision: 'highp',
    uniforms: {
      numImages: { value: 10 },
      layers: { value: this._texDataArray },
      mask: { value: Texture },
      interactionValue: { value: new THREE.Vector3(0.5,0.5,0.0) },
      maskColor: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
      size: { value: new THREE.Vector2( this._planeWidth, this._planeHeight ) }
    },
    glslVersion: THREE.GLSL3
  });

  private readonly _shaderMaterialTextureArrayLayerNavigation: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: false,
    depthWrite: false,
    precision: 'highp',
    uniforms: {
      numImages: { value: 10 },
      layers: { value: this._texDataArray },
      depthValue: { value: 0.0 },
      size: { value: new THREE.Vector2( this._planeWidth, this._planeHeight ) }
    },
    glslVersion: THREE.GLSL3
  });

  private _renderSubscription?: Subscription;
  private _textureSubscription?: Subscription;

  private _depthImageSubscription? : Subscription;
  private _layerSubscription? : Subscription;
  private _settingsSubscription? : Subscription;
  private _interactionTypeSubscription? : Subscription;
  private _calibrationSubscription?: Subscription;
  private _depthImageResolutionSubscription?: Subscription;

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _angularRenderer: Renderer2,
    private readonly _textureService: TextureRepositoryService,
    private readonly _depthImageService: DepthImageServiceFacade,
    private readonly _layerService: LayerLogicServiceBase,
    private readonly _interactionService: InteractionService,
    public readonly SettingsService: SettingsService ) {

      this._httpClient.get('assets/shader/fullscreen-rect_vertex.txt', {
        responseType: 'text'
      }).subscribe((shader) => {
        this._shaderMaterialTexture2d.vertexShader = shader.toString();
        this._shaderMaterialTextureArray.vertexShader = shader.toString();
        this._shaderMaterialTextureArrayLens.vertexShader = shader.toString();
        this._shaderMaterialTextureArrayLayerNavigation.vertexShader = shader.toString();
        this._shaderMaterialTexture2d.needsUpdate = true;
        this._shaderMaterialTextureArray.needsUpdate = true;
        this._shaderMaterialTextureArrayLens.needsUpdate = true;
        this._shaderMaterialTextureArrayLayerNavigation.needsUpdate = true;
      });

      this._httpClient.get('assets/shader/blendTexture_sampler2d_fragment.txt', {
        responseType: 'text'
      }).subscribe((shader) => {
        this._shaderMaterialTexture2d.fragmentShader = shader.toString();
        this._shaderMaterialTexture2d.needsUpdate = true;
      });

      this._httpClient.get('assets/shader/blendTexture_textureArray_fragment.txt', {
        responseType: 'text'
      }).subscribe((shader) => {
        this._shaderMaterialTextureArray.fragmentShader = shader.toString();
        this._shaderMaterialTextureArray.needsUpdate = true;
      });

      this._httpClient.get('assets/shader/useLens_textureArray_fragment.txt', {
        responseType: 'text'
      }).subscribe((shader) => {
        this._shaderMaterialTextureArrayLens.fragmentShader = shader.toString();
        this._shaderMaterialTextureArrayLens.needsUpdate = true;
      });

      this._httpClient.get('assets/shader/layerNavigation_textureArray_fragment.txt', {
        responseType: 'text'
      }).subscribe((shader) => {
        this._shaderMaterialTextureArrayLayerNavigation.fragmentShader = shader.toString();
        this._shaderMaterialTextureArrayLayerNavigation.needsUpdate = true;
      });

      this._settingsSubscription = this.SettingsService.CurrentSettings.subscribe(
        {
          next: (settings) => this.settingsUpdated(settings),
          error: (error) => {
            console.error(error);
            log.error(error);
          }
        }
      );

      this._scene = new THREE.Scene();

      // this.renderer = new THREE.WebGLRenderer({canvas: this.container, antialias: true});
      this._camera = new THREE.PerspectiveCamera(45, 16/9, 0.1, 1000);
      this._camera.position.z = 130;


      this._fullScreenQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(this._planeWidth, this._planeHeight, 2000, 2000),
        this._shaderMaterialTexture2d
      );
      this._scene.add(this._fullScreenQuad);
    }

  ngOnInit(): void {
    this._interactionTypeSubscription = this.SettingsService.CurrentInteraction.subscribe(
      (updatedInteraction) => this.interactionUpdated(updatedInteraction)
    );

    this._textureSubscription = this._textureService.SelectedTextureId.pipe(
      concatMap((id:number) => this._textureService.retrieveTextureResource(id))
    ).subscribe(
      result => this.loadTextures(result),
      error => {
        console.error(error);
        log.error(error);
      }
    );

    this._layerSubscription = this._layerService.getDepthInformation().subscribe(
      (info) => this.updateLayerVisualization(info)
    );

    this._calibrationSubscription = this._interactionService.getCalibration().subscribe(
      (transformation) => {
          this._shaderMaterialTextureArray.uniforms['scale'].value = transformation.scale;
          this._shaderMaterialTextureArray.uniforms['translate'].value = transformation.translation;
          this._shaderMaterialTextureArray.uniformsNeedUpdate = true;

          this._shaderMaterialTexture2d.uniforms['scale'].value = transformation.scale;
          this._shaderMaterialTexture2d.uniforms['translate'].value = transformation.translation;
          this._shaderMaterialTexture2d.uniformsNeedUpdate = true;
      }
    );

    this._depthImageResolutionSubscription = this._interactionService.getCameraConfig().subscribe((cfg) => {
      this._shaderMaterialTexture2d.uniforms['originalSize'].value = new THREE.Vector2( cfg.width, cfg.height );
      this._shaderMaterialTextureArray.uniforms['originalSize'].value = new THREE.Vector2( cfg.width, cfg.height );

      this._shaderMaterialTexture2d.uniformsNeedUpdate = true;
      this._shaderMaterialTextureArray.uniformsNeedUpdate = true;
    });

    this.updateDepthImageSubscription();
  }

  public ngAfterViewInit(): void {
    this.initRenderer();
    this.updateRenderSubscription();
  }

  public ngOnDestroy(): void {
    this._renderSubscription?.unsubscribe();
    this._textureSubscription?.unsubscribe();
    this._depthImageSubscription?.unsubscribe();
    this._settingsSubscription?.unsubscribe();
    this._layerSubscription?.unsubscribe();
    this._interactionTypeSubscription?.unsubscribe();
    this._calibrationSubscription?.unsubscribe();
    this._depthImageResolutionSubscription?.unsubscribe();
  }

  private updateDepthImageSubscription() {

    this._depthImageSubscription = this._depthImageService.Data.subscribe(
      imgData => this.updateStreamedTexture(imgData)
    );

  }

  private updateStreamedTexture(imgData: string): void {
    var image = new Image();
    image.src = imgData;
    var texture = new THREE.Texture();
    texture.image = image;
    texture.needsUpdate = true;
    this._shaderMaterialTexture2d.uniforms['depth'].value = texture;
    this._shaderMaterialTexture2d.uniformsNeedUpdate = true;
    this._shaderMaterialTextureArray.uniforms['depth'].value = texture;
    this._shaderMaterialTextureArray.uniformsNeedUpdate = true;

  }

  private loadTextures(resource: TextureResource | undefined): void {
    if (resource === undefined) {
      return;
    }

    this._textureType = resource.type;

    switch (resource.type) {
      case 1:
        this.loadDataArrayTextureKTX(resource);
        break;
      case 2:
        this.loadDataArrayTexture(resource);
        break;
      case 0:
      default:
        this.loadTexture2d(resource);
        break;
    }

    if (resource.type === undefined || resource.type === 0) {
      this._textureType = TextureResourceType.Texture2d;
      this.loadTexture2d(resource);
    }

    const interactionMetaphor = this.SettingsService.CurrentSettings.value?.defaultLayerSettings?.interaction ?? InteractionMetaphor.PixelBlending;

    this.updateState(interactionMetaphor, this._textureType);

    this.updateMaterial(interactionMetaphor, this._textureType);

  }

  private settingsUpdated(settings: AppSettings): void {

    const idx = settings.defaultLayerSettings?.defaultLensMaskIdx >= 0 && settings.defaultLayerSettings?.defaultLensMaskIdx < settings.lensMasks.length
      ? settings.defaultLayerSettings.defaultLensMaskIdx
      : 0;

    const maskColor = hexToRgb(settings?.defaultLayerSettings?.lensBorderColor ?? '#fff');
    this._shaderMaterialTextureArrayLens.uniforms['maskColor'].value = new THREE.Vector4(maskColor.r / 255, maskColor.g / 255, maskColor.b / 255, 1.0);
    this._shaderMaterialTextureArrayLens.uniformsNeedUpdate = true;

    const mask = `assets/textures/common/${settings.lensMasks[idx]}`;
    this._textureLoader.load(mask, (texture) => {
      this._shaderMaterialTextureArrayLens.uniforms['mask'].value = texture;
      this._shaderMaterialTextureArrayLens.uniformsNeedUpdate = true;
    });

    this._shaderMaterialTexture2d.uniforms['interpolateColor'].value = (settings.defaultLayerSettings?.interpolateColor ?? false) ? 1.0 : 0.0;
    this._shaderMaterialTexture2d.uniforms['showDepth'].value = settings.showDepthImage ? 1.0 : 0.0;
    this._shaderMaterialTexture2d.uniforms['doOverrideDepth'].value = settings.doOverrideDepth ? 1.0 : 0.0;
    this._shaderMaterialTexture2d.uniforms['applyCalibration'].value = (settings.defaultLayerSettings?.applyCalibration ?? true) ? 1.0 : 0.0;
    this._shaderMaterialTexture2d.uniforms['depthOverrideValue'].value = settings.depthOverrideValue;
    this._shaderMaterialTexture2d.uniforms['minDepth'].value = settings.minDepth;
    this._shaderMaterialTexture2d.uniforms['maxDepth'].value = settings.maxDepth;

    this._shaderMaterialTextureArray.uniforms['interpolateColor'].value = (settings.defaultLayerSettings?.interpolateColor ?? false)  ? 1.0 : 0.0;
    this._shaderMaterialTextureArray.uniforms['showDepth'].value = settings.showDepthImage ? 1.0 : 0.0;
    this._shaderMaterialTextureArray.uniforms['doOverrideDepth'].value = settings.doOverrideDepth ? 1.0 : 0.0;
    this._shaderMaterialTextureArray.uniforms['applyCalibration'].value = (settings.defaultLayerSettings?.applyCalibration ?? true) ? 1.0 : 0.0;
    this._shaderMaterialTextureArray.uniforms['depthOverrideValue'].value = settings.depthOverrideValue;
    this._shaderMaterialTextureArray.uniforms['minDepth'].value = settings.minDepth;
    this._shaderMaterialTextureArray.uniforms['maxDepth'].value = settings.maxDepth;

    this._shaderMaterialTexture2d.uniformsNeedUpdate = true;
    this._shaderMaterialTextureArray.uniformsNeedUpdate = true;

    const metaphor = settings?.defaultLayerSettings?.interaction ?? InteractionMetaphor.PixelBlending;

    this.updateState(metaphor, this._textureType);
  }

  private interactionUpdated(updatedInteraction: InteractionMetaphor): void {
    this.updateState(updatedInteraction, this._textureType);

    this.updateMaterial(updatedInteraction, this._textureType);
  }

  private updateState(interaction: InteractionMetaphor, type: TextureResourceType): boolean {

    const useTexArray = type === TextureResourceType.TextureArray_DataTexture || type === TextureResourceType.TextureArray_Khronos;

    const updatedValue = interaction === 0 || useTexArray;
    const oldValue = this.isActive;

    if (updatedValue === oldValue) {
      return false;
    }

    this.isActive = updatedValue;
    this.updateRenderSubscription();

    return true;
  }

  private updateMaterial(interaction: InteractionMetaphor, type: TextureResourceType): void {

    if (interaction === InteractionMetaphor.PixelBlending) {

      switch(type) {
        case TextureResourceType.TextureArray_Khronos:
        case TextureResourceType.TextureArray_DataTexture:
          this._fullScreenQuad.material = this._shaderMaterialTextureArray;
          break;
        case TextureResourceType.Texture2d:
        default:
          this._fullScreenQuad.material = this._shaderMaterialTexture2d;
      }

      return;
    }

    if (interaction === InteractionMetaphor.GlobalLayerNavigation &&
      (type === TextureResourceType.TextureArray_DataTexture || type === TextureResourceType.TextureArray_Khronos)) {
        this._fullScreenQuad.material = this._shaderMaterialTextureArrayLayerNavigation;
    }

    if (interaction === InteractionMetaphor.SingleTouchLens &&
      (type === TextureResourceType.TextureArray_DataTexture || type === TextureResourceType.TextureArray_Khronos)) {
        this._fullScreenQuad.material = this._shaderMaterialTextureArrayLens;
    }
  }

  private loadTexture2d(resource: TextureResource): void {
    this._fullScreenQuad.material = this._shaderMaterialTexture2d;

    resource.layers.forEach(layer => {
      if (layer.id < 0 || layer.id >= environment.maxTexture2dCount) {
        return;
      }

      const numTextures = Math.min(resource.layers.length, environment.maxTexture2dCount);

      this._texArray = new Array<Texture>(numTextures);
      this._shaderMaterialTexture2d.uniforms['numImages'].value = numTextures;

      this._textureLoader.load(`assets/${resource.folder}/${layer.file}`, (texture) => {
        texture.anisotropy = 16;
        this._texArray[layer.id] = texture;
        this._shaderMaterialTexture2d.uniforms['layers'].value = this._texArray;
        this._shaderMaterialTexture2d.uniformsNeedUpdate = true;
      })
    });
  }

  private loadDataArrayTexture(resource: TextureResource): void {
    if (resource.layers.length != 1) {
      const error = 'DataArray must not contain more or less than 1 layer';
      console.error(error);
      log.error(error);
      return;
    }

    if (!(resource.resX && resource.resY && resource.numLayers && resource.pixelFormat as PixelFormat)) {
      const error = `Missing information for DataArray: Resolution = [${resource.resX} x ${resource.resY} x ${resource.numLayers}], PixelFormat = ${resource.pixelFormat} `;
      console.error(error);
      log.error(error);
      return;
    }

    const layer = resource.layers[0];

    new THREE.FileLoader()
      .setResponseType( 'arraybuffer' )
      .load( `assets/${resource.folder}/${layer.file}`, (data) => {
        const array = new Uint8Array( data as ArrayBuffer );
        this._texDataArray = new THREE.DataArrayTexture( array, resource.resX, resource.resY, resource.numLayers );
        this._texDataArray.format = resource.pixelFormat;
        this._texDataArray.needsUpdate = true;

        this._shaderMaterialTextureArray.uniforms['numImages'].value = resource.numLayers;
        this._shaderMaterialTextureArray.uniforms['layers'].value = this._texDataArray;
        this._shaderMaterialTextureArray.uniforms['useRedChannelOnly'].value =
          resource.pixelFormat === RedFormat ? 1.0 : 0.0;
        this._shaderMaterialTextureArray.uniformsNeedUpdate = true;

        this._shaderMaterialTextureArrayLens.uniforms['layers'].value = this._texDataArray;
        this._shaderMaterialTextureArrayLens.uniformsNeedUpdate = true;

        this._shaderMaterialTextureArrayLayerNavigation.uniforms['layers'].value = this._texDataArray;
        this._shaderMaterialTextureArrayLayerNavigation.uniformsNeedUpdate = true;

      } );
  }

  private loadDataArrayTextureKTX(resource: TextureResource): void {
    if (resource.layers.length != 1) {
      const error = 'DataArray must not contain more or less than 1 layer';
      console.error(error);
      log.error(error);
      return;
    }

    const layer = resource.layers[0];

    this._ktx2Loader.load(`assets/${resource.folder}/${layer.file}`, ( textureArray ) => {

      this._shaderMaterialTextureArray.uniforms['numImages'].value = resource.numLayers;
      this._shaderMaterialTextureArray.uniforms['layers'].value = textureArray;
      this._shaderMaterialTextureArray.uniforms['useRedChannelOnly'].value = 0.0;
      this._shaderMaterialTextureArray.uniformsNeedUpdate = true;

      this._shaderMaterialTextureArrayLens.uniforms['numImages'].value = resource.numLayers;
      this._shaderMaterialTextureArrayLens.uniforms['layers'].value = textureArray;
      this._shaderMaterialTextureArrayLens.uniformsNeedUpdate = true;

      this._shaderMaterialTextureArrayLayerNavigation.uniforms['numImages'].value = resource.numLayers;
      this._shaderMaterialTextureArrayLayerNavigation.uniforms['layers'].value = textureArray;
      this._shaderMaterialTextureArrayLayerNavigation.uniformsNeedUpdate = true;
    });

  }

  private updateRenderSubscription(): void {

    this._renderSubscription?.unsubscribe();

    if (this.isActive) {
      this._renderSubscription = interval(0, animationFrameScheduler)
        .subscribe(() => {
          if (this.isActive) {
            // if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            //   renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
            //   camera.aspect = canvas.clientWidth /  canvas.clientHeight;
            //   this._camera.updateMatrix().updateProjectionMatrix();
            // }

            this._renderer?.render(this._scene, this._camera);
          }
        });
    }
  }

  private initRenderer() {
    this._renderer = new THREE.WebGLRenderer({ alpha: true, canvas: this.container?.nativeElement });

    this._ktx2Loader.setTranscoderPath( 'assets/jsm/libs/basis/' );
    this._ktx2Loader.detectSupport( this._renderer );

    this._renderer.setSize(this._screenWidth, this._screenHeight);

    this._shaderMaterialTexture2d.uniforms['viewportSize'].value = new THREE.Vector2( this._screenWidth, this._screenHeight );
    this._shaderMaterialTextureArray.uniforms['viewportSize'].value = new THREE.Vector2( this._screenWidth, this._screenHeight );

  }

  private updateLayerVisualization(info: DepthInformation[]): void {
    if (this._textureType === TextureResourceType.Texture2d && this.SettingsService.CurrentSettings.value?.defaultLayerSettings?.interaction !== 0) {
      return;
    }

    const depthValue = info?.length ?? 0 > 0 ? Math.abs(info[0].point.Position.Z) : 0.0;
    const xValue = info?.length ?? 0 > 0 ? Math.abs(info[0].point.Position.X) : 0.5;
    const yValue = info?.length ?? 0 > 0 ? Math.abs(info[0].point.Position.Y) : 0.5;

    this._shaderMaterialTextureArrayLens.uniforms['interactionValue'].value = new THREE.Vector3(xValue, yValue, depthValue);
    this._shaderMaterialTextureArrayLens.uniformsNeedUpdate = true;

    this._shaderMaterialTextureArrayLayerNavigation.uniforms['depthValue'].value = depthValue;
    this._shaderMaterialTextureArrayLayerNavigation.uniformsNeedUpdate = true;
  }

}
