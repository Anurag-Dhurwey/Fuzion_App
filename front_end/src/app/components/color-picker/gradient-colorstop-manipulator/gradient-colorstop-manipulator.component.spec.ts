import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradientColorstopManipulatorComponent } from './gradient-colorstop-manipulator.component';

describe('GradientColorstopManipulatorComponent', () => {
  let component: GradientColorstopManipulatorComponent;
  let fixture: ComponentFixture<GradientColorstopManipulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradientColorstopManipulatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GradientColorstopManipulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
