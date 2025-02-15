import React, {useEffect} from "react";
import {Link} from "@link";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useCookies } from "@services/cookie";
import {cn} from "@/lib/utils";

import { DotFilledIcon } from "@radix-ui/react-icons";

export const SideNavItem = (props) => {
  const {
    children,
    Icon,
    path,
    title,
    active,
    hasChildren,
    isChild,
    solid,
  } = props;

  const [open, setOpen] = useCookies(path, active);

  const external = {
    href: path,
  };

  const linkProps = path ? external : {};

  const handleToggleCollapse = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  }
  
  useEffect(() => {
    !open && setOpen(active);
  }, [active]);

  return (
    <>
      <Link
        className={cn(
          'w-full grow whitespace-nowrap leading-6 justify-between',
          isChild && 'border-l-2 rounded-l-none bg-transparent',
          !solid && 'focus:bg-transparent hover:bg-transparent bg-transparent',
        )}
        to={`${path}`}
        active={active}
      >
        <button
          {...linkProps}
        >
          {Icon && <Icon className="mr-2"/> }
          {isChild && active && !hasChildren && <DotFilledIcon className="p-0 m-0 w-7 h-7 inline-block -ml-6 pl-[2px] -mr-1"/>}
          {title}
        </button>
        {hasChildren && (
          <div className="r-0" onClick={handleToggleCollapse}>
            {open && <ChevronDownIcon className="transition-transform transform rotate-0" />}
            {!open && <ChevronRightIcon className="transition-transform transform rotate-0" />}
          </div>
        )}
      </Link>
      {open && children}
    </>
  );
};