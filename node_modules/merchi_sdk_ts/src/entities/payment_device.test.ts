import { Merchi } from '../merchi.js';

test('can make PaymentDevice', () => {
  const merchi = new Merchi();
  const paymentDevice = new merchi.PaymentDevice();
  expect(paymentDevice).toBeTruthy();
});
