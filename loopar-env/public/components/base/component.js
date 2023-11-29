import { div, a, i, span, style } from "/components/elements.js";
import { HTML } from "/components/base/html.js";

import { loopar } from "/loopar.js";
import { fileManager } from "../tools/file-manager.js";
import { ErrorBoundary } from "../tools/error-boundary.js";

export default class Component extends HTML {
   droppable = true;
   draggable = true;
   constructor(props) {
      super(props);
   }

   render(content) {
      (!this.dontHaveBackground && !this.dontHaveContainer) && this.backGround(false);

      return super.render([
         ErrorBoundary(this.props, [
            (this.props.hasTitle && this.props.designer) ? [
               div({ className: "element-title" }, [
                  div({ className: "btn-group element-options" }, [
                     a({
                        className: "btn btn-default btn-xs element-title-action", onClick: () => {
                           loopar.documentForm.editElement(this);
                        }
                     }, [
                        i({ className: "oi oi-pencil" })
                     ]),
                     a({
                        className: "btn btn-default btn-xs element-title-action",
                        onClick: () => {
                           loopar.dialog({
                              type: "confirm",
                              title: "Delete element",
                              message: `Are you sure you want to delete this element?`,
                              open: true,
                              ok: () => {
                                 this.props.designerRef.deleteElement(this.props.meta.data.key);
                              },
                           });
                        }
                     }, [
                        i({ className: "oi oi-trash" })
                     ]),
                  ]),
                  div({ className: "btn-group title-description" }, [
                     a({ className: "btn btn-default btn-xs element-title-text" }, [
                        span((this.props.elementTitle || this.props.element).toString().split(".")[0].toUpperCase())
                     ])
                  ])
               ])
            ] : null,
            content || this.props.children,
         ])
      ])
   }

   componentDidMount(prevProps, prevState, snapshot) {
      super.componentDidMount(prevProps, prevState, snapshot);
      if (this.props.designer) {
         this.addClass("element designer");
         if (this.droppable || this.props.droppable) {
            (this.container || this).addClass("droppable");
            (this.container || this).droppableActions();
         }

         /*if (this.props.draggable) {
            this.addClass("draggable");
            this.draggableActions();
         }*/

         this.draggableActions();
         this.addClass("draggable");
      }

      if (this.props.hasTitle) {
         this.setAttrs({
            onMouseOut: (e) => {
               //this.removeClass("hover");
               this.node?.classList.remove("hover");
            },
            onMouseOver: (e) => {
               e.stopPropagation();
               this.node?.classList.add("hover");
               //this.addClass("hover");
            }
         });
      }
   }

   rerender(content) {
      this.setState({ children: content });
   }

   getSrc() {
      const data = this.props.meta?.data;
      if (data) {
         return fileManager.getMappedFiles(data.background_image || this.props.src, data.name);
      }
      return [];
   }

   backGround(image) {
      const data = this.props.meta?.data;

      if(image && (!data || !data.background_image || data.background_image === '[]')) {
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
         }else if (this.style && this.style.backgroundImage) {
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
   }


   getSize(size=this.meta.data.size) {
      return {
         xm: 5,
         sm: 4,
         md: 3,
         lg: 2,
         xl: 1
      }[size] || 5;
   }

   getAlign(align=this.meta.data.text_align) {
      return {
         left: "text-left",
         center: "text-center",
         right: "text-right"
      }[align] || "text-left";
   }

   set(key, value, onChange = true){
      const meta = this.props.meta;
      let data = meta.data;

      if(typeof key == "object"){
         Object.assign(data, key);
      }else{
         data[key] = value;
      }

      if(this.props.designerRef) {
         this.props.designerRef.updateElement(data.key, data);
      }else{
         meta.data = data;
         this.setState({meta})
      }

      if(!onChange) return;

      this.onChange && this.onChange();
      this.props.onChange && this.props.onChange();
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
   }
}