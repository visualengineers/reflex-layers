import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import log from 'electron-log';
import { combineLatest, concatMap, Subscription } from 'rxjs';
import { DepthImageService } from 'src/services/depth-image.service';
import { ElectronIpcService } from 'src/services/electron-ipc.service';
import { InteractionService } from 'src/services/interaction.service';
import { SettingsService } from 'src/services/settings.service';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { ConnectionState } from 'src/shared/enum/connection-state';
import { InteractionMetaphor } from 'src/shared/enum/interaction-metaphor';
import { AppSettings } from 'src/shared/interface/app-settings';
import { TextureRepository } from 'src/shared/interface/texture-repository';
import { TextureResource } from 'src/shared/interface/texture-resource';
import { hexToRgb, RGBColor } from 'src/shared/util/util';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    imports: [
        CommonModule,
        FormsModule
    ]
})
export class SettingsComponent implements OnInit, OnDestroy {

  public textures: Array<TextureResource> = [];
  public masks: Array<string> = [];
  public color: string = 'fff';
  public colorValue: RGBColor = { r: 255, g: 255, b: 255 };
  public selectedTextureId: string = '0';
  public selectedMaskId: string = '0';
  public isTextureSelected = false;
  public isMaskSelected = false;
  public isModeSelected = false;
  public selectedMode: string = '1';
  public isPanelExpanded = false;
  public settings: AppSettings;
  public interactionModes = [
    "Pixel Blending",
    "Magic Lens (Single Touch)",
    "Magic Lens (Multi Touch)",
    "Layer Navigation (global)"
  ]

  public selectedResource?: TextureResource;

  public depthImageConnectionState: ConnectionState = ConnectionState.Disconnected;
  public interactionConnectionState: ConnectionState = ConnectionState.Disconnected;

  private _repoSubscription?: Subscription;
  private _resourceSubscription?: Subscription;
  private _settingsSubscription?: Subscription;
  private _depthImageConnectionStateSubscription?: Subscription;
  private _interactionConnectionStateSubscription?: Subscription;

  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === 'KeyS') {
      this.toggleSettingsPanel(true);
    }
  }

  constructor(
    private readonly _repoService: TextureRepositoryService,
    private readonly _settingsService: SettingsService,
    private readonly _depthImageService: DepthImageService,
    private readonly _interactionService: InteractionService,
    public readonly electronService: ElectronIpcService) {
      this.settings = _settingsService.CurrentSettings.value;
    }

  ngOnInit(): void {
    this._repoSubscription = this._repoService.retrieveData().subscribe(
      {
        next: (result) => this.updateTextures(result),
        error: (error) => {
          console.error(error);
          log.error(error);
        }
      }
    );

    this._resourceSubscription = this._repoService.SelectedTextureId.pipe(
      concatMap((id:number) => this._repoService.retrieveTextureResource(id))
    ).subscribe(
      {
        next: (resource: TextureResource | undefined) => {
          if (resource !== undefined) {
            this.selectedResource = resource;
          }
        },
        error: (error) => {
          console.error(error);
          log.error(error);
        }
      }
    );

    this._settingsSubscription = this._settingsService.CurrentSettings.subscribe(
      {
        next: (settings) => {
          this.settings = settings;
          this.selectedMode = (settings.defaultLayerSettings?.interaction ?? InteractionMetaphor.PixelBlending).toString();
          this.masks = settings.lensMasks;
          this.selectedMaskId = (settings.defaultLayerSettings?.defaultLensMaskIdx ?? 0).toString();
        },
        error: (error) => {
          console.error(error);
          log.error(error);
        }
      }
    );

    this._depthImageConnectionStateSubscription =
      combineLatest([this._depthImageService.isConnected, this._depthImageService.isConnecting])
    .subscribe({
      next: ([connected, connecting]) => {
        this.depthImageConnectionState = connected === true
        ? ConnectionState.Connected
        : connecting === true ? ConnectionState.Connecting : ConnectionState.Disconnected;
      },
      error: () => this.depthImageConnectionState = ConnectionState.Error
    });

    this._interactionConnectionStateSubscription =
      combineLatest([this._interactionService.isConnected, this._interactionService.isConnecting])
    .subscribe({
      next: ([connected, connecting]) => {
        this.interactionConnectionState = connected === true
        ? ConnectionState.Connected
        : connecting === true ? ConnectionState.Connecting : ConnectionState.Disconnected;
      },
      error: () => this.interactionConnectionState = ConnectionState.Error
    });
  }

  ngOnDestroy(): void {
      this._repoSubscription?.unsubscribe();
      this._resourceSubscription?.unsubscribe();
      this._settingsSubscription?.unsubscribe();
      this._depthImageConnectionStateSubscription?.unsubscribe();
      this._interactionConnectionStateSubscription?.unsubscribe();
  }

  public updateSelectedTexture(id: number): void {
    this.isTextureSelected = false;
    this.settings.defaultResourceId = id;
    this.updateSettings();
  }

  public updateSelectedMask(idx: number): void {
    this.isMaskSelected = false;
    this.settings.defaultLayerSettings.defaultLensMaskIdx = idx;
    this.updateSettings();
  }

  public updateSelectedMode(idx: number): void {
    this.isModeSelected = false;
    this.settings.defaultLayerSettings.interaction = idx;
    this.updateSettings();
  }

  public updateColor(): void {
    try {
      const validColor = hexToRgb(this.color);
      this.settings.defaultLayerSettings.lensBorderColor = this.color;
      this.updateSettings();
    }
    catch(error) {

    }
  }

  public updateSettings(): void {
    this._settingsService.CurrentSettings.next(this.settings);
  }

  public saveSettings(): void {
    this._settingsService.saveSettings();
  }

  public reloadSettings(): void {
    this._settingsService.loadSettings();
  }

  public restoreSettings(): void {
    this._settingsService.restoreSettings();
  }

  private updateTextures(repo: TextureRepository): void {
    this.textures = repo.textureResources;
    this.selectedTextureId = this._repoService.SelectedTextureId.value.toString();
  }

  private toggleSettingsPanel(maximizePanel: boolean) {
    const settings = this._settingsService.CurrentSettings.value;
    settings.hideSettingsPanel = !settings.hideSettingsPanel;
    if (maximizePanel) {
      this.isPanelExpanded = !settings.hideSettingsPanel;
    }

    this._settingsService.CurrentSettings.next(settings);
  }
}
