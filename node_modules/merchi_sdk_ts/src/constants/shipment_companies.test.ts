import { ShipmentCompany } from './shipment_companies.js';

test('dhl exists', () => {
  expect(ShipmentCompany.DHL).toBe(0);
});
