import React, {useEffect} from "react";
import {Link} from "$link";
import { ChevronDown, ChevronRight } from "lucide-react";
import {useCookies} from "@services/cookie";

import { buttonVariants } from "@/components/ui/button";


export const SideNavItem = (props) => {
  const {
    children,
    Icon,
    path,
    title,
    active
  } = props;

  const [open, setOpen] = useCookies(path, active);

  const external = {
    href: path,
    //target: '_blank',
    //rel: 'noopener noreferrer',
  };

  const linkProps = path ? external : {};
  const activeBg = 'bg-secondary'
  const activeClass = active ? `${activeBg} text-primary` : ``;

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
        className={`w-full text-neutral-400 grow whitespace-nowrap font-sans text-[14px] font-semibold leading-6 no-underline ${activeClass} hover:bg-secondary items-center justify-between py-2 px-3 rounded-md transition-colors mt-1`}
        to={`${path}`}
      >
        <button
          className={`transition-colors hover:text-foreground/80 text-foreground/60`}
          {...linkProps}
        >
          {Icon && <Icon className="mr-2"/> }
          {title}
        </button>
        {children && children.length > 0 && (
          <div className="r-0" onClick={handleToggleCollapse}>
            {open ? <ChevronDown className="transition-transform transform rotate-0" /> : <ChevronRight className="transition-transform transform rotate-0" />}
          </div>
          )}
      </Link>
      {open && children}
    </>
  );
};