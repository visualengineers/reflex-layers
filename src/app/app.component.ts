import { Component, HostListener } from '@angular/core';
import { DiagnosticsService } from 'src/services/diagnostics.service';
import { KeyboardShortcutService } from 'src/services/keyboard-shortcut.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
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
