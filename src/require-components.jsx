import loopar from "$loopar";

export function requireComponents(__META__) {
  const meta = typeof __META__.meta == "object" ? __META__.meta : JSON.parse(__META__.meta)
  const action = ["update", "create"].includes(__META__.action) ? "form" : __META__.action;

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