import { Merchi } from '../merchi.js';

test('can make ProductionComment', () => {
  const merchi = new Merchi();
  const productionComment = new merchi.ProductionComment();
  expect(productionComment).toBeTruthy();
});
