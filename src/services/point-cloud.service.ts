import { Injectable } from '@angular/core';
import { BehaviorSubject, concatMap, filter, from, fromEventPattern, Observable, share, skipWhile, using } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as signalR from "@microsoft/signalr";
import { IConnectionState } from 'src/shared/interface/connectionState.interface';
import { Point3 } from 'src/shared/interface/point3';
import log from 'electron-log';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsData } from 'src/shared/util/diagnostics-data.interface';

@Injectable()
export class PointCloudService implements IConnectionState {

  private readonly _hubConnection: signalR.HubConnection;
  private _pointCloudAddress: string;

  public isConnected = new BehaviorSubject<boolean>(false);
  public isConnecting = new BehaviorSubject<boolean>(false);
  private isStarted = new BehaviorSubject<boolean>(false);

  private readonly startAfterConnected$: Observable<void>;
  private readonly points$: Observable<Array<Point3>>;

  // eslint-disable-next-line new-cap
  public constructor(private readonly _diagService: DiagnosticsService) {
    this._pointCloudAddress =  `http://${environment.serverAddress}:${environment.serverPort}/${environment.pointCloudHub}`

    this._hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this._pointCloudAddress)
      .build();

    // update connection status the rxjs way
    from(this._hubConnection.start()).subscribe(
      () => this.isConnected.next(true),
      (error) => {
        console.error(error);
        log.error(error);
      }
    );

    this.points$ = fromEventPattern<Array<Point3>>(
      (handler) => this._hubConnection.on('pointCloud', handler),
      (handler) => this._hubConnection.off('pointCloud', handler)
    )
      .pipe(
        share(),
        filter((x) => x !== undefined)
      );

    // send 'startState' only after 'isConnected' emits true
    this.startAfterConnected$ = this.isConnected.pipe(
      skipWhile((value) => !value),
      concatMap(async () => this._hubConnection.send('startPointCloud').catch((error) => {
        console.error(error);
        log.error(error);
      }))
    );

    this.isConnected.subscribe({
      next: (value:boolean) => this.reportConnectionState(value)
    });
  }

  /**
   * @return an Observable of Arrays of Point3 from the currently configured camera
   */
  public getPointCloud(): Observable<Array<Point3>> {
    return using(() => {
      this.startAfterConnected$.subscribe(() => this.isStarted.next(true));

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this._hubConnection.send('stopPointCloud').catch((error) => {
        console.error(error);
        log.error(error);
      }) };
    }, () => this.points$);

  }

  private reportConnectionState(isConnected: boolean): void {
    const data: DiagnosticsData = {
      eventTypeDescription: 'PointCloud ConnectionState: ' + isConnected ? 'Connected' : 'Disconnected',
      data1: this._pointCloudAddress,
      data2: `${this._hubConnection?.connectionId ?? '-'}`
    }

    this._diagService.submit(data);
  }
}
