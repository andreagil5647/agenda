import { withChanges, withItem, withReplaced, withoutItem } from './listEdits';

const items = [
  { id: 'a', title: 'First' },
  { id: 'b', title: 'Second' },
];

describe('list edits', () => {
  it('appends an item', () => {
    expect(withItem(items, { id: 'c', title: 'Third' }).map((item) => item.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('removes the item with an id', () => {
    expect(withoutItem(items, 'a')).toEqual([{ id: 'b', title: 'Second' }]);
  });

  it('replaces an item in place, even under a new id', () => {
    expect(withReplaced(items, 'a', { id: 'saved', title: 'First' })).toEqual([
      { id: 'saved', title: 'First' },
      { id: 'b', title: 'Second' },
    ]);
  });

  it('merges changes into one item', () => {
    expect(withChanges(items, 'b', { title: 'Renamed' })[1]).toEqual({ id: 'b', title: 'Renamed' });
  });

  it('leaves the list as it was when no item has the id', () => {
    expect(withoutItem(items, 'missing')).toEqual(items);
    expect(withChanges(items, 'missing', { title: 'x' })).toEqual(items);
  });

  it('never changes the list it was given', () => {
    const before = structuredClone(items);

    withItem(items, { id: 'c', title: 'Third' });
    withChanges(items, 'a', { title: 'x' });

    expect(items).toEqual(before);
  });
});
