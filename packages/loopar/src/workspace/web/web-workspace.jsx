import React from "react";
import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import { Markdown } from "@pure-html-block";

const SEO = () => {
  return <>
  <meta property="og:locale" content="en_US"/>
  <meta property="og:type" content="website"/>
  <meta charset="utf-8"/>
  <meta name="generator" content="Loopar"/>
  <meta name="framework" content="Loopar"/>
  <meta name="cms" content="Loopar CMS"/>
  </>
}

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

  const containerClass = childMenu.length > 0
    ? 'lg:grid-cols-[var(--container-2xs)_minmax(0,1fr)] xl:grid-cols-[var(--container-2xs)_minmax(0,1fr)]'
    : 'grid-cols-1 w-full';

  const className = `grid min-h-dvh w-full grid-rows-[1fr_auto] pt-web-header-height ${containerClass}`;

  return (
    <div className="vaul-drawer-wrapper flex flex-col min-h-screen">
      <SEO/>
      <TopNav menuActions={webApp.menu_actions} />
      <main className="flex-grow flex">
        <section
          className={className}
        >
          <SideNav sideMenuItems={menuItemsTree} childMenu={childMenu} />
          <div
            className={` relative row-start-1 grid ${childMenu.length > 0 ? 'grid-cols-subgrid lg:col-start-2' : 'col-span-12'} mt-5`}
          >
            <div className="grid grid-cols-1">
              {props.children}
            </div>
          </div>
          <footer
            className="row-start-2 col-start-1 col-span-full py-6 border-t w-full"
          >
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row w-ful">
              {webApp.has_footer ? (
                <Markdown className="w-full text-center" content={webApp.footer}/>
              ) : null}
              {webApp.has_copyright ? (
                <Markdown className="w-full text-center" content={webApp.copyright}/>
              ) : null}
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
});

export default function WebWorkspace(props) {
  const { ActiveView, __META__ } = useWorkspace();

  const getWebApp = () => {
    return __META__.web_app || {};
  }

  const activePage = __META__.Document.Entity.name;

  return (
    <BaseWorkspace activePage={activePage} webApp={getWebApp()}>
      <Layout {...props}>
        {ActiveView}
      </Layout>
    </BaseWorkspace>
  )
}