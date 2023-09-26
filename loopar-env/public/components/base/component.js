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
      const data = this.props.meta?.data || {};
      this.backGround(false);

      const backgroundColor = data.background_color;
      const { color, alpha } = backgroundColor || {};

      /*this.style = {
         ...this.style || {},
         backgroundColor: color || "transparent",
         opacity: alpha || 1
      }*/

      //if(color) this.className = this.className + " " + data.name;

      return super.render([
         ErrorBoundary({}, [
            (this.props.has_title && this.props.designer) ? [
               div({ className: "element-title" }, [
                  div({ className: "btn-group element-options" }, [
                     a({
                        className: "btn btn-default btn-xs element-title-action", onClick: () => {
                           loopar.documentForm.editElement(this.props);
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
                                 this.props.designerRef.deleteElement(this.props.meta.data.name);
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
            /*(color && this.props.element !== COLOR_PICKER && !this.has_image) ? div({
               className: "background-color",
               style: {
                  backgroundColor: color,
                  opacity: alpha || 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%"
               }
            }) : null,*/
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

         if (this.props.draggable) {
            this.addClass("draggable");
            this.draggableActions();
         }

         this.addClass("draggable");
      }

      if (this.props.has_title) {
         this.setAttrs({
            onMouseOut: (e) => {
               this.removeClass("hover");
            },
            onMouseOver: (e) => {
               e.stopPropagation();
               this.addClass("hover");
            }
         });
      }
   }

   rerender(content) {
      this.setState({ children: content });
   }

   getSrc() {
      const data = this.props.meta.data;
      return fileManager.getMappedFiles(data.background_image, data.name);
   }

   backGround(image) {
      if (this.props.meta && this.props.meta.data) {
         let src = this.getSrc();
         const data = this.props.meta.data;

         if (src && src.length > 0) {
            this.has_image = true;
            src = src[0];
            const imageUrl = src.src || "/uploads/empty-image.svg";

            if (image) {
               return {
                  src: imageUrl,
                  alt: data.label || "",
                  title: data.description || "",

               }
            } else if (this.props.element !== "image") {
               this.style = {
                  ...this.style || {},
                  ...{
                     backgroundImage: `url('${imageUrl}')`,
                     backgroundSize: data.background_size || "cover",
                     backgroundPosition: data.background_position || "center",
                     backgroundRepeat: data.background_repeat || "no-repeat"
                  }
               }
            }
            return;
         }
      }
      if (image) {
         return {
            src: "/uploads/empty-image.svg",
         }
      }

      this.style = {
         ...this.style || {},
         ...{
            backgroundImage: "unset"
         }
      }
   }
}