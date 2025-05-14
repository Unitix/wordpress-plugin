import { robotsMetaDirectives } from './robots_meta_directives.js';

test('robot meta directive exists', () => {
  expect(robotsMetaDirectives[0]).toBe('noindex');
});
