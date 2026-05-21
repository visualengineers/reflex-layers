import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from 'src/testing/test-providers';

import { DepthImageComponent } from './depth-image.component';

describe('DepthImageComponent', () => {
  let component: DepthImageComponent;
  let fixture: ComponentFixture<DepthImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepthImageComponent],
      providers: appTestProviders
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
