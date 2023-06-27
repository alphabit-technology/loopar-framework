import {BaseInput} from "/components/base/base-input.js";
import {div} from "/components/elements.js";

export default class TextEditor extends BaseInput {
   toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],

      [{'header': 1}, {'header': 2}],               // custom button values
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'script': 'sub'}, {'script': 'super'}],      // superscript/subscript
      [{'indent': '-1'}, {'indent': '+1'}],          // outdent/indent
      [{'direction': 'rtl'}],                         // text direction

      [{'size': ['small', false, 'large', 'huge']}],  // custom dropdown
      [{'header': [1, 2, 3, 4, 5, 6, false]}],

      [{'color': []}, {'background': []}],          // dropdown with defaults from theme
      [{'font': []}],
      [{'align': []}],

      ['clean']                                         // remove formatting button
   ];

   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         div({
            className: 'text-editor', ref: editor_container => this.editor_container = editor_container,
            style: {height: 300}
         })
      ]);
   }

   componentDidMount() {
      super.componentDidMount();

      this.input.addClass('d-none');
      this.label.addClass('d-none');

      this.editor = new Quill(this.editor_container.node, {
         modules: {
            toolbar: this.toolbarOptions
         },
         theme: 'snow'
      });

      this.editor.on('text-change', (delta, oldDelta, source) => {
         this.handleInputChange({ target: { value: this.editor.getContents()}});
      });

      this.editor.setContents(JSON.parse(this.data.value || "{}"));
   }

   val(val = null) {
      if (val != null) {
         this.editor.setContents(JSON.parse(val || "{}"));
         this.trigger('change');
      } else {
         return JSON.stringify(this.editor.getContents());
      }
   }
}