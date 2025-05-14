import { Merchi } from '../merchi.js';

test('can make DraftTemplate', () => {
  const merchi = new Merchi();
  const draftTemplate = new merchi.DraftTemplate();
  expect(draftTemplate).toBeTruthy();
});
