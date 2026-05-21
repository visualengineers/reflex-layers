import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import log from 'electron-log';
import { BehaviorSubject, combineLatest, concatMap, delay, distinctUntilChanged, filter, Observable, Observer, Subscription, tap } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IConnectionState } from 'src/shared/interface/connectionState.interface';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsData } from 'src/shared/util/diagnostics-data.interface';

@Injectable()
export abstract class WebSocketServiceBase<T> implements IConnectionState {
  public Data: BehaviorSubject<T>

  public numFramesReceived = 0;

  public isConnected = new BehaviorSubject<boolean>(false);
  public isConnecting = new BehaviorSubject<boolean>(false);

  private _websocketObserver: Observer<any>;

  protected _depthImageSubscription? : Subscription;
  private _reconnectSubscription?: Subscription;

  protected readonly Headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected Socket?: WebSocketSubject<any>;

  private readonly _streamDataRoute: string;


  public constructor(
    protected readonly HttpClient: HttpClient,
    private readonly _diagnosticService: DiagnosticsService,
    route: string,
    defaultValue: T) {
    this.Data = new BehaviorSubject<T>(defaultValue);

    this._streamDataRoute = route;

    this._websocketObserver = {
      next: (val: any) => {
        this.numFramesReceived++;
        this.update(val as MessageEvent);
        this.isConnected.next(true);
        this.isConnecting.next(false);
      },
      error: (error: any) => {
        console.error(error);
        log.error(error);
        this.isConnected.next(false);
        this.isConnecting.next(false);
      },
      complete: () => {
        const msg = 'completed depth image subscription...';
        console.log(msg);
        log.info(msg);
      }
    };


  }

  public startStreaming() {
    this.stopStreaming();

    this._reconnectSubscription =
      combineLatest([this.isConnected, this.isConnecting]).pipe(
      distinctUntilChanged(),
      filter(([connected, connecting]) => connected === false && connecting === false),
      tap(() => this.isConnecting.next(true)),
      delay(2000),
      tap(() => {
        this._depthImageSubscription = this.startSocket().subscribe(this._websocketObserver);
      })
    ).subscribe(
      {
        error: (error) => {
          console.error(error);
          log.error(error);
          this.reportConnectionStatusChanged(false, `${error}`);
        }
      }
    );
  }

  public stopStreaming() {
    this._reconnectSubscription?.unsubscribe();
    this._reconnectSubscription = undefined;
    this._depthImageSubscription?.unsubscribe();
    this._depthImageSubscription = undefined;
    this.Socket?.complete();
    this.Socket = undefined;
    this.isConnecting.next(false);
    this.isConnected.next(false);
  }

  public ngOnDestroy(): void {
    this.stopStreaming();
  }

  protected abstract enableSocket(): Observable<Object>;

  protected abstract disableSocket(): Observable<Object>;

  private startSocket(): Observable<MessageEvent> {
    this.Socket = webSocket({
      url: this._streamDataRoute,
      deserializer: (value) => value,
      closeObserver: {
        next: (val) => {
          const closeMsg = `closed subscription to depth image service: ${val}`;
          console.log(closeMsg);
          log.info(closeMsg);
          this.reportConnectionStatusChanged(false, `${closeMsg}`);
        },
        error: (error: any) => {
          console.error(error);
          log.error(error);
          this.reportConnectionStatusChanged(false, `${error}`);
        },
      },
      openObserver: {
        next: (val) => {
          const openMsg = `opened subscription to depth image service: ${val}`;
          console.log(openMsg);
          log.info(openMsg);
          this.reportConnectionStatusChanged(true, `${openMsg}`);
        },
        error: (error) => {
          const errorMsg = `Error when opening WebSocket: ${error}`;
          console.error(errorMsg);
          log.error(errorMsg);
          this.reportConnectionStatusChanged(false, `${errorMsg}`);
        }
      },
    });

    this.Socket?.next('Start');

    return this.enableSocket().pipe(
      concatMap(() => this.Socket as Observable<MessageEvent>));
  }

  protected abstract update(result: MessageEvent): void;

  private reportConnectionStatusChanged(connected: boolean, msg = '') {
    const data: DiagnosticsData = {
      eventTypeDescription: connected ? 'WebSocket: Connected' : 'WebSocket: Disconnected',
      data1: this._streamDataRoute,
      data2: `${this.numFramesReceived}`,
      remarks: msg
    }

    this._diagnosticService.submit(data);
  }
}
