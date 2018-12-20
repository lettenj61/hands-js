import { parseNonAttribute } from '../src/selector';

describe('query parser', () => {
  it('parse CSS `id` selector', () => {
    const q = parseNonAttribute('#hash');
    expect(q).toEqual({
      id: 'hash',
      classNames: [],
      attributes: [],
      subQueries: []
    });
  });
});
