import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByLoginId(loginId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { loginId },
    });
  }

  async findByEmailOrLoginId(
    email?: string,
    loginId?: string,
  ): Promise<User | null> {
    if (email) {
      return this.findByEmail(email);
    }
    if (loginId) {
      return this.findByLoginId(loginId);
    }
    return null;
  }
}
