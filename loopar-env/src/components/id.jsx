import BaseInput from '#base-input';

export default class Id extends BaseInput {
   type = "input";
   constructor(props) {
      super(props);
   }

   componentDidUpdate(prevProps) {
      super.componentDidUpdate(prevProps);
   }
}