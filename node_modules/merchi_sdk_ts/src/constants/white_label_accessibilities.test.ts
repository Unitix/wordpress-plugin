import { WhiteLabelAccessibility } from './white_label_accessibilities.js';

test('not reachable exists', () => {
  expect(WhiteLabelAccessibility.UNREACHABLE).toBe(0);
});
