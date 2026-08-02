import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:4200', credentials: true } })
export class RealtimeGateway {
  @WebSocketServer()
  private server?: Server;

  emit(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
