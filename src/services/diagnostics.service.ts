import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ElectronIpcService } from './electron-ipc.service';
import { DiagnosticsData } from 'src/shared/util/diagnostics-data.interface';
import { DiagnosticsConverter } from 'src/shared/util/diagnostics-converter';
import { DiagnosticsDataEncoded } from 'src/shared/util/diagnostics-data.encoded';
import { environment } from 'src/environments/environment';

@Injectable()
export class DiagnosticsService {
  public static readonly diagnosticsRoute = `http://${environment.diagnosticsServerAddress}:${environment.diagnosticsServerPort}/log/appData`;
  public static headers: HttpHeaders = new HttpHeaders().set('content-type','application/json');

  public constructor(
      private readonly _httpClient: HttpClient,
      private readonly _ipcService: ElectronIpcService
    ) {
      this._ipcService.on('window-activated', (event, diagnostics: DiagnosticsData) => {
        this.submitWindowActivated(diagnostics);
      });

       this._ipcService.on('window-deactivated', (event, diagnostics: DiagnosticsData) => {
        this.submitWindowDeactivated(diagnostics);
      });

      this._ipcService.on('app-ready', (event, diagnostics: DiagnosticsData) => {
        this.submitAppReady(diagnostics);
      });

      this._ipcService.on('app-closing', (event, diagnostics: DiagnosticsData) => {
        this.submitAppClosing(diagnostics);

        setTimeout(() => {
          // Allow time for the diagnostics to be sent before the app closes
          this._ipcService.send('app-closing-complete');
        }, 200);
      });

      this._ipcService.on('app-error', (event, diagnostics: DiagnosticsData) => {
        this.submit(diagnostics);
      });
    }

    private submitAppReady(diagnostics: DiagnosticsData): void {
      diagnostics.eventTypeDescription = 'Application started.';
      this.submit(diagnostics);
    }

    private submitAppClosing(diagnostics: DiagnosticsData): void {
      diagnostics.eventTypeDescription = 'Application exited.';
      this.submit(diagnostics);
    }


    private submitWindowActivated(diagnostics: DiagnosticsData): void {
      diagnostics.eventTypeDescription = 'Window Activated.';
      this.submit(diagnostics);
    }

    private submitWindowDeactivated(diagnostics: DiagnosticsData): void {
      diagnostics.eventTypeDescription = 'Window Deactivated.';
      this.submit(diagnostics);
    }

    public submit(diagnostics: DiagnosticsData): void {
      if (!environment.sendDiagnosticsData) {
        return;
      }

      var msg = DiagnosticsConverter.toJson(diagnostics);

      this._httpClient.post<DiagnosticsDataEncoded>(
        DiagnosticsService.diagnosticsRoute,
        msg,
        { headers: DiagnosticsService.headers })
      .subscribe();
    }
}
