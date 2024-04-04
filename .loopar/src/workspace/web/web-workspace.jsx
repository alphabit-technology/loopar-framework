import React, {useEffect, useState} from "react";
import BaseWorkspace from "$workspace/base/base-workspace";
import loopar from "$loopar";
import {Link} from "$link";
import { marked } from 'marked';

import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import AOS from 'aos';
//import 'node_modules/aos/src/sass/aos.scss';
import 'aos/dist/aos.css';

const Layout = (({ webApp={}, ...props }) => {
  const { headerHeight } = useWorkspace();
  const [animated, setAnimated] = useState(false);

  const handlerInitAnimation = () => {
    AOS.init();
    setAnimated(true);
  }

  useEffect(() => {
    setTimeout(() => {
      handlerInitAnimation();
    }, 0);
  }, animated);
  
  return (
    <div className="vaul-drawer-wrapper">
      <TopNav />
      <section
        className="flex w-full"
        style={{ minHeight: `calc(100vh - ${headerHeight})`, position: "absolute", top: 0}}
      >
        <SideNav />
        <div
          className={`ease-induration-100 w-full overflow-auto duration-100 ease-in`}
        >
          {props.children}
        </div>
      </section>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          {webApp.has_footer ? (
            <div className="">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(webApp.footer || "") }} />
            </div>
          ) : null}
          {webApp.has_copyright ? (
            <div className="">
              <hr className="my-4" />
              <div dangerouslySetInnerHTML={{ __html: marked.parse(webApp.copyright || "") }} />
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
});

export default class WebWorkspace extends BaseWorkspace {
  headerHeight = "5rem";
  sidebarWidth = 250;
  collapseSidebarWidth = 0;

  menuItems() {
    const app = this.webApp();
    return app.menu_items?.rows || [];
  }

  webApp() {
    const __META__ = this.props.__META__;
    const workspace = JSON.parse(__META__.workspace);
    return workspace.web_app.__DOCUMENT__ || {};
  }


  render() {
    const meta = this.meta || {};
    const webApp = meta.web_app.__DOCUMENT__;

    //const profileImage = fileManager.getImage(user, "profile_picture", "profile.png");

    return super.render(
      <Layout {...this.props} webApp={webApp} >
        {super.documents}
      </Layout>
    )
  }

  getMenuItems(menuItems) {
    return menuItems.map((item) => {
      const active = item.page === loopar.currentPageName;
      return (
        <ul className="menu" key={loopar.currentPageName}>
          <li className={`menu-item ${active ? "active" : ""}`} ref={self => this[item.page] = self}>
            <Link
              className={`menu-link py-2`}// text-${theme}`}
              href={item.page}
            >
              {item.link}
            </Link>
          </li>
        </ul>
      )
    })
  }
}