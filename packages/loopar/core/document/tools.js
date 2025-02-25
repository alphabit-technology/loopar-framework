import { renderMarkdownSSR } from "markdown";
import {fileManage} from "../file-manage.js";
import {loopar} from "../loopar.js";

export const parseDocStructure = async (doc_structure) => {
  return Promise.all(
    doc_structure.map(async (field) => {
      if (field.element === MARKDOWN) {
        field.data.value = await renderMarkdownSSR(field.data.value);
      }

      if (field.elements) {
        field.elements = await parseDocStructure(field.elements);
      }

      return field;
    })
  );
}

export const parseDocument = async (entity, doc) => {
  const ref = loopar.getRef(entity);
  const structure = JSON.parse(fileManage.getConfigFile(entity, ref.__ROOT__).doc_structure);

  const fieldMap = new Map();

  const buildFieldMap = (fields) => {
    fields.forEach((field) => {
      fieldMap.set(field.data.name, field);
      if (field.elements) buildFieldMap(field.elements);
    });
  };

  buildFieldMap(structure);

  const promises = Object.entries(doc || {}).map(async ([key, value]) => {
    const field = fieldMap.get(key);
    if (field?.element === MARKDOWN_INPUT) {
      doc[key] = await renderMarkdownSSR(value);
    }
  });

  await Promise.all(promises);
  return doc;
};
