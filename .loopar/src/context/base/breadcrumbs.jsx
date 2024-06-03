import loopar from "$loopar";
import {Link} from "@link";
import { HomeIcon, ChevronRight } from "lucide-react";

export function Breadcrumbs({ meta }) {
  let context = null;
  const makeLinks = () => {
    const dataLinks = [];

    if (meta.__DOCTYPE__.module) {
      const text = loopar.utils.Capitalize(
        context === "module" ? "Home" : meta.__DOCTYPE__.module
      );
      const link =
        context === "module" ? "/" : `/${meta.__DOCTYPE__.module}`;

      dataLinks.push({ text: text, link: link, has_icon: true });
    }

    if (
      meta.__DOCTYPE__.name &&
      context !== "module" &&
      !meta.__DOCTYPE__.is_single
    ) {
      dataLinks.push({
        text: loopar.utils.Capitalize(meta.__DOCTYPE__.name),
        link: `/${meta.__DOCTYPE__.module}/${meta.__DOCTYPE__.name}/list`,
        has_icon: false,
      });
    }

    if (meta.action) {
      dataLinks.push({
        text: context === "module" ? meta.module_group : meta.action,
        to: null,
        has_icon: false,
      });
    }

    return dataLinks;
  }

  const dataLinks = makeLinks();

  const getItem = (link, index, attrs={}) => (
    <li class="inline-flex items-center" {...attrs}>
      <Link
        variant="link"
        className="px-0"
        {...(link.link ? {to:`/desk${link.link}`} : {})}
      >
        {index === 0 ? <HomeIcon className="h-4"/> : <ChevronRight/> }
        {index === 0 ? loopar.utils.UPPERCASE(link.text) : link.text}
      </Link>
    </li>
  )

  return (
    <nav class="flex" aria-label="Breadcrumb" className="pb-1">
      <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {dataLinks.map((link, index) => {
          return getItem(link, index, index < dataLinks.length - 1 ? {} : {"aria-current": "page"})
        })}
      </ol>
    </nav>
  )
}