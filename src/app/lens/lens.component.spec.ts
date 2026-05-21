import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from 'src/testing/test-providers';

import { LensComponent } from './lens.component';

describe('LensComponent', () => {
  let component: LensComponent;
  let fixture: ComponentFixture<LensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LensComponent],
      providers: appTestProviders
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
