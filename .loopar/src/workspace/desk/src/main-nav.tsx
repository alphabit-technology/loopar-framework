import {DeskLogo} from './desk-logo';
import { MenuIcon, XIcon } from 'lucide-react';
import { useWorkspace } from "@workspace/workspace-provider"


export function MainNav() {
  const { openNav, setOpenNav } = useWorkspace();
  const Icon = openNav ? XIcon : MenuIcon;

  return (
    <div className="flex">
      <button
        onClick={()=>{
          setOpenNav(!openNav)
        }}
        className="text-gray-700"
      >
        <Icon className="h-11 w-11 fill-current" />
      </button>
      <DeskLogo />
    </div>
  )
}
