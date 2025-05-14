import { JobPriority } from './job_priorities.js';

test('urgent priority exists', () => {
  expect(JobPriority.URGENT).toBe(1);
});
