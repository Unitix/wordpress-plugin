import { InventoryStatus } from './inventory_statuses.js';

test('inventory deducted', () => {
  expect(InventoryStatus.DEDUCTED).toBe(0);
});
