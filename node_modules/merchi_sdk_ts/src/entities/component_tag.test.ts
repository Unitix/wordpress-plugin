import { Merchi } from '../merchi.js';

test('can make ComponentTag', () => {
  const merchi = new Merchi();
  const componentTag = new merchi.ComponentTag();
  expect(componentTag).toBeTruthy();
});
