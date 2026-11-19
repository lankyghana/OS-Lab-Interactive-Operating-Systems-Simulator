import { Controller, Delete, Get, HttpCode, Module, Param, Post, Put, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

const SLUG = /^[a-z0-9-]{1,60}$/;
const FAV = /^[a-z]+:[A-Z_]{1,20}$/;

@Controller()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the dashboard and My Progress page need, in the client's ProgressState shape. */
  @Get('progress')
  async summary(@CurrentUser() u: AuthUser) {
    const [simulations, exercises, quizzes, topics, favourites, marks] = await Promise.all([
      this.prisma.simulationRun.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 500 }),
      this.prisma.exerciseAttempt.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 500 }),
      this.prisma.quizAttempt.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 200 }),
      this.prisma.topicProgress.findMany({ where: { userId: u.id } }),
      this.prisma.favourite.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'asc' } }),
      this.prisma.resourceMark.findMany({ where: { userId: u.id } }),
    ]);
    return {
      simulations: simulations.map((r) => ({ module: r.module, algorithm: r.algorithm, mode: r.mode, summary: r.summary ?? undefined, at: r.createdAt.toISOString() })),
      exercises: exercises.map((e) => ({ id: `${e.kind}-${e.difficulty}-${e.seed}`, kind: e.kind, difficulty: e.difficulty, score: e.score, at: e.createdAt.toISOString() })),
      quizzes: quizzes.map((q) => ({ module: q.module, score: q.score, total: q.total, at: q.createdAt.toISOString() })),
      topicsRead: topics.map((t) => t.slug),
      favourites: favourites.map((f) => f.key),
      savedResources: marks.filter((m) => m.saved).map((m) => m.resourceId),
      completedResources: marks.filter((m) => m.completed).map((m) => m.resourceId),
    };
  }

  @Post('progress/topics/:slug')
  @HttpCode(204)
  async markRead(@CurrentUser() u: AuthUser, @Param('slug') slug: string) {
    if (!SLUG.test(slug)) throw new BadRequestException('Invalid topic.');
    await this.prisma.topicProgress.upsert({ where: { userId_slug: { userId: u.id, slug } }, create: { userId: u.id, slug }, update: {} });
  }

  @Put('favourites/:key')
  @HttpCode(204)
  async addFavourite(@CurrentUser() u: AuthUser, @Param('key') key: string) {
    if (!FAV.test(key)) throw new BadRequestException('Invalid favourite.');
    await this.prisma.favourite.upsert({ where: { userId_key: { userId: u.id, key } }, create: { userId: u.id, key }, update: {} });
  }

  @Delete('favourites/:key')
  @HttpCode(204)
  async removeFavourite(@CurrentUser() u: AuthUser, @Param('key') key: string) {
    await this.prisma.favourite.deleteMany({ where: { userId: u.id, key } });
  }
}

@Module({ controllers: [ProgressController] })
export class ProgressModule {}
