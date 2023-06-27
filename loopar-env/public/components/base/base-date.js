import {BaseInput} from "./base-input.js";

export default class BaseDate extends BaseInput {
   constructor(props) {
      super(props);
   }

   componentDidMount() {
      super.componentDidMount();

      this.dtsel = new dtsel.DTS(this.input.node, {
         direction: 'BOTTOM',
         showTime: this.type === 'datetime' || this.type === 'time',
         showDate: this.type !== 'time',
         onUpdateInput: (e) => {
            this.handleInputChange({target: {value: e.value}});
         }
      });
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
      const formattedValue = dayjs(this.props.meta.data.value).format(this.props.format);

      if (prevProps.meta.data.value !== formattedValue){
         this.props.meta.data.value = formattedValue;
         this.dtsel.inputElem.value = formattedValue;

         this.handleInputChange({target: {value: formattedValue}});
      }
   }

   val(val) {
      if(val){

         val = dayjs(val).format(this.format);
         this.dtsel.inputElem.value = val;
      }else{
         return this.dtsel.inputElem.value;
      }
   }
}