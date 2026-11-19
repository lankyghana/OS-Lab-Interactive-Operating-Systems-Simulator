import { describe, expect, it } from 'vitest';
import { PracticeService } from '../src/practice/practice.service';

describe('PracticeService', () => {
  const svc = new PracticeService();

  it('grades from the seed, ignoring anything the client claims', () => {
    const ex = svc.generate('paging', 42, 'medium');
    const right = Object.fromEntries(ex.questions.map((q) => [q.key, q.answer]));
    expect(svc.grade('paging', 42, 'medium', right).grade.score).toBe(100);
    expect(svc.grade('paging', 42, 'medium', { faults: -1, score: 100 }).grade.score).toBe(0);
  });

  it('never leaks answers in public exercises', () => {
    const ex = svc.publicExercise('cpu', 7, 'hard');
    expect(ex.questions.every((q) => !('answer' in q))).toBe(true);
  });

  it('rejects bad input', () => {
    expect(() => svc.generate('nope' as never, 1, 'easy')).toThrow();
    expect(() => svc.generate('cpu', -1, 'easy')).toThrow();
  });
});
