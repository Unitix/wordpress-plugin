import { ProductionStatus } from './production_status.js';

test('init status exists', () => {
  expect(ProductionStatus.INIT).toBe(0);
});
