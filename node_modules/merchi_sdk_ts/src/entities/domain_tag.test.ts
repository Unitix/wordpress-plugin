import { Merchi } from '../merchi.js';

test('can make DomainTag', () => {
  const merchi = new Merchi();
  const domainTag = new merchi.DomainTag();
  expect(domainTag).toBeTruthy();
});
