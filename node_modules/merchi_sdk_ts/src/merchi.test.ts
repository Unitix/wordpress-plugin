import { setup, mockFetch } from './test_util.js';
import { Merchi } from './merchi.js';

setup();

test('can get current user merchi has session token', () => {
  const testToken = 'YrDwzmh8&QGtAfg9quh(4QfSlE^RPXWl';
  const merchi = new Merchi(testToken);
  mockFetch(true, { session: { user: { name: 'currentUser' } } }, 200);
  return merchi
    .getCurrentUser()
    .then(user => expect(user.name).toBe('currentUser'));
});

test('get current user return empty if there is no cookie', () => {
  Object.defineProperty(document, 'cookie', {
    get: jest.fn().mockImplementation(() => {
      return '';
    }),
  });
  const merchi = new Merchi();
  mockFetch(true, { user: { name: 'currentUser' } }, 200);
  return merchi.getCurrentUser({embed: {}}).then(
    user => expect(user).toBe(null));
});
