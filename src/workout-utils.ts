import * as fs from 'fs';
import * as path from 'path';
import { Interval } from './interval';
import { Swimming } from './training-activity';

/**
 * Loads swimming workouts from the JSON file and returns a randomly selected one.
 * @returns A randomly selected Swimming object, fully instantiated, or null if an error occurs.
 */
export function getRandomSwimmingWorkout(): Swimming | null {
    try {
        const jsonFilePath = path.join(__dirname, '..', 'data', 'swimming_workouts', 'swimming_workouts.json');
        const fileContents = fs.readFileSync(jsonFilePath, 'utf8');
        // Parse the raw data from JSON. This will be an array of plain objects.
        const workoutsData: any[] = JSON.parse(fileContents);

        if (!workoutsData || workoutsData.length === 0) {
            console.warn("Warning: The swimming workouts JSON file is empty.");
            return null;
        }

        // Select a random workout object from the data
        const randomWorkoutData = workoutsData[Math.floor(Math.random() * workoutsData.length)];

        // Create a new Swimming class instance from the raw data.
        // Note: The date from the JSON is ignored in favor of the date from the AI's plan.
        // We pass a placeholder date here which will be replaced in agent.ts.
        const swimmingActivity = new Swimming(
            new Date(), // Placeholder date
            randomWorkoutData.description,
            randomWorkoutData.plannedDuration,
            randomWorkoutData.distance
        );

        // Instantiate and assign the intervals from the JSON to the new Swimming object.
        swimmingActivity.intervals = randomWorkoutData.intervals.map((i: any) => new Interval(i.description, i.duration, i.intensity, i.repetitions));

        return swimmingActivity;
    } catch (error) {
        console.error("Failed to read or parse swimming workouts JSON.", error);
        return null;
    }
}
