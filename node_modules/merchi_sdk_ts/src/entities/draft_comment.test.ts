import { Merchi } from '../merchi.js';

test('can make DraftComment', () => {
  const merchi = new Merchi();
  const draftComment = new merchi.DraftComment();
  expect(draftComment).toBeTruthy();
});
