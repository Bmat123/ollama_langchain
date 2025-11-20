import { TrainingActivity, Running, Cycling, Swimming } from '../src/training-activity';

// Since TrainingActivity is abstract, we create a simple concrete class for testing its base functionality.
class TestActivity extends TrainingActivity {
  constructor(date: Date, description: string, discipline: string, plannedDuration: number) {
    super(date, description, discipline, plannedDuration);
  }
}

describe('TrainingActivity Classes', () => {

  describe('Base TrainingActivity', () => {
    it('should correctly initialize with constructor values', () => {
      const date = new Date();
      const plannedDuration = 60; // 60 minutes
      const activity = new TestActivity(date, 'Base Test', 'Test', plannedDuration);

      expect(activity.date).toBe(date);
      expect(activity.description).toBe('Base Test');
      expect(activity.discipline).toBe('Test');
      expect(activity.plannedDuration).toBe(plannedDuration);
      expect(activity.isDone()).toBe(false); // Check default value
    });

    it('should allow marking an activity as done', () => {
      const activity = new TestActivity(new Date(), 'Test Done', 'Test', 30);
      expect(activity.isDone()).toBe(false); // Initially not done
      activity.markAsDone();
      expect(activity.isDone()).toBe(true); // Should be done
    });

    it('should allow marking an activity as undone after being marked as done', () => {
      const activity = new TestActivity(new Date(), 'Test Undone', 'Test', 45);
      activity.markAsDone();
      expect(activity.isDone()).toBe(true); // Check it is done first
      activity.markAsUndone();
      expect(activity.isDone()).toBe(false); // Should be not done
    });
  });

  describe('Running Class', () => {
    it('should set discipline to "Running" and store distance', () => {
      const date = new Date();
      const plannedDuration = 40;
      const runningActivity = new Running(date, 'Morning Jog', plannedDuration, 5);

      expect(runningActivity.discipline).toBe('Running');
      expect(runningActivity.distance).toBe(5);
      expect(runningActivity.description).toBe('Morning Jog');
      expect(runningActivity.plannedDuration).toBe(plannedDuration);
    });
  });


  describe('Cycling Class', () => {
    it('should set discipline to "Cycling" and store distance', () => {
      const date = new Date();
      const plannedDuration = 90;
      const cyclingActivity = new Cycling(date, 'Road Trip', plannedDuration, 42);

      expect(cyclingActivity.discipline).toBe('Cycling');
      expect(cyclingActivity.distance).toBe(42);
      expect(cyclingActivity.plannedDuration).toBe(plannedDuration);
    });
  });

  describe('Swimming Class', () => {
    it('should set discipline to "Swimming" and store distance', () => {
      const plannedDuration = 30;
      const swimmingActivity = new Swimming(new Date(), 'Pool Laps', plannedDuration, 1.5);

      expect(swimmingActivity.discipline).toBe('Swimming');
      expect(swimmingActivity.distance).toBe(1.5);
      expect(swimmingActivity.plannedDuration).toBe(plannedDuration);
    });
  });
});
