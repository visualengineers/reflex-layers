import { Component,  Inject, OnInit, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { DepthImageServiceFacade } from 'src/services/depth-image.facade.service';

@Component({
  selector: 'app-depth-image',
  templateUrl: './depth-image.component.html',
  styleUrls: ['./depth-image.component.scss'],
  standalone: true
})
export class DepthImageComponent implements OnInit {
  public imageData = '';

  private _depthImageSubscription? : Subscription;

  // eslint-disable-next-line new-cap
  public constructor(
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly _depthImageService: DepthImageServiceFacade,
    private readonly angularRenderer: Renderer2) {

    }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public ngOnInit(): void {
    this._depthImageSubscription = this._depthImageService.Data.subscribe(
      imageData => this.imageData = imageData
    );
  }

  public ngOnDestroy(): void {
   this._depthImageSubscription?.unsubscribe();
  }
}
