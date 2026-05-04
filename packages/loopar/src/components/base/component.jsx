import loopar from "loopar";
import fileManager from "@@file/file-manager";
import React from "react";
import elementManage from "@@tools/element-manage";

export default class Component extends React.Component {
  get droppable() {return true};
  get draggable() {return true};

  constructor(props) {
    super(props);

    this.state = {
      data: props.data,
    };
  }

  render(){
    return <></>
  }

  get identifier() {
    const { key, id, name } = this.data;
    return key ?? id ?? name ?? elementManage.getUniqueKey();
  }


  get data() {
    return this.state.data || this.props.data || {};
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

  componentDidMount() {
    if (this.props.Component) {
      this.Component = this.props.Component;
    }

    this.onMake && this.onMake();
    this.onUpdate && this.onUpdate();
    this.onMount && this.onMount();
  }

  componentDidUpdate() {
    this.onUpdate && this.onUpdate();
  }

  backGround(image) {
    const data = this.props.data;

    if (image && (!data || !data.background_image || data.background_image === '[]')) {
      return {
        src: "/uploads/empty-image.svg",
      };
    }

    if (data) {
      if (data.background_image && data.background_image !== '[]') {
        const src = this.getSrc();
        if (src && src.length > 0) {
          const imageUrl = src[0].src || "/uploads/empty-image.svg";

          if (image) {
            return {
              src: imageUrl,
              alt: data.label || "",
              title: data.description || "",
            };
          } else if (this.props.element !== "image") {
            this.style = {
              ...this.style || {},
              ...{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: data.background_size || "cover",
                backgroundPosition: data.background_position || "center",
                backgroundRepeat: data.background_repeat || "no-repeat",
              },
            };
          }
        }
      } else if (this.style && this.style.backgroundImage) {
        delete this.style.backgroundImage;
      }

      if (data?.background_color) {
        const color = loopar.utils.rgba(data.background_color);

        if (color) {
          this.style = {
            ...this.style || {},
            backgroundColor: color,
          };
        } else if (this.style?.backgroundColor) {
          delete this.style.backgroundColor;
        }
      } else if (this.style?.backgroundColor) {
        delete this.style.backgroundColor;
      }

    } else if (this.style) {
      this.style.backgroundImage && (delete this.style.backgroundImage);
      this.style.backgroundColor && (delete this.style.backgroundColor);
    }

    return {
      style: this.style,
    }
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
      "5xl": "text-5xl",
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

    loopar.Designer?.updateElement(data.key, data);
  }
}