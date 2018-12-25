import { Eyes } from './selector';
declare type EventHandler = (e?: Event) => any;
declare type HandlerMap = {
  [type: string]: EventHandler[];
};
declare type ListenerEntry = {
  el: Element;
  hijacked: {
    [type: string]: EventHandler;
  };
  nativeHandlers: string[];
  handlers: HandlerMap;
};
export default class Hands {
  private idCounter;
  eyes: Eyes;
  registry: {
    [id: string]: ListenerEntry;
  };
  extendEventObject: boolean;
  preserveNative: boolean;
  constructor();
  findKey(el: Element): number | undefined;
  hasPropagationFns(event: any): boolean;
  inject(event: any, el: Element): void;
  addHandler(
    listener: ListenerEntry,
    type: string,
    callback: EventHandler
  ): void;
  handleNativeHandler(target: any, type: string, listener: ListenerEntry): void;
  on(el: Element | string, type: string, callback: EventHandler): void;
  addListener(el: Element, type: string, callback: EventHandler): void;
  removeListener(el: Element, type: string, callback: EventHandler): void;
}
