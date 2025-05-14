import { DiscountType } from './discount_types.js';

test('discount type volumetric exists', () => {
  expect(DiscountType.VOLUMETRIC).toBe(0);
});
