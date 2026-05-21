import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepthLayerVisualizationComponent } from './depth-layer-visualization.component';

describe('DepthLayerVisualizationComponent', () => {
  let component: DepthLayerVisualizationComponent;
  let fixture: ComponentFixture<DepthLayerVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepthLayerVisualizationComponent ]
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
