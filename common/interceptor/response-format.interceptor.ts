import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: '요청이 성공적으로 처리되었습니다.',
        data,
        meta: {
          path: context.switchToHttp().getRequest().url,
          timestamp: new Date().toLocaleTimeString(),
          responseTime: `${Date.now() - now}ms`,
        },
      })),
    );
  }
}
