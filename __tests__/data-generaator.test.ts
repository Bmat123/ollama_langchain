import { TrainingPlan } from '../src/data-generator';
import { Running, Cycling } from '../src/training-activity';

describe('TrainingPlan', () => {
  let plan: TrainingPlan;

  beforeEach(() => {
    plan = new TrainingPlan();
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
});

