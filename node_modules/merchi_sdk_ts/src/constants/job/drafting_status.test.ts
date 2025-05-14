import { DraftingStatus } from './drafting_status.js';

test('init status exists', () => {
  expect(DraftingStatus.INIT).toBe(0);
});
