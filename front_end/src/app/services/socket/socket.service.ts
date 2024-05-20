// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {
  Fab_Objects,
  Position,
  // Project,
  // SocketEmitEvents,
  // SocketOnEvents,
} from '../../../types/app.types';
import { environment } from '../../../../environment';
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket | undefined;
  presense: Presense[] = [];
  presense_status = {
    on: true,
    emit: true,
  };
  constructor() {}

  connect(id: string, email?: string | null) {
    if (!this.socket?.connected && environment?.socket_url) {
      this.socket = io(environment.socket_url, { query: { id, email } });
    } else if (!environment?.socket_url) {
      console.error('environment.socket_url is undefind');
    }
  }

  // Emit an event to the server
  // emit(event: SocketEmitEvents, data: any) {
  //   this.socket?.emit(event, data);
  // }

  // Listen for events from the server
  // on(event: SocketOnEvents, callback: (data: any) => void) {
  //   this.socket?.on(event, callback);
  // }

  on = {
    mouse_move: (
      callback: (data: { _id: string; position: Position }) => void
    ) => {
      this.socket?.on('mouse:move', callback);
    },
    object_modified: (
      callback: (
        data: Fab_Objects | string | Fab_Objects[],
        method: object_modified_method
      ) => void
    ) => {
      this.socket?.on('objects:modified', callback);
    },
  };

  emit = {
    room_join: (roomId: string) => {
      this.socket?.emit('room:join', roomId);
    },
    object_modified: (
      roomId: string,
      objects: Fab_Objects | Fab_Objects[],
      method: object_modified_method
    ) => {
      if (!Array.isArray(objects)) {
        objects = [objects];
      }
      const toObj = objects.map((obj) => obj.toObject(['_id', 'type']));
      toObj.length > 1 &&
        toObj.forEach((obj) => {
          const found = (objects as Fab_Objects[]).find(
            (fo) => fo._id === obj._id
          );
          obj.left = found?.calcTransformMatrix()[4];
          obj.top = found?.calcTransformMatrix()[5];
        }); 
      this.socket?.emit('objects:modified', { roomId, objects:toObj, method });
    },
    mouse_move: (roomId: string, position: Position) => {
      this.socket?.emit('mouse:move', { position, roomId });
    },
    room_leave: (roomId: string) => {
      this.socket?.emit('room:leave', roomId);
    },
  };
}

export type object_modified_method =
  | 'push'
  | 'reset'
  | 'popAndPush'
  | 'replace'
  | 'delete';
export type Presense = fabric.Rect & { expiry: number; _id: string };
