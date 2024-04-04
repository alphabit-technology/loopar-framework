import { jsx } from "react/jsx-runtime";
import { c as cn, l as loopar } from "../entry-server.js";
import { f as fileManager } from "./file-manager-elzUYIBp.js";
import { useState } from "react";
import { b as useDocument, u as useDesigner, B as BaseComponent } from "./base-component-BnGRdg1n.js";
function Droppable(props) {
  const [dropping, setDropping] = useState(false);
  const { children, receiver, className, Component: Component2 = "div" } = props;
  const document = useDocument();
  const mode = document.mode;
  const isDesigner = useDesigner().designerMode || props.isDesigner;
  const isDroppable = receiver.droppable || receiver.props.droppable || props.isDroppable;
  const droppableEvents = {};
  if (isDesigner && isDroppable && mode !== "preview" && receiver.drop) {
    droppableEvents.onDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDropping(true);
    };
    droppableEvents.onDragLeave = (e) => {
      e.preventDefault();
      setDropping(false);
    };
    droppableEvents.onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDropping(false);
      receiver.drop(e);
    };
  }
  const ClassNames = cn(
    mode !== "preview" && "h-full w-full p-3 py-6",
    dropping ? "bg-gradient-to-r from-slate-500/50 to-slate-600/50 shadow" : mode !== "preview" && "bg-slate-200/50 dark:bg-slate-900/50",
    className
  );
  const renderizableProps = {
    ...Object.keys(props).reduce((acc, key) => {
      if (typeof props[key] != "object" || (typeof props[key] === "function" || key === "children" || key === "style")) {
        acc[key] = props[key];
      }
      return acc;
    }, {})
  };
  return isDesigner && isDroppable ? /* @__PURE__ */ jsx(
    Component2,
    {
      ...renderizableProps,
      className: ClassNames,
      ...droppableEvents,
      children
    }
  ) : /* @__PURE__ */ jsx(Component2, { ...renderizableProps, children });
}
class Component extends BaseComponent {
  get droppable() {
    return true;
  }
  get draggable() {
    return true;
  }
  render(content) {
    !this.dontHaveBackground && !this.dontHaveContainer && this.backGround(false);
    return super.render(
      /* @__PURE__ */ jsx(Droppable, { receiver: this, children: content || this.props.children })
    );
  }
  rerender(content) {
    this.setState({ children: content });
  }
  getSrc() {
    const data = this.props.data;
    if (data) {
      return fileManager.getMappedFiles(data.background_image || this.props.src, data.name);
    }
    return [];
  }
  backGround(image) {
    var _a, _b;
    const data = this.props.data;
    if (image && (!data || !data.background_image || data.background_image === "[]")) {
      return {
        src: "/uploads/empty-image.svg"
      };
    }
    if (data) {
      if (data.background_image && data.background_image !== "[]") {
        const src = this.getSrc();
        if (src && src.length > 0) {
          const imageUrl = src[0].src || "/uploads/empty-image.svg";
          if (image) {
            return {
              src: imageUrl,
              alt: data.label || "",
              title: data.description || ""
            };
          } else if (this.props.element !== "image") {
            this.style = {
              ...this.style || {},
              ...{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: data.background_size || "cover",
                backgroundPosition: data.background_position || "center",
                backgroundRepeat: data.background_repeat || "no-repeat"
              }
            };
          }
        }
      } else if (this.style && this.style.backgroundImage) {
        delete this.style.backgroundImage;
      }
      if (data == null ? void 0 : data.background_color) {
        const color = loopar.utils.rgba(data.background_color);
        if (color) {
          this.style = {
            ...this.style || {},
            backgroundColor: color
          };
        } else if ((_a = this.style) == null ? void 0 : _a.backgroundColor) {
          delete this.style.backgroundColor;
        }
      } else if ((_b = this.style) == null ? void 0 : _b.backgroundColor) {
        delete this.style.backgroundColor;
      }
    } else if (this.style) {
      this.style.backgroundImage && delete this.style.backgroundImage;
      this.style.backgroundColor && delete this.style.backgroundColor;
    }
    return {
      style: this.style
    };
  }
  getSize(size = this.data.size) {
    return {
      xm: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl"
    }[size] || 5;
  }
  getAlign(align = this.data.text_align) {
    return {
      left: "text-left",
      center: "text-center",
      right: "text-right"
    }[align] || "text-left";
  }
  set(key, value, onChange = true) {
    let data = this.data;
    if (typeof key == "object") {
      Object.assign(data, key);
    } else {
      data[key] = value;
    }
    if (this.props.designerRef) {
      this.props.designerRef.updateElement(data.key, data);
    } else {
      this.setState({ data });
    }
    if (!onChange)
      return;
    this.onChange && this.onChange();
    this.props.onChange && this.props.onChange();
  }
}
export {
  Component as C,
  Droppable as D
};
