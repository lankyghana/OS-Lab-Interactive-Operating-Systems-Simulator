import { Body, Controller, Get, Module, ParseIntPipe, Post, Query, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { clientTimestamp } from '../common/dates';

export const MODULE_IDS = ['process', 'cpu', 'memory', 'paging', 'disk'] as const;
export type ModuleIdValue = (typeof MODULE_IDS)[number];

class RecordSimulationDto {
  @IsIn(MODULE_IDS)
  module: ModuleIdValue;

  @IsString()
  @MaxLength(40)
  algorithm: string;

  @IsIn(['visual', 'text', 'compare'])
  mode: 'visual' | 'text' | 'compare';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  summary?: string;

  @IsOptional()
  @IsISO8601()
  at?: string;
}

@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async record(@CurrentUser() u: AuthUser, @Body() dto: RecordSimulationDto) {
    const run = await this.prisma.simulationRun.create({
      data: { userId: u.id, module: dto.module, algorithm: dto.algorithm, mode: dto.mode, summary: dto.summary, createdAt: clientTimestamp(dto.at) },
    });
    return { id: run.id };
  }

  @Get()
  async list(@CurrentUser() u: AuthUser, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const runs = await this.prisma.simulationRun.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return runs.map((r) => ({ module: r.module, algorithm: r.algorithm, mode: r.mode, summary: r.summary ?? undefined, at: r.createdAt.toISOString() }));
  }
}

@Module({ controllers: [SimulationsController] })
export class SimulationsModule {}
