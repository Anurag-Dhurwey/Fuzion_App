import { Component, EventEmitter, Output } from '@angular/core';
import {
  Fields,
  Keys,
  PossibleKeysOfObject,
  QuadraticCurveControlPoint,
  possibleShapeType,
} from '../../../../types/app.types';
import { CanvasService } from '../../../services/canvas/canvas.service';
import { fabric } from 'fabric';
@Component({
  selector: 'app-commom',
  standalone: true,
  imports: [],
  templateUrl: './commom.component.html',
  styleUrl: './commom.component.css',
})
export class CommomComponent {
  @Output() onInputClick = new EventEmitter<MouseEvent>();
  @Output() onValueChange = new EventEmitter<Event>();

  constructor(
    public canvasService: CanvasService
  ) 
  {}

  addBtn = (keys: Keys[]) => {
    for (let key of keys) {
      this.addInitialValueToField(key.key as keyof fabric.Object);
    }
    this.canvasService.socketEvents.object_modified('replace');
    this.canvasService.oneDarrayOfObjects.forEach((ob) =>
      this.canvasService.totalChanges.add(ob._id)
    );
    this.canvasService.saveStateInHistory();
    this.canvasService.canvas?.requestRenderAll();
  };

  removeBtn = (keys: Keys[]) => {
    for (let key of keys) {
      (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
        key.key as keyof fabric.Object,
        ''
      );
    }
    this.canvasService.socketEvents.object_modified('replace');
    this.canvasService.oneDarrayOfObjects.forEach((ob) =>
      this.canvasService.totalChanges.add(ob._id)
    );
    this.canvasService.saveStateInHistory();
    this.canvasService.canvas?.requestRenderAll();
  };

  fields: {
    top: Keys;
    left: Keys;
    // lockMovementX: Keys;
    // lockMovementY: Keys;
    opacity: Keys;
    width: Keys;
    height: Keys;
    scaleX: Keys;
    scaleY: Keys;
    angle: Keys;
    // lockRotation: Keys;
    // lockScalingX: Keys;
    // lockScalingY: Keys;
    stroke: Keys;
    strokeWidth: Keys;
    fill: Keys;
    flipX: Keys;
    flipY: Keys;
  } = {
    top: {
      lable: 'Top',
      key: 'top',
      val_type: 'number',
      inputBox_type: 'number',
      pipe(num: number) {
        return num.toFixed();
      },
      lock: {
        key: 'lockMovementY',
        val: false,
      },
    },
    left: {
      lable: 'Left',
      key: 'left',
      val_type: 'number',
      inputBox_type: 'number',
      pipe(num: number) {
        return num.toFixed();
      },
      lock: {
        key: 'lockMovementX',
        val: false,
      },
    },
    // lockMovementX: {
    //   lable: 'MovementX',
    //   key: 'lockMovementX',
    //   val_type: 'boolean',
    //   inputBox_type: 'checkbox',
    //   pipe(val: boolean) {
    //     return val;
    //   },
    // },
    // lockMovementY: {
    //   lable: 'MovementY',
    //   key: 'lockMovementY',
    //   val_type: 'boolean',
    //   inputBox_type: 'checkbox',
    //   pipe(val: boolean) {
    //     return val;
    //   },
    // },

    opacity: {
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
    width: {
      lable: 'W',
      key: 'width',
      val_type: 'number',
      inputBox_type: 'number',
      pipe(val: number) {
        return val.toFixed();
      },
    },
    height: {
      lable: 'H',
      key: 'height',
      val_type: 'number',
      inputBox_type: 'number',
      pipe(val: number) {
        return val.toFixed();
      },
    },
    scaleX: {
      lable: 'ScaleX',
      key: 'scaleX',
      val_type: 'number',
      inputBox_type: 'number',
      step: 0.1,
      pipe(val: number) {
        return val.toFixed(3);
      },
      lock: {
        key: 'lockScalingX',
        val: false,
      },
    },
    scaleY: {
      lable: 'ScaleY',
      key: 'scaleY',
      val_type: 'number',
      inputBox_type: 'number',
      step: 0.1,
      pipe(val: number) {
        return val.toFixed(3);
      },
      lock: {
        key: 'lockScalingY',
        val: false,
      },
    },
    angle: {
      lable: 'Angle',
      key: 'angle',
      val_type: 'number',
      inputBox_type: 'number',
      step: 1,
      pipe(val: number) {
        return val.toFixed();
      },
      lock: {
        key: 'lockRotation',
        val: false,
      },
    },
    // lockRotation: {
    //   lable: 'Rotation',
    //   key: 'lockRotation',
    //   val_type: 'boolean',
    //   inputBox_type: 'checkbox',
    //   pipe(val: boolean) {
    //     return val;
    //   },
    // },
    // lockScalingX: {
    //   lable: 'ScalingX',
    //   key: 'lockScalingX',
    //   val_type: 'boolean',
    //   inputBox_type: 'checkbox',
    //   pipe(val: boolean) {
    //     return val;
    //   },
    // },
    // lockScalingY: {
    //   lable: 'ScalingY',
    //   key: 'lockScalingY',
    //   val_type: 'boolean',
    //   inputBox_type: 'checkbox',
    //   pipe(val: boolean) {
    //     return val;
    //   },
    // },
    stroke: {
      lable: 'Color',
      key: 'stroke',
      val_type: 'string',
      inputBox_type: 'color',
      pipe(val: string) {
        return val;
      },
    },
    strokeWidth: {
      lable: 'Size',
      key: 'strokeWidth',
      val_type: 'number',
      inputBox_type: 'number',
      min: 0,
      pipe(val: number) {
        return val;
      },
    },
    fill: {
      lable: 'color',
      key: 'fill',
      val_type: 'string',
      inputBox_type: 'color',
      pipe(val: string) {
        return val;
      },
    },
    flipX: {
      lable: 'X',
      key: 'flipX',
      val_type: 'boolean',
      inputBox_type: 'checkbox',
      pipe(val: boolean) {
        return val;
      },
    },
    flipY: {
      lable: 'Y',
      key: 'flipY',
      val_type: 'boolean',
      inputBox_type: 'checkbox',
      pipe(val: boolean) {
        return val;
      },
    },
  };

  commonFields: Fields[] = [
    {
      title: 'Position',
      keys: [this.fields.top, this.fields.left],
    },
    {
      title: 'Size',
      keys: [
        this.fields.width,
        this.fields.height,
        this.fields.scaleX,
        this.fields.scaleY,
        this.fields.angle,
      ],
    },

    {
      title: 'Stroke',
      keys: [this.fields.stroke, this.fields.strokeWidth],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Fill',
      keys: [this.fields.fill],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Flip',
      keys: [this.fields.flipX, this.fields.flipY],
    },
    {
      title: 'Others',
      keys: [this.fields.opacity],
    },
    // this.lockFields,
  ];
  quadratic_curve: Fields[] = [
    {
      title: 'Position',
      keys: [this.fields.top, this.fields.left],
    },
    {
      title: 'Size',
      keys: [
        this.fields.width,
        this.fields.height,
        this.fields.scaleX,
        this.fields.scaleY,
        this.fields.angle,
      ],
    },

    {
      title: 'Stroke',
      keys: [this.fields.stroke, this.fields.strokeWidth],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Fill',
      keys: [this.fields.fill],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Flip',
      keys: [this.fields.flipX, this.fields.flipY],
    },
    {
      title: 'Others',
      keys: [this.fields.opacity],
    },
    // this.lockFields,
  ];

  rectFields: Fields[] = [
    {
      title: 'Position',
      keys: [this.fields.top, this.fields.left],
    },
    {
      title: 'Size',
      keys: [
        this.fields.width,
        this.fields.height,
        this.fields.scaleX,
        this.fields.scaleY,
        this.fields.angle,
      ],
    },
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
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },

    {
      title: 'Stroke',
      keys: [this.fields.stroke, this.fields.strokeWidth],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Fill',
      keys: [this.fields.fill],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Flip',
      keys: [this.fields.flipX, this.fields.flipY],
    },
    {
      title: 'Others',
      keys: [this.fields.opacity],
    },
    // this.lockFields,
  ];
  textFields: Fields[] = [
    {
      title: 'Position',
      keys: [this.fields.top, this.fields.left],
    },
    {
      title: 'Size',
      keys: [
        this.fields.width,
        this.fields.height,
        this.fields.scaleX,
        this.fields.scaleY,
        this.fields.angle,
      ],
    },
    {
      title: 'Font',
      keys: [
        {
          lable: 'Weight',
          key: 'fontWeight',
          val_type: 'string',
          inputBox_type: 'choose',
          options: ['200', '400', '600', '800', '1000', '1200'],
          pipe(val: string) {
            return val;
          },
        },
        {
          lable: 'Style',
          key: 'fontStyle',
          val_type: 'string',
          inputBox_type: 'choose',
          options: ['normal', 'italic', 'oblique'],
          pipe(val: string) {
            return val;
          },
        },
        {
          lable: 'Family',
          key: 'fontFamily',
          val_type: 'string',
          inputBox_type: 'choose',
          options: [
            'Times New Roman',
            'serif',
            'sans-serif',
            'monospace',
            'cursive',
            'fantasy',
            'system-ui',
            'ui-serif',
            'Roboto',
            'Teko',
          ],
          pipe(val: string) {
            return val;
          },
        },
        {
          lable: 'Size',
          key: 'fontSize',
          val_type: 'number',
          inputBox_type: 'number',
          pipe(val) {
            return val;
          },
          min: 2,
        },
      ],
    },
    {
      title: 'Align',
      keys: [
        {
          lable: 'Hor',
          key: 'textAlign',
          val_type: 'string',
          inputBox_type: 'choose',
          options: [
            'left',
            'right',
            'center',
            // 'justify',
            // 'justify-left',
            // 'justify-center',
            // 'justify-right',
          ],
          pipe(val: string) {
            return val;
          },
        },
        // {
        //   lable: 'Ver',
        //   key: 'pathAlign',
        //   val_type: 'string',
        //   inputBox_type: 'choose',
        //   options: [
        //     "baseline", "center", "ascender", "descender"
        //   ],
        //   pipe(val: string) {
        //     return val;
        //   },
        // },
      ],
    },

    {
      title: 'Stroke',
      keys: [this.fields.stroke, this.fields.strokeWidth],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Fill',
      keys: [this.fields.fill],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Flip',
      keys: [
        this.fields.flipX,
        this.fields.flipY,
        {
          lable: 'UnderLine',
          key: 'underline',
          val_type: 'boolean',
          inputBox_type: 'checkbox',
          pipe(val) {
            return val;
          },
        },
      ],
    },
    {
      title: 'Others',
      keys: [this.fields.opacity],
    },
    // this.lockFields,
  ];

  circleFields: Fields[] = [
    {
      title: 'Position',
      keys: [this.fields.left, this.fields.top],
    },
    {
      title: 'Size',
      keys: [
        this.fields.width,
        this.fields.height,
        this.fields.scaleX,
        this.fields.scaleY,
        this.fields.angle,
        {
          lable: 'Radius',
          key: 'radius',
          val_type: 'number',
          inputBox_type: 'number',
          step: 1,
          pipe(val: number) {
            return val;
          },
        },
      ],
    },

    {
      title: 'Stroke',
      keys: [this.fields.stroke, this.fields.strokeWidth],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Fill',
      keys: [this.fields.fill],
      buttons: {
        add: this.addBtn,
        remove: this.removeBtn,
      },
    },
    {
      title: 'Flip',
      keys: [this.fields.flipX, this.fields.flipY],
    },
    {
      title: 'Others',
      keys: [this.fields.opacity],
    },
    // this.lockFields,
  ];

  buttons: {
    quadratic_curve: {
      lable: string;
      inputBox_type: 'button';
      emit: () => void;
    }[];
  } = {
    quadratic_curve: [
      {
        lable: 'Edit Path',
        inputBox_type: 'button',
        emit: () => {
          this.canvasService.addQuadraticCurveControlPoints();
        },
      },
    ],
  };

  getButtonsList() {
    const objs = this.canvasService.oneDarrayOfSelectedObj;
    if (
      objs.length &&
      objs[0].type === 'path' &&
      objs[0].pathType == 'quadratic_curve'
    ) {
      return this.buttons.quadratic_curve;
    } else {
      return [];
    }
  }

  getFieldsList(type?: possibleShapeType | 'activeSelection') {
    if (!type) {
      if (
        !(this.canvasService.activeObjects as QuadraticCurveControlPoint).ctrlOf
      ) {
        type = this.canvasService.activeObjects?.type as possibleShapeType;
      } else {
        return [];
      }
    }
    if (type == 'circle') {
      return this.circleFields;
    } else if (type == 'line') {
      return this.commonFields;
    } else if (type == 'rect') {
      return this.rectFields;
    } else if (type == 'path') {
      // if((this.canvasService.activeObjects as Fab_Path).pathType==='quadratic_curve'){
      //   return [...this.commonFields];

      // }
      return this.commonFields;
    } else if (type == 'image') {
      return this.commonFields;
    } else if (type == 'i-text') {
      return this.textFields;
    } else {
      return [];
    }
  }

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.value.length) {
      return;
    }
    const value = this.extractValueFromTarget(target);
    if (this.canvasService.oneDarrayOfSelectedObj?.length === 1) {
      (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
        target.name as keyof fabric.Object,
        value
      );
      this.canvasService.socketEvents.set_object_property(
        this.canvasService.oneDarrayOfSelectedObj[0]._id,
        { [target.name]: value }
      );
      this.canvasService.saveStateInHistory();
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
        'radius',
      ].includes(target.name)
    ) {
      return parseFloat(target.value);
    } else if (
      [
        'flipX',
        'flipY',
        'underline',
        'lockMovementX',
        'lockMovementY',
        'lockScalingX',
        'lockScalingY',
        'lockRotation',
      ].includes(target.name)
    ) {
      return target.checked;
    } else {
      return target.value;
    }
  }

  addInitialValueToField(field: keyof fabric.Object) {
    if (['stroke', 'fill'].includes(field.toLowerCase())) {
      (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
        field,
        '#07a4b0'
      );
    } else if (['strokewidth'].includes(field.toLowerCase())) {
      (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
        field,
        1
      );
    } else if (['rx', 'ry'].includes(field.toLowerCase())) {
      (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
        field,
        10
      );
    }
    // this.canvasService.canvas?.requestRenderAll();
  }

  isThisKeyRequired(key: Keys) {
    if (
      this.canvasService.oneDarrayOfSelectedObj[0].type == 'line' &&
      key.key == 'height'
    ) {
      return false;
    }
    return true;
  }

  showElement(keys: Keys[], title: string) {
    if (
      ['stroke', 'fill', 'corners', 'rx', 'ry'].includes(title.toLowerCase())
    ) {
      return this.isValueExist(keys);
    }
    return true;
  }

  isValueExist(key: Keys[]) {
    for (const item of key) {
      if (
        this.canvasService.oneDarrayOfSelectedObj[0][
          item.key as keyof fabric.Object
        ] != null &&
        this.canvasService.oneDarrayOfSelectedObj[0][
          item.key as keyof fabric.Object
        ].toString().length
      ) {
        return true;
      }
    }
    return false;
  }

  getValue(key: PossibleKeysOfObject) {
    // if (['backgroundColor', 'fill', 'stroke'].includes(key)) {
    //   return this.cssColor(
    //     this.canvasService.oneDarrayOfSelectedObj[0][key as keyof fabric.Object]
    //   );
    // }
    return this.canvasService.oneDarrayOfSelectedObj[0][
      key as keyof fabric.Object
    ];
  }

  lockProperty(
    key:
      | 'lockMovementX'
      | 'lockMovementY'
      | 'lockScalingX'
      | 'lockScalingY'
      | 'lockRotation',
    val: boolean
  ) {
    if (this.canvasService.oneDarrayOfSelectedObj?.length === 1) {
      (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
        key,
        val
      );
      // this.canvasService.emitReplaceObjsEventToSocket();
      // this.canvasService.canvas?.requestRenderAll();
    }
  }

  cssColor(color: string | fabric.Gradient) {
    if (color instanceof fabric.Gradient) {
      if (color.type == 'radial') {
        let radial = '';
        color.colorStops?.forEach((it) => {
          radial = `${radial}, ${it.color} ${it.offset * 100}%`;
        });
        return `radial-gradient(circle ${radial})`;
      } else {
        let linear = '';
        color.colorStops?.forEach((it) => {
          linear = `${linear}, ${it.color} ${it.offset * 100}%`;
        });
        return `linear-gradient(90deg ${linear})`;
      }
    } else {
      return color;
    }
  }
}
