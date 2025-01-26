import React from "react";
import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import { Markdown } from "@components/base/pure-html-block";

const Layout = (({ ...props }) => {
  const { activeParentMenu, webApp } = useWorkspace();

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
        } else {
          menuTree.push(menuMap[item.link]);
        }
      } else {
        menuTree.push(menuMap[item.link]);
      }
    });

    return menuTree;
  }

  const menuItemsTree = buildMenuTree(webApp.menu_items);
  const childMenu = menuItemsTree.find(item => item.page === activeParentMenu)?.items || [];

  return (
    <div className="vaul-drawer-wrapper">
      <TopNav menuActions={webApp.menu_actions} />
      <section
        className={`flex flex-col absolute w-full`}
      >
        <SideNav sideMenuItems={menuItemsTree} childMenu={childMenu} />
        <div
          className={`ease-induration-100 w-full overflow-aut mt-web-header-height ${childMenu.length > 0 && 'lg:ml-web-sidebar-width'}`}
        >
          <div className="">
            {props.children}
          </div>
        </div>
        <footer className="py-6 border-t">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            {webApp.has_footer ? (
              <Markdown className="w-full text-center">{webApp.footer}</Markdown>
            ) : null}
            {webApp.has_copyright ? (
              <Markdown className="w-full text-center">{webApp.copyright}</Markdown>
            ) : null}
          </div>
        </footer>
      </section>

    </div>
  );
});

export default function WebWorkspace(props) {
  const { getDocuments, __META__ } = useWorkspace();

  const getWebApp = () => {
    const workspace = __META__.__WORKSPACE__ || {};
    return workspace.web_app || {};
  }

  const activePage = __META__.__DOCUMENT__?.__ENTITY__?.name;

  return (
    <BaseWorkspace activePage={activePage} webApp={getWebApp()}>
      <Layout {...props}>
        {getDocuments()}
      </Layout>
    </BaseWorkspace>
  )
}