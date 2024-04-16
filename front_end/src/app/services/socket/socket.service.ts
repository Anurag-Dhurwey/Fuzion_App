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
  constructor() {}

  connect() {
    if (!this.socket?.connected) {
      // this.socket = io('http://localhost:3000');
      this.socket = io('https://fabric-app-server.onrender.com');
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



