import { BaseInput } from "/components/base/base-input.js";
import { loopar } from "/loopar.js";

export default class Markdown extends BaseInput {
   isWritable = false;

   constructor(props = {}) {
      super(props);

      this.state = {
         ...this.state,
         parsedData: null,
      };
   }

   render() {
      const data = this.props.meta.data;
      //if(this.state.parsedData) {
         /*return this.props.designer ? super.render([
            this.state.parsedData ? React.createElement("div", this.innerHtml(this.state.parsedData)) : null
         ]) : this.state.parsedData ? React.createElement("div", this.innerHtml(this.state.parsedData)) : null;*/
      //}

      /*return super.render([
         (!this.props.designer && this.state.parsedData) ? React.createElement("div", this.innerHtml(this.state.parsedData)) : null
      ]);*/

      return this.props.designer ? super.render([
         //React.createElement("div", this.innerHtml(marked.parse(data.value || "")))
      ]) : this.state.parsedData && React.createElement("div", this.innerHtml(this.state.parsedData));
   }

   componentDidMount() {
      super.componentDidMount();
      const data = this.props.meta.data;

      if (this.props.designer) {
         this.label?.addClass('d-none');
         this.input?.addClass('d-none');

         loopar.includeCSS("/assets/plugins/simplemde/css/simplemde.min");
         loopar.require("/assets/plugins/simplemde/js/simplemde.min", () => {
            this.editor = new SimpleMDE({
               element: this.input.node,
               toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview"],
            });
            this.editor.value(data.value);

            this.editor.codemirror.on('change', () => {
               this.set("value", this.editor.value());
            });

            this.setState({ parsedData: marked.parse(data.value || "") });
         });
      } else {
         if(this.state.parsedData){
            /*Object.values(this.node.getElementsByTagName("a")).forEach(a => {
               a.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation(); 

                  loopar.navigate(a.href);
               });
            });*/
         }else{
            if(data.has_inside_data){
               loopar.require("/twig.min", () => {
                  const vars = data.ref_data.split("\n");

                  const values = vars.reduce((obj, v) => {
                     obj[v] = this.props.docRef[v];
                     return obj;
                  }, {});

                  const content = Twig.twig({data: marked.parse(data.value || "")})?.render(values);
                  
                  this.setState({ parsedData: content });
               });
            }else{
               this.setState({ parsedData: marked.parse(data.value || "")});
            }
         }
      }
      //}
   }

   get metaFields() {
      return [
         {
            group: "custom",
            elements: {
               has_inside_data: {
                  element: SWITCH,
                  data: {
                     description: "If you need to use data inside the markdown, check this option and use the variable {{ data }} inside the markdown."
                  }
               },
               ref_data: {
                  element: TEXTAREA,
                  data: {
                     description: "Define name of the variable to be used inside the markdown, this variable will be taked from the data of the document"
                  }
               }
            }
         }
      ]
   }
}