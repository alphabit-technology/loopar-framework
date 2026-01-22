import { fileManage } from "../file-manage.js";
import { loopar } from "../loopar.js";

export const parseDocStructure = (doc_structure, renderMarkdown = true) => {
  return doc_structure.map((field) => {
    field.data = {
      ...field.data,
      key: field.data.key || loopar.getUniqueKey(),
    };

    if (field.element === MARKDOWN && renderMarkdown) {
      field.data.value = loopar.markdownRenderer(field.data.value);
    }

    if (field.element === EXAMPLE_VIEWER && renderMarkdown) {
      field.data.rendered_value = loopar.markdownRenderer(
        loopar.utils.isJSON(field.data.value) 
          ? JSON.stringify(JSON.parse(field.data.value), null, 3) 
          : ""
      );
    }

    if (field.elements) {
      field.elements = parseDocStructure(field.elements, renderMarkdown);
    }

    return field;
  });
};

export const parseDocument = (entity, doc) => {
  const ref = loopar.getRef(entity);
  const structure = JSON.parse(
    fileManage.getConfigFile(entity, ref.__ROOT__).doc_structure
  );

  const fieldMap = new Map();

  const buildFieldMap = (fields) => {
    fields.forEach((field) => {
      fieldMap.set(field.data.name, field);
      if (field.elements) buildFieldMap(field.elements);
    });
  };

  buildFieldMap(structure);

  Object.entries(doc || {}).forEach(([key, value]) => {
    const field = fieldMap.get(key);
    if (field?.element === MARKDOWN_INPUT) {
      doc[key] = loopar.markdownRenderer(value);
    }
  });

  return doc;
};