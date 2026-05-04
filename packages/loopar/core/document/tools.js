import { fileManage } from "../file-manage.js";
import { loopar } from "../loopar.js";

export const parseDocStructure = async (doc_structure, renderMarkdown = true, document_name) => {
  doc_structure = loopar.utils.JSONparse(doc_structure, doc_structure);
  return Promise.all(
    doc_structure.map(async (field) => {
      field.data ??= {};

      //temporary assign a unique key to the field if it doesn't have one
      field.node ??= field.key || field.data.key || loopar.getUniqueKey();
      /* if (!field.key && field.data.key) {
        field.key = field.data.key;
      }

      if (!field.key) {
        field.key = loopar.getUniqueKey();
        // eslint-disable-next-line no-console
        console.warn(`[loopar] parseDocStructure: node loaded without key, assigned ${field.key}. document=${document_name ?? "?"} element=${field.element}`);
      } */

      //field.data.key = field.key;
      //if (field.data.id == null) field.data.id = field.key;

      if (field.element === MARKDOWN && renderMarkdown) {
        field.data.value = loopar.markdownRenderer(field.data.value);
      }

      if (field.element === REVIEW) {
        field.data.reviews = await loopar.db.getAll("Review", ["*"], {
          parent_id: document_name,
          approved: 1
        });
      }

      if (field.element === EXAMPLE_VIEWER && renderMarkdown) {
        field.data.rendered_value = loopar.markdownRenderer(
          loopar.utils.isJSON(field.data.value)
            ? JSON.stringify(JSON.parse(field.data.value), null, 3)
            : ""
        );
      }

      if (field.elements) {
        field.elements = await parseDocStructure(field.elements, renderMarkdown, document_name);
      }

      return field;
    })
  );
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