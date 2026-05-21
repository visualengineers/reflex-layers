import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { TextureRepositoryService } from "./texture-repository.service";
import { KeyConfiguration } from "../shared/interface/key-configuration";
import { SettingsService } from "./settings.service";

@Injectable({ providedIn: 'root'})
export class KeyboardShortcutService {
  private _keyConfig?: KeyConfiguration;

  public constructor(private readonly _httpClient: HttpClient, private readonly _settingsService: SettingsService) {
    this._httpClient.get<KeyConfiguration>(environment.keyConfigFile).subscribe({
      next: (cfg) => this._keyConfig = cfg,
      error: (error) => {
        console.error(error);
      }
    });
  }

  public handelKeyPress(key: string): void {
    const binding = this._keyConfig?.keyBindings.find((elem) => elem.key === key);
    if (binding) {
      const settings = this._settingsService.CurrentSettings.getValue();
      settings.defaultResourceId = binding.dataset;
      this._settingsService.CurrentSettings.next(settings);
    }
  }
}
