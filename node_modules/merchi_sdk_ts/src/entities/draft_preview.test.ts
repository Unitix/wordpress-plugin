import { setup, mockFetch } from '../test_util.js';
import { DraftPreview } from './draft_preview.js';

setup();

test('can create draft preview from json', () => {
  const mockData = {
    draft_preview: {
      id: 1,
      name: 'Test Preview',
      description: 'Test Description',
      date: '2024-03-26T10:00:00Z',
      height: 800,
      width: 600
    }
  };

  const draftPreview = new DraftPreview();
  draftPreview.fromJson(mockData.draft_preview);

  expect(draftPreview.id).toBe(1);
  expect(draftPreview.name).toBe('Test Preview');
  expect(draftPreview.description).toBe('Test Description');
  expect(draftPreview.date).toBeInstanceOf(Date);
  expect(draftPreview.height).toBe(800);
  expect(draftPreview.width).toBe(600);
});

test('can fetch draft preview from server', () => {
  const mockData = {
    draft_preview: {
      id: 1,
      name: 'Test Preview'
    }
  };

  mockFetch(true, mockData, 200);
  return DraftPreview.get(1).then(draftPreview => {
    expect(draftPreview.id).toBe(1);
    expect(draftPreview.name).toBe('Test Preview');
  });
});
