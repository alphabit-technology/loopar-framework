import Component from "../base/component.js";

export default class Tab
   extends Component {
   className = "tab-pane fade";

   constructor(props) {
      super(props);
   }

   remove() {
      this.props.parentElement.removeTab(this.props.meta.data.key);
   }

   setData(data) {
      super.setData(data);
      this.props.parentElement.updateTab(this.props.meta.data.key, data);
   }
}