import { Merchi } from '../merchi.js';

test('can make SeoDomainPage', () => {
  const merchi = new Merchi();
  const seoDomainPage = new merchi.SeoDomainPage();
  expect(seoDomainPage).toBeTruthy();
});
