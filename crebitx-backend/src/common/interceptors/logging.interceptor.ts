import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '@/common/services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const requestId = headers['x-request-id'] || uuidv4();

    // Attach request ID to request object
    request.requestId = requestId;

    const now = Date.now();

    this.logger.log(
      `➡️  ${method} ${url} - ${ip} - ${userAgent}`,
      'HTTP',
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        this.logger.log(
          `⬅️  ${method} ${url} ${statusCode} - ${responseTime}ms`,
          'HTTP',
        );
      }),
    );
  }
}
