import { Breadcrumbs } from "@loopar/context/base/breadcrumbs";
import loopar from "$loopar";
import { Button } from "@/components/ui/button";
import { PlusIcon, SaveIcon, ArrowBigRight, MenuIcon, XIcon, MoreVerticalIcon, GridIcon} from "lucide-react";
import {Link} from "$link";
//import {useCookies} from "@services/cookie";


export function AppBarr({docRef, meta, sidebarOpen, toggleSidebar, viewTypeToggle, viewType, ...props}) {
  //const {docRef, meta} = useFormContext();
  const context = ["create", "update"].includes(meta.action) ? "form" : meta.action;
  const title = ((meta.title || context === 'module') ? meta.module_group :
      (['list', 'view'].includes(context) || meta.action === 'create') ? meta.__DOCTYPE__.name : meta.__DOCUMENT__.name) || meta.__DOCTYPE__.name;
  
  const SidebarIcon = sidebarOpen ? XIcon : MoreVerticalIcon;
  //const formContext = useFormContext();
  
  const formPrimaryActions = () => {
    return docRef.canUpdate ? (
      <>
        <Button
          variant="secondary"
          tabIndex="0"
          onClick={() => {
            docRef.save();
          }}
        >
          <SaveIcon className="pr-1" />
          Save
        </Button>
        {meta.__IS_NEW__ ? null : meta.__DOCTYPE__.name === 'Document' ? (
          <Link
            variant="secondary"
            to={`/desk/${meta.__DOCUMENT__.module}/${meta.__DOCUMENT__.name}/${meta.__DOCUMENT__.is_single ? 'update' : 'list'}`}
          >
            <>
              <ArrowBigRight className="pr-1" />
              Go to {loopar.utils.Capitalize(meta.__DOCUMENT__.name)}
            </>
          </Link>
        ) : null}
      </>
    ) : [];
  }

  const listPrimaryActions = () => {
    return (
      <>
        {context === 'list' ? (
          <>
            {docRef.primaryAction ? (
              docRef.primaryAction()
            ) : (
              <Link
                variant="secondary"
                tabIndex="0"
                to={`/desk/${meta.__DOCTYPE__.module}/${meta.__DOCTYPE__.name}/create`}
              >
                <PlusIcon className="pr-1" />
                New
              </Link>
            )}
            {docRef.onlyGrid !== true && <Button
              className="p-1"
              variant="secondary"
              onClick={viewTypeToggle}
            >
              {viewType === 'List' ? <GridIcon /> : <MenuIcon />}
            </Button>}
          </>
        ) : null}
      </>
    );
  }

  const customActions = docRef.customActions || {};

  return (
    <>
      <div
        className="flex w-full flex-row justify-between border-b"
        style={{paddingRight: sidebarOpen ? "0" : "2rem"}}
      >
        <div className="gap-1">
          <h1 className="text-4xl font-bold">{title}</h1>
          <div className="flex flex-row items-center gap-1">
            <Breadcrumbs meta={meta} />
          </div>
        </div>
        <div className="flex flex-row space-x-1">
          {Object.values(customActions)}
          {formPrimaryActions()}
          {listPrimaryActions()}
        </div>
      </div>
    </>
  );
}
