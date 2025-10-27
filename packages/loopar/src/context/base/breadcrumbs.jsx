import loopar from "loopar";
import {Link} from "@link";
import { HomeIcon, ChevronRight } from "lucide-react";

export function Breadcrumbs({ Document }) {
  let context = null;
  const {Entity} = Document;
  const makeLinks = () => {
    const dataLinks = [];

    if (Entity.module) {
      const text = loopar.utils.Capitalize(
        context === "module" ? "Home" : Entity.module
      );
      const link =
        context === "module" ? "/" : `/${Entity.module}`;

      dataLinks.push({ text: text, link: link, has_icon: true });
    }

    if (
      Entity.name &&
      context !== "module" &&
      !Entity.is_single
    ) {
      dataLinks.push({
        text: loopar.utils.Capitalize(Entity.name),
        link: `/${Entity.name}/list`,
        has_icon: false,
      });
    }

    if (Document.meta.action) {
      dataLinks.push({
        text: context === "module" ? Document.module_group : Document.meta.action,
        to: null,
        has_icon: false,
      });
    }

    return dataLinks;
  }

  const dataLinks = makeLinks();

  const getItem = (link, index, attrs={}) => (
    <li className="inline-flex items-center" {...attrs}>
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
    <nav className="flex pb-1" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {dataLinks.map((link, index) => {
          return getItem(link, index, index < dataLinks.length - 1 ? {} : {"aria-current": "page"})
        })}
      </ol>
    </nav>
  )
}