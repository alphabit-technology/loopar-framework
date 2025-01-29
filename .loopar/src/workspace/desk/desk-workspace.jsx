import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import React from "react";

export default function DeskWorkspace(props){
  const {openNav, getDocuments} = useWorkspace();
  const menuData = props.menu_data || [];

  return (
    <BaseWorkspace menuData={menuData}>
      <TopNav openNav={openNav}></TopNav>
      <section className="flex-grow  min-h-header-height">
        <SideNav
          items={menuData}
        />
        <div 
          className={`ease-induration-100 w-full overflow-auto p-4 duration-100 lg:ml-4 ease-in ${openNav ? "lg:pl-sidebar-width" : "lg:pl-collapse-sidebar-width"}`}
        >
          {getDocuments()}
        </div>
      </section>
    </BaseWorkspace>
  )
}