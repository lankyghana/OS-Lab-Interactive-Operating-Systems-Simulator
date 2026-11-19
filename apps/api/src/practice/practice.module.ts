import { Body, Controller, Get, Module, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsInt, IsISO8601, IsObject, IsOptional, Max, Min } from 'class-validator';
import type { Difficulty, ExerciseKind } from '@os-lab/engine';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { clientTimestamp } from '../common/dates';
import { MODULE_IDS, type ModuleIdValue } from '../simulations/simulations.module';
import { DIFFICULTIES, KINDS, PracticeService } from './practice.service';

class ExerciseAttemptDto {
  @IsIn(KINDS)
  kind: ExerciseKind;

  @IsIn(DIFFICULTIES)
  difficulty: Difficulty;

  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  seed: number;

  @IsObject()
  answers: Record<string, unknown>;

  @IsOptional()
  @IsISO8601()
  at?: string;
}

class QuizAttemptDto {
  @IsIn(MODULE_IDS)
  module: ModuleIdValue;

  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsInt()
  @Min(1)
  @Max(100)
  total: number;

  @IsOptional()
  @IsISO8601()
  at?: string;
}

@Controller('practice')
export class PracticeController {
  constructor(
    private readonly practice: PracticeService,
    private readonly prisma: PrismaService,
  ) {}

  /** Public: fetch a generated exercise (answers withheld). */
  @Get('exercises/:kind/:seed')
  exercise(@Param('kind') kind: ExerciseKind, @Param('seed', ParseIntPipe) seed: number, @Query('difficulty') difficulty: Difficulty = 'medium') {
    return this.practice.publicExercise(kind, seed, difficulty);
  }

  /** Grades on the server from (kind, difficulty, seed) — scores sent by clients are never trusted. */
  @Post('exercises/attempts')
  @UseGuards(JwtAuthGuard)
  async attempt(@CurrentUser() u: AuthUser, @Body() dto: ExerciseAttemptDto) {
    const { answers, grade } = this.practice.grade(dto.kind, dto.seed, dto.difficulty, dto.answers);
    await this.prisma.exerciseAttempt.create({
      data: {
        userId: u.id,
        kind: dto.kind,
        difficulty: dto.difficulty,
        seed: dto.seed,
        answers,
        correct: grade.correct,
        total: grade.total,
        score: grade.score,
        createdAt: clientTimestamp(dto.at),
      },
    });
    return grade;
  }

  @Post('quizzes/attempts')
  @UseGuards(JwtAuthGuard)
  async quiz(@CurrentUser() u: AuthUser, @Body() dto: QuizAttemptDto) {
    const score = Math.min(dto.score, dto.total);
    const q = await this.prisma.quizAttempt.create({ data: { userId: u.id, module: dto.module, score, total: dto.total, createdAt: clientTimestamp(dto.at) } });
    return { id: q.id };
  }
}

@Module({ controllers: [PracticeController], providers: [PracticeService] })
export class PracticeModule {}
