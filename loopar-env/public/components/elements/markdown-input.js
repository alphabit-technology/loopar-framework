import { BaseInput } from "/components/base/base-input.js";

export default class MarkdownInput extends BaseInput {
   isWritable = true;

   constructor(props = {}) {
      super(props);
   }

   render() {
      const data = this.data;

      return super.render([
         React.createElement("div", this.innerHtml(marked.parse(data.value || "")))
      ]);
   }

   componentDidMount() {
      super.componentDidMount();
      const data = this.data;
      this.input.addClass('d-none');

      this.css({ 'display': 'block' });

      this.editor = new SimpleMDE({
         element: this.input.node,
         toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|"],
      });

      this.editor.value(data.value);

      this.editor.codemirror.on('change', () => {
         this.handleInputChange({ target: { value: this.editor.value() } })
      });
   }

   val(value) {
      if (!value) {
         return this.editor.value();
      } else {
         this.editor.value(value);
      }
   }
}