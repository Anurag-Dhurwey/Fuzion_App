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
  _objects: Object[];
  type: 'group';
  isMinimized?: boolean;
  _id: string;
};

export type Object = (
  | (fabric.Path & { isPathClosed?: boolean; type: 'path' })
  | (fabric.Line & { type: 'line' })
  | (fabric.Rect & { type: 'rect' })
  | (fabric.Circle & { type: 'circle' })
  | (fabric.Image & { type: 'image' })
  | (fabric.IText & { type: 'i-text' })
  | Group
) & {
  _id: string;
};

export type Position = { x: number; y: number };
// export type Presense = { id: string; mouse: Position; expire: number };

export type CommonProperty<Type> = {
  title: 'Position'|'Stroke' | 'Size' | 'Fill' | 'Flip' | 'Others'|'Corners';
  keys: Keys<Type>[];
  buttons?: {
    add: (keys: Keys<fabric.Object>[]) => void;
    remove: (keys: Keys<fabric.Object>[]) => void;
  };
};

export interface Keys<Type> {
  lable: string;
  key: keyof Type;
  val_type: string;
  inputBox_type: string;
  pipe: (val: any) => any;
  min?: number;
  max?: number;
  step?: number;
}

export type Project = {
  id: string;
  background: string;
  objects: string;
  version: string;
  user: string;
  width: number;
  height: number;
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
