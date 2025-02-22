import React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@cn/components/ui/dropdown-menu"

import {Link} from "@link"
import { buttonVariants } from "@cn/components/ui/button"
import { ComponentIcon, CircuitBoardIcon, FileJson2Icon, FileArchiveIcon, LayoutGridIcon, Settings2Icon, User2Icon } from "lucide-react"

const MakeButton = ({ Icon, text, link }) => (
  <Link
    to={link}
    variant="ghost"
  >
    <Icon className="h-10 w-10" />
    <span className="w-full px-2">{text}</span>
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
          <MakeButton Icon={FileJson2Icon} text="Builder" link="/desk/Builder/list" />
          <MakeButton Icon={ComponentIcon} text="Modules" link="/desk/Module/list" />
          <MakeButton Icon={CircuitBoardIcon} text="Apps" link="/desk/App Manager/view"/>
          <MakeButton Icon={FileArchiveIcon} text="Files" link="/desk/File Manager/list" />
          <MakeButton Icon={Settings2Icon} text="Settings" link="/desk/System Settings/update" />
          <MakeButton Icon={User2Icon} text="Users" link="/desk/user/list" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
