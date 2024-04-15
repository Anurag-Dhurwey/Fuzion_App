import { Component } from '@angular/core';
import { CommonProperty } from '../../../../types/app.types';
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
        },
        {
          lable: 'Left',
          key: 'left',
          val_type: 'number',
          inputBox_type: 'number',
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
        },
        {
          lable: 'H',
          key: 'height',
          val_type: 'number',
          inputBox_type: 'number',
        },
        {
          lable: 'ScaleX',
          key: 'scaleX',
          val_type: 'number',
          inputBox_type: 'number',
          step: 0.1,
        },
        {
          lable: 'ScaleY',
          key: 'scaleY',
          val_type: 'number',
          inputBox_type: 'number',
          step: 0.1,
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
        },
        {
          lable: 'Y',
          key: 'flipY',
          val_type: 'boolean',
          inputBox_type: 'checkbox',
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
        },
        {
          lable: 'Size',
          key: 'strokeWidth',
          val_type: 'number',
          inputBox_type: 'number',
          min: 0,
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
        },
        {
          lable: 'Opacity',
          key: 'opacity',
          val_type: 'number',
          inputBox_type: 'number',
          step: 0.1,
          min: 0,
          max: 1,
        },
        {
          lable: 'Background',
          key: 'backgroundColor',
          val_type: 'string',
          inputBox_type: 'color',
        },
      ],
    },
  ];

  constructor(public canvasService: CanvasService) {}

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = this.extractValueFromTarget(target);
    if (value !== null && this.canvasService.selectedObj?.length === 1) {
      this.canvasService.selectedObj.forEach((obj:fabric.Object)=>{
        obj.set(
          target.name as keyof fabric.Object,
          value
        );
      })
      this.canvasService.canvas?.renderAll();
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
      return Math.floor(parseFloat(target.value));
    } else if (['flipX', 'flipY'].includes(target.name)) {
      return target.checked;
    } else {
      return target.value;
    }
  }
}
