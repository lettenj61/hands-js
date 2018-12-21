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

const attrSelectorRE: RegExp = /\[([\w\-_]+)([~|\^$*]?=)?(["'][^"']+["'])?\]/;

function createQuery(opts: {
  tagName?: string;
  id?: string;
  classNames?: string[];
  attributes?: QueryAttribute[];
  subQueries?: QuerySelector[];
}): QuerySelector {
  let { id, tagName, classNames, attributes, subQueries } = opts;
  classNames = classNames || [];
  attributes = attributes || [];
  subQueries = subQueries || [];
  return {
    id,
    tagName,
    classNames,
    attributes,
    subQueries
  };
}

function splitClassPrefix(qualified: string): [string, string[]] {
  const [head, ...rest] = qualified.split(/\./);
  return [head, rest.filter(e => e !== '')];
}

function splitSelectors(selectors: string): string[] {
  const buf: string[] = [];
  const chars = selectors.split('');
  let part = '';
  let quote = '';
  let inQuote = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    switch (ch) {
      case ' ':
      case '\t':
      case '\r':
      case '\n':
        if (inQuote) {
          part += ' ';
        } else {
          if (part !== '') {
            buf.push(part);
            part = '';
          }
        }
        break;
      case '"':
      case "'":
        if (!inQuote) {
          inQuote = true;
          quote = ch;
        } else if (quote === ch) {
          inQuote = false;
          quote = '';
        }
        part += ch;
        break;
      default:
        part += ch;
        break;
    }
  }
  if (part !== '') {
    buf.push(part);
  }
  return buf;
}

export function parseAttributes(attr: string): QueryAttribute[] {
  const buf: QueryAttribute[] = [];
  let close = attr.indexOf(']');
  while (close > -1) {
    const head = attr.substring(0, close + 1);
    const m = head.match(attrSelectorRE);
    if (m !== null) {
      buf.push({
        name: m[1],
        op: m[2],
        value: m[3].replace(/["']/g, '')
      });
    }
    attr = attr.substring(close + 1);
    close = attr.indexOf(']');
  }
  return buf;
}

export function parseNonAttribute(selector: string): QuerySelector {
  switch (selector[0]) {
    case '#':
      // id
      if (selector.indexOf('.') > -1) {
        const [hashed, classNames] = splitClassPrefix(selector);
        return createQuery({
          id: hashed.substring(1),
          classNames
        });
      } else {
        return createQuery({ id: selector.substring(1) });
      }
    case '.':
      // class
      return createQuery({
        classNames: selector.split(/\./).filter(s => s !== '')
      });
    default:
      // tag name
      if (selector.indexOf('#') > -1) {
        // we have id
        const idIndex = selector.indexOf('#');
        const rest = selector.substring(idIndex);
        const tagName = selector.substring(0, idIndex);
        if (rest.indexOf('.') > -1) {
          // we also have class
          const [hashed, classNames] = splitClassPrefix(rest);
          return createQuery({
            tagName,
            id: hashed.substring(1),
            classNames
          });
        } else {
          return createQuery({ tagName, id: rest.substring(1) });
        }
      } else if (selector.indexOf('.') > -1) {
        // we have class, but not id
        const [tagName, classNames] = splitClassPrefix(selector);
        return createQuery({ tagName, classNames });
      } else {
        // just tag name
        return createQuery({ tagName: selector });
      }
  }
}

export function parseComponent(selector: string): QuerySelector {
  const matched = selector.match(attrSelectorRE);
  if (matched !== null) {
    if (matched.index === 0) {
      return createQuery({
        attributes: parseAttributes(selector)
      });
    } else {
      const query = parseNonAttribute(selector.substring(0, matched.index));
      query.attributes = parseAttributes(selector.substring(matched.index!));
      return query;
    }
  } else {
    return parseNonAttribute(selector);
  }
}

export function parseSelectors(selectors: string): QuerySelector {
  const parts = splitSelectors(selectors);
  try {
    const qs = parseComponent(parts[0]);
    if (parts.length === 0) {
      return qs;
    } else {
      return {
        ...qs,
        subQueries: parts.slice(1).map(parseComponent)
      };
    }
  } catch (e) {
    throw e;
  }
}

export function filterElements<E extends HTMLElement>(
  elements: ArrayLike<Element>,
  query: QuerySelector
): E[] {
  const { tagName, id, classNames, attributes } = query;
  const ret = [];
  for (let i = 0; i < elements.length; i++) {
    const elem = elements[i] as E;
    let pass = true;

    if (tagName) {
      pass = pass && elem.tagName === tagName.toUpperCase();
    }

    if (id) {
      pass = pass && elem.getAttribute('id') === id;
    }

    const currentClasses = elem.className.split(' ');
    pass = pass && classNames.every(cls => currentClasses.indexOf(cls) > -1);

    pass =
      pass &&
      attributes.every(({ name, op, value }) => {
        const attrValue = elem.getAttribute(name)!;
        if (name && op && value) {
          switch (op) {
            case '=':
              return attrValue == value;
            case '~=':
              return attrValue.split(' ').indexOf(value) > -1;
            case '|=':
              return attrValue === value || attrValue === `${value}-`;
            case '^=':
              return attrValue.startsWith(value);
            case '$=':
              return attrValue.endsWith(value);
            case '*=':
              return attrValue.indexOf(value) > -1;
            default:
              return false;
          }
        } else if (name) {
          return attrValue != null;
        }

        return false;
      });

    if (pass) {
      ret.push(elem);
    }
  }

  return ret;
}

export class Eyes {
  private currentNode: ParentNode;

  constructor(node?: ParentNode) {
    this.currentNode = node || document;
  }

  collectNodes(): Element[] {
    const nodes =
      this.currentNode === document
        ? document.body.children
        : this.currentNode.children;

    return this.collectChildren(nodes, true);
  }

  collectChildren(nodes: ArrayLike<Element>, withParent?: boolean): Element[] {
    const ret: Element[] = [];
    const append = (children: ArrayLike<Element>, withParent0: boolean) => {
      for (let i = 0; i < children.length; i++) {
        if (withParent0 === true) {
          ret.push(children[i]);
        }
        if (children[i].children.length) {
          append(children[i].children, true);
        }
      }
    };

    append(nodes, withParent || false);
    return ret;
  }

  search<E extends HTMLElement = HTMLElement>(selectors: string): E[] {
    const qs = parseSelectors(selectors);
    const parents = filterElements<E>(this.collectNodes(), qs);

    if (qs.subQueries.length > 0) {
      return qs.subQueries.reduce(
        (result: E[], subQuery: QuerySelector) => {
          result = filterElements<E>(this.collectChildren(result), subQuery);
          return result;
        },
        parents as E[]
      );
    } else {
      return parents;
    }
  }

  watch(parentNode: ParentNode): this {
    if (parentNode == null) {
      console.warn('unable to watch null element, skipping.');
    } else {
      this.currentNode = parentNode;
    }
    return this;
  }
}
