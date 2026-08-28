import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incomingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
    const requestId = (typeof incomingId === 'string' && incomingId.trim() !== '')
      ? incomingId
      : randomUUID();

    // Attach to request for controllers and interceptors
    (req as any).requestId = requestId;
    req.headers['x-request-id'] = requestId;

    // Echo back in response header
    res.setHeader('x-request-id', requestId);

    next();
  }
}
