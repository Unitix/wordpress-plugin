import { InoviceType } from './invoice_types.js';

test('invoice type exists', () => {
  expect(InoviceType.ORDER).toBe(0);
});
