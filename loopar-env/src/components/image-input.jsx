import FileInput from "#file-input";

export default class ImageInput extends FileInput {
   //inputType = 'file';

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