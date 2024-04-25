import {loopar, elementsDict} from "loopar";


export const extractElements = (elements, environment) => {
  let extractedElements = [];

  const extract = (elements, environment) => {
    for (const el of elements || []) {

      const element = typeof el === "string" ? { element: el } : el;

      const def = elementsDict[element.element]?.def || {};

      if ((environment !== "server" || !def.clientOnly)) {
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
  const meta = typeof __META__.meta == "object" ? __META__.meta : JSON.parse(__META__.meta)
  const action = ["update", "create", "form"].includes(__META__.action) ? "form" : __META__.action;

  const filterByWritable = (structure) => {
    return structure.reduce((acc, element) => {
      if (loopar.utils.trueValue(element.data?.searchable)) {
        acc.push(element);
      }

      if(element.elements) {
        acc.push(...filterByWritable(element.elements));
      }

      return acc;
    }, []);
    
  }

  const DOCTYPE = meta?.__DOCTYPE__ || {};

  if(action === "list"){
    return filterByWritable(JSON.parse(DOCTYPE.doc_structure || "[]"));
  }else{
    return JSON.parse(DOCTYPE.doc_structure || "[]");
  }
}

export function MetaComponents(__META__, environment){
  return extractElements(requireComponents(__META__), environment)
}