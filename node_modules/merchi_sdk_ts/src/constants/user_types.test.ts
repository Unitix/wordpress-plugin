import { UserType } from './user_types.js';

test('not valid status exists', () => {
  expect(UserType.CLIENT_GUEST).toBe(1);
});
