import { loopar, elementsDict } from "loopar";


export const extractElements = (__META__, elements, environment) => {
  let extractedElements = [];
  const __DOCUMENT__ = __META__.__DOCUMENT__ || {};
  const ENTITY = __DOCUMENT__.__ENTITY__ || {};

  const extract = (elements, environment) => {
    for (const el of elements || []) {
      const element = typeof el === "string" ? { element: el } : el;

      const def = elementsDict[element.element]?.def || {};

      if ((environment !== "server" || !def.clientOnly) && (!def.designerOnly || ENTITY.name === "Document")) {
        element.element && extractedElements.push(element.element);

        if (element.elements) {
          extract(element.elements, environment);
        }
      }
    }
  };

  extract(elements, environment);

  return Array.from(new Set(extractedElements));
}

export function requireComponents(__META__) {
  const __DOCUMENT__ = __META__.__DOCUMENT__ || {};
  const action = ["update", "create", "form"].includes(__META__.action) ? "form" : __META__.action;

  const filterByWritable = (structure) => {
    return structure.reduce((acc, element) => {
      if (loopar.utils.trueValue(element.data?.searchable)) {
        acc.push(element);
      }

      if (element.elements) {
        acc.push(...filterByWritable(element.elements));
      }

      return acc;
    }, []);
  }

  const ENTITY = __DOCUMENT__?.__ENTITY__ || {};
  const DOCUMENT = __DOCUMENT__?.__DOCUMENT__ || {};

  const entityDocStructure = JSON.parse(ENTITY.doc_structure || "[]");
  const documentDocStructure = JSON.parse(DOCUMENT.doc_structure || "[]");

  if (action === "list") {
    return [
      ...filterByWritable(Array.isArray(entityDocStructure) ? entityDocStructure : []),
      ...filterByWritable(Array.isArray(documentDocStructure) ? documentDocStructure : [])
    ];
  } else {
    return [
      ...(Array.isArray(entityDocStructure) ? entityDocStructure : []),
      ...(Array.isArray(documentDocStructure) ? documentDocStructure : []),
    ];
  }
}

export function MetaComponents(__META__, environment) {
  return extractElements(__META__, [...requireComponents(__META__), "fragment"], environment);
}