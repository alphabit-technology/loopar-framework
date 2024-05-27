import React, {useState, useEffect} from "react";
import {Link} from "$link";
import { ChevronDown, ChevronRight } from "lucide-react";

export const SideNavItem = (props) => {
  const {
    children,
    Icon,
    path,
    title,
    active,
    activeParent
  } = props;

  const [open, setOpen] = useState(active || activeParent);

  const external = {
    href: path,
    //target: '_blank',
    //rel: 'noopener noreferrer',
  };

  const linkProps = path ? external : {};
  const activeClass = active ? 'bg-primary/10 text-primary' : '';

  const handleToggleCollapse = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  }
  
  useEffect(() => {
    setOpen((children && children.length > 0 && active) || activeParent);
  }, [active, activeParent]);

  return (
    <>
      <Link
        className={`text-primary w-full text-neutral-400 grow whitespace-nowrap font-sans text-[14px] font-semibold leading-6 no-underline ${activeClass} items-center justify-between py-2 px-4 hover:bg-primary/10 hover:text-primary/80 rounded-md transition-colors mt-2`}
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