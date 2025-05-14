import { PaymentType } from './payment_types.js';

test('urgent notification urgency exists', () => {
  expect(PaymentType.ONLINE_PAYMENT).toBe(1);
});
