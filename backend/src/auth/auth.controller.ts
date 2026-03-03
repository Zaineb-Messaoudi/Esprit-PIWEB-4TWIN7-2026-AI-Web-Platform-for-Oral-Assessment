import { Controller, Post, Body, UnauthorizedException,Get, UseGuards, 
  Request, 
  Res, } from '@nestjs/common';
//                          ^^^^  Assure-toi que Body est ici !
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; // Vérifie que le chemin est correct
import { AuthGuard } from '@nestjs/passport';
// Remplacer l'import simple par un import namespace
import * as express from 'express'; 

@Controller('auth')
export class AuthController {
    constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // Route pour créer un utilisateur de TEST
  @Post('register')
  async register(@Body() body: any) {
    return this.usersService.create(body);
  }

  // Route Login Classique
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.authService.login(user);
  }

  
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req: any) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req: any, @Res() res: any) {
    try {
      // Si l'utilisateur existe déjà
      const result = await this.authService.login(req.user);
      return res.redirect(`http://localhost:5173/login-success?token=${result.access_token}`);
    } catch (error: any) {
      // Si l'utilisateur est nouveau (Erreur USER_NOT_FOUND jetée par le service)
      const socialData = error.response?.socialInfo;
      const dataStr = encodeURIComponent(JSON.stringify(socialData));
      return res.redirect(`http://localhost:5173/complete-profile?data=${dataStr}`);
    }
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Request() req: any) {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Request() req: any, @Res() res: any) { // Utiliser express.Response
    try {
      const result = await this.authService.login(req.user);
      return res.redirect(`http://localhost:5173/login-success?token=${result.access_token}`);
    } catch (error: any) {
      const socialData = error.response?.socialInfo;
      if (socialData) {
        const dataStr = encodeURIComponent(JSON.stringify(socialData));
        return res.redirect(`http://localhost:3001/complete-profile?data=${dataStr}`);
      }
      return res.redirect('http://localhost:3001/login?error=auth_failed');
    }
  }

}