import { Merchi } from '../merchi.js';

test('can make AutomaticPaymentRelationship', () => {
  const merchi = new Merchi();
  const automaticPaymentRelationship =
    new merchi.AutomaticPaymentRelationship();
  expect(automaticPaymentRelationship).toBeTruthy();
});
