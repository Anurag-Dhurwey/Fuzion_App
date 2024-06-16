// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { fabric } from 'fabric';
import {
  Fab_Objects,
  FabObjectsPropertiesOnly,
  Position,
  Project,
  // Project,
  // SocketEmitEvents,
  // SocketOnEvents,
} from '../../../types/app.types';
import { environment } from '../../../../environment';
import { propertiesToInclude } from '../../constants';
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

  connect(
    id: string,
    email: string,
    cbs?: {
      onConnect?: () => void;
      onProject?: (data: Project) => void;
    }
  ) {
    if (!this.socket?.connected && environment?.socket_url) {
      this.socket = io(environment.socket_url, { query: { id, email } });
      this.socket.on('connect', () => {
        this.emit.project(id);
        cbs?.onConnect && cbs.onConnect();
      });
      this.socket.on('project', (data: Project) => {
        cbs?.onProject && cbs.onProject(data);
      });
    } else if (!environment?.socket_url) {
      console.error('environment.socket_url is undefind');
    }
  }

  on = {
    // connect:(cb:()=>void)=>{
    //   this.socket?.on('connect',cb)
    // },
    objects: (cb: (data: string) => void) => {
      this.socket?.on('objects', cb);
    },
    // project:(cb:(data:Project)=>void)=>{
    //   this.socket?.on('project', cb);
    // },
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
    set_object_property: (
      cb: (_id: string, property: FabObjectsPropertiesOnly) => void
    ) => {
      this.socket?.on('set:object:property', cb);
    },
    saveObjectsToDB_succeeded: (cb: (roomId: string) => void) => {
      this.socket?.on('saveObjectsToDB:succeeded', cb);
    },
    saveObjectsToDB_failed: (cb: (roomId: string) => void) => {
      this.socket?.on('saveObjectsToDB:failed', cb);
    },
  };

  emit = {
    room_join: (roomId: string) => {
      this.socket?.emit('room:join', roomId);
    },
    room_leave: (roomId: string) => {
      this.socket?.emit('room:leave', roomId);
    },
    objects: (projectId: string) => {
      this.socket?.emit('objects', projectId);
    },
    project: (projectId: string) => {
      this.socket?.emit('project', projectId);
    },
    object_modified: (
      roomId: string,
      objects: Fab_Objects | Fab_Objects[],
      method: object_modified_method
    ) => {
      if (!Array.isArray(objects)) {
        objects = [objects];
      }
      objects = objects.map((obj) => obj.toObject(propertiesToInclude));
      this.socket?.emit('objects:modified', { roomId, objects, method });
    },
    set_object_property: (
      roomId: string,
      _id: string,
      property: FabObjectsPropertiesOnly
    ) => {
      this.socket?.emit('set:object:property', roomId, _id, property);
    },
    saveObjectsToDB_succeeded: (projectId: string) => {
      this.socket?.emit('saveObjectsToDB:succeeded', projectId);
    },
    saveObjectsToDB_failed: (projectId: string) => {
      this.socket?.emit('saveObjectsToDB:failed', projectId);
    },
    mouse_move: (roomId: string, position: Position) => {
      this.socket?.emit('mouse:move', { position, roomId });
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
