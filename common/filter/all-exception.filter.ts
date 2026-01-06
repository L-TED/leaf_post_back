import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { normalizeHttpException } from './normalize';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const isHttp = err instanceof HttpException;
    const statusCode = isHttp
      ? err.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = isHttp
      ? normalizeHttpException(err)
      : { message: '서버 내부 오류', errors: undefined };

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      path: req.url,
      timestamp: new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false, // 24시간 형식
      }),
    });
  }
}
