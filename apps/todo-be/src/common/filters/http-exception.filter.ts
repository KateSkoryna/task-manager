import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OperationException } from '../errors/operation.exception';

type LoggableRequest = Request & {
  id?: string;
  log?: { error: (obj: Record<string, unknown>, msg?: string) => void };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<LoggableRequest>();
    const requestId = request?.id;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const payload = typeof body === 'string' ? { message: body } : body;
      response.status(exception.getStatus()).json({ ...payload, requestId });
      return;
    }
    if (exception instanceof OperationException) {
      request?.log?.error({ err: exception }, exception.publicMessage);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: exception.publicMessage,
        error: exception.message,
        requestId,
      });
      return;
    }
    request?.log?.error({ err: exception }, 'Unhandled exception');
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      requestId,
    });
  }
}
