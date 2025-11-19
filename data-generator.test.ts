import { TrainingActivity, Running, Cycling, Swimming } from './data-generator';

// Since TrainingActivity is abstract, we create a simple concrete class for testing its base functionality.
class TestActivity extends TrainingActivity {}

describe('TrainingActivity Classes', () => {

  describe('Base TrainingActivity', () => {
    it('should correctly initialize with constructor values', () => {
      const date = new Date();
      const activity = new TestActivity(date, 'Base Test', 'Test');

      expect(activity.date).toBe(date);
      expect(activity.description).toBe('Base Test');
      expect(activity.discipline).toBe('Test');
      expect(activity.done).toBe(false); // Check default value
    });
  });

  describe('Running Class', () => {
    it('should set discipline to "Running" and store distance', () => {
      const date = new Date();
      const runningActivity = new Running(date, 'Morning Jog', 5);

      expect(runningActivity.discipline).toBe('Running');
      expect(runningActivity.distance).toBe(5);
      expect(runningActivity.description).toBe('Morning Jog');
    });
  });

  describe('Cycling Class', () => {
    it('should set discipline to "Cycling" and store distance', () => {
      const date = new Date();
      const cyclingActivity = new Cycling(date, 'Road Trip', 42);

      expect(cyclingActivity.discipline).toBe('Cycling');
      expect(cyclingActivity.distance).toBe(42);
    });
  });

  describe('Swimming Class', () => {
    it('should set discipline to "Swimming" and store distance', () => {
      const swimmingActivity = new Swimming(new Date(), 'Pool Laps', 1.5);

      expect(swimmingActivity.discipline).toBe('Swimming');
      expect(swimmingActivity.distance).toBe(1.5);
    });
  });
});