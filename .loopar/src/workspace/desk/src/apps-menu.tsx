import React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {Link} from "@link"
import { buttonVariants } from "@/components/ui/button"
import { ComponentIcon, CircuitBoardIcon, FileJson2Icon, FileArchiveIcon, LayoutGridIcon, Settings2Icon, User2Icon } from "lucide-react"

const MakeButton = ({ Icon, text, link }) => (
  <Link
    to={link}
    variant="ghost"
  >
    <Icon className="h-7 w-7 mr-2" />
    {text}
  </Link>
)

export function AppsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`${buttonVariants({
            size: "icon",
            variant: "ghost",
          })} cursor-pointer`}
        >
          <LayoutGridIcon />
          <span className="sr-only">Home</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="grid grid-cols-2 p-2">
          <MakeButton Icon={FileJson2Icon} text="Documents" link="/desk/core/Document/list" />
          <MakeButton Icon={ComponentIcon} text="Modules" link="/desk/core/Module/list" />
          <MakeButton Icon={CircuitBoardIcon} text="Apps" link="/desk/developer/App Manager/view"/>
          <MakeButton Icon={FileArchiveIcon} text="Files" link="/desk/core/File Manager/list" />
          <MakeButton Icon={Settings2Icon} text="Settings" link="/desk/core/System Settings/update" />
          <MakeButton Icon={User2Icon} text="Users" link="/desk/auth/user/list" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
