import { getQueryStringValue } from './query_string.js';

test('lol', () => {
  expect(getQueryStringValue('a')).toBe(undefined);
  history.replaceState({}, 'Test', '/test?a=3');
  expect(getQueryStringValue('a')).toBe('3');
});
