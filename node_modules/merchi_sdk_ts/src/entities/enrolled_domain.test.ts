import { Merchi } from '../merchi.js';

test('can make EnrolledDomain', () => {
  const merchi = new Merchi();
  const enrolledDomain = new merchi.EnrolledDomain();
  expect(enrolledDomain).toBeTruthy();
});
