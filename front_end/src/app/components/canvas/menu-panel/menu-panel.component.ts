import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CanvasService } from '../../../services/canvas/canvas.service';

@Component({
  selector: 'app-menu-panel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-panel.component.html',
  styleUrl: './menu-panel.component.css',
})
export class MenuPanelComponent {
  @ViewChild('importInput') importRef: ElementRef<HTMLInputElement> | undefined;

  menu: Menu[] = [
    {
      header: 'MENU',
      buttons: [
        { type: 'button', lable: 'New', onClick: () => {} },
        { type: 'button', lable: 'Open', onClick: () => {} },
        { type: 'button', lable: 'Save', onClick: () => {} },
        {
          type: 'button',
          lable: 'Import',
          onClick: () => {
            this.importRef?.nativeElement.click();
            this.canvasService.setRole('select')
          },
        },
        {
          type: 'button',
          lable: 'Export',
          onClick: () => {
            this.canvasService.toggleLayoutVisibility(['export_panel'], true);
            this.canvasService.setRole('select')
          },
        },
      ],
    },
    {
      header: 'GO TO',
      buttons: [
        { type: 'route', lable: 'Dashboard', route: '/dashboard/' },
        { type: 'route', lable: 'Welcome', route: '/welcome/' },
        { type: 'route', lable: 'Profile', route: '/user-profile/' },
      ],
    },
  ];
  constructor(public canvasService: CanvasService) {}

  import(files: FileList | null) {
    if (files && files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          typeof reader.result === 'string' &&
            this.canvasService.importJsonObjects(reader.result);
        } catch (error) {
          console.error('json.parse error');
        }
      };
      reader.readAsText(file);
    }
  }
}

interface Menu {
  header: string;
  buttons: button[] | Route[];
}

type button = {
  type: 'button';
  lable: string;
  onClick: () => void;
};

type Route = {
  type: 'route';
  lable: string;
  route: string;
};
