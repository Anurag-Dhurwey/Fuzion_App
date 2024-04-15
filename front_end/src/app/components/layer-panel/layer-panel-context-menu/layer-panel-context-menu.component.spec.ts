import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerPanelContextMenuComponent } from './layer-panel-context-menu.component';

describe('LayerPanelContextMenuComponent', () => {
  let component: LayerPanelContextMenuComponent;
  let fixture: ComponentFixture<LayerPanelContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayerPanelContextMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayerPanelContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
