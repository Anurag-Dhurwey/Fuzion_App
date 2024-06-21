import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorContainerComponent } from './color-container.component';

describe('ColorContainerComponent', () => {
  let component: ColorContainerComponent;
  let fixture: ComponentFixture<ColorContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorContainerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ColorContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
