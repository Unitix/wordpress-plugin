import { Merchi } from '../merchi.js';

test('can make Notification', () => {
  const merchi = new Merchi();
  const notification = new merchi.Notification();
  expect(notification).toBeTruthy();
});
