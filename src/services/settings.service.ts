import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, skipWhile, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { InteractionMetaphor } from 'src/shared/enum/interaction-metaphor';
import { LayerSettings } from 'src/shared/interface/layer-settings';
import { ElectronIpcService } from './electron-ipc.service';
import log from 'electron-log';
import { AppSettings } from 'src/shared/interface/app-settings';
import { TextureResource } from 'src/shared/interface/texture-resource';
import { DiagnosticsData } from 'src/shared/util/diagnostics-data.interface';
import { DiagnosticsService } from './diagnostics.service';

@Injectable()
export class SettingsService {
  private _defaultLayerSettings: LayerSettings = {
    interaction: InteractionMetaphor.PixelBlending,
    interpolateColor: true,
    showLenseUI: false,
    showLayerUI: false,
    applyCalibration: false,
    defaultLensMaskIdx: 0,
    lensBorderColor: '#fff',
    lensSize: 1.0,
    lensOffsetX: 0.0,
    lensOffsetY: 0.0,
    maxNumLenses: 3,
  };

  private _defaultSettings: AppSettings = {
    defaultResourceId: 0,
    showDepthImage: false,
    hideSettingsPanel: false,
    depthOverrideValue: 0,
    minDepth: 0.0,
    maxDepth: 0.5,
    doOverrideDepth: false,
    streamNativeDepthImage: false,
    lensMasks: ['mask_1080p_border_plain.png'],
    enableIdleMode: true,
    useLogo: false,
    idleLogoImage: 'logo.png',
    defaultLayerSettings: this._defaultLayerSettings
  };

  private _globalLayerSettings: LayerSettings = this._defaultLayerSettings;

  public CurrentSettings = new BehaviorSubject<AppSettings>(
    this._defaultSettings
  );

  public CurrentInteraction = new BehaviorSubject<InteractionMetaphor>(
    this._defaultSettings.defaultLayerSettings?.interaction ?? InteractionMetaphor.PixelBlending
  );

  public constructor(
    private readonly _httpClient: HttpClient,
    private readonly _ipcService: ElectronIpcService,
    private readonly _diagnosticService: DiagnosticsService
  ) {
    this.loadSettings();

    this.CurrentSettings.pipe(
      filter((settings) => settings !== undefined),
      map((settings) => settings.defaultLayerSettings?.interaction ?? InteractionMetaphor.PixelBlending),
      skipWhile((interaction) => interaction === this.CurrentInteraction.value)
    ).subscribe({
      next: (updatedInteraction) =>
        this.CurrentInteraction.next(updatedInteraction),
      error: (error) => {
        console.error(error);
        log.error(error);
      },
      complete: () => {
        const warn = 'Completed subscription to CurrentSettings...';
        console.warn(warn);
        log.warn(warn);
      },
    });
  }

  public loadSettings(): void {
    this._httpClient.get<AppSettings>(environment.settingsFile).subscribe({
      next: (settings) => {
        // save default layerSettings from config
        this._globalLayerSettings = structuredClone(settings.defaultLayerSettings ?? this._defaultLayerSettings);
        log.log('global layer settings: ', this._globalLayerSettings);
        // update settings
        this.CurrentSettings.next(settings);
        this.CurrentInteraction.next(settings.defaultLayerSettings?.interaction ?? InteractionMetaphor.PixelBlending);
      },
      error: (error) => {
        console.error(error);
        log.error(error);
      },
      complete: () => {
        log.info('Settings update complete.');
      },
    });
  }

  public saveSettings(): void {
    const serializedSettings = JSON.stringify(this.CurrentSettings.getValue());

    this._ipcService.send('save-settings', serializedSettings);
  }

  public restoreSettings(): void {
    this.CurrentSettings.next(this._defaultSettings);
  }

  public updateLayerSettings(textureResource: TextureResource | undefined): void {
    const updatedConfig = this.CurrentSettings.getValue();

    // set values from texture resource or reset to defaults
    updatedConfig.defaultLayerSettings.interpolateColor = textureResource?.config?.interpolateColor ?? this._globalLayerSettings.interpolateColor;
    updatedConfig.defaultLayerSettings.interaction = textureResource?.config?.interaction ?? this._globalLayerSettings.interaction;
    updatedConfig.defaultLayerSettings.showLayerUI = textureResource?.config?.showLayerUI ?? this._globalLayerSettings.showLayerUI;
    updatedConfig.defaultLayerSettings.showLenseUI = textureResource?.config?.showLenseUI ?? this._globalLayerSettings.showLenseUI;
    updatedConfig.defaultLayerSettings.applyCalibration = textureResource?.config?.applyCalibration ?? this._globalLayerSettings.applyCalibration;
    updatedConfig.defaultLayerSettings.defaultLensMaskIdx = textureResource?.config?.defaultLensMaskIdx ?? this._globalLayerSettings.defaultLensMaskIdx;
    updatedConfig.defaultLayerSettings.lensBorderColor = textureResource?.config?.lensBorderColor ?? this._globalLayerSettings.lensBorderColor;
    updatedConfig.defaultLayerSettings.lensSize = textureResource?.config?.lensSize ?? this._globalLayerSettings.lensSize;
    updatedConfig.defaultLayerSettings.lensOffsetX = textureResource?.config?.lensOffsetX ?? this._globalLayerSettings.lensOffsetX;
    updatedConfig.defaultLayerSettings.lensOffsetY = textureResource?.config?.lensOffsetY ?? this._globalLayerSettings.lensOffsetY;
    updatedConfig.defaultLayerSettings.maxNumLenses = textureResource?.config?.maxNumLenses ?? this._globalLayerSettings.maxNumLenses;

    this.CurrentSettings.next(updatedConfig);

    this.reportSettingsChanged(updatedConfig);
  }

  private reportSettingsChanged(settings: AppSettings) {

    const data: DiagnosticsData = {
      eventTypeDescription: 'SettingsChanged',
      data1: `${settings.defaultLayerSettings.showLenseUI}`,
      data2: `${settings.defaultLayerSettings.showLayerUI}`,
      remarks: `${settings.defaultLayerSettings.interaction}|${settings.defaultLayerSettings.lensSize}|${settings.defaultLayerSettings.lensOffsetX}|${settings.defaultLayerSettings.lensOffsetY}|${settings.defaultLayerSettings.defaultLensMaskIdx}`
    }

    this._diagnosticService.submit(data);
  }
}
