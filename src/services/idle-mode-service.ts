import { Injectable, OnDestroy } from "@angular/core";
import { InteractionService } from "./interaction.service";
import { BehaviorSubject, Subscription, combineLatest } from "rxjs";
import { SettingsService } from "./settings.service";
import { error } from "console";
import log from "electron-log";

@Injectable()
export class IdleModeService implements OnDestroy {
  private _idleSubscription: Subscription;

  public ShowIdleScreen = new BehaviorSubject<boolean>(true);

  public constructor(
    private readonly _interactionService: InteractionService,
    private readonly _settingsService: SettingsService
    ) { 

    this._idleSubscription = combineLatest(
      [this._settingsService.CurrentSettings, this._interactionService.isConnected, this._interactionService.Data]
      ).subscribe(
        (result) => {   
          const isEnabled = result[0].enableIdleMode;
          this.ShowIdleScreen.next(isEnabled && (result[1] === true ? result[2].length === 0 : true));
        },
        (error) =>{
          console.error(error);
          log.error(error);
        }
    );
  }


  ngOnDestroy(): void {
    this._idleSubscription.unsubscribe();
  }
}