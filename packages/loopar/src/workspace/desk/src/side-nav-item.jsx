import {Link} from "@link";
import { useWorkspace } from "@workspace/workspace-provider";
import { useCookies } from "@services/cookie";
import { useEffect } from "react";
import Icon from "@icon";

import { useLocation } from 'react-router';

const usePathname = () => {
  return useLocation();
};

export const SideNavItem = (props) => {
  const {
    external,
    icon,
    DefaultIcon,
    path,
    title,
    compact,
  } = props;

  const linkProps = path ? external : {};
  const { collapseSidebarWidth, activeModule } = useWorkspace();
  const [active, setActive] = useCookies(path);

  const pathname = usePathname();

  useEffect(() => {
    const moduleName = decodeURIComponent(pathname?.pathname.split('/')[2]);
    setActive(moduleName === path || path == activeModule);
  }, [pathname, activeModule]);

  const link = compact ? (
    <Link
      to={`/desk/${path}`}
      className={`transition-duration-100 h-18 flex w-full flex-col justify-start space-y-0 rounded-full text-left align-middle transition-all ${props.className || ''}`}
      active={active}
      //activeClassName="bg-red-500 font-medium text-primary-foreground hover:bg-primary"
    >
      <Icon data={{icon}} className="h-6 w-6"/>
      { title && title.split(' ').map((word, index) => (
        <small 
          key={path + index} 
          className="truncate text-center h-auto" 
          style={{maxWidth: collapseSidebarWidth - 10}}
        >
          {word}
        </small>
      ))}

    </Link>
  ) : null

  return compact ? link : (
    <Link
      className={`flex w-full justify-start rounded py-1 text-left align-middle ${props.className || ''}`}
      {...linkProps}
      to={`/desk/${path}`}
      active={active}
    >
      <Icon data={{icon}} className="mr-2 h-6 w-6"/>
      <span className="w-full">{title}</span>
    </Link>
  );
};
