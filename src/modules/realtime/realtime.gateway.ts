import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsOrigins } from 'src/shared/config/cors.config';
import { AuthService } from '../auth/auth.service';

type StaffRole = 'admin' | 'kitchen' | 'waiter' | 'host';
type RealtimeJwtPayload = {
  sub: string;
  sessionVersion: number;
};
type RealtimeSocketData = {
  userId?: string;
  role?: string;
};

const EVENT_ROLES: Record<string, readonly StaffRole[]> = {
  'order.created': ['admin', 'kitchen', 'waiter'],
  'order.updated': ['admin', 'kitchen', 'waiter'],
  'order.deleted': ['admin', 'kitchen', 'waiter'],
  'payment.created': ['admin', 'waiter'],
  'inventory.created': ['admin', 'kitchen'],
  'inventory.updated': ['admin', 'kitchen'],
  'inventory.entry': ['admin', 'kitchen'],
  'inventory.output': ['admin', 'kitchen'],
  'kitchen.created': ['admin', 'kitchen'],
  'kitchen.updated': ['admin', 'kitchen'],
  'reservation.created': ['admin', 'host', 'waiter'],
  'reservation.updated': ['admin', 'host', 'waiter'],
  'reservation.deleted': ['admin', 'host', 'waiter'],
  'table.created': ['admin', 'kitchen', 'waiter', 'host'],
  'table.updated': ['admin', 'kitchen', 'waiter', 'host'],
  'table.deleted': ['admin', 'kitchen', 'waiter', 'host'],
};

const roleRoom = (role: string) => `role:${role}`;

@WebSocketGateway({
  cors: { origin: getCorsOrigins(), credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server?: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    server.use((client, next) => {
      void this.authenticate(client)
        .then(() => next())
        .catch(() => next(new Error('Unauthorized')));
    });
  }

  handleConnection(client: Socket) {
    const { role } = client.data as RealtimeSocketData;
    if (!role) {
      client.disconnect(true);
      return;
    }
    void client.join(roleRoom(role));
  }

  emit(event: string, payload: unknown) {
    const roles = EVENT_ROLES[event] ?? ['admin'];
    this.server?.to(roles.map(roleRoom)).emit(event, payload);
  }

  private async authenticate(client: Socket) {
    const handshakeAuth = client.handshake.auth as unknown as {
      token?: unknown;
    };
    const token = handshakeAuth.token;
    if (typeof token !== 'string' || !token) {
      throw new Error('Unauthorized');
    }

    const payload =
      await this.jwtService.verifyAsync<RealtimeJwtPayload>(token);
    const user = await this.authService.findById(
      payload.sub,
      payload.sessionVersion,
    );
    if (!user?.role?.name) {
      throw new Error('Unauthorized');
    }

    const data = client.data as RealtimeSocketData;
    data.userId = user.id;
    data.role = user.role.name;
  }
}
