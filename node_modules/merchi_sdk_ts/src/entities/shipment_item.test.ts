import { Merchi } from '../merchi.js';

test('can make ShipmentItem', () => {
  const merchi = new Merchi();
  const shipmentItem = new merchi.ShipmentItem();
  expect(shipmentItem).toBeTruthy();
});
