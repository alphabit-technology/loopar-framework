import React, {useEffect} from "react";
import {Link} from "$link";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import {useCookies} from "@services/cookie";

import { DotFilledIcon, Cross1Icon } from "@radix-ui/react-icons";

export const SideNavItem = (props) => {
  const {
    children,
    Icon,
    path,
    title,
    active,
    hasChildren,
    isChild,
  } = props;

  const [open, setOpen] = useCookies(path, active);

  const external = {
    href: path,
    //target: '_blank',
    //rel: 'noopener noreferrer',
  };

  const linkProps = path ? external : {};
  const activeBg = isChild ? '' : 'bg-secondary'
  const activeClass = active ? `${activeBg} text-primary` : ``;
  const activeText = active ? "text-primary" : "text-primary/60 hover:text-slate/60";

  const handleToggleCollapse = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  }
  
  useEffect(() => {
    !open && setOpen(active);
    //setOpen((children && children.length > 0 || active) || activeParent);
  }, [active]);

  return (
    <>
      <Link
        className={`w-full text-neutral-400 grow whitespace-nowrap font-sans text-[14px] font-semibold leading-6 no-underline ${activeClass} justify-between ${isChild ? 'border-l-2 rounded-l-none' : ''}`}
        to={`${path}`}
      >
        <button
          className={`transition-colors hover:text-foreground/80 text-foreground/60 ${activeText}`}  
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