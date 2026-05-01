
'use strict';
import {useEffect, useState} from "react";
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
      variant={(active === action)? "secondary" : "ghost"}
      className={`${active === action ? "border border-primary/60" : ""}`}
      to={`?type=${action}`}
    >
      {label}
    </Link>
  );
}

export default class ModuleView extends EntityList {
  onlyGrid = true;
  hasSearchForm = true;
  disabledSearchFields = ["module"];

  setCustomActions() {
    super.setCustomActions();
    const {Document} = this.props;
    const actions = Document?.__TYPES__ || [];

    actions.forEach((action, index) => {
      this.setCustomAction(
        action.name,
        <ButtonType 
          key={index} 
          action={action.name} 
          label={action.label}
          actions={actions}
          current={Document.__TYPE__}
        />
      );
    });
  }
}