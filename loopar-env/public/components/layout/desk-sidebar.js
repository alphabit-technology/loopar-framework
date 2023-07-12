'use strict';
import {a, li, span} from '/components/elements.js';
import Div from '/components/elements/div.js';

class DeskSidebarClass extends Div {
   tag_name = "ul";
   className = "menu";

   constructor(props) {
      super(props);
   }

   render() {
      const data = this.props.meta.menu_data;

      return super.render(
         data.map(group => {
            return [
               li({key: group.description + "-group", className: 'menu-header'}, group.description),
               ...group.modules.map(module => {
                  return li({className: 'menu-item'}, [
                     a({
                        key: module.name + "menu-item", className: 'menu-link',
                        //href: `/desk/core/Module/view?document_name=${module.link}`
                        href: `/desk/${module.link}`
                     }, [
                        span({className: `menu-icon ${module.icon}`}),
                        span({className: 'menu-text'}, module.description)
                     ])
                  ]);
               })
            ];
         })
      )
   }
}

export const DeskSidebar = (props, content) => {
   return React.createElement(DeskSidebarClass, props, content);
}