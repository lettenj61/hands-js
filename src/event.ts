import { Eyes } from './selector';

type EventHandler = (e?: Event) => any;
type HandlerMap = { [type: string]: EventHandler[] };
type ListenerEntry = {
  el: Element;
  hijacked: { [type: string]: EventHandler }; // listener injected by handsjs
  nativeHandlers: string[];
  handlers: HandlerMap;
};

// const PREVENTED = 'handsjs_prevented__';

export default class Hands {
  private idCounter: number;
  eyes: Eyes;
  registry: { [id: string]: ListenerEntry };
  extendEventObject: boolean;
  preserveNative: boolean; // for testing environment, such as JSDom

  constructor() {
    this.eyes = new Eyes();
    this.idCounter = 0;
    this.registry = {};
    this.extendEventObject = !('addEventListener' in window);
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

  hasPropagationFns(event: any): boolean {
    return 'preventDefault' in event && 'stopPropagation' in event;
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

  handleNativeHandler(
    target: any,
    type: string,
    listener: ListenerEntry
  ): void {
    // check for native handlers
    let nativeFn =
      (
        typeof target['on' + type] === 'function' &&
        target['on' + type] !== listener.hijacked[type]
      )
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

    const self = this;
    let target = el as any;
    let first = false;

    // translate DOMContentLoaded as onload event
    if (type === 'DOMContentLoaded') {
      target = window;
      type = 'load';
    }

    // check if the element is already registered
    let key = this.findKey(el);
    if (key == null) {
      key = ++this.idCounter;
      this.registry[key] = {
        el,
        nativeHandlers: [],
        handlers: {},
        hijacked: {}
      };
      first = true;
    }

    const listener = this.registry[key];

    // check for native handlers
    if (first || listener.handlers[type] == null) {
      this.handleNativeHandler(target, type, listener);
      if (target['on' + type] == null) {
        listener.hijacked[type] = function(event?: Event): any {
          event = event || window.event;
          if (self.extendEventObject && !self.hasPropagationFns(event)) {
            self.inject(event, el);
          }
          let result;
          listener.handlers[type].forEach(handler => {
            result = handler(event);
          });
          return result;
        };
      }
      target['on' + type] = listener.hijacked[type];
    }

    // register handler
    this.addHandler(listener, type, callback);
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
