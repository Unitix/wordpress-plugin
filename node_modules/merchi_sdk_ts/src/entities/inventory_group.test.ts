import { Merchi } from '../merchi.js';

test('can make InventoryGroup', () => {
  const merchi = new Merchi();
  const inventoryGroup = new merchi.InventoryGroup();
  expect(inventoryGroup).toBeTruthy();
});
