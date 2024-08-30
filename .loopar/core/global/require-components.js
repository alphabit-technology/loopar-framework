import { loopar, elementsDict } from "loopar";


export const extractElements = (__META__, elements, environment) => {
  let extractedElements = [];
  const meta = typeof __META__.meta == "object" ? __META__.meta : JSON.parse(__META__.meta)
  const ENTITY = meta?.__ENTITY__ || {};

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
  const meta = typeof __META__.meta == "object" ? __META__.meta : JSON.parse(__META__.meta);
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

  const ENTITY = meta?.__ENTITY__ || {};
  const DOCUMENT = meta?.__DOCUMENT__ || {};

  if (action === "list") {
    return [
      ...filterByWritable(JSON.parse(ENTITY.doc_structure || "[]")),
      ...filterByWritable(JSON.parse(DOCUMENT.doc_structure || "[]"))
    ];
  } else {
    return [
      ...JSON.parse(ENTITY.doc_structure || "[]"),
      ...JSON.parse(DOCUMENT.doc_structure || "[]")
    ];
  }
}

export function MetaComponents(__META__, environment) {
  return extractElements(__META__, [...requireComponents(__META__), "fragment"], environment);
}