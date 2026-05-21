import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';
import log from 'electron-log';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ElectronIpcService {

  private _ipc?: IpcRenderer;

  public isElectronAvailable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public constructor() {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
        this.isElectronAvailable.next(true);
      } catch (e) {
        this.isElectronAvailable.next(false);
        throw e;
      }
    } else {
      const warn = 'Electron\'s IPC was not loaded'
      console.warn(warn);
      log.warn(warn);
      this.isElectronAvailable.next(false);
    }
  }

  public on(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => any): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args: any[]): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.send(channel, ...args);
  }
}
