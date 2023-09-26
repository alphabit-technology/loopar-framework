import { loopar } from "/loopar.js";
import { Breadcrumbs } from "/components/layout/breadcrumbs.js";
import Div from "/components/elements/div.js";
import { header, div, span, h6, h1, button } from "/components/elements.js";

class HeaderClass extends Div {
   constructor(props) {
      super(props);
   }

   getTitle() {
      const meta = this.meta;
      const context = ["create", "update"].includes(meta.action) ? "form" : meta.action;

      return ((meta.title || context === 'module') ? meta.module_group :
         (['list', 'view'].includes(context) || meta.action === 'create') ? meta.__DOCTYPE__.name : meta.__DOCUMENT__.name) || meta.__DOCTYPE__.name;
   }
   
   get docRef() {
      return this.props.gui.docRef;
   }

   get gui() {
      return this.props.gui;
   }

   get meta() {
      return this.gui.meta;
   }

   getContext() {
      const meta = this.meta;
      return ["create", "update"].includes(meta.action) ? "form" : meta.action;
   }

   formPrimaryActions() {
      const meta = this.meta;

      return this.docRef.canUpdate ? [
         button({
            className: "btn btn-primary", tabindex: "0", type: "button",
            onClick: () => {
               this.docRef.save();
            }
         }, [
            span({ className: "fa fa-save mr-1" }),
            " Save"
            //span(`Save ${meta.__DOCTYPE__.name}`)
         ]),
         meta.__IS_NEW__ ? null : meta.__DOCTYPE__.name === 'Document' ? button({
            className: "btn btn-success", tabindex: "1", type: "button",
            onClick: () => {
               if (meta.__DOCUMENT__.name) {
                  loopar.navigate(`/${meta.__DOCUMENT__.module}/${meta.__DOCUMENT__.name}/${meta.__DOCUMENT__.is_single ? 'update' : 'list'}`);
               }
            }
         }, [
            span(`Go to ${loopar.utils.Capitalize(meta.__DOCUMENT__.name)}`)
         ]) : null
      ] : []
   }

   listPrimaryActions() {
      const context = this.getContext();
      return [
         context === 'list' ? (
            this.docRef.primaryAction ? this.docRef.primaryAction() : button({
               className: "btn btn-success", tabindex: "0", type: "button",
               onClick: () => {
                  loopar.navigate('create');
               }
            }, [
               span({ className: "fa fa-plus" }),
               " New"
            ])
         ) : null,
         this.docRef.hasSidebar ? button({
            className: "btn btn-secondary", tabindex: "0", type: "button",
            onClick: () => {
               this.props.gui.toggleSidebar();
            }
         }, [
            span({ className: "fa fa-bars" })
         ]) : null
      ]
   }

   render() {
      //const meta = this.meta;
      const customActions = this.docRef.customActions || {};
      return header({
         className: "page-navs shadow-sm pr-3",
         style: { paddingLeft: "1rem", marginBottom: "unset" }
      }, [
         div({ className: "btn-account" }, [
            div({ className: "account-summary" }, [
               h1({ className: "card-title" }, loopar.utils.Capitalize(this.getTitle())),
               h6({ className: "card-subtitle text-muted" }, [
                  Breadcrumbs({ meta: this.meta })
               ])
            ]),
            div({ className: "ml-auto", style: { position: "fixed", right: "10px" } }, [
               div({ className: "btn-group mr-1" }, [
                  Object.values(customActions),
               ]),
               div({ className: "btn-group mr-1" }, [
                  ...this.formPrimaryActions(),
               ]),
               div({ className: "btn-group mr-1" }, [
                  ...this.listPrimaryActions(),
               ])
            ])
         ])
      ]);
   }
}

export const Header = (props, content) => {
   return React.createElement(HeaderClass, props, content);
}