import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from 'src/testing/test-providers';

import { TextureBlendingComponent } from './texture-blending.component';

describe('TextureBlendingComponent', () => {
  let component: TextureBlendingComponent;
  let fixture: ComponentFixture<TextureBlendingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextureBlendingComponent],
      providers: appTestProviders
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextureBlendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
