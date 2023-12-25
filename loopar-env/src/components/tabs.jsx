
import Component from "#component";
import elementManage from "#tools/element-manage";
import loopar from "#loopar";

export default class Tabs extends Component {
   className = "card";
   droppable = false;
   blockComponent = true;

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         active: this.currentTab()
      }
   }

   addTab() {
      const elements = this.elementsDict;
      const [name, label] = [`tab_${elementManage.uuid()}`, `Tab ${elements.length + 1}`];

      const tab = [{
         element: "tab",
         data: {
            name,
            id: name,
            label,
            droppable: true,
            draggable: false,
            key: name
         },
      }];

      this.setElements(tab, () => {
         this.selectTab(name);
      });
   }

   selectLastTab() {
      const elements = this.elementsDict;
      this.selectTab(elements[elements.length - 1]?.data?.key);
   }

   selectFirstTab() {
      const elements = this.elementsDict;
      this.selectTab(elements[0]?.data?.key);
   }

   /*removeTab(key) {
      console.log("removing tab", key)
      this.setElements(this.elementsDict.filter(element => element.data.key !== key), false, () => {
         this.selectLastTab();
      });
   }*/

   selectTab(key) {
      !this.props.notManageSelectedStatus && localStorage.setItem(this.props.meta.data.key, key);

      this.setState(prevState => {
         if (prevState.active !== key) {
            return { active: key };
         }
      }, () => {
         this[key] && this.props.designer && loopar.sidebarOption !== "preview" && loopar.documentForm.editElement(this[key]);
      });
   }

   updateTab(key, data) {
      const elements = this.elementsDict.map((element) => {
         if (element.data.key === key) {
            element.data = data;
         }

         return element;
      });

      this.setElements(elements, null, false);
   }

   /*setElements(elements, callback) {
      super.setElements([], () => {
         callback && callback();
      });
   }*/

   currentTab() {
      return this.props.notManageSelectedStatus ? null : localStorage.getItem(this.props.meta.data.key);
   }

   componentDidMount() {
      super.componentDidMount();

      if (JSON.stringify(elementManage.fixElements(super.elementsDict)) !== JSON.stringify(super.elementsDict)) {
         this.setElements(elementManage.fixElements(super.elementsDict));
      }

      if (this.elementsDict.length === 0 && this.props.designer) {
         this.addTab();
      } else {
         !this.checkIfTabExists(this.currentTab()) && this.selectFirstTab();
      }
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);

      const currentTab = this.currentTab();
      if (currentTab && !this.checkIfTabExists(currentTab)) {
         //this.selectFirstTab();
      }
   }

   checkIfTabExists(key) {
      return this.elementsDict.some(element => element.data.key === key);
   }

   get elementsDict() {
      return this.props.designer ? super.elementsDict : this.props.children || super.elementsDict;
      /*return super.elementsDict;
      return this.props.children || super.elementsDict;*/
   }

   render() {
      const elementsDict = this.elementsDict || [];
      const bodyStyle = this.props.bodyStyle || {};

      return super.render(
         <>
            <div className="card-header" style={{ ...(this.props.headerStyle || {}) }}>
               {this.props.meta.data.label ? <h4 className="card-title">{this.props.meta.data.label}</h4> : null}
               <ul className="nav nav-tabs card-header-tabs">
                  {elementsDict.map(element => {
                     return (
                        <li className="nav-item">
                           <a
                              className={"nav-link" + (element.data.key === this.state.active ? " active" : "")}
                              onClick={(e) => {
                                 e.preventDefault();
                                 this.selectTab(element.data.key);
                              }}
                              data-toggle="tab"
                           >
                              {element.data.label}
                           </a>
                        </li>
                     )
                  })}
                  {this.props.designer ? (
                     <li className="nav-item">
                        <a
                           className="nav-link"
                           onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              this.addTab();
                           }}
                        >
                           <i className="fa fa-plus"></i>
                        </a>
                     </li>
                  ) : null}
               </ul>
            </div>
         </>
      )
   }
}

class TabClass extends Component {
   constructor(props) {
      super(props);
   }

   /*remove() {
      this.props.parentElement.removeTab(this.props.meta.data.key);
   }*/

   setData(data) {
      super.setData(data);
      this.props.parentElement.updateTab(this.props.meta.data.key, data);
   }
}

const Tab = (options, content) => {
   return React.createElement(TabClass, options, content);
}