import { FormControl } from '@angular/forms';

export type Roles =
  | 'pan'
  | 'select'
  | 'pen'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'pencil'
  | 'image'
  | 'text';

export type Group = fabric.Group & {
  _objects: Fab_Objects[];
  type: 'group';
  isMinimized?: boolean;
  _id: string;
};

export type Fab_Objects = (
  | Fab_Path
  | (fabric.Line & { type: 'line' })
  | (fabric.Rect & { type: 'rect' })
  | (fabric.Circle & { type: 'circle' })
  | (fabric.Image & { type: 'image' })
  | (fabric.IText & { type: 'i-text' })
  | Group
) & {
  _id: string;
};

export type Fab_Path = fabric.Path & {_id:string, isPathClosed?: boolean; type: 'path',pathType:'free_hand'|'quadratic_curve'};
export  type Fab_PathArray = [string, number, number, number, number]

export type QuadraticCurveControlPoint= (fabric.Circle & {
  name: 'curve' | 'node';
  index: number;
  ctrlOf: string;
})

export type possibleShapeType =
  | 'path'
  | 'line'
  | 'rect'
  | 'circle'
  | 'image'
  | 'i-text';

export type Position = { x: number; y: number };
// export type Presense = { id: string; mouse: Position; expire: number };

export type PropertiesToInclude={_id:string,pathType?:string}


export type Fields = {
  title:
    | 'Position'
    | 'Stroke'
    | 'Size'
    | 'Fill'
    | 'Flip'
    | 'Others'
    | 'Corners'
    | ''
    | 'Align'
    | 'Font';
  keys: Keys[];
  buttons?: {
    add: (keys: Keys[]) => void;
    remove: (keys: Keys[]) => void;
  };
};
export type PossibleKeysOfObject =
  | keyof fabric.Object
  | 'rx'
  | 'ry'
  | 'radius'
  | 'textAlign'
  | 'underline'
  | 'pathAlign'
  | 'fontWeight'
  | 'fontStyle'
  | 'fontSize'
  | 'fontFamily';

export type Keys =
  | {
      lable: string;
      key: PossibleKeysOfObject;
      val_type: 'string' | 'number' | 'boolean';
      inputBox_type: 'number' | 'color' | 'checkbox';
      pipe: (val: any) => any;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      lable: string;
      key: PossibleKeysOfObject;
      val_type: 'string';
      inputBox_type: 'choose';
      options: string[];
      pipe: (val: any) => any;
    };

export type Project = {
  id: string;
  background: string;
  objects: string;
  version: string;
  user: string;
  width: number;
  height: number;
  members: string[];
  promotional?: boolean;
};

export type SocketEmitEvents =
  | 'room:join'
  | 'room:leave'
  | 'objects'
  | 'objects:modified'
  | 'mouse:move';
export type SocketOnEvents =
  | 'room:joined'
  | 'room:left'
  | 'objects'
  | 'objects:modified'
  | 'mouse:move'
  | 'disconnect'
  | 'connect';

// export type project = {
//   id: string;
//   version: string;
//   background: string;
//   objects:  Object[]|string;
// };
