import { parseNonAttribute } from '../src/selector';

describe('query parser', () => {
  it('parse id selector', () => {
    const q = parseNonAttribute('#hash');
    expect(q.id).toBe('hash');
  });

  it('parse class selector', () => {
    const q = parseNonAttribute('.good.morning');
    expect(q.classNames).toEqual(['good', 'morning']);
  });
});
