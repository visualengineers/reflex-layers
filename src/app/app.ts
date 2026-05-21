import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DiagnosticsService } from 'src/services/diagnostics.service';
import { KeyboardShortcutService } from 'src/services/keyboard-shortcut.service';
import { DepthImageComponent } from './depth-image/depth-image.component';
import { DepthLayerVisualizationComponent } from './depth-layer-visualization/depth-layer-visualization.component';
import { IdleScreenComponent } from './idle-screen/idle-screen.component';
import { LensVisualizationComponent } from './lens-visualization/lens-visualization.component';
import { SettingsComponent } from './settings/settings.component';
import { TextureBlendingComponent } from './texture-blending/texture-blending.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    imports: [
        RouterOutlet,
        DepthImageComponent,
        DepthLayerVisualizationComponent,
        IdleScreenComponent,
        LensVisualizationComponent,
        SettingsComponent,
        TextureBlendingComponent
    ],
    styleUrls: ['./app.scss']
})
export class App {
  public title = 'ReFlex - Layer Exploration';

  @HostListener('window:keydown', ['$event'])
  public onKeyPress(event: KeyboardEvent) {
    event?.preventDefault();
    this._shortcutService.handelKeyPress(event.code);
  }

  public constructor(
    private readonly _shortcutService: KeyboardShortcutService,
    private readonly _diagnosticService: DiagnosticsService
  ) {

  }
}
