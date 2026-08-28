import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const requestId = (req as any).requestId || req.headers['x-request-id'] || 'no-request-id';
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId || null;
    const userId = (req as any).user?.id || null;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          const logPayload = {
            timestamp: new Date().toISOString(),
            requestId,
            tenantId,
            userId,
            method,
            url: originalUrl,
            statusCode,
            durationMs: duration,
            clientIp: ip,
            userAgent,
          };
          this.logger.log(JSON.stringify(logPayload));
        },
        error: (err: any) => {
          const duration = Date.now() - startTime;
          const statusCode = err?.status || res.statusCode || 500;
          const logPayload = {
            timestamp: new Date().toISOString(),
            requestId,
            tenantId,
            userId,
            method,
            url: originalUrl,
            statusCode,
            durationMs: duration,
            clientIp: ip,
            error: err?.message || 'Request execution error',
          };
          this.logger.warn(JSON.stringify(logPayload));
        },
      })
    );
  }
}
