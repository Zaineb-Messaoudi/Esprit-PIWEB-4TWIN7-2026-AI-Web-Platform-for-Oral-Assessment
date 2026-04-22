import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    console.log('AUTH HEADER:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    console.log('JWT ERROR:', err);
    console.log('JWT INFO:', info);
    console.log('JWT USER:', user);
    return super.handleRequest(err, user, info, context);
  }
}
