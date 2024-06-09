import { Component, EventEmitter, Output } from '@angular/core';
import { CanvasService } from '../../services/canvas/canvas.service';
import { SocketService } from '../../services/socket/socket.service';
import { DbService } from '../../services/db/db.service';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { Fab_Image} from '../../../types/app.types';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-import-image',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './import-image.component.html',
  styleUrl: './import-image.component.css',
})
export class ImportImageComponent {
  @Output() close = new EventEmitter<void>();

  constructor(
    public canvasService: CanvasService,
    private socketService: SocketService,
    private dbService: DbService
  ) {}

  imageObject: null | Fab_Image = null;
  inputType: 1 | 2 = 1;
  link = new FormControl('');

  get window() {
    return window;
  }

  async onImageInput(files: FileList | null) {
    if (files && files.length) {
      const file = files[0];

      if (this.socketService.socket?.connected) {
        const img = document.createElement('img');
        img.onload = () => {
          const imgInstance = new fabric.Image(img, {
            left: 200,
            top: 200,
          }) as fabric.Image & { type: 'image'; _id: string };
          imgInstance._id = v4();
          // this.canvasService.updateObjects(imgInstance, 'push');
          this.imageObject = imgInstance;
        };
        img.src = await this.dbService.uploadImage(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          typeof reader.result === 'string' &&
            fabric.Image?.fromURL(reader.result, (imgObj) => {
              // const object = imgObj as Fab_Image;
              (imgObj as Fab_Image)._id = v4();
              this.imageObject = imgObj as Fab_Image;
              // this.canvasService.updateObjects(object, 'push');
            });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async loadImageLink() {
    if (!this.link.value?.toString().length) {
      alert('Link is required');
      return;
    }

    const img = document.createElement('img');
    img.onload = () => {
      const imgInstance = new fabric.Image(img, {
        left: 200,
        top: 200,
      }) as Fab_Image;
      imgInstance._id = v4();
      // this.canvasService.updateObjects(imgInstance, 'push');
      this.imageObject = imgInstance;
    };
    img.src = this.link.value;
  }

  openBtn() {
    if (this.imageObject) {
      this.canvasService.updateObjects(this.imageObject, 'push');
    } else {
      alert('file not selected');
    }
    this.close.emit();
  }

  // closeBtn() {
  //   this.close.emit();
  // }
}
