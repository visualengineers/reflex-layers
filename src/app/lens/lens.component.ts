
import { Component, Input, OnInit } from '@angular/core';
import { DefaultLensProperties, LensProperties } from 'src/shared/interface/lens-properties';

@Component({
    selector: 'app-lens',
    templateUrl: './lens.component.html',
    styleUrls: ['./lens.component.scss'],
    imports: []
})
export class LensComponent implements OnInit {

  @Input()
  DefaultRadius = 200;

  @Input()
  public ShowLensUI = false;

  @Input()
  public LensScale = 1.0;

  @Input()
  public Properties: LensProperties = DefaultLensProperties;

  get Radius(): number {
    return this.DefaultRadius * this.LensScale;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
