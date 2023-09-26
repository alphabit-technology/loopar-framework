import { loopar } from "/loopar.js";
import { li, a, i } from "/components/elements.js";
import { HTML } from "/components/base/html.js";

class BreadcrumbsClass extends HTML {
   className = "breadcrumb";
   tagName = "ol";
   constructor(props) {
      super(props);
   }

   make_links() {
      const meta = this.props.meta;
      const data_links = [];

      if (meta.__DOCTYPE__.module) {
         const text = loopar.utils.Capitalize(this.context === 'module' ? 'Home' : meta.__DOCTYPE__.module);
         const link = this.context === 'module' ? '/' : `/${meta.__DOCTYPE__.module}`;

         data_links.push({ text: text, link: link, has_icon: true });
      }

      if (meta.__DOCTYPE__.name && this.context !== 'module' && !meta.__DOCTYPE__.is_single) {
         data_links.push({ text: loopar.utils.Capitalize(meta.__DOCTYPE__.name), link: `/${meta.__DOCTYPE__.module}/${meta.__DOCTYPE__.name}/list`, has_icon: false });
      }

      if (meta.action) {
         data_links.push({ text: this.context === 'module' ? meta.module_group : meta.action, link: null, has_icon: false });
      }

      return data_links;
   }

   render() {
      const data_links = this.make_links();

      return super.render(
         data_links.map(link => {
            return li({ className: "breadcrumb-item", ...{ "href": link.link || "#" } }, [
               a({ href: "javascript:void(0);" }, [
                  link.has_icon ? i({ className: "breadcrumb-icon fa fa-angle-left mr-2 disabled" }) : null,
                  link.text
               ])
            ])
         })
      );
   }
}

export const Breadcrumbs = (props, content) => {
   return React.createElement(BreadcrumbsClass, props, content);
}