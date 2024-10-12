import { Breadcrumbs } from "@loopar/context/base/breadcrumbs";
import loopar from "$loopar";
import { Button } from "@/components/ui/button";
import { PlusIcon, SaveIcon, ArrowBigRight, MenuIcon, GridIcon} from "lucide-react";
import {Link} from "$link";

export function AppBarr({docRef, meta, sidebarOpen, viewTypeToggle, viewType}) {
  const context = ["create", "update"].includes(meta.action) ? "form" : meta.action;
  const { __ENTITY__, __DOCUMENT__ } = meta;
  const title = ((meta.title || context === 'module') ? meta.module_group :
      (['list', 'view'].includes(context) || meta.action === 'create' || __ENTITY__.is_single) ? __ENTITY__.name : __DOCUMENT__.name) || __ENTITY__.name;

  const type = __DOCUMENT__.is_single ? "Single" : __ENTITY__.build || __ENTITY__.__TYPE__;
  //const goTo = (["Single", "View", "Page", "Form", "Report"].includes(type) ? type : "Base") + "Controller";
  const goTo = ["View", "Page", "Report"].includes(type) ? "view" : type === "Single" ? "update" : "list";
    
  const formPrimaryActions = () => {
    return docRef.canUpdate ? (
      <>
        <Button
          variant="secondary"
          tabIndex="0"
          onClick={(e) => {
            e.preventDefault();
            docRef.save();
          }}
        >
          <SaveIcon className="pr-1" />
          Save
        </Button>
        {!meta.__IS_NEW__ && (__ENTITY__.is_builder || __ENTITY__.__TYPE__ === 'Builder') && (
          <Link
            variant="secondary"
            to={`/desk/${__DOCUMENT__.name}/${goTo}`}
          >
            <>
              <ArrowBigRight className="pr-1" />
              Go to {loopar.utils.Capitalize(__DOCUMENT__.name)}
            </>
          </Link>
        )}
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
                to={`/desk/${__ENTITY__.name}/create`}
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
        <div className="flex flex-row space-x-1 overflow-auto" style={{height: "fit-content"}}>
          {Object.values(customActions)}
          {formPrimaryActions()}
          {listPrimaryActions()}
        </div>
      </div>
    </>
  );
}
