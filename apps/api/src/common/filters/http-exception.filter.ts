import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { globalErrorTracker } from '../observability/error-tracker';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    const requestId = (request as any)?.requestId || request?.headers?.['x-request-id'] || 'unknown';
    const tenantId = (request as any)?.tenant?.id || (request as any)?.user?.tenantId || undefined;
    const userId = (request as any)?.user?.id || undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorCode = HttpStatus[status] || 'HTTP_EXCEPTION';
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;
        errorCode = (resObj.error as string) || HttpStatus[status] || 'HTTP_EXCEPTION';
        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          details = resObj.message;
        } else if (resObj.details) {
          details = resObj.details;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception at ${request.method} ${request.url}: ${exception.stack}`);
    }

    if (status >= 500) {
      this.logger.error(`[${status}] ${request.method} ${request.url} - Error: ${message} (Request-ID: ${requestId})`);
      // Dispatch to Error Tracking hooks for external alerting
      globalErrorTracker.captureException(exception, {
        requestId,
        tenantId,
        userId,
        url: request.url,
        method: request.method,
        ip: request.ip,
        statusCode: status,
      });
    } else {
      this.logger.warn(`[${status}] ${request.method} ${request.url} - Client Error: ${message} (Request-ID: ${requestId})`);
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        requestId,
        ...(details ? { details } : {}),
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
