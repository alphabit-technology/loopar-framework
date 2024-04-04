import { l as loopar } from "../entry-server.js";
class ElementManage {
  constructor() {
  }
  initialize() {
    return new Promise((resolve) => {
      document.ready(() => {
        resolve();
      });
    });
  }
  elementName(element) {
    let counter = loopar["element" + element];
    counter = !counter || isNaN(counter) ? 1 : counter + 1;
    loopar["element" + element] = counter;
    const base_name = `${element}${counter}`;
    const id = base_name + "_" + this.uuid();
    return {
      id,
      name: id,
      label: loopar.utils.Capitalize(base_name)
    };
  }
  uuid() {
    return "el" + Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
  }
  getUniqueKey() {
    return Math.random().toString(36).substr(2, 9);
  }
  isJSON(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  fixElements(elements) {
    return elements.map((el) => {
      var _a, _b;
      el.data ?? (el.data = {});
      if (!el.data.name || !el.data.id || !el.data.label || !el.data.key) {
        const names = this.elementName(el.element);
        (_a = el.data).key ?? (_a.key = this.getUniqueKey());
        (_b = el.data).label ?? (_b.label = loopar.utils.Capitalize(names.label.replaceAll("_", " ")));
      }
      if (el.elements) {
        el.elements = this.fixElements(el.elements);
      }
      return el;
    });
  }
}
const elementManage = new ElementManage();
function styleToObject(style) {
  if (typeof style != "string")
    return style;
  return style.replaceAll(" ", "").split(";").reduce((acc, cur) => {
    const [key, value] = cur.split(":");
    acc[key] = value;
    return acc;
  }, {});
}
export {
  elementManage as e,
  styleToObject as s
};
