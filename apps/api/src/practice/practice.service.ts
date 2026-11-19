import { BadRequestException, Injectable } from '@nestjs/common';
import { generateExercise, gradeExercise, type Difficulty, type Exercise, type ExerciseKind } from '@os-lab/engine';

export const KINDS: ExerciseKind[] = ['cpu', 'memory', 'paging', 'disk'];
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Exercise generation and grading, delegated to the shared simulation engine. */
@Injectable()
export class PracticeService {
  /** The exercise without its answers, for clients that fetch exercises from the server. */
  publicExercise(kind: ExerciseKind, seed: number, difficulty: Difficulty) {
    const ex = this.generate(kind, seed, difficulty);
    return { ...ex, questions: ex.questions.map(({ answer: _answer, ...q }) => q) };
  }

  generate(kind: ExerciseKind, seed: number, difficulty: Difficulty): Exercise {
    if (!KINDS.includes(kind)) throw new BadRequestException('Unknown exercise kind.');
    if (!DIFFICULTIES.includes(difficulty)) throw new BadRequestException('Unknown difficulty.');
    if (!Number.isInteger(seed) || seed < 0 || seed > 1_000_000_000) throw new BadRequestException('Invalid seed.');
    return generateExercise(kind, seed, difficulty);
  }

  grade(kind: ExerciseKind, seed: number, difficulty: Difficulty, answers: Record<string, unknown>) {
    const ex = this.generate(kind, seed, difficulty);
    const clean: Record<string, string | number | null> = {};
    for (const q of ex.questions) {
      const v = answers?.[q.key];
      clean[q.key] = typeof v === 'number' || typeof v === 'string' ? v : null;
    }
    return { exercise: ex, answers: clean, grade: gradeExercise(ex, clean) };
  }
}
