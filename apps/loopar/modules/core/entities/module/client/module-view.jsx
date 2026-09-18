
'use strict';
import {useEffect, useState} from "react";
import { useDocument } from "@loopar/document";
import EntityList from "../../entity/client/entity-list";
import { useLocation } from 'react-router';
import {Link} from "@link"

const usePathname = () => {
  return useLocation();
};

const ButtonType = ({action, label, actions, current}) => {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const type = pathname.search.split("=")[1];
    setActive(decodeURIComponent(type || current));
  } , [pathname]);

  return (
    <Link
      award={false}
      variant={(active === action)? "secondary" : "ghost"}
      className={`${active === action ? "border border-primary/60" : ""}`}
      to={`?type=${action}`}
    >
      {label}
    </Link>
  );
}

const DISABLED_SEARCH_FIELDS = ["module"];

export const config = { onlyGrid: true, hasSearchForm: true, disabledSearchFields: DISABLED_SEARCH_FIELDS };

export default function ModuleView() {
  const { Document } = useDocument();
  const types = Document?.__TYPES__ || [];

  const actions = Object.fromEntries(types.map((action, index) => [
    action.name,
    <ButtonType
      key={index}
      action={action.name}
      label={action.label}
      actions={types}
      current={Document.__TYPE__}
    />,
  ]));

  return <EntityList actions={actions} />;
}
