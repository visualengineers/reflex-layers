import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebSocketServiceBase } from './websocket.service.base';
import { DiagnosticsService } from './diagnostics.service';

export abstract class StreamImageService extends WebSocketServiceBase<string> {

  public constructor(httpClient: HttpClient, diagService: DiagnosticsService, private readonly _streamRoute: string, private readonly _enableRoute: string) {
    super(httpClient, diagService, _streamRoute, '');
  }

  protected enableSocket(): Observable<Object> {
    return this.setStreamState(true);
  }

  protected disableSocket(): Observable<Object> {
    return this.setStreamState(false);
  }

  protected update(result: MessageEvent): void {
    this.Data.next(result.data);

    this.Socket?.next('continue');
  }

  private setStreamState(newState: boolean): Observable<Object> {
    return this.HttpClient.put<number>(
      this._enableRoute,
      newState,
      { headers: this.Headers }
    );
  }
}
