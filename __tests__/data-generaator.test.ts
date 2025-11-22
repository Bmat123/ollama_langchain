import { TrainingPlan } from "../src/training-plan";
import { Running, Cycling } from "../src/training-activity";
import * as fs from "fs";
import * as path from "path";

describe('TrainingPlan', () => {
  let plan: TrainingPlan;

  beforeEach(() => {
    plan = new TrainingPlan();
    // clearing mocks if needed 
    jest.restoreAllMocks()
  });

  it('should add an activity to the plan', () => {
    expect(plan.activities.length).toBe(0);
    plan.addActivity(new Running(new Date(), 'Test Run', 30, 5));
    expect(plan.activities.length).toBe(1);
  });

  it('should sort activities by date when adding them', () => {
    plan.addActivity(new Running(new Date('2025-11-20'), 'Later Run', 30, 5));
    plan.addActivity(new Cycling(new Date('2025-11-19'), 'Earlier Cycle', 60, 20));
    expect(plan.activities[0].description).toBe('Earlier Cycle');
    expect(plan.activities[1].description).toBe('Later Run');
  });

  it('should group entries by date correctly', () => {
    const activity1 = new Running(new Date('2025-11-20'), 'Run 1', 30, 5);
    const activity2 = new Cycling(new Date('2025-11-20'), 'Cycle 1', 60, 20);
    const activity3 = new Running(new Date('2025-11-21'), 'Run 2', 45, 10);
    activity2.markAsDone();

    plan.addActivity(activity1);
    plan.addActivity(activity2);
    plan.addActivity(activity3);

    const entries = plan.getEntriesByDate();
    expect(Object.keys(entries)).toHaveLength(2);
    expect(entries['2025-11-20']).toHaveLength(2);
    expect(entries['2025-11-21']).toHaveLength(1);
    expect(entries['2025-11-20'][1].done).toBe(true);
  });

  it('should save the plan to a JSON file', () => {

    const activity = new Running(new Date("2025-11-20T10:00:00.000Z"), "Morning Run", 30, 5);
    activity.markAsDone();
    plan.addActivity(activity);

    const filename = "my-test-plan";
    const expectedPath = path.join("data", `${filename}.json`);
    const expectedJson = JSON.stringify(
      [
        {
          date: "2025-11-20T10:00:00.000Z",
          description: "Morning Run",
          discipline: "Running",
          plannedDuration: 30,
          done: true,
          distance: 5,
        },
      ],
      null,
      2
    );

    // Act: Call the save method
    plan.save(filename);
    let test = new TrainingPlan();
    test = TrainingPlan.load(filename);
    expect(test.activities.length).toBe(1);
    expect(test.activities[0].description).toBe("Morning Run");
    expect(test.activities[0].discipline).toBe("Running");
    expect(test.activities[0].plannedDuration).toBe(30);
    expect(test.activities[0].isDone()).toBe(true);
    

   
  });


});

