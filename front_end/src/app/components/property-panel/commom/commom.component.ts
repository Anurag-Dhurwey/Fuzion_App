import { Component } from '@angular/core';
import { CommonProperty, Keys } from '../../../../types/app.types';
import { CanvasService } from '../../../services/canvas/canvas.service';

@Component({
  selector: 'app-commom',
  standalone: true,
  imports: [],
  templateUrl: './commom.component.html',
  styleUrl: './commom.component.css',
})
export class CommomComponent {
  commonData: CommonProperty[] = [
    {
      title: 'Position',
      keys: [
        {
          lable: 'Top',
          key: 'top',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(num: number) {
            return num.toFixed();
          },
        },
        {
          lable: 'Left',
          key: 'left',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(num: number) {
            return num.toFixed();
          },
        },
      ],
    },
    {
      title: 'Size',
      keys: [
        {
          lable: 'W',
          key: 'width',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(val: number) {
            return val.toFixed();
          },
        },
        {
          lable: 'H',
          key: 'height',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(val: number) {
            return val.toFixed();
          },
        },
        {
          lable: 'ScaleX',
          key: 'scaleX',
          val_type: 'number',
          inputBox_type: 'number',
          step: 0.1,
          pipe(val: number) {
            return val.toFixed(3);
          },
        },
        {
          lable: 'ScaleY',
          key: 'scaleY',
          val_type: 'number',
          inputBox_type: 'number',
          step: 0.1,
          pipe(val: number) {
            return val.toFixed(3);
          },
        },
      ],
    },
    {
      title: 'Flip',
      keys: [
        {
          lable: 'X',
          key: 'flipX',
          val_type: 'boolean',
          inputBox_type: 'checkbox',
          pipe(val: boolean) {
            return val;
          },
        },
        {
          lable: 'Y',
          key: 'flipY',
          val_type: 'boolean',
          inputBox_type: 'checkbox',
          pipe(val: boolean) {
            return val;
          },
        },
      ],
    },
    {
      title: 'Stroke',
      keys: [
        {
          lable: 'Color',
          key: 'stroke',
          val_type: 'string',
          inputBox_type: 'color',
          pipe(val: string) {
            return val;
          },
        },
        {
          lable: 'Size',
          key: 'strokeWidth',
          val_type: 'number',
          inputBox_type: 'number',
          min: 0,
          pipe(val: number) {
            return val;
          },
        },
      ],
    },
    {
      title: 'Others',
      keys: [
        {
          lable: 'Fill',
          key: 'fill',
          val_type: 'string',
          inputBox_type: 'color',
          pipe(val: string) {
            return val;
          },
        },
        {
          lable: 'Opacity',
          key: 'opacity',
          val_type: 'number',
          inputBox_type: 'number',
          step: 0.1,
          min: 0,
          max: 1,
          pipe(val: number) {
            return val;
          },
        },
        {
          lable: 'Background',
          key: 'backgroundColor',
          val_type: 'string',
          inputBox_type: 'color',
          pipe(val: string) {
            return val;
          },
        },
      ],
    },
  ];

  constructor(public canvasService: CanvasService) {}

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.value.length) {
      target.value =
        this.canvasService.selectedObj[0][target.name as keyof fabric.Object];
      return;
    }
    const value = this.extractValueFromTarget(target);
    if (this.canvasService.selectedObj?.length === 1) {
      (this.canvasService.selectedObj[0] as fabric.Object).set(
        target.name as keyof fabric.Object,
        value
      );
      this.canvasService.canvas?.requestRenderAll();
    }
  }

  // onInputValue(key: Keys) {
  //   if (!key.controller.value) {
  //     key.controller.setValue(this.canvasService.selectedObj[0][key.key]);
  //     // console.log(this.form.top.value);
  //   } else {
  //     (this.canvasService.selectedObj[0] as fabric.Object).set(
  //       key.key,
  //       key.controller.value!
  //     );
  //     this.canvasService.selectedObj[0].setCoords()
  //     this.canvasService.canvas?.requestRenderAll();
  //   }
  // }

  extractValueFromTarget(target: HTMLInputElement) {
    if (
      [
        'top',
        'left',
        'width',
        'height',
        'scaleX',
        'scaleY',
        'angle',
        'strokeWidth',
        'opacity',
      ].includes(target.name)
    ) {
      return parseFloat(target.value);
    } else if (['flipX', 'flipY'].includes(target.name)) {
      return target.checked;
    } else {
      return target.value;
    }
  }
}
