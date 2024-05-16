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
  constructor(public canvasService: CanvasService) {}
  commonFields: CommonProperty<fabric.Object>[] = [
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
        {
          lable: 'Angle',
          key: 'angle',
          val_type: 'number',
          inputBox_type: 'number',
          step: 1,
          pipe(val: number) {
            return val.toFixed();
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
      buttons: {
        add: (keys: Keys<fabric.Object>[]) => {
          for (let key of keys) {
            this.addInitialValueToField(key.key);
          }
        },
        remove: (keys: Keys<fabric.Object>[]) => {
          for (let key of keys) {
            (this.canvasService.selectedObj[0] as fabric.Object).set(
              key.key,
              ''
            );
          }
          this.canvasService.canvas?.requestRenderAll();
        },
      },
    },
    {
      title: 'Fill',
      keys: [
        {
          lable: 'color',
          key: 'fill',
          val_type: 'string',
          inputBox_type: 'color',
          pipe(val: string) {
            return val;
          },
        },
      ],
      buttons: {
        add: (keys: Keys<fabric.Object>[]) => {
          for (let key of keys) {
            this.addInitialValueToField(key.key);
          }
        },
        remove: (keys: Keys<fabric.Object>[]) => {
          for (let key of keys) {
            (this.canvasService.selectedObj[0] as fabric.Object).set(
              key.key,
              ''
            );
          }
          this.canvasService.canvas?.requestRenderAll();
        },
      },
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
      title: 'Others',
      keys: [
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
        // {
        //   lable: 'Background',
        //   key: 'backgroundColor',
        //   val_type: 'string',
        //   inputBox_type: 'color',
        //   pipe(val: string) {
        //     return val;
        //   },
        // },
      ],
    },
  ];

  rectFields: CommonProperty<fabric.Rect>[] = [
    {
      title: 'Corners',
      keys: [
        {
          lable: 'RX',
          key: 'rx',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(val: string) {
            return val;
          },
        },
        {
          lable: 'RY',
          key: 'ry',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(val: string) {
            return val;
          },
        },
      ],
      buttons: {
        add: (keys: Keys<fabric.Object>[]) => {
          for (let key of keys) {
            this.addInitialValueToField(key.key);
          }
        },
        remove: (keys: Keys<fabric.Object>[]) => {
          for (let key of keys) {
            (this.canvasService.selectedObj[0] as fabric.Object).set(
              key.key,
              ''
            );
          }
          this.canvasService.canvas?.requestRenderAll();
        },
      },
    },
  ];

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

  addInitialValueToField(field: keyof fabric.Object) {
    if (['stroke', 'fill'].includes(field.toLowerCase())) {
      (this.canvasService.selectedObj[0] as fabric.Object).set(
        field,
        '#07a4b0'
      );
    } else if (['strokewidth'].includes(field.toLowerCase())) {
      (this.canvasService.selectedObj[0] as fabric.Object).set(field, 1);
    } else if(['rx','ry'].includes(field.toLowerCase())){
      (this.canvasService.selectedObj[0] as fabric.Object).set(field, 10);

    }
    this.canvasService.canvas?.requestRenderAll();
  }

  isThisKeyRequired(key: Keys<fabric.Object>) {
    if (
      this.canvasService.selectedObj[0].type == 'line' &&
      key.key == 'height'
    ) {
      return false;
    }
    return true;
  }

  showElement(keys: Keys<fabric.Object>[], title: string) {
    if (['stroke', 'fill','corners','rx','ry'].includes(title.toLowerCase())) {
      return this.isValueExist(keys);
    }
    return true;
  }

  isValueExist(key: Keys<fabric.Object>[]) {
    for (const item of key) {
      if (this.canvasService.selectedObj[0][item.key].toString().length) {
        return true;
      }
    }
    return false;
  }
}
