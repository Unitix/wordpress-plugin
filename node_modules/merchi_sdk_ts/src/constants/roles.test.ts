import { Role } from './roles.js';

test('admin role exists', () => {
  expect(Role.ADMIN).toBe(1);
});
