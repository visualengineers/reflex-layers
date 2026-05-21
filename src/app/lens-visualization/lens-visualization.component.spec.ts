import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from 'src/testing/test-providers';

import { LensVisualizationComponent } from './lens-visualization.component';

describe('LensVisualizationComponent', () => {
  let component: LensVisualizationComponent;
  let fixture: ComponentFixture<LensVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LensVisualizationComponent],
      providers: appTestProviders
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LensVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
