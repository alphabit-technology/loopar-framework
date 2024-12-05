import React, {useEffect, useState} from "react";
import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import AOS from 'aos';

const Layout = (({ webApp={}, ...props }) => {
  const { menuItems, activeParentMenu } = useWorkspace();
  const [animated, setAnimated] = useState(true);

  const handlerInitAnimation = () => {
    AOS.init({
      duration: 100,
      easing: 'ease-in-out',
      once: false,
    });

    setAnimated(true);
  }

  useEffect(() => {
    handlerInitAnimation();
  }, [animated]);

  function buildMenuTree(menu) {
    const menuMap = {};

    menu.forEach(item => {
      menuMap[item.link] = { ...item, items: [] };
    });

    const menuTree = [];

    menu.forEach(item => {
      if (item.parent_menu) {
        if (menuMap[item.parent_menu]) {
          menuMap[item.parent_menu].items.push(menuMap[item.link]);
        }else{
          menuTree.push(menuMap[item.link]);
        }
      } else {
        menuTree.push(menuMap[item.link]);
      }
    });

    return menuTree;
  }

  const menuItemsTree = buildMenuTree(menuItems);
  const childMenu = menuItemsTree.find(item => item.page === activeParentMenu)?.items || [];

  return (
    <div className="vaul-drawer-wrapper">
      <TopNav />
      <section
        className={`flex absolute w-full`}
      >
        <SideNav sideMenuItems={menuItemsTree} childMenu={childMenu}/>
        <div
          className={`ease-induration-100 w-full overflow-auto mt-web-header-height ${childMenu.length > 0 && 'lg:ml-web-sidebar-width'}`}
        >
          <div className="p-3">
            {props.children}
          </div>
        </div>
      </section>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          {webApp.has_footer ? (
            <div className="">
              <div dangerouslySetInnerHTML={{ __html: webApp.footer }} />
            </div>
          ) : null}
          {webApp.has_copyright ? (
            <div className="">
              <hr className="my-4" />
              <div dangerouslySetInnerHTML={{ __html: webApp.copyright }} />
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
});

export default function WebWorkspace(props) {
  const { getDocuments, __META__} = useWorkspace();

  const getWebApp = () => {
    const workspace =__META__.__WORKSPACE__ || {};
    return workspace.web_app || {};
  }

  const webApp = getWebApp();

  const menuItems = () => {
    return webApp.menu_items || [];
  }

  const activePage = __META__.__DOCUMENT__?.__ENTITY__?.name

  return (
    <BaseWorkspace menuItems={menuItems} activePage={activePage}>
      <Layout {...props} webApp={webApp}>
        {getDocuments()}
      </Layout>
    </BaseWorkspace>
  )
}