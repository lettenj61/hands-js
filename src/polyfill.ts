import { Eyes } from './selector';
import Hands from './event';

((window: any, document: any) => {
  let hands: Hands | null = null;
  // querySelector
  if (!document.querySelector) {
    hands = new Hands();
    const eyes = hands.eyes!;

    document.querySelectorAll = function querySelectorAll(selectors: string) {
      return eyes.search(selectors);
    };

    document.querySelector = function querySelector(selectors: string) {
      return eyes.search(selectors)[0];
    };
  }

  // addEventListener
  if (!window.addEventListener) {
    if (hands == null) {
      hands = new Hands();
    }
    const createAddListener = (self: any) => {
      return (type: string, callback: (e?: Event) => any) => {
        hands!.addListener(self as Element, type, callback);
      }
    };
    window['__handsjs__polyfill'] = hands;
    window.addEventListener = createAddListener(window);
    document.addEventListener = createAddListener(document);
    const prevFn = document.onreadystatechange;
    document.onreadystatechange = function() {
      for (let i = 0; i < document.all.length; i++) {
        const el = document.all[i];
        el.addEventListener = createAddListener(el);
      }
      if (typeof prevFn === 'function') {
        prevFn();
      }
    }
  }
})(window, document);
