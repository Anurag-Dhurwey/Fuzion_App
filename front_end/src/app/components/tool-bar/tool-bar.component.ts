import { Component, HostListener } from '@angular/core';
import { Roles } from '../../../types/app.types';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../../services/canvas/canvas.service';
import { ExportComponent } from '../export/export.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-tool-bar',
  standalone: true,
  imports: [
    CommonModule,
    ExportComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './tool-bar.component.html',
  styleUrl: './tool-bar.component.css',
})
export class ToolBarComponent {
  // @HostListener('window:keyup', ['$event'])
  // keyUp(event: KeyboardEvent) {
  //   if (event.key == 'i') {
  //     this.onClickRoleButton('image')
  //   }
  // }

  constructor(
    public canvasService: CanvasService,
  ) {
  }
  roles: { role: Roles; icon: string }[] = [
    { role: 'pan', icon: 'pan_tool' },
    { role: 'select', icon: 'arrow_selector_tool' },
    { role: 'line', icon: 'pen_size_2' },
    { role: 'circle', icon: 'radio_button_unchecked' },
    { role: 'rectangle', icon: 'crop_3_2' },
    { role: 'pencil', icon: 'edit' },
    { role: 'pen', icon: 'ink_pen' },
    { role: 'text', icon: 'text_fields' },
    { role: 'image', icon: 'image' },
  ];

 
  onClickRoleButton(role: Roles) {
    this.canvasService.setRole(role);
    if (role === 'image') {
      this.canvasService.toggleLayoutVisibility(['import_image_panel'], true);
    }
  }
}
