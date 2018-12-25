export interface QueryAttribute {
  name: string;
  op?: string;
  value?: string;
}
export interface QuerySelector {
  tagName?: string;
  id?: string;
  classNames: string[];
  attributes: QueryAttribute[];
  subQueries: QuerySelector[];
}
export declare function parseAttributes(attr: string): QueryAttribute[];
export declare function parseNonAttribute(selector: string): QuerySelector;
export declare function parseComponent(selector: string): QuerySelector;
export declare function parseSelectors(selectors: string): QuerySelector[];
export declare function filterElements<E extends HTMLElement>(
  elements: ArrayLike<Element>,
  query: QuerySelector
): E[];
export declare class Eyes {
  private currentNode;
  constructor(node?: ParentNode);
  collectNodes(): Element[];
  collectChildren(nodes: ArrayLike<Element>, withParent?: boolean): Element[];
  search<E extends HTMLElement = HTMLElement>(selectors: string): E[];
  watch(parentNode: ParentNode): this;
}
