import { Interval } from './interval';

/**
 * @fileoverview This file contains the core data models for training activities.
 */

/**
 * Represents a single training activity with a date, description, and discipline.
 */
export abstract class TrainingActivity {
  date: Date;
  description: string;
  discipline: string;
  plannedDuration: number; // in minutes
  intervals: Interval[]=[];
  private done: boolean = false;

  isDone(): boolean {
    return this.done;
  }

  markAsDone() {
    this.done = true;
  }
  markAsUndone() {
    this.done = false;
  }

  constructor(date: Date, description: string, discipline: string, plannedDuration: number) {
    this.date = date;
    this.description = description;
    this.discipline = discipline;
    this.plannedDuration = plannedDuration;
  }
}

/**
 * Represents a running activity, inheriting from TrainingActivity.
 * It automatically sets the discipline to "Running" and adds a distance property.
 */
export class Running extends TrainingActivity {
  constructor(public date: Date, public description: string, public plannedDuration: number, public distance: number) {
    super(date, description, "Running", plannedDuration);
  }
}

export class Cycling extends TrainingActivity {
  constructor(public date: Date, public description: string, public plannedDuration: number, public distance: number) {
    super(date, description, "Cycling", plannedDuration);
  }
}

export class Swimming extends TrainingActivity {
  constructor(public date: Date, public description: string, public plannedDuration: number, public distance: number) {
    super(date, description, "Swimming", plannedDuration);
  }
}