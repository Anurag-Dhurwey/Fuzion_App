import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { fabric } from 'fabric';
import { ColorStop, ColorStopRect } from '../../../../types/color-picker.types';
@Component({
  selector: 'app-gradient-colorstop-manipulator',
  standalone: true,
  imports: [],
  templateUrl: './gradient-colorstop-manipulator.component.html',
  styleUrl: './gradient-colorstop-manipulator.component.css',
})
export class GradientColorstopManipulatorComponent implements OnChanges {
  @Output() onColorStopSelected = new EventEmitter<ColorStop>();
  @Output() onColorStopSelectionUpdate = new EventEmitter<ColorStop>();
  @Output() onColorStopSelectionCleared = new EventEmitter<void>();
  @Output() onColorStopMoving = new EventEmitter<ColorStop>();
  @Output() onColorStopModified = new EventEmitter<ColorStop>();
  @Input({ required: true }) gradient: fabric.Gradient | null = null;
  @Input({ required: true }) width: number = 300;

  canvas: fabric.Canvas | null = null;

  stops: ColorStopRect[] = [];
  previewBoard: fabric.Rect | null = null;
  refTriangle: fabric.Triangle | null = null;
  ngAfterViewInit() {
    if (!this.gradient) return;
    const can = document.getElementById(
      'color-stop-canvas'
    ) as HTMLCanvasElement;
    can.width = this.width;
    can.height = 65;
    this.canvas = new fabric.Canvas(can, { selection: false });
    this.previewBoard = new fabric.Rect({
      top: 30,
      left: 0,
      width: this.canvas.width,
      height: 50,
      hasControls: false,
      evented: false,
      selectable: false,
      fill: this.gradient,
    });

    this.gradient.colorStops?.forEach((item, i) => {
      const rect = new fabric.Rect({
        top: 0,
        left: Math.max(
          0,
          Math.min(item.offset * this.canvas!.width!, this.canvas!.width! - 10)
        ),
        width: 10,
        height: 20,
        fill: item.color,
        hasControls: false,
        hasBorders:false,
        lockMovementY: true,
        lockRotation: true,
      }) as ColorStopRect;
      rect.offset = item.offset;
      rect.color = item.color;
      rect.index = i;
      this.stops.push(rect);
    });

    this.refTriangle = new fabric.Triangle({
      left: 0,
      top: 0,
      fill: 'yellow',
      width: 10,
      height: 10,
      hasControls: false,
      evented: false,
      centeredRotation: true,
      angle: 180,
    });

    this.draw();

    this.canvas.on('selection:created', (e) => {
      const tar = e.selected![0] as ColorStopRect;
      this.onColorStopSelected.emit({
        offset: tar.offset,
        index: tar.index,
        color: tar.color,
      });
      this.refTriangle?.set({ left: tar.left!+tar.width!+1, top: tar.height!*1.5 });
      this.canvas?.add(this.refTriangle!);
      this.canvas?.requestRenderAll();
    });
    this.canvas.on('selection:updated', (e) => {
      const tar = e.selected![0] as ColorStopRect;
      this.onColorStopSelectionUpdate.emit({
        offset: tar.offset,
        index: tar.index,
        color: tar.color,
      });
      this.refTriangle?.set({ left: tar.left!+tar.width!+1 });
      this.canvas?.requestRenderAll();
    });
    this.canvas.on('selection:cleared', (e) => {
      this.onColorStopSelectionCleared.emit();
      this.canvas?.remove(this.refTriangle!);
    });
    this.canvas.on('object:moving', (e) => {
      const tar = e.target as ColorStopRect;
      tar.offset = Math.max(
        0,
        Math.min(1, parseFloat((tar.left! / this.canvas?.width!).toFixed(2)))
      );
      if (tar.left! < 0) {
        tar.set('left', 0);
        tar.offset = 0;
      }
      if (tar.left! > this.canvas!.width! - tar.width!) {
        tar.set('left', this.canvas!.width! - tar.width!);
        tar.offset = 1;
      }

      this.refTriangle?.set({ left: tar.left!+tar.width!+1});
      this.canvas?.requestRenderAll();
      this.onColorStopMoving.emit({
        offset: tar.offset,
        index: tar.index,
        color: tar.color,
      });
    });
    this.canvas.on('object:modified', (e) => {
      const tar = e.target as ColorStopRect;
      this.onColorStopModified.emit({
        offset: tar.offset,
        index: tar.index,
        color: tar.color,
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gradient']) {
      this.previewBoard?.set('fill', changes['gradient'].currentValue);
      this.stops.forEach((st, i) => {
        const fill = (
          changes['gradient'].currentValue as fabric.Gradient
        ).colorStops?.find((it, n) => i == n);
        st.set('fill', fill?.color);
      });
      this.canvas?.requestRenderAll();
    }
  }



  draw() {
    this.canvas?.clear();
    this.previewBoard && this.canvas?.add(this.previewBoard);
    this.stops.forEach((s) => this.canvas?.add(s));
  }

  // onClickColorStop(index: number) {
  //   this.onChangeColorStopIndex.emit(index);
  // }
}
