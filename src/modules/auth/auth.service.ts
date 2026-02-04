import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, TokenResponseDto } from './dto/login.dto';

interface JwtPayload {
  sub: string;
  email?: string;
  loginId?: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmailOrLoginId(
      identifier.includes('@') ? identifier : undefined,
      !identifier.includes('@') ? identifier : undefined,
    );

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, loginId, password } = loginDto;

    if (!email && !loginId) {
      throw new UnauthorizedException('Email or Login ID is required');
    }

    const identifier = email || loginId || '';
    const user = await this.validateUser(identifier, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: User): TokenResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      loginId: user.loginId || undefined,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '1d';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const accessToken = this.jwtService.sign(payload);

    const refreshOptions: JwtSignOptions = {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    };
    const refreshToken = this.jwtService.sign(payload, refreshOptions);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
