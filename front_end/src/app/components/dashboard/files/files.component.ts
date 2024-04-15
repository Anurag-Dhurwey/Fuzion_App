import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [],
  templateUrl: './files.component.html',
  styleUrl: './files.component.css'
})
export class FilesComponent {
@Input() data:(folder|file)|undefined

constructor(){

}

}
type file={type:"file",data:any}
type folder={type:"folder",data:(file|folder)[]}