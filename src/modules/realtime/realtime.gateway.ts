import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { getCorsOrigins } from 'src/shared/config/cors.config';

@WebSocketGateway({
  cors: { origin: getCorsOrigins(), credentials: true },
})
export class RealtimeGateway {
  @WebSocketServer()
  private server?: Server;

  emit(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
