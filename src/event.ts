import { Eyes } from './selector';

type EventHandler = (e?: Event) => any;
type HandlerMap = { [type: string]: EventHandler[] };
type ListenerEntry = {
  el: Element;
  nativeHandlers: string[];
  handlers: HandlerMap;
};

// const PREVENTED = 'handsjs_prevented__';

export default class Hands {
  private idCounter: number;
  eyes: Eyes;
  registry: { [id: string]: ListenerEntry };
  eventSupport: boolean;
  preserveNative: boolean; // for testing environment, such as JSDom

  constructor() {
    this.eyes = new Eyes();
    this.idCounter = -1;
    this.registry = {};
    this.eventSupport = 'addEventListener' in window;
    this.preserveNative = true;
  }

  findKey(el: Element): number | undefined {
    for (const key in this.registry) {
      if (this.registry[key] && this.registry[key].el === el) {
        return parseInt(key, 10);
      }
    }
    return void 0;
  }

  inject(event: any, el: Element): void {
    if ('srcElement' in event) {
      event.target = event.srcElement;
    } else {
      event.target = el;
    }
    event.preventDefault =
      event.preventDefault ||
      function() {
        event.returnValue = false;
      };

    event.stopPropagation =
      event.stopPropagation ||
      function() {
        event.cancelBubble = true;
      };
  }

  addHandler(
    listener: ListenerEntry,
    type: string,
    callback: EventHandler
  ): void {
    if (listener.handlers[type] == null) {
      listener.handlers[type] = [];
    }
    listener.handlers[type].push(callback);
  }

  on(el: Element | string, type: string, callback: EventHandler): void {
    if (typeof el === 'string') {
      this.eyes
        .search(el)
        .forEach(target => this.addListener(target, type, callback));
    } else {
      this.addListener(el, type, callback);
    }
  }

  addListener(el: Element, type: string, callback: EventHandler): void {
    if (el == null) {
      console.error('unable to set event handler on null, skipping.');
      return;
    }

    let target = el as any;

    // check if the element is already registered
    let key = this.findKey(el);
    if (key == null) {
      key = ++this.idCounter;
      this.registry[key] = {
        el,
        nativeHandlers: [],
        handlers: {}
      };
    }

    const listener = this.registry[key];

    // translate DOMContentLoaded as onload event
    if (type === 'DOMContentLoaded') {
      target = window;
      type = 'load';
    }

    // check for native handlers
    let nativeFn =
      typeof target['on' + type] === 'function'
        ? (target['on' + type] as EventHandler)
        : void 0;

    if (
      this.preserveNative &&
      nativeFn &&
      listener.nativeHandlers.indexOf(type) === -1
    ) {
      listener.nativeHandlers.push(type);
      this.addHandler(listener, type, nativeFn);
      target['on' + type] = null;
    }

    // register handler
    this.addHandler(listener, type, callback);

    // attach listener to element
    const self = this;
    target['on' + type] = function(event?: Event): any {
      event = event || window.event;
      if (!self.eventSupport) {
        self.inject(event, el);
      }
      let result;
      listener.handlers[type].forEach(handler => {
        result = handler(event);
      });
      return result;
    };
  }

  removeListener(el: Element, type: string, callback: EventHandler): void {
    const key = this.findKey(el);
    if (!key) {
      return;
    }
    const handlers = this.registry[key].handlers;
    if (handlers[type]) {
      handlers[type] = handlers[type].filter(cb => cb !== callback);
    }
  }
}
