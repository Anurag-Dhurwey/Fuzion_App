import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrameSelectionPanelComponent } from './frame-selection-panel.component';

describe('FrameSelectionPanelComponent', () => {
  let component: FrameSelectionPanelComponent;
  let fixture: ComponentFixture<FrameSelectionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrameSelectionPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FrameSelectionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
