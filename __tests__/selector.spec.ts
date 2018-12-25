import Vue from 'vue';
import { mount } from '@vue/test-utils';
import { parseSelectors, Eyes } from '../src/selector';

describe('query selector', () => {
  const TestDom = Vue.extend({
    template: `
    <div id="app">
      <span class="deep text">unit test</span>
      <form id="myForm">
        <input name="like" type="text">
        <ul>
          <li>One</li>
          <li>Two</li>
        </ul>
        <ul id="list-two">
          <li>Orphan</li>
        </ul>
      </form>
    </div>
    `
  });

  const wrapper = mount(TestDom, {
    attachToDocument: true
  });
  const eyes = new Eyes();

  it('select element by id', () => {
    const coll = eyes.search('#app');
    expect(coll).toHaveLength(1);
    expect(coll[0].tagName).toBe('DIV');
    expect(coll[0].children).toHaveLength(2);
  });

  it('select element by class name', () => {
    const coll = eyes.search('.text');
    expect(coll).toHaveLength(1);
    expect(coll[0].tagName).toBe('SPAN');
    expect(coll[0].textContent).toBe('unit test');
    expect(coll[0].children).toHaveLength(0);
  });

  it('select element by tag name', () => {
    const coll = eyes.search('li');
    expect(coll).toHaveLength(3);
    expect(coll.every(el => el.tagName === 'LI')).toBe(true);
  });

  it('select element by attribute value', () => {
    const coll = eyes.search('[name="like"]');
    expect(coll).toHaveLength(1);
    expect(coll[0].tagName).toBe('INPUT');
    expect((coll[0] as any).type).toBe('text');
  });

  it('select with sub queries', () => {
    const selector = 'form ul li';
    const coll = eyes.search(selector);
    expect(coll).toEqual(Array.from(document.querySelectorAll(selector)));
  });

  it('handle multiple selectors at once', () => {
    const [el1, el2] = eyes.search<HTMLElement>('.text, #list-two');
    expect(el1.tagName).toBe('SPAN');
    expect(el2.tagName).toBe('UL');
    expect(el2.innerHTML).toBe('<li>Orphan</li>');
  });
});

describe('query selector specification', () => {});

describe('query parser', () => {
  it('parse id selector', () => {
    const [{ id }] = parseSelectors('#hash');
    expect(id).toBe('hash');
  });

  it('parse class selector', () => {
    const [{ classNames }] = parseSelectors('.good.morning');
    expect(classNames).toEqual(['good', 'morning']);
  });

  it('parse attribute selector', () => {
    const [{ attributes }] = parseSelectors('[name="value"]');
    expect(attributes).toEqual([
      {
        name: 'name',
        op: '=',
        value: 'value'
      }
    ]);
  });

  it('parse tag name selector', () => {
    const [{ tagName }] = parseSelectors('tbody');
    expect(tagName).toBe('tbody');
  });

  it('parse combined selector', () => {
    const q = parseSelectors('div#foo.wrapped.beautiful[safe^="blocked"]');
    expect(q).toEqual([
      {
        tagName: 'div',
        id: 'foo',
        classNames: ['wrapped', 'beautiful'],
        attributes: [
          {
            name: 'safe',
            op: '^=',
            value: 'blocked'
          }
        ],
        subQueries: []
      }
    ]);
  });

  it('parse sub query', () => {
    const [{ tagName, attributes, subQueries }] = parseSelectors(
      'select[name="foo"] option'
    );
    expect(tagName).toBe('select');
    expect(attributes).toHaveLength(1);
    expect(attributes[0]).toEqual({
      name: 'name',
      op: '=',
      value: 'foo'
    });
    expect(subQueries).toHaveLength(1);
    expect(subQueries[0].tagName).toBe('option');
    expect(subQueries[0].id).toBeUndefined();
  });

  it('parse multiple selectors', () => {
    const queries = parseSelectors('div, select[name^="foo"]');
    expect(queries).toEqual([
      {
        tagName: 'div',
        classNames: [],
        attributes: [],
        subQueries: []
      },
      {
        tagName: 'select',
        classNames: [],
        attributes: [
          {
            name: 'name',
            op: '^=',
            value: 'foo'
          }
        ],
        subQueries: []
      }
    ]);
  });
});
