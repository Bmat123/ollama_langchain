import * as fs from 'fs';
import * as path from 'path';
import { Interval } from './interval';
import { Swimming, Running, Cycling, TrainingActivity } from './training-activity';

/**
 * Loads swimming workouts from the JSON file and returns a randomly selected one.
 * @returns A randomly selected Swimming object, fully instantiated, or null if an error occurs.
 */
export function getRandomSwimmingWorkout(): Swimming | null {
    const jsonFilePath = path.join(__dirname, '..', 'data', 'swimming_workouts', 'swimming_workouts.json');
    return getRandomWorkout(jsonFilePath, 'Swimming') as Swimming | null;
}

/**
 * Loads running workouts from the JSON file and returns a randomly selected one.
 * @returns A randomly selected Running object, fully instantiated, or null if an error occurs.
 */
export function getRandomRunningWorkout(): Running | null {
    const jsonFilePath = path.join(__dirname, '..', 'data', 'running_workouts', 'running_workouts.json');
    return getRandomWorkout(jsonFilePath, 'Running') as Running | null;
}

/**
 * A generic function to load a workout from a JSON file for a given discipline.
 * @param jsonFilePath The absolute path to the JSON file containing the workouts.
 * @param discipline The name of the discipline to determine which class to instantiate.
 * @returns A randomly selected and instantiated TrainingActivity object, or null on error.
 */
function getRandomWorkout(jsonFilePath: string, discipline: 'Running' | 'Swimming' | 'Cycling'): TrainingActivity | null {
    try {
        const fileContents = fs.readFileSync(jsonFilePath, 'utf8');
        const workoutsData: any[] = JSON.parse(fileContents);

        if (!workoutsData || workoutsData.length === 0) {
            console.warn(`Warning: The workout file at ${jsonFilePath} is empty.`);
            return null;
        }

        const randomWorkoutData = workoutsData[Math.floor(Math.random() * workoutsData.length)];

        // Create a new activity instance using the provided constructor.
        // The date is a placeholder and will be replaced in agent.ts with the planned date.
        let activity: TrainingActivity;
        const placeholderDate = new Date();

        switch (discipline) {
            case 'Running':
                activity = new Running(placeholderDate, randomWorkoutData.description, randomWorkoutData.plannedDuration, randomWorkoutData.distance);
                break;
            case 'Swimming':
                activity = new Swimming(placeholderDate, randomWorkoutData.description, randomWorkoutData.plannedDuration, randomWorkoutData.distance);
                break;
            case 'Cycling':
                activity = new Cycling(placeholderDate, randomWorkoutData.description, randomWorkoutData.plannedDuration, randomWorkoutData.distance);
                break;
        }

        // Instantiate and assign intervals if they exist in the data.
        if (randomWorkoutData.intervals && Array.isArray(randomWorkoutData.intervals)) {
            activity.intervals = randomWorkoutData.intervals.map((i: any) => new Interval(i.description, i.duration, i.intensity, i.repetitions));
        }

        return activity;
    } catch (error) {
        console.error(`Failed to read or parse workout file at ${jsonFilePath}.`, error);
        return null;
    }
}
