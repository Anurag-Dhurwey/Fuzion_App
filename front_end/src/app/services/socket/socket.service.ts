// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Presense, SocketEmitEvents, SocketOnEvents } from '../../../types/app.types';
import { environment } from '../../../../environment';
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket | undefined;
  presense: Presense[] = [];
  constructor() {}

  connect(id:string,email?:string|null) {
    if (!this.socket?.connected&&environment.socket_url) {
      this.socket = io(environment.socket_url,{query:{id,email}});
    }else if(!environment.socket_url){
      console.error('environment.socket_url is undefind')
    }
  }

  // Emit an event to the server
  emit(event: SocketEmitEvents, data: any) {
    this.socket?.emit(event, data);
  }

  // Listen for events from the server
  on(event: SocketOnEvents, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }
}



