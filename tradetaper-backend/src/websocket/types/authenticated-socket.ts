import { Socket } from 'socket.io';

/**
 * Extended Socket interface with authenticated user information
 * The user property is added by WsJwtAdapter after JWT validation
 */
export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role?: string;
  };
}
