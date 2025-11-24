/**
 * @fileoverview This file contains the TrainingPlan class and its persistence logic.
 */

import * as path from 'path';
import * as fs from 'fs';
import { Interval } from './interval';
import { TrainingActivity, Running, Cycling, Swimming } from './training-activity';

export class TrainingPlan {
  activities: TrainingActivity[] = [];

  addActivity(activity: TrainingActivity) {
    this.activities.push(activity);
    this.activities.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Saves the current training plan to a JSON file.
   */
  save(username: string, planName: string): void {
    const dir = path.join('data', 'users', username, 'plans');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dataFilePath = path.join(dir, `${planName}.json`);
    // Serialize activities to a plain JSON object, including distance for relevant types
    const activitiesToSave = this.activities.map(activity => {
      const plainActivity: any = {
        date: activity.date.toISOString(),
        description: activity.description,
        discipline: activity.discipline,
        plannedDuration: activity.plannedDuration,
        done: activity.isDone(),
        intervals: activity.intervals.map(interval => ({
          description: interval.description,
          duration: interval.duration,
          intensity: interval.intensity,
          repetitions: interval.repetitions,
          done: interval.isDone(),
        })),
      };
      if (activity instanceof Running || activity instanceof Cycling || activity instanceof Swimming) {
        plainActivity.distance = activity.distance;
      }
      return plainActivity;
    });
    const json = JSON.stringify(activitiesToSave, null, 2); // Pretty-print JSON
    fs.writeFileSync(dataFilePath, json);
  }

  /**
   * Loads the training plan from a JSON file.
   * @returns The loaded training plan, or an empty TrainingPlan if the file does not exist or if there is an error.
   */
  static load(username: string, planName: string): TrainingPlan {
    const plan = new TrainingPlan();
    const dataFilePath = path.join('data', 'users', username, 'plans', `${planName}.json`);
    try {
      if (!fs.existsSync(dataFilePath)) {
        return plan; // Return an empty plan if the file doesn't exist
      }

      const json = fs.readFileSync(dataFilePath, 'utf-8');
      const activities: any[] = JSON.parse(json);

      activities.forEach(activity => {
        let newActivity: TrainingActivity | null = null;
        const activityDate = new Date(activity.date);

        // Re-create the correct class instance based on the discipline
        switch (activity.discipline) {
          case "Running":
            newActivity = new Running(activityDate, activity.description, activity.plannedDuration, activity.distance);
            break;
          case "Cycling":
            newActivity = new Cycling(activityDate, activity.description, activity.plannedDuration, activity.distance);
            break;
          case "Swimming":
            newActivity = new Swimming(activityDate, activity.description, activity.plannedDuration, activity.distance);
            break;
        }

        if (newActivity) {
          if (activity.done) {
            newActivity.markAsDone();
          }
          if (activity.intervals && Array.isArray(activity.intervals)) {
            activity.intervals.forEach((intervalData: any) => {
              const interval = new Interval(intervalData.description, intervalData.duration, intervalData.intensity, intervalData.repetitions);
              if (intervalData.done) interval.markAsDone();
              newActivity.addInterval(interval);
            });
          }
          plan.addActivity(newActivity);
        }
      });
    } catch (error) {
      console.error("Error loading training plan:", error);
      // In case of any error (e.g., corrupt file), return an empty plan
    }
    return plan;
  }

  getEntriesByDate(): { [date: string]: { description: string; discipline: string; done: boolean; plannedDuration: number; intervals: any[], distance?: number }[] } {
    const entries: { [date: string]: any[] } = {};
    for (const activity of this.activities) {
      const dateKey = activity.date.toISOString().split("T")[0]; // Format date as 'YYYY-MM-DD'
      if (!entries[dateKey]) {
        entries[dateKey] = [];
      }
      // Push a detailed object instead of just the description string
      entries[dateKey].push({
        ...activity, // Spread operator to include all properties
        discipline: activity.discipline,
        done: activity.isDone(),
        plannedDuration: activity.plannedDuration,
        intervals: activity.intervals.map(i => ({
          description: i.description,
          duration: i.duration,
          intensity: i.intensity,
          repetitions: i.repetitions,
          done: i.isDone(),
        })),
      });
    }
    return entries;
  }
}