import Component from "../base/component.js";

export default class Tab
   extends Component {
   className = "tab-pane fade";

   constructor(props) {
      super(props);
   }

   remove() {
      this.parent_component.removeTab(this.data.name);
   }

   setData(data){
      this.parent_component.updateTab(this.data.name, data);
   }
}