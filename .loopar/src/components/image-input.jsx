import FileInput from "$file-input";

export default class ImageInput extends FileInput {
   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         multiple: props.data.multiple || false,
         accept: props.data.accept || 'image/*',
      }
   }
}