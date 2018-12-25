import Vue from 'vue';
import { mount } from '@vue/test-utils';
import Hands from '../src/event';

const TestDOM = Vue.extend({
  template: `
  <main id="not-real">
    <section class="top display-top">
      <nav>this is nav</nav>
    </section>
    <section class="controls shop">
      <div id="form-container">
        <form action="/my-url" name="my-form">
          <input type="text" name="user_name">
          <input type="password" name="login" value="secret">
          <input type="checkbox" name="remember_me" value="1">
          <button id="my-button">PRESS ME</button>
        </form>
      </div>
    </section>
    <section class="content q">
    </section>
  </main>
  `
});

let wrapper;

beforeEach(() => {
  wrapper = mount(TestDOM, {
    attachToDocument: true
  });
});

describe('event listeners', () => {
  it('attach multiple event handler on element', () => {
    const hands = new Hands();
    let counter = 0;
    const apiMock = jest.fn();
    hands.on('#my-button', 'click', (e?: Event) => {
      counter++;
      e!.preventDefault();
    });
    hands.on('#my-button', 'click', () => apiMock());

    const button = document.getElementById('my-button') as HTMLButtonElement;

    [1, 2, 3].forEach(i => {
      button.click();
      expect(counter).toBe(i);
      expect(apiMock.mock.calls.length).toBe(i);
    });
  });

  it('can listen to multiple event types for an element', () => {
    const hands = new Hands();
    const userName = `input[name="user_name"]`;
    let focus = 0;
    let evidence = '';
    hands.on(userName, 'focus', () => {
      focus++;
    });
    hands.on(userName, 'blur', () => {
      evidence = 'BLUR';
    });

    const input = document.querySelector<HTMLInputElement>(userName);
    input!.focus();
    input!.value = 'FOCUS 1';
    input!.blur();

    expect(focus).toBe(1);
    expect(evidence).toBe('BLUR');
  });
});
