import { Merchi } from '../merchi.js';

test('can make ShortUrl', () => {
  const merchi = new Merchi();
  const shortUrl = new merchi.ShortUrl();
  expect(shortUrl).toBeTruthy();
});
