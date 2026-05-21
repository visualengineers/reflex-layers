import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from 'src/testing/test-providers';

import { DepthLayerVisualizationComponent } from './depth-layer-visualization.component';

describe('DepthLayerVisualizationComponent', () => {
  let component: DepthLayerVisualizationComponent;
  let fixture: ComponentFixture<DepthLayerVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepthLayerVisualizationComponent],
      providers: appTestProviders
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthLayerVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
