import { PaymentStatus } from './payment_status.js';

test('init status exists', () => {
  expect(PaymentStatus.INIT).toBe(0);
});
