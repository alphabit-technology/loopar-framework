import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import React from "react";

export default function DeskWorkspace(props){
  const {openNav, __DOCUMENTS__} = useWorkspace();
  const menuData = props.menu_data || [];

  return (
    <BaseWorkspace menuData={menuData}>
      <div className="vaul-drawer-wrapper flex flex-col min-h-screen">
        <meta name="robots" content="noindex, nofollow"/>
        <TopNav openNav={openNav}></TopNav>
        <section className="flex flex-col flex-1">
          <SideNav
            items={menuData}
          />
         <div
          className={`flex flex-col flex-1 w-full overflow-auto p-4 duration-100 lg:ml-4 ease-in ${
            openNav ? "lg:pl-sidebar-width" : "lg:pl-collapse-sidebar-width"
          }`}
        >
            {__DOCUMENTS__}
          </div>
        </section>
      </div>
    </BaseWorkspace>
  )
}