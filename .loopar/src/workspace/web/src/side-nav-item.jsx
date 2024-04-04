import {Link} from "$link";

export const SideNavItem = (props) => {
  const {
    Icon,
    path,
    title,
  } = props;

  const linkProps = path ? external : {};

  return (
    <Link
      className='text-primary text-neutral-400 grow whitespace-nowrap px-0 font-sans text-[14px] font-semibold leading-6 no-underline'
      to={`/${path}`}
    >
      <button
        className={`transition-colors hover:text-foreground/80 text-foreground/60`}
        {...linkProps}
      >
        {Icon && <Icon className="mr-2"/> }
        {title}
      </button>
    </Link>
  );
};