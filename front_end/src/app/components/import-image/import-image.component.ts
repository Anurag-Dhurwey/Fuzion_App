import { Component, EventEmitter, Output } from '@angular/core';
import { CanvasService } from '../../services/canvas/canvas.service';
import { SocketService } from '../../services/socket/socket.service';
import { DbService } from '../../services/db/db.service';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { Fab_Image } from '../../../types/app.types';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'app-import-image',
  standalone: true,
  imports: [ReactiveFormsModule,AsyncPipe],
  templateUrl: './import-image.component.html',
  styleUrl: './import-image.component.css',
})
export class ImportImageComponent {
  @Output() close = new EventEmitter<void>();

  constructor(
    public canvasService: CanvasService,
    private socketService: SocketService,
    public dbService: DbService
  ) {}

  uploadStatus: {
    status: 'uploading' | '' | 'success' | 'failed';
    percent?: number;
    message: string;
  } = { status: '', message: '' };

  imageObject: null | Fab_Image = null;
  inputType: 1 | 2 |3= 1;
  link = new FormControl('');

  get window() {
    return window;
  }

  async onImageInput(files: FileList | null) {
    if (files && files.length) {
      const file = files[0];

      if (this.socketService.socket?.connected) {
        if (file.size >= 5 * 1024 * 1024) {
          alert('File size should be less than 5MB');
          return;
        }
        const img = document.createElement('img');

        const onUploading = (percent: number) => {
          this.uploadStatus.percent = Math.floor(percent);
          this.uploadStatus.status = 'uploading';
        };

        const onUploadSuccess = (src: string) => {
          img.src = src;
          this.uploadStatus.status = 'success';
          this.uploadStatus.message = 'success';
        };
        const onUploadError = (message: string) => {
          this.uploadStatus.message = message;
          this.uploadStatus.status = 'failed';
        };

        try {
          img.onload = () => {
            const imgInstance = new fabric.Image(img, {
              left: 200,
              top: 200,crossOrigin:'anonymous'
            }) as fabric.Image & { type: 'image'; _id: string };
            imgInstance._id = v4();
            imgInstance.name = 'image';
            // this.canvasService.updateObjects(imgInstance, 'push');
            this.imageObject = imgInstance;
            this.uploadStatus = { status: 'success', message: 'Success' };
          };
          this.uploadStatus = { status: 'uploading', message: 'uploading' };
          await this.dbService.uploadImage(
            file,
            onUploading,
            onUploadSuccess,
            onUploadError
          );
          // img.src = src;
        } catch (error: any) {
          alert('Unable to Upload image on Server: try another method');
          this.uploadStatus = { status: 'failed', message: error.message };
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          typeof reader.result === 'string' &&
            fabric.Image?.fromURL(reader.result, (imgObj) => {
              // const object = imgObj as Fab_Image;
              (imgObj as Fab_Image)._id = v4();
              (imgObj as Fab_Image).name = 'image';

              this.imageObject = imgObj as Fab_Image;
              // this.canvasService.updateObjects(object, 'push');
            });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async loadImageLink(link:string|null) {
    if (!link) {
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
      imgInstance.name = 'image';
      // this.canvasService.updateObjects(imgInstance, 'push');
      this.imageObject = imgInstance;
    };
    img.src = link;
  }

  openBtn() {
    if (this.imageObject) {
      this.canvasService.updateObjects(this.imageObject, 'push');
      this.canvasService.saveStateInHistory()
      console.log('added')
    } else {
      alert('file not selected');
    }
    this.close.emit();
  }

  // closeBtn() {
  //   this.close.emit();
  // }
}
