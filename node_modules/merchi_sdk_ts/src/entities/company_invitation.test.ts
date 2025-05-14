import { Merchi } from '../merchi.js';

test('can make CompanyInvitation', () => {
  const merchi = new Merchi();
  const companyInvitation = new merchi.CompanyInvitation();
  expect(companyInvitation).toBeTruthy();
});
