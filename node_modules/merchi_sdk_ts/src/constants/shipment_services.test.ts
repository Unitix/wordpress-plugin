import { ShipmentService } from './shipment_services.js';

test('dhl exists', () => {
  expect(ShipmentService.SENDLE).toBe(1);
});
