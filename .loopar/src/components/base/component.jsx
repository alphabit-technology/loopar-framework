
import loopar from "$loopar";
import fileManager from "$tools/file-manager";
import ErrorBoundary from "$error-boundary";
import BaseComponent from "$base-component";
import { Droppable } from "$droppable";
export default class Component extends BaseComponent {
  get droppable() {return true};
  get draggable() {return true};

  render(content) {
    (!this.dontHaveBackground && !this.dontHaveContainer) && this.backGround(false);

    return super.render(
      <Droppable receiver={this}>
        {content || this.props.children}
       </Droppable>
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
    /*if (this.props.designerRef) {
      this.props.designerRef.updateElement(data.key, data);
    } else {
      //meta.data = data;
      this.setState({ data })
    }

    if (!onChange) return;

    this.onChange && this.onChange();
    this.props.onChange && this.props.onChange();*/
  }
}