
import Div from '#div';

export default class DeskSidebarClass extends Div {
   tagName = "ul";
   className = "menu";

   constructor(props) {
      super(props);
   }

   render() {
      const data = this.props.meta.menu_data;
      super.render(
         data.map(group => [
            <li key={group.description + "-group"} className="menu-header">
               {group.description}
            </li>,
            ...group.modules.map(module => (
               <li key={module.name + "menu-item"} className="menu-item">
                  <a
                     className="menu-link"
                     href={`/desk/${module.link}`}
                  >
                     <span className={`menu-icon ${module.icon}`} />
                     <span className="menu-text">{module.description}</span>
                  </a>
               </li>
            )),
         ])
      );
   }
}