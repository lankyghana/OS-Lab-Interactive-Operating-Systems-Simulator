import { BadRequestException, Body, Controller, Get, Module, Param, Put, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

const RESOURCE_ID = /^[a-z0-9-]{1,60}$/;

class MarkResourceDto {
  @IsOptional()
  @IsBoolean()
  saved?: boolean;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('marks')
  async marks(@CurrentUser() u: AuthUser) {
    const rows = await this.prisma.resourceMark.findMany({ where: { userId: u.id } });
    return {
      saved: rows.filter((r) => r.saved).map((r) => r.resourceId),
      completed: rows.filter((r) => r.completed).map((r) => r.resourceId),
    };
  }

  /** Sets saved and/or completed for one resource; fields left out are unchanged. */
  @Put(':id')
  async mark(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: MarkResourceDto) {
    if (!RESOURCE_ID.test(id)) throw new BadRequestException('Invalid resource.');
    if (dto.saved === undefined && dto.completed === undefined) throw new BadRequestException('Nothing to update.');
    const row = await this.prisma.resourceMark.upsert({
      where: { userId_resourceId: { userId: u.id, resourceId: id } },
      create: { userId: u.id, resourceId: id, saved: dto.saved ?? false, completed: dto.completed ?? false },
      update: { ...(dto.saved !== undefined && { saved: dto.saved }), ...(dto.completed !== undefined && { completed: dto.completed }) },
    });
    return { id, saved: row.saved, completed: row.completed };
  }
}

@Module({ controllers: [ResourcesController] })
export class ResourcesModule {}
