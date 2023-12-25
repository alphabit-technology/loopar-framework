import BaseInput from "#base-input";
import loopar from "#loopar";

export default class BaseDate extends BaseInput {
   constructor(props) {
      super(props);
   }

   componentDidMount() {
      super.componentDidMount();

      loopar.scriptManager.loadStylesheet("/assets/plugins/datetime/css/dt");

      loopar.scriptManager.loadScript("/assets/plugins/datetime/js/dt", () => {
         if (this.input?.node) {
            this.dtsel = new dtsel.DTS(this.input.node, {
               direction: 'BOTTOM',
               showTime: this.type === 'datetime' || this.type === 'time',
               showDate: this.type !== 'time',
               onUpdateInput: (e) => {
                  e.preventDefault();
                  this.handleInputChange({ target: { value: e.value } });
               }
            });

            this.setState({})
         }
      });
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);

      const formattedValue = dayjs(this.props.meta.data.value).format(this.props.format);

      if (prevProps.meta.data.value !== formattedValue && this.dtsel) {
         this.props.meta.data.value = formattedValue;
         this.dtsel.inputElem.value = formattedValue;

         this.handleInputChange({ target: { value: formattedValue } });
      }
   }

   val(val) {
      if (val) {
         val = dayjs(val).format(this.format);
         this.dtsel.inputElem.value = val;
      } else {
         return this.dtsel ? this.dtsel.inputElem.value : this.data.value;
      }
   }
}