import React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Link } from "@link"
import { buttonVariants } from "@/components/ui/button"
import { User2Icon, UserRoundCogIcon, LogOutIcon, Globe2Icon } from "lucide-react"

const MakeButton = ({ Icon, text, link, ...props }) => (
  <Link
    {...props}
    to={link}
    variant="ghost"
  >
    <Icon className="h-7 w-7 mr-2" />
    {text}
  </Link>
)

export function UserInfo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`${buttonVariants({
            size: "icon",
            variant: "ghost",
          })} cursor-pointer`}
        >
          <User2Icon />
          <span className="sr-only">User</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="grid grid-cols-1 p-2">
          <MakeButton Icon={UserRoundCogIcon} text="Profile" link="/desk/auth/User/profile" />
          <MakeButton Icon={LogOutIcon} text="Log Out" link="/auth/user/logout" />
          <MakeButton Icon={Globe2Icon} text="Web Site" link="/home1" _target="_blank" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
