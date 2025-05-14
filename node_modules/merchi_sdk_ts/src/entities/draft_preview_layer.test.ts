import { Merchi } from '../merchi.js';

test('can make DraftPreviewLayer', () => {
  const merchi = new Merchi();
  const draftPreviewLayer = new merchi.DraftPreviewLayer();
  expect(draftPreviewLayer).toBeTruthy();
});
