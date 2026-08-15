import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  type SocketMiddleware = (
    socket: Socket,
    next: (error?: Error) => void,
  ) => void;

  const jwt = { verifyAsync: jest.fn() };
  const auth = { findById: jest.fn() };
  let middleware: SocketMiddleware;
  const use = jest.fn((candidate: SocketMiddleware) => {
    middleware = candidate;
  });
  const roomEmit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit: roomEmit });
  const server = { use, to } as unknown as Server;
  const gateway = new RealtimeGateway(
    jwt as unknown as JwtService,
    auth as unknown as AuthService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.afterInit(server);
  });

  it('authenticates the handshake token and current user session', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', sessionVersion: 3 });
    auth.findById.mockResolvedValue({
      id: 'user-1',
      role: { name: 'waiter' },
    });
    const client = {
      handshake: { auth: { token: 'valid-token' } },
      data: {},
    } as unknown as Socket;

    await runHandshake(middleware, client);

    expect(jwt.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(auth.findById).toHaveBeenCalledWith('user-1', 3);
    expect(client.data).toEqual({ userId: 'user-1', role: 'waiter' });
  });

  it('rejects invalid or expired tokens', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('expired'));
    const client = {
      handshake: { auth: { token: 'expired-token' } },
      data: {},
    } as unknown as Socket;

    await expect(runHandshake(middleware, client)).rejects.toThrow(
      'Unauthorized',
    );
    expect(auth.findById).not.toHaveBeenCalled();
  });

  it('joins the authenticated role room', () => {
    const join = jest.fn();
    const client = {
      data: { role: 'kitchen' },
      join,
      disconnect: jest.fn(),
    } as unknown as Socket;

    gateway.handleConnection(client);

    expect(join).toHaveBeenCalledWith('role:kitchen');
  });

  it('emits sensitive events only to their authorized role rooms', () => {
    gateway.emit('payment.created', { id: 'payment-1' });

    expect(to).toHaveBeenCalledWith(['role:admin', 'role:waiter']);
    expect(roomEmit).toHaveBeenCalledWith('payment.created', {
      id: 'payment-1',
    });
  });
});

async function runHandshake(
  middleware: (socket: Socket, next: (error?: Error) => void) => void,
  client: Socket,
) {
  await new Promise<void>((resolve, reject) => {
    middleware(client, (error) => (error ? reject(error) : resolve()));
  });
}
