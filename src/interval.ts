/**
 * @fileoverview This file contains the Interval class.
 */

/**
 * Represents an interval within a training activity,
 * for example, a set of sprints within a run.
 */
export class Interval {
    private ifDone: boolean = false

  constructor(
    public description: string,
    public duration: number, // in minutes
    public intensity: string, // e.g., "High", "Low", "Race Pace"
    public repetitions: number
  ) {}
  markAsDone() {
    this.ifDone = true;
  }
  markAsUndone() {
    this.ifDone = false;
  }
  isDone(): boolean {
    return this.ifDone;
  }

}