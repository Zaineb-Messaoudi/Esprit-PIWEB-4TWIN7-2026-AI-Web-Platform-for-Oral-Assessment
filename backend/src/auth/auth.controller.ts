import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone: string;
      dateOfBirth: string;
      role: 'student' | 'instructor' | 'admin';
    },
  ) {
    return this.authService.register({
      ...body,
      dateOfBirth: new Date(body.dateOfBirth),
    });
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}