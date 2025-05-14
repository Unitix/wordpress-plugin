import { Merchi } from '../merchi.js';

test('can make UserCompany', () => {
  const merchi = new Merchi();
  const userCompany = new merchi.UserCompany();
  expect(userCompany).toBeTruthy();
});
