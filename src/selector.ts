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

const attrSelectorRE: RegExp = /(\[([\w\-_]+)([~|\^$*]?=)?(["'][^"']+["'])?\])/;

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

export function parseAttributes(attr: string): QueryAttribute[] {
  // TODO
  throw void 0
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
  // TODO
  return (void 0 as unknown) as QuerySelector;
}
