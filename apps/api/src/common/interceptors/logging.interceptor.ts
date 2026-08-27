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
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            `[${method}] ${originalUrl} ${statusCode} - ${duration}ms (IP: ${ip}, UA: ${userAgent})`
          );
        },
        error: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode || 500;
          this.logger.warn(
            `[${method}] ${originalUrl} ${statusCode} [FAILED] - ${duration}ms (IP: ${ip})`
          );
        },
      })
    );
  }
}
