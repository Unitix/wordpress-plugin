import { Merchi } from '../merchi.js';

test('can make Company', () => {
  const merchi = new Merchi();
  const company = new merchi.Company();
  expect(company).toBeTruthy();
});
