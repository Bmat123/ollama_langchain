import { TrainingPlan } from "../src/training-plan";
import { Running, Cycling } from "../src/training-activity";
import { Interval } from "../src/interval";
import * as fs from "fs";
import * as path from "path";

// Mock the entire fs module to control file system operations
jest.mock("fs");

describe("TrainingPlan", () => {
  let plan: TrainingPlan;

  beforeEach(() => {
    plan = new TrainingPlan();
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it("should add an activity to the plan", () => {
    expect(plan.activities.length).toBe(0);
    plan.addActivity(new Running(new Date(), "Test Run", 30, 5));
    expect(plan.activities.length).toBe(1);
  });

  it("should sort activities by date when adding them", () => {
    plan.addActivity(new Running(new Date("2025-11-20"), "Later Run", 30, 5));
    plan.addActivity(new Cycling(new Date("2025-11-19"), "Earlier Cycle", 60, 20));
    expect(plan.activities[0].description).toBe("Earlier Cycle");
    expect(plan.activities[1].description).toBe("Later Run");
  });

  it("should group entries by date correctly", () => {
    const activity1 = new Running(new Date("2025-11-20"), "Run 1", 30, 5);
    const activity2 = new Cycling(new Date("2025-11-20"), "Cycle 1", 60, 20);
    const activity3 = new Running(new Date("2025-11-21"), "Run 2", 45, 10);
    activity2.markAsDone();

    plan.addActivity(activity1);
    plan.addActivity(activity2);
    plan.addActivity(activity3);

    const entries = plan.getEntriesByDate();
    expect(Object.keys(entries)).toHaveLength(2);
    expect(entries["2025-11-20"]).toHaveLength(2);
    expect(entries["2025-11-21"]).toHaveLength(1);
    expect(entries["2025-11-20"][1].done).toBe(true);
  });

  describe("Save and Load", () => {
    it("should save the plan to a user-specific JSON file", () => {
      // Arrange
      const activity = new Running(new Date("2025-11-20T10:00:00.000Z"), "Morning Run", 30, 5);
      plan.addActivity(activity);

      const username = "test-user";
      const planName = "my-test-plan";
      const expectedPath = path.join("data", "users", username, "plans", `${planName}.json`);

      // Act
      plan.save(username, planName);

      // Assert
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it("should correctly load a plan that includes intervals", () => {
      // Arrange
      const jsonData = `[
        {
          "date": "2025-11-20T10:00:00.000Z",
          "description": "Run with Intervals",
          "discipline": "Running",
          "plannedDuration": 25,
          "done": false,
          "intervals": [
            { "description": "Warm up", "duration": 10, "intensity": "low", "repetitions": 1, "done": true }
          ],
          "distance": 5
        }
      ]`;
      (fs.readFileSync as jest.Mock).mockReturnValue(jsonData);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Act
      const loadedPlan = TrainingPlan.load("test-user", "any-plan");

      // Assert
      expect(loadedPlan.activities).toHaveLength(1);
      const loadedActivity = loadedPlan.activities[0];
      expect(loadedActivity.description).toBe("Run with Intervals");
      expect(loadedActivity.intervals).toHaveLength(1);
      const loadedInterval = loadedActivity.intervals[0];
      expect(loadedInterval.description).toBe("Warm up");
      expect(loadedInterval.isDone()).toBe(true);
    });
  });
});
