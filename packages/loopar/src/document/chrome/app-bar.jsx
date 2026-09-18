import { Breadcrumbs } from "./breadcrumbs";
import loopar from "loopar";
import { Button } from "@cn/components/ui/button";
import { PlusIcon, SaveIcon, ArrowBigRight, MenuIcon, GridIcon} from "lucide-react";
import {Link} from "@link";
import { useDocument, useViewOptions } from "@loopar/document";

export const SaveButton = () => {
  const {docRef} = useDocument();
  const { canUpdate } = useViewOptions();

  if (!docRef || !canUpdate || !docRef.save) return null;
  return (
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
  )
}

const FormPrimaryActions = ({Document}) => {
  const {docRef} = useDocument();
  const { canUpdate } = useViewOptions();
  const {Entity, data={}} = Document;

  const gotoAction = (row, Entity) => {
    if(["Entity", "Builder"].includes(Entity.name)) return row.is_single ? "update" : "list";
    if(["Page Builder", "View Builder"].includes(Entity.name)) return "view";
  }

  const goTo = gotoAction(data, Entity);

  if (!docRef || !canUpdate) return null;
  return (
    <>
      <SaveButton />
      {!Document.isNew && goTo && (
        <Link
          variant="secondary"
          to={`/desk/${data.name}/${goTo}`}
        >
          <>
            <ArrowBigRight className="pr-1" />
            Go to {loopar.utils.Capitalize(data.name)}
          </>
        </Link>
      )}
    </>
  );
}

export function AppBar({Document, sidebarOpen, viewTypeToggle, viewType, ...props}) {
  const { actions = {}, primaryAction, onlyGrid, onlyList } = useViewOptions();
  const {data, meta, Entity} = Document;
  
  const contextName = ["create", "update"].includes(meta.action) ? "form" : meta.action;

  const title = ((meta.title || contextName === 'module') ? meta.module_group :
      (['list', 'view'].includes(contextName) || meta.action === 'create' || Entity.is_single) ? Entity.name : data.name) || Entity.name;

  const listPrimaryActions = () => {
    return (
      <>
        {contextName === 'list' ? (
          <>
            {primaryAction ? (
              typeof primaryAction === "function" ? primaryAction() : primaryAction
            ) : (
              <Link
                variant="secondary"
                tabIndex="0"
                to={`/desk/${Entity.name}/create`}
              >
                <PlusIcon className="pr-1" />
                New
              </Link>
            )}
            {onlyGrid !== true && onlyList !== true && <Button
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

  return (
    <>
      <div
        className="flex w-full flex-row justify-between border-b"
        style={{paddingRight: sidebarOpen ? "0" : "2rem"}}
      >
        <div className="gap-1">
          <h1 className="text-4xl font-bold flex flex-row inline-block align-baseline">
            {title}{Document?.name ? <span className="text-[1.52rem] text-muted-foreground"> {Document.name}</span> : null}
          </h1>
          <div className="flex flex-row items-center gap-1">
            {props.hasBreadcrumb ? <Breadcrumbs Document={Document}/> : <div className="py-2"/>}
          </div>
        </div>
        <div className="flex flex-row space-x-1 overflow-auto" style={{height: "fit-content"}}>
          {...Object.values(actions)}
          <FormPrimaryActions Document={Document}/>
          {listPrimaryActions()}
        </div>
      </div>
    </>
  );
}
