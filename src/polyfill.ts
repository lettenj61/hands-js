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

    const inject = (self: any) => {
      if (self !== undefined && self !== null) {
        if (self.length) {
          const len = self.length as number;
          for (let i = 0; i < len; i++) {
            inject(self[i]);
          }
        } else {
          self.addEventListener =
            self.addEventListener ||
            function(type: string, callback: (e?: Event) => any): void {
              hands!.addListener(self as Element, type, callback);
            };
  
          self.removeEventListener =
            self.removeEventListener ||
            function(type: string, callback: (e?: Event) => any): void {
              hands!.removeListener(self as Element, type, callback);
            };
        }
      }
      return self;
    };

    const hijack = (fn: string) => {
      if (fn in document) {
        const native = document[fn];
        document[fn] = function(arg: any) {
          return inject(native(arg));
        };
      }
    };

    inject([window, document]);

    hands!.addListener(document as Element, 'readystatechange', (e?: Event) => {
      inject(document.all);
    });

    hijack('getElementById');
    hijack('getElementsByName');
    hijack('getElementsByTagName');
    hijack('createElement');

    // for querySelector polyfill
    hijack('querySelector');
    hijack('querySelectorAll');

    window['__handsjs__polyfill'] = hands;
  }
})(window, document);
