import { BaseInput } from "/components/base/base-input.js";
import { loopar } from "/loopar.js";

export default class Markdown extends BaseInput {
   is_writable = false;

   constructor(props = {}) {
      super(props);
   }

   render() {
      const data = this.props.meta.data;
      return super.render([
         !this.props.designer ? React.createElement("div", this.innerHtml(marked.parse(data.value || ""))) : null
      ]);
   }

   componentDidMount() {
      super.componentDidMount();
      const data = this.props.meta.data;
      //this.label.removeClass('d-block');
      this.label.addClass('d-none');
      this.input.addClass('d-none');

      this.css({ 'display': 'block' });

      if (this.props.designer) {
         this.editor = new SimpleMDE({
            element: this.input.node,
            toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview"],
         });
         this.editor.value(data.value);

         this.editor.codemirror.on('change', () => {
            this.props.designerRef && this.props.designerRef.updateElement(this.props.meta.data.name, { value: this.editor.value() });
         });
      } else {
         Object.values(this.node.getElementsByTagName("a")).forEach(a => {
            a.addEventListener("click", (e) => {
               e.preventDefault();
               e.stopPropagation();
               loopar.navigate(a.href);
            });
         });
      }
   }
}