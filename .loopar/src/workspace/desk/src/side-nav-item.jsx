import {Link} from "@link";
import { useWorkspace } from "@workspace/workspace-provider";
import { useCookies } from "@services/cookie";
import { useEffect } from "react";

import { useLocation } from 'react-router';

const usePathname = () => {
  return useLocation();
};

export const SideNavItem = (props) => {
  const {
    external,
    Icon,
    path,
    title,
    compact,
  } = props;

  const linkProps = path ? external : {};
  const { collapseSidebarWidth, activeModule } = useWorkspace();
  const [active, setActive] = useCookies(path);

  const pathname = usePathname();

  useEffect(() => {
    //console.log(["activeModule", activeModule])
    const moduleName = decodeURIComponent(pathname?.pathname.split('/')[2]);
    //console.log(["activeModule", activeModule, moduleName])
    setActive(moduleName === path || path == activeModule);
  }, [pathname, activeModule]);

  const link = compact ? (
    <Link
      to={`/desk/${path}`}
      className={`transition-duration-100 h-18 flex w-full flex-col justify-start space-y-0 rounded-full text-left align-middle transition-all ${props.className || ''}`}
      active={active}
      //activeClassName="bg-red-500 font-medium text-primary-foreground hover:bg-primary"
    >
      {Icon && <Icon className="h-7"/>}
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
      {Icon && <Icon className="mr-2"/> }
      <span className="w-full">{title}</span>
    </Link>
  );
};
