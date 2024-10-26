import http from "@tools/router/http";
import BaseWorkspace from "@workspace/base/base-workspace";
import { SideNav } from './src/side-nav';
import { TopNav } from "./src/top-nav";
import { useWorkspace } from "@workspace/workspace-provider";
import React, {useState} from "react";

export default function DeskWorkspace(props){
  const {openNav, getDocuments, __META__={}} = useWorkspace();
  const [menuData, setMenuData] = useState(__META__?.menu_data || []);

  const refresh = () => {
    return new Promise(() => {
      http.send({
        action: "/api/desk/sidebar",
        params: {},
        success: r => {
          if (r.meta?.sidebarData){
            setMenuData(r.meta.sidebarData);
          }
        }
      });
    });
  }

  return (
    <BaseWorkspace menuData={menuData} refresh={refresh}>
      <TopNav openNav={openNav}></TopNav>
      <section className="flex min-h-headerHeight">
        <SideNav
          items={props.menu_data}
        />
        <div 
          className={`ease-induration-100 w-full overflow-auto p-4 duration-100 lg:ml-4 ease-in ${openNav ? "lg:pl-sidebarWidth" : "lg:pl-collapseSidebarWidth"}`}
        >
          {getDocuments()}
        </div>
      </section>
    </BaseWorkspace>
  )
}