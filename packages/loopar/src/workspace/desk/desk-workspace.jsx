import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";

export default function DeskWorkspace(props){
  const {openNav, ActiveView} = useWorkspace();
  const menuData = props.menuData || [];

  return (
    <BaseWorkspace menuData={menuData}>
      <div 
        className="vaul-drawer-wrapper flex flex-col min-h-screen"
      >
        <meta name="robots" content="noindex, nofollow"/>
        <TopNav openNav={openNav}></TopNav>
        <section className="flex flex-col flex-1">
          <SideNav
            items={menuData}
          />
         <div
          className={`flex flex-col flex-1 w-full overflow-auto duration-100 ease-in ${
            openNav ? "lg:pl-sidebar-width" : "lg:pl-collapse-sidebar-width"
          }`}
        >
          <div className="p-4">
            {ActiveView}
          </div>
          </div>
        </section>
      </div>
    </BaseWorkspace>
  )
}