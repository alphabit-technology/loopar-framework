import FileInput from "./file-input.js";
export default class ImageInput extends FileInput {
   input_type = 'file';

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         multiple: props.meta.data.multiple || false,
         accept: props.meta.data.accept || 'image/*',
      }
   }

   render() {
      return super.render();
   }
}