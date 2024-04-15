// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Presense, SocketEmitEvents, SocketOnEvents } from '../../../types/app.types';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket | undefined;
  presense: Presense[] = [];
  socket_url=import.meta.env['NG_APP_socket_url']
  constructor() {}

  connect() {
    if (!this.socket?.connected) {
      this.socket = io(`${this.socket_url}`)
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



