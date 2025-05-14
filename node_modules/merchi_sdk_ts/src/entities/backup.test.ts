import { Merchi } from '../merchi.js';

test('can make Backup', () => {
  const merchi = new Merchi();
  const backup = new merchi.Backup();
  expect(backup).toBeTruthy();
});
