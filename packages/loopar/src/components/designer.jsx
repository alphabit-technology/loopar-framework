import loopar from "loopar";
import elementManage from "@tools/element-manage";
import React, { useEffect } from "react";
import BaseInput from "@base-input";
import { Designer } from "./designer/base-designer";
import Emitter from '@services/emitter/emitter';

export default function MetaDesigner(props) {
  const { renderInput, data, value } = BaseInput(props);

  const makeElements = (elements) => {
    value(JSON.stringify(elementManage.fixElements(elements)));
  }

  const getElements = () => {
    return JSON.parse(value() || "[]");
  }

  const updateElements = (target, elements, current = null) => {
    const currentElements = getElements();
    const targetKey = target.data.key;
    const currentKey = current ? current.data.key : null;

    const lastParentKey = current ? current.parentKey : null;
    const selfKey = data.key;

    /**Search target in structure and set elements in target*/
    const setElementsInTarget = (structure) => {
      return structure.map((el) => {
        el.elements = el.data.key === targetKey ? elements
          : setElementsInTarget(el.elements || []);
        return el;
      });
    };

    /**Search target in structure and set elements in target, if target is self set directly in self*/
    let newElements = targetKey === selfKey ? elements
      : setElementsInTarget(currentElements, selfKey);

    /**Search current in structure and delete current in last parent*/
    const deleteCurrentOnLastParent = (structure, parent) => {
      if (lastParentKey === parent) {
        return structure.filter((e) => e.data.key !== currentKey);
      }

      return structure.map((el) => {
        el.elements = deleteCurrentOnLastParent(el.elements || [], el.data.key);
        return el;
      });
    };

    if (current && lastParentKey !== targetKey) {
      newElements = deleteCurrentOnLastParent(newElements, selfKey);
    }

    makeElements(newElements);
  }

  const findElement = (field, value, elements = getElements()) => {
    if (!value || value === "null" || value.length == 0) return null;
    
    for (let i = 0; i < elements.length; i++) {
      if (elements[i]?.data?.[field] === value) {
        return elements[i];
      } else if (Array.isArray(elements[i]?.elements)) {
        const found = findElement(field, value, elements[i].elements);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };


  const getElement = (key) => {
    return findElement("key", key);
  }

  const deleteElement = (element) => {
    const removeElement = (elements = getElements()) => {
      return elements.filter((el) => {
        if (el.data.key === element) {
          return false;
        } else if (el.elements) {
          el.elements = removeElement(el.elements);
        }

        return true;
      });
    };

    makeElements(removeElement());
  }

  const updateElement = (key, data, merge = true) => {
    const selfElements = getElements();

    if (data.name) {
      const exist = findElement("name", data.name, selfElements);

      if (exist && exist.data.key !== key) {
        loopar.throw(
          "Duplicate field",
          `The field with the name: ${data.name} already exists, your current field will keep the name: ${data.name} please check your fields and try again.`
        );
        return false;
      }
    }

    const updateE = (structure) => {
      return structure.map((el) => {
        if (el.data.key === key) {
          el.data = merge ? Object.assign({}, el.data, data) : data;
          el.data.key ??= elementManage.getUniqueKey();
        } else {
          el.elements = updateE(el.elements || []);
        }

        /**Purify Data */
        el.data = Object.entries(el.data).reduce((obj, [key, value]) => {
          if (
            key === "background_color" &&
            JSON.stringify(value) === '{"color":"#000000","alpha":0.5}'
          ) {
            return obj;
          }

          if (![null,undefined,"","0","false",false,'{"color":"#000000","alpha":0.5}',].includes(value)) {
            obj[key] = value;
          }
          return obj;
        }, {});
        /**Purify Meta */

        return { element: el.element, data: el.data, elements: el.elements };
      });
    };

    makeElements(updateE(selfElements));
    Emitter.emit("currentElementEdit", data.key);
  }

  const findDuplicateNames = () => {
    const elements = getElements();
    const [names, duplicates] = [new Set(), new Set()];

    const traverseElements = (el) => {
      if (el.data.name && names.has(el.data.name)) {
        duplicates.add(el.data.name);
      } else {
        names.add(el.data.name);
      }

      if (el.elements && el.elements.length) {
        el.elements.forEach(traverseElements);
      }
    };

    elements.forEach(traverseElements);
  }

  const validate = () => {
    const duplicates = findDuplicateNames();

    return {
      valid: !duplicates.length,
      message: `Duplicate names: ${duplicates.join(
        ", "
      )}, please check your structure.`,
    };
  }

  return renderInput((field) => {
    return (
      <Designer
        metaComponents={field.value}
        designerRef={{
          updateElements,
          getElement,
          deleteElement,
          updateElement,
          setMeta: makeElements,
          findElement
        }}
        data={data}
      />
    )
  });
}
