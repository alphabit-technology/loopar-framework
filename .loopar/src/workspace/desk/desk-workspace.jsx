import http from "@tools/router/http";
import BaseWorkspace from "@workspace/base/base-workspace";
import fileManager from "@tools/file-manager";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";

const Layout = ((props) => {
  const {sidebarWidth, collapseSidebarWidth, screenSize, headerHeight, openNav} = useWorkspace();

  return (
   <>
    <TopNav openNav={openNav} height={headerHeight}></TopNav>
    <section style={{ minHeight: `calc(100vh - ${headerHeight}px)` }} className="flex">
      <SideNav
        items={props.menu_data}
      />
      <div 
        className={`ease-induration-100 ml-4 w-full overflow-auto p-4 duration-100 ease-in`}
        style={{ paddingLeft: (openNav && screenSize === "lg" ? sidebarWidth : screenSize === "lg" ? collapseSidebarWidth : 0 )}}
      >
        {props.children}
      </div>
    </section>
   </>
  );
});

export default class DeskWorkspace extends BaseWorkspace {
  sidebarWidth = 250;
  collapseSidebarWidth = 70;
  headerHeight = "2rem";
  
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      menu_data: props.menu_data || []
    };
  }

  menuItems() {
    const __META__ = this.props.__META__;
    return __META__.menu_data || [];
  }

  render() {
    const user = this.meta.user || {};
    const profileImage = fileManager.getImage(
      user,
      "profile_picture",
      "profile.png"
    );

    return super.render(
      <Layout {...this.props} menu_data={this.state.menu_data} >
        {super.documents}
      </Layout>
    )
  }

  async refresh() {
    return new Promise(resolve => {
      http.send({
        action: "/api/desk/sidebar",
        params: {},
        success: r => {
          if (r.meta?.sidebarData){
            this.state.menu_data = r.meta.sidebarData;
            resolve(r);
          }
        }
      });
    });
  }
}