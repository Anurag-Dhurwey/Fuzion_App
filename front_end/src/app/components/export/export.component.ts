import { Component, HostListener } from '@angular/core';
import { CanvasService } from '../../services/canvas/canvas.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
@Component({
  selector: 'app-export',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './export.component.html',
  styleUrl: './export.component.css',
})
export class ExportComponent {
  // app$: appState | undefined;
  file_name = new FormControl('');
  file_type = new FormControl('jpeg');
  windowWidth: number = window.innerWidth;
  windowHeight: number = window.innerHeight;

  constructor(private canvasService: CanvasService) {
    // this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowWidth = event.target.innerWidth;
    this.windowHeight = event.target.innerHeight;
  }

  exportFile() {
    if (!this.canvasService.canvas) {
      return;
    }
    // const click = (imageDataURL: string | undefined) => {
    //   if (!imageDataURL) {
    //     alert('something went wrong');
    //     return;
    //   }
    //   const link = document.createElement('a');
    //   link.href = imageDataURL;
    //   link.download = this.file_name.value || 'myDrawing';
    //   link.click();
    //   this.canvasService.totalChanges.clear();
    // };
    // const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (this.file_type.value === 'png' || this.file_type.value === 'jpeg') {
      this.canvasService!.export(this.file_type.value, (res) => {
        if (typeof res != 'string') return;
        this.canvasService.downloadSrc(res, this.file_name.value || undefined);
      });
    }
    //  else if (this.file_type.value === 'jpeg') {
    //   this.canvasService!.export('jpeg', (res) => {
    //     if (typeof res != 'string') return;
    //     click(res);
    //   });
    //   // click(this.canvasService.export('jpeg') as string);
    // }
    else if (this.file_type.value === 'pdf') {
      const { width, height } = this.canvasService.canvas;
      const pdf = new jsPDF({
        orientation: width! > height! ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width!, height!],
      });
      this.canvasService.export('png', (dataImg) => {
        if (typeof dataImg != 'string') return;
        pdf.addImage(dataImg, 'PNG', 0, 0, width!, height!);
        pdf.save(`${this.file_name.value || 'myDrawing'}`);
      });
    } else if (this.file_type.value === 'JSON') {
     this.canvasService.exportAsJSON(this.file_name.value||undefined)
    } else {
      throw new Error('file type not recognized');
    }
  }

  close(arg: boolean) {
    this.canvasService.toggleLayoutVisibility(['export_panel'], false);
  }
}
