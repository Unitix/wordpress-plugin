import { Merchi } from '../merchi.js';

test('can make Page', () => {
  const merchi = new Merchi();
  const page = new merchi.Page();
  expect(page).toBeTruthy();
});
