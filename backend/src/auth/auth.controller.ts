// backend/src/auth/auth.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup') // Rota: POST http://localhost:3000/auth/signup
  signUp(@Body() dto: CreateUserDto) {
    // O @Body() pega o corpo da requisição e o Nest valida usando o DTO.
    return this.authService.signUp(dto);
  }
}