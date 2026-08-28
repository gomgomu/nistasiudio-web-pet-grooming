import { Logger } from '@nestjs/common';

export interface ErrorReportContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  url?: string;
  method?: string;
  ip?: string;
  statusCode?: number;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface ErrorTrackerHook {
  captureException(error: Error | unknown, context?: ErrorReportContext): Promise<void> | void;
}

export class DefaultErrorTracker implements ErrorTrackerHook {
  private readonly logger = new Logger('ErrorTracker');
  private hooks: ErrorTrackerHook[] = [];

  registerHook(hook: ErrorTrackerHook) {
    this.hooks.push(hook);
  }

  async captureException(error: Error | unknown, context?: ErrorReportContext): Promise<void> {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || 'unknown',
      tenantId: context?.tenantId || 'unknown',
      userId: context?.userId || 'anonymous',
      path: `${context?.method || 'GET'} ${context?.url || '/'}`,
      statusCode: context?.statusCode || 500,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    // Structured JSON log for error indexing/ELK/CloudWatch
    this.logger.error(`[CRITICAL_ERROR] ${JSON.stringify(errorDetails)}`);

    for (const hook of this.hooks) {
      try {
        await hook.captureException(error, context);
      } catch (err: any) {
        this.logger.warn(`Error hook failed: ${err.message}`);
      }
    }
  }
}

export const globalErrorTracker = new DefaultErrorTracker();
