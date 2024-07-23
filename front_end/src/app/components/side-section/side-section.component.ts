import { Component, Input } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Navs } from '../../../types/side-section.types';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-side-section',
  standalone: true,
  imports: [RouterLink,RouterOutlet],
  templateUrl: './side-section.component.html',
  styleUrl: './side-section.component.css',
})
export class SideSectionComponent {

  @Input() navs:Navs[]=[]
  @Input() createProject:boolean=false

  constructor(public authService: AuthService) {}
}
