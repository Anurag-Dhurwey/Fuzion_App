import { Component } from '@angular/core';
import { SocketService } from '../../../services/socket/socket.service';

@Component({
  selector: 'app-setting-panel',
  standalone: true,
  imports: [],
  templateUrl: './setting-panel.component.html',
  styleUrl: './setting-panel.component.css',
})
export class SettingPanelComponent {
  constructor(public socketService: SocketService) {}
}
