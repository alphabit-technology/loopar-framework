import {Link} from "$link";
import { useWorkspace } from "@workspace/workspace-provider";

export const SideNavItem = (props) => {
  const {
    active = false,
    external,
    Icon,
    path,
    title,
    compact,
  } = props;

  const linkProps = path ? external : {};
  const { collapseSidebarWidth } = useWorkspace();

  const link = compact ? (
    <Link
      to={`/desk/${path}`}
      className={`transition-duration-100 h-13 flex w-full flex-col justify-start space-y-0 rounded-full text-left align-middle transition-all ${props.className || ''}`}
    >
      {Icon && <Icon className="h-7"/>}
      { title && title.split(' ').map((word, index) => (
        <small 
          key={index} 
          className="truncate text-center" 
          style={{maxWidth: collapseSidebarWidth - 10}}
        >
          {word}
        </small>
      ))}

    </Link>
  ) : null

  return compact ? link : (
    <Link
      className={`${active ? 'text-primary' : module.disabled ? 'text-disabled' : 'text-neutral-400'}
                      grow whitespace-nowrap px-0 font-sans text-[14px] font-semibold leading-6 no-underline `}
      href={`/desk/${path}`}
    >
      <Link
        className={`flex w-full justify-start rounded bg-slate-100/50 px-4 py-1 text-left align-middle dark:bg-slate-700/30 ${props.className || ''}`}
        {...linkProps}
        to={`/desk/${path}`}  
      >
        {Icon && <Icon className="mr-2"/> }
        {title}
      </Link>
    </Link>
  );
};

/*SideNavItem.propTypes = {
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  external: PropTypes.bool,
  Icon: PropTypes.node,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};*/
