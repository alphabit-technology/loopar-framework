import Component from "../base/component.js";
import {loopar} from "/loopar.js";
import {div} from "../elements.js";

export default class Generic extends Component {
   //blockComponent = true;
   dontHaveMetaElements = ["label"];
   constructor(props) {
      super(props);
   }

   validateTag(tag) {
      const validTags = ["div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "i", "ul", "li", "img", "input", "button", "form", "label", "select", "option", "textarea", "table", "tr", "td", "th", "thead", "tbody", "tfoot", "nav", "header", "footer", "main", "section", "article", "aside", "blockquote", "br", "hr", "iframe", "map", "area", "audio", "video", "canvas", "datalist", "details", "embed", "fieldset", "figure", "figcaption", "mark", "meter", "object", "output", "progress", "q", "ruby", "rt", "rp", "samp", "script", "style", "summary", "time", "track", "var", "wbr"];
      
      return validTags.includes(tag);
   }

   render(content) {
      const data = this.props.meta.data;
      this.tagName = this.validateTag(data.tag) ? data.tag : "div";

      if (this.tagDontHaveChild(data.tag) && this.elementsDict.length > 0) {
         loopar.dialog({
            title: "Warning",
            message: `This element have a child element, but the tag "${this.tagName}" don't have child elements. will be used the tag "div" instead.`,
            buttons: [
               {
                  label: "Ok",
                  className: "btn btn-primary",
                  onClick: () => {
                     loopar.closeDialog();
                  }
               }
            ]
         });

         this.tagName = "div";
      }

      if (this.tagDontHaveChild(data.tag)){
         this.tagName = "div";

         return super.render([
            React.createElement(data.tag, {
               //...(Object.entries(this.props.meta.data)).filter ((key, value) => typeof value === "string" ? { [key]: value } : value),
            })
         ]);
      }

      return super.render(this.elementsDict.length === 0 ? data.text : null);
   }

   get metaFields() {
      return [
         {
            group: 'HTML',
            elements: {
               tag: { element: INPUT },
            }
         }
      ]
   }
}