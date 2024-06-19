import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
  viewChild,
} from '@angular/core';
import { fabric } from 'fabric';
// import { Fab_Objects } from '../../../types/app.types';
import Color from 'color';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.css',
})
export class ColorPickerComponent {
  // @Input({ required: true }) target_name: string | null = null;
  // @Input({ required: true }) target: Fab_Objects | null = null;
  // gradientColorIndex: number = 0;
  // toggle = true;

  @Output() onColorChnage = new EventEmitter<string>();
  @Input({ required: true }) inputColor: string = '';
  @Input() width: number = 300;
  @HostListener('window:mouseup', ['$event'])
  mouseUp() {
    this.palette.mouseDown = false;
    this.hueSlider.mouseDown = false;
  }

  hueColors = [
    'hsl(0, 100%, 50%)',
    'hsl(15, 100%, 50%)',
    'hsl(30, 100%, 50%)',
    'hsl(45, 100%, 50%)',
    'hsl(60, 100%, 50%)',
    'hsl(75, 100%, 50%)',
    'hsl(90, 100%, 50%)',
    'hsl(105, 100%, 50%)',
    'hsl(120, 100%, 50%)',
    'hsl(135, 100%, 50%)',
    'hsl(150, 100%, 50%)',
    'hsl(165, 100%, 50%)',
    'hsl(180, 100%, 50%)',
    'hsl(195, 100%, 50%)',
    'hsl(210, 100%, 50%)',
    'hsl(225, 100%, 50%)',
    'hsl(240, 100%, 50%)',
    'hsl(255, 100%, 50%)',
    'hsl(270, 100%, 50%)',
    'hsl(285, 100%, 50%)',
    'hsl(300, 100%, 50%)',
    'hsl(315, 100%, 50%)',
    'hsl(330, 100%, 50%)',
    'hsl(345, 100%, 50%)',
    'hsl(360, 100%, 50%)',
  ];

  hue: string | null = null;
  currentColor: string = this.inputColor || '';
  defaultColorFormate: DefaultColorFormate = 'RGB';
  palette: {
    ctx: null | CanvasRenderingContext2D;
    dim: {
      w: number;
      h: number;
    };
    lastMousePo: { x: number; y: number } | null;
    mouseDown: boolean;
  } = {
    ctx: null,
    dim: { w: this.width, h: 300 },
    lastMousePo: null,
    mouseDown: false,
  };
  hueSlider: {
    ctx: null | CanvasRenderingContext2D;
    dim: {
      w: number;
      h: number;
    };
    lastMousePo: { x: number; y: number } | null;
    mouseDown: boolean;
  } = {
    ctx: null,
    dim: { w: this.width, h: 30 },
    lastMousePo: null,
    mouseDown: false,
  };
  ngAfterViewInit() {
    const ele_palette = document.getElementById('palette') as HTMLCanvasElement;
    ele_palette.width = this.palette.dim.w;
    ele_palette.height = this.palette.dim.h;
    this.palette.ctx = ele_palette.getContext('2d') as CanvasRenderingContext2D;
    const ele_hue = document.getElementById('hue') as HTMLCanvasElement;
    ele_hue.width = this.hueSlider.dim.w;
    ele_hue.height = this.hueSlider.dim.h;
    this.hueSlider.ctx = ele_hue.getContext('2d') as CanvasRenderingContext2D;

    const animate = () => {
      this.drawHueSlider(this.hueSlider.ctx!);
      this.drawRefOnHueSlider();
      this.drawPalette(this.palette.ctx!);
      this.drawRefOnpalette();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  drawRefOnpalette() {
    if (!this.palette.ctx) return;
    if (!this.palette.lastMousePo) {
      const po = this.findColorPosition(
        this.inputColor || 'gray',
        this.palette.ctx,
        this.palette.dim.w,
        this.palette.dim.h
      );
      this.palette.lastMousePo = po || null;
    }
    if (this.palette.lastMousePo) {
      this.palette.ctx.strokeStyle = 'white';
      this.palette.ctx.fillStyle = 'white';
      this.palette.ctx.beginPath();
      this.palette.ctx.arc(
        this.palette.lastMousePo.x,
        this.palette.lastMousePo.y,
        5,
        0,
        2 * Math.PI
      );
      this.palette.ctx.lineWidth = 1;
      this.palette.ctx.stroke();
    }
  }
  drawRefOnHueSlider() {
    if (!this.hueSlider.ctx) return;
    if (!this.hueSlider.lastMousePo && this.hue) {
      // console.log('hue')
      const po = this.findColorPosition(
        this.hue,
        this.hueSlider.ctx,
        this.hueSlider.dim.w,
        this.hueSlider.dim.h
      );
      this.hueSlider.lastMousePo = po || null;
    }
    if (this.hueSlider.lastMousePo) {
      this.hueSlider.ctx.strokeStyle = 'white';
      this.hueSlider.ctx.fillStyle = 'white';
      this.hueSlider.ctx.beginPath();
      this.hueSlider.ctx.moveTo(this.hueSlider.lastMousePo.x, 0);
      this.hueSlider.ctx.lineTo(
        this.hueSlider.lastMousePo.x,
        this.hueSlider.dim.h
      );
      // this.hueSlider.ctx.fillRect(0,0,width,height)
      this.hueSlider.ctx.lineWidth = 1;
      this.hueSlider.ctx.stroke();
    }
  }
  mouseMoveOnPalette(e: MouseEvent) {
    if (this.palette.mouseDown) {
      this.onCLickPalette(e);
    }
  }
  mouseMoveOnHueSlider(e: MouseEvent) {
    if (this.hueSlider.mouseDown) {
      this.onClickHueSlider(e);
    }
  }

  onChangeColor(val: string) {
    this.hue = null;
    this.palette.lastMousePo = null;
    this.hueSlider.lastMousePo = null;
    this.inputColor = val;
    this.setCurrentColor(val);
    // this.currentColor = val;
    // this.onColorChnage.emit(val);
    // this.drawPalette();
    // this.drawHueSlider();
  }

  onFormateChange(val: string) {
    this.defaultColorFormate = val as DefaultColorFormate;
  }

  convertFormate(color: string, formate: DefaultColorFormate) {
    if (!color) return color;
    if (formate == 'RGB') {
      return Color(color).rgb().string();
    } else if (formate == 'HSL') {
      return Color(color).hsl().string();
    } else if (formate == 'HSV') {
      return Color(color).hsv().string();
    } else if (formate == 'HEX') {
      return Color(color).hex();
    } else if (formate == 'CMYK') {
      return Color(color).cmyk().string();
    }
    return 'unknown formate';
  }

  drawPalette(
    ctx: CanvasRenderingContext2D,
    callback?: (ctx: CanvasRenderingContext2D) => void
  ) {
    // if (!this.palette.ctx) {
    //   const ele = document.getElementById('palette') as HTMLCanvasElement;
    //   ele.width = this.palette.dim.w;
    //   ele.height = this.palette.dim.h;
    //   this.palette.ctx = ele.getContext('2d') as CanvasRenderingContext2D;
    // }
    const width = this.palette.dim.w;
    const height = this.palette.dim.h;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.hue || this.findHue(this.inputColor || 'gray') || '';
    ctx.fillRect(0, 0, width, height);

    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0.1, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, width, height);

    const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0.1, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');

    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, width, height);
    // if (!this.palette.lastMousePo) {
    //   const po = this.findColorPosition(
    //     this.inputColor || 'gray',
    //     this.palette.ctx,
    //     width,
    //     height
    //   );
    //   this.palette.lastMousePo = po || null;
    // }
    // if (this.palette.lastMousePo) {
    //   this.palette.ctx.strokeStyle = 'white';
    //   this.palette.ctx.fillStyle = 'white';
    //   this.palette.ctx.beginPath();
    //   this.palette.ctx.arc(
    //     this.palette.lastMousePo.x,
    //     this.palette.lastMousePo.y,
    //     5,
    //     0,
    //     2 * Math.PI
    //   );
    //   this.palette.ctx.lineWidth = 1;
    //   this.palette.ctx.stroke();
    // }
  }
  drawHueSlider(
    ctx: CanvasRenderingContext2D,
    callback?: (ctx: CanvasRenderingContext2D) => void
  ) {
    // if (!this.hueSlider.ctx) {
    //   const ele = document.getElementById('hue') as HTMLCanvasElement;
    //   ele.width = this.hueSlider.dim.w;
    //   ele.height = this.hueSlider.dim.h;
    //   this.hueSlider.ctx = ele.getContext('2d') as CanvasRenderingContext2D;
    // }
    const width = this.hueSlider.dim.w;
    const height = this.hueSlider.dim.h;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    // for (let i = 0; i <= 360; i+=15) {
    //   gradient.addColorStop(parseFloat((i / (360)).toFixed(2)),`hsl(${i}, 100%, 50%)`);
    // }
    this.hueColors.forEach((co, i) => {
      gradient.addColorStop(i / this.hueColors.length, co);
    });

    ctx.beginPath();
    ctx.rect(0, 0, width, height);

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
    // if (!this.hueSlider.lastMousePo && this.hue) {
    //   // console.log('hue')
    //   const po = this.findColorPosition(
    //     this.hue,
    //     this.hueSlider.ctx,
    //     width,
    //     height
    //   );
    //   this.hueSlider.lastMousePo = po || null;
    // }
    // if (this.hueSlider.lastMousePo) {
    //   this.hueSlider.ctx.strokeStyle = 'white';
    //   this.hueSlider.ctx.fillStyle = 'white';
    //   this.hueSlider.ctx.beginPath();
    //   this.hueSlider.ctx.moveTo(this.hueSlider.lastMousePo.x, 0);
    //   this.hueSlider.ctx.lineTo(this.hueSlider.lastMousePo.x, height);
    //   // this.hueSlider.ctx.fillRect(0,0,width,height)
    //   this.hueSlider.ctx.lineWidth = 1;
    //   this.hueSlider.ctx.stroke();
    // }
  }

  onCLickPalette(e: MouseEvent) {
    if (!this.palette.ctx) return;
    const ele = document.createElement('canvas');
    ele.width = this.palette.dim.w;
    ele.height = this.palette.dim.h;
    const ctx = ele.getContext('2d');
    if (!ctx) return;
    this.drawPalette(ctx);
    this.setCurrentColor(this.pickColor(ctx, e.offsetX, e.offsetY)!);
    this.palette.lastMousePo = { x: e.offsetX, y: e.offsetY };
    // this.drawPalette();
  }

  setCurrentColor(color: string) {
    this.currentColor = color;
    this.onColorChnage.emit(Color(color).hex());
  }

  onClickHueSlider(e: MouseEvent) {
    if (!this.hueSlider.ctx) return;
    const ele = document.createElement('canvas');
    ele.width = this.hueSlider.dim.w;
    ele.height = this.hueSlider.dim.h;
    const ctx = ele.getContext('2d');
    if (!ctx) return;
    this.drawHueSlider(ctx);
    this.hue = this.pickColor(ctx, e.offsetX, e.offsetY)!;
    this.hueSlider.lastMousePo = { x: e.offsetX, y: e.offsetY };
    // this.drawPalette();

  

    if (this.palette.lastMousePo?.x) {
      this.setCurrentColor(
        this.pickColor(
          this.palette.ctx!,
          this.palette.lastMousePo.x,
          this.palette.lastMousePo.y
        )!
      );
    }
    // this.drawHueSlider();
  }

  findHue(color: string) {
    try {
      const obj = Color(color);
      const hsl = obj.hsl().object();
      this.hue = `hsl(${Math.floor(hsl['h'])}, 100%, 50%)`;
      return `hsl(${Math.floor(hsl['h'])}, 100%, 50%)`;
    } catch (error) {
      return;
    }
  }

  private pickColor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): string | null {
    const pixel = ctx.getImageData(x, y, 1, 1).data;

    if (pixel) {
      const [r, g, b, a] = pixel;
      return `rgba(${r},${g},${b},${a / 255})`;
    } else {
      return null;
    }
  }

  findColorPosition(
    color: string,
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const targetColor = Color(color).rgb().array();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (this.colorWithinTolerance([r, g, b], targetColor, 10)) {
        const x = (i / 4) % w;
        const y = Math.floor(i / 4 / w);
        return { x, y };
      }
    }
    return;
  }
  colorWithinTolerance(rgb1: number[], rgb2: number[], tolerance: number) {
    return (
      Math.abs(rgb1[0] - rgb2[0]) <= tolerance &&
      Math.abs(rgb1[1] - rgb2[1]) <= tolerance &&
      Math.abs(rgb1[2] - rgb2[2]) <= tolerance
    );
  }
  // get colorType() {
  //   if (!this.target_name || !this.target) return undefined;
  //   if (
  //     typeof this.target[this.target_name as keyof fabric.Object] == 'string'
  //   ) {
  //     return 'string';
  //   } else if (
  //     typeof this.target[this.target_name as keyof fabric.Object] == 'object'
  //   ) {
  //     return 'gradient';
  //   }
  //   return;
  // }

  // get setSelectedColor() {
  //   if (!this.target_name || !this.target) return '';
  //   if (this.colorType == 'string') {
  //     return this.target[this.target_name as keyof fabric.Object] as string;
  //   } else if (this.colorType == 'gradient') {
  //     return (
  //       (
  //         this.target[
  //           this.target_name as keyof fabric.Object
  //         ] as fabric.Gradient
  //       ).colorStops![this.gradientColorIndex].color || ''
  //     );
  //   } else {
  //     return '';
  //   }
  // }
}

type DefaultColorFormate = 'RGB' | 'HSL' | 'HSV' | 'CMYK' | 'HEX';
