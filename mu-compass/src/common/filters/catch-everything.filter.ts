import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception instanceof Error
        ? exception.message
        : typeof exception === 'string'
          ? exception
          : JSON.stringify(exception);

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const isDevelopment = process.env.NODE_ENV === 'development';

    const responseBody = {
      status: 'error',
      statusCode: httpStatus,
      message: errorMessage,
      ...(isDevelopment &&
        exception instanceof Error && { stack: exception.stack }),
      ...(errorResponse && { details: errorResponse }),
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    // Log the error in production
    if (!isDevelopment) {
      console.error('Unhandled Exception:', exception);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
