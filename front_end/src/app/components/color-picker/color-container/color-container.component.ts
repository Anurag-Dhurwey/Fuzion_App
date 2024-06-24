import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CanvasService } from '../../../services/canvas/canvas.service';
import Color from 'color';
import { fabric } from 'fabric';
import { IncludePropertiesOnly } from '../../../../types/app.types';
@Component({
  selector: 'app-color-container',
  standalone: true,
  imports: [],
  templateUrl: './color-container.component.html',
  styleUrl: './color-container.component.css',
})
export class ColorContainerComponent implements OnChanges {
  constructor(public canvasService: CanvasService) {}
  @Output() onColorChnage = new EventEmitter<string | fabric.Gradient>();
  @Input({ required: true }) targetNameToColor: keyof fabric.Object | null =
    null;
  @Input({ required: true }) gradientColorStopIndex: number | null = null;
  @Input({ required: true }) fillColorFormateType:
    | 'string'
    | 'gradient'
    | undefined;
  @Input() colorPresets: string[] = [];
  @Input() width: number = 300;
  @HostListener('window:mouseup', ['$event'])
  mouseUp() {
    this.palette.mouseDown = false;
    this.hueSlider.mouseDown = false;
    this.alphaSlider.mouseDown = false;

    // if (this.initialColor != this.color) {
      this.canvasService.emitReplaceObjsEventToSocket();
      // this.initialColor=this.color
    // }
    this.canvasService.saveStateInHistory();
  }

  // initialColor: string | undefined = '';

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
  // currentColor: string = '';
  defaultColorFormate: DefaultColorFormate = 'HEX';
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
  alphaSlider: {
    ctx: null | CanvasRenderingContext2D;
    dim: {
      w: number;
      h: number;
    };
    lastMousePo: { x: number; y: number } | null;
    mouseDown: boolean;
  } = {
    ctx: null,
    dim: { w: this.width, h: 20 },
    lastMousePo: null,
    mouseDown: false,
  };

  // gradientColorStopIndex: number | null = null;

  // colorCatch: string | fabric.Gradient | fabric.Pattern | null = null;

  ngAfterViewInit() {
    // if (!this.initialColor) {
    //   this.initialColor = this.color;
    // }

    this.palette.dim.w = this.width;
    this.hueSlider.dim.w = this.width;
    this.alphaSlider.dim.w = this.width;
    const ele_palette = document.getElementById('palette') as HTMLCanvasElement;
    if (!ele_palette) return;
    ele_palette.width = this.width;
    ele_palette.height = this.palette.dim.h;
    this.palette.ctx = ele_palette.getContext('2d') as CanvasRenderingContext2D;

    const ele_hue = document.getElementById('hue') as HTMLCanvasElement;
    ele_hue.width = this.width;
    ele_hue.height = this.hueSlider.dim.h;
    this.hueSlider.ctx = ele_hue.getContext('2d') as CanvasRenderingContext2D;

    const ele_alpha = document.getElementById('alpha') as HTMLCanvasElement;
    ele_alpha.width = this.width;
    ele_alpha.height = this.alphaSlider.dim.h;
    this.alphaSlider.ctx = ele_alpha.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    const animate = () => {
      this.drawHueSlider(this.hueSlider.ctx!);
      this.drawRefOnHueSlider();
      this.drawPalette(this.palette.ctx!);
      this.drawRefOnpalette();
      this.drawAlphaSlider(this.alphaSlider.ctx!, this.color!);

      this.drawRefOfAlphaSlider();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  mouseUpEventRegistered: boolean = false;
  reset = () => {
    this.ngAfterViewInit();
    document.removeEventListener('mouseup', this.reset);
    this.mouseUpEventRegistered = false;
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['width'] && !this.mouseUpEventRegistered) {
      document.addEventListener('mouseup', this.reset);
      this.mouseUpEventRegistered = true;
    }
  }

  get color(): string | undefined {
    const objs = this.canvasService.oneDarrayOfSelectedObj;
    if (
      !this.targetNameToColor ||
      !objs.length ||
      !objs[0][this.targetNameToColor]?.toString().length
    )
      return;
    if (typeof objs[0][this.targetNameToColor] === 'string') {
      return objs[0][this.targetNameToColor];
    } else if (
      objs[0][this.targetNameToColor] instanceof fabric.Gradient &&
      this.gradientColorStopIndex != null
    ) {
      return objs[0][this.targetNameToColor].colorStops![
        this.gradientColorStopIndex
      ].color;
    }
    return;
  }

  drawRefOnpalette() {
    if (!this.palette.ctx) return;
    if (!this.palette.lastMousePo && this.color) {
      const po = this.findColorPosition(
        this.color,
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
      this.palette.ctx.lineWidth = 3;
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
      this.hueSlider.ctx.lineWidth = 3;
      this.hueSlider.ctx.stroke();
    }
  }
  touchMoveOnPalette(e: TouchEvent) {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    let x = e.targetTouches[0].pageX - rect.left;
    let y = e.targetTouches[0].pageY - rect.top;

    if (x < 0) {
      x = 0;
    } else if (x > rect.width) {
      x = rect.width - 1;
    }
    if (y < 0) {
      y = 0;
    } else if (y > rect.height) {
      x = rect.height;
    }

    this.onCLickPalette(x, y);
  }
  mouseMoveOnPalette(e: MouseEvent) {
    if (this.palette.mouseDown) {
      this.onCLickPalette(e.offsetX, e.offsetY);
    }
  }
  touchMoveOnHueSlider(e: TouchEvent) {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    let x = e.targetTouches[0].pageX - rect.left;
    let y = e.targetTouches[0].pageY - rect.top;
    if (x < 0) {
      x = 0;
    } else if (x > rect.width) {
      x = rect.width - 1;
    }
    this.onClickHueSlider(x, y);
  }
  mouseMoveOnHueSlider(e: MouseEvent) {
    if (this.hueSlider.mouseDown) {
      this.onClickHueSlider(e.offsetX, e.offsetY);
    }
  }
  touchMoveOnAlphaSlider(e: TouchEvent) {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    let x = e.targetTouches[0].pageX - rect.left;
    let y = e.targetTouches[0].pageY - rect.top;
    if (x < 0) {
      x = 0;
    } else if (x > rect.width) {
      x = rect.width - 1;
    }
    this.onClickAlphaSlider(x, y);
  }
  mouseMoveOnAlphaSlider(e: MouseEvent) {
    if (this.alphaSlider.mouseDown) {
      this.onClickAlphaSlider(e.offsetX, e.offsetY);
    }
  }

  changeColor(val: string) {
    this.hue = null;
    this.palette.lastMousePo = null;
    this.hueSlider.lastMousePo = null;
    // this.inputColor = val;
    this.setCurrentColor(val);
  }

  setCurrentColor(color: string) {
    if (
      this.fillColorFormateType == 'gradient' &&
      this.gradientColorStopIndex != null
    ) {
      const fill = (
        this.canvasService.oneDarrayOfSelectedObj[0].fill as fabric.Gradient
      ).toObject() as IncludePropertiesOnly<fabric.Gradient>;

      // const grad = obj.fill as fabric.Gradient;
      fill.colorStops![this.gradientColorStopIndex].color = Color(color).hexa();
      const grad = new fabric.Gradient({
        ...fill,
      });
      this.onColorChnage.emit(grad);
      return;
    }
    this.onColorChnage.emit(color);
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
      return Color(color).hexa();
    } else if (formate == 'CMYK') {
      return Color(color).cmyk().string();
    }
    return 'unknown formate';
  }

  drawAlphaSlider(ctx: CanvasRenderingContext2D, color: string) {
    const width = this.alphaSlider.dim.w;
    const height = this.alphaSlider.dim.h;
    ctx.clearRect(0, 0, width, height);

    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0.1, Color(color).alpha(0).hexa());
    whiteGrad.addColorStop(1, Color(color).alpha(1).hexa());

    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, width, height);
  }
  drawRefOfAlphaSlider() {
    if (!this.alphaSlider.ctx) return;

    if (!this.alphaSlider.lastMousePo) {
      this.alphaSlider.lastMousePo = {
        x: Color(this.color).alpha() * this.alphaSlider.dim.w - 3,
        y: 0,
      };
    }

    if (this.alphaSlider.lastMousePo) {
      this.alphaSlider.ctx.strokeStyle = 'white';
      this.alphaSlider.ctx.fillStyle = 'white';
      this.alphaSlider.ctx.beginPath();
      this.alphaSlider.ctx.moveTo(this.alphaSlider.lastMousePo.x, 0);
      this.alphaSlider.ctx.lineTo(
        this.alphaSlider.lastMousePo.x,
        this.alphaSlider.dim.h
      );
      // this.hueSlider.ctx.fillRect(0,0,width,height)
      this.alphaSlider.ctx.lineWidth = 3;
      this.alphaSlider.ctx.stroke();
    }
  }
  drawPalette(
    ctx: CanvasRenderingContext2D,
    callback?: (ctx: CanvasRenderingContext2D) => void
  ) {
    const width = this.palette.dim.w;
    const height = this.palette.dim.h;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.hue || this.findHue(this.color || 'gray') || '';
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
  }
  drawHueSlider(
    ctx: CanvasRenderingContext2D,
    callback?: (ctx: CanvasRenderingContext2D) => void
  ) {
    const width = this.hueSlider.dim.w;
    const height = this.hueSlider.dim.h;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);

    this.hueColors.forEach((co, i) => {
      gradient.addColorStop(i / this.hueColors.length, co);
    });

    ctx.beginPath();
    ctx.rect(0, 0, width, height);

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
  }

  onCLickPalette(x: number, y: number) {
    if (!this.palette.ctx) return;
    const ele = document.createElement('canvas');
    ele.width = this.palette.dim.w;
    ele.height = this.palette.dim.h;
    const ctx = ele.getContext('2d');
    if (!ctx) return;
    this.drawPalette(ctx);
    // this.setCurrentColor(this.pickColor(ctx, x, y)!);

    const co = this.pickColor(ctx, x, y)!;
    this.setCurrentColor(Color(co).alpha(Color(this.color).alpha()).hexa());
    this.palette.lastMousePo = { x, y };
    // this.drawPalette();
  }

  onClickHueSlider(x: number, y: number) {
    if (!this.hueSlider.ctx) return;
    const ele = document.createElement('canvas');
    ele.width = this.hueSlider.dim.w;
    ele.height = this.hueSlider.dim.h;
    const ctx = ele.getContext('2d');
    if (!ctx) return;
    this.drawHueSlider(ctx);
    this.hue = this.pickColor(ctx, x, y)!;
    this.hueSlider.lastMousePo = { x, y };
    // this.drawPalette();
    if (this.palette.lastMousePo?.x) {
      this.drawPalette(this.palette.ctx!);
      const co = this.pickColor(
        this.palette.ctx!,
        this.palette.lastMousePo.x,
        this.palette.lastMousePo.y
      );
      // console.log(co)
      co &&
        this.setCurrentColor(Color(co).alpha(Color(this.color).alpha()).hexa());
    }
    // this.drawHueSlider();
  }
  onClickAlphaSlider(x: number, y: number) {
    // if(this.alphaSlider)
    this.alphaSlider.lastMousePo = { x, y };
    const alpha = Math.max(
      0,
      Math.min(1, parseFloat((x / this.alphaSlider.dim.w).toFixed(2)))
    );
    // const co=Color(this.color).alpha(alpha).hexa()
    this.setCurrentColor(Color(this.color).alpha(alpha).hexa());
  }
  findHue(color: string) {
    try {
      const hsl = Color(color).hsl().object();
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

  ngOndestroy() {
    document.removeEventListener('mouseup', this.reset);

    console.log('dd');
  }
}

type DefaultColorFormate = 'RGB' | 'HSL' | 'HSV' | 'CMYK' | 'HEX';
