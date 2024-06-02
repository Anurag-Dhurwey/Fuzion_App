import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentalCanvasComponent } from './experimental-canvas.component';

describe('ExperimentalCanvasComponent', () => {
  let component: ExperimentalCanvasComponent;
  let fixture: ComponentFixture<ExperimentalCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentalCanvasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExperimentalCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
