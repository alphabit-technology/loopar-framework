import React, {useEffect} from "react";
import {Link} from "@link";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useCookies } from "@services/cookie";
import {cn} from "@cn/lib/utils";
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
    
    if (!active && path) {
      window.location.href = path;
    } else {
      setOpen(!open);
    }
  }
  
  useEffect(() => {
    !open && setOpen(active);
  }, [active]);

  return (
    <>
      <div className="flex items-center w-full">
        <Link
          className={cn(
            'grow whitespace-nowrap leading-6 flex items-center',
            isChild && 'border-l-2 rounded-l-none bg-transparent',
            !solid && 'focus:bg-transparent hover:bg-transparent bg-transparent',
            hasChildren && 'rounded-r-none'
          )}
          to={`${path}`}
          active={active}
        >
          <button
            {...linkProps}
            className="flex items-center flex-1"
          >
            {Icon && <Icon className="mr-2"/> }
            {isChild && active && !hasChildren && <DotFilledIcon className="p-0 m-0 w-7 h-7 inline-block -ml-6 pl-[2px] -mr-1"/>}
            {title}
          </button>
        </Link>
        {hasChildren && (
          <button 
            className={cn(
              "px-2 py-1 flex items-center justify-center shrink-0",
              !solid && 'hover:bg-transparent',
              active && 'text-primary'
            )}
            onClick={handleToggleCollapse}
            type="button"
          >
            {open ? (
              <ChevronDownIcon className="transition-transform" />
            ) : (
              <ChevronRightIcon className="transition-transform" />
            )}
          </button>
        )}
      </div>
      {open && children}
    </>
  );
};