import { Breadcrumbs } from "@loopar/context/base/breadcrumbs";
import loopar from "loopar";
import { Button } from "@cn/components/ui/button";
import { PlusIcon, SaveIcon, ArrowBigRight, MenuIcon, GridIcon} from "lucide-react";
import {Link} from "@link";
import {useDocument} from "@context/@/document-context";

export const SaveButton = () => {
  const {docRef} = useDocument();

  if (!docRef || !docRef.canUpdate || !docRef.save) return null;
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

const FormPrimaryActions = ({meta}) => {
  const {docRef} = useDocument();
  const { __ENTITY__, __DOCUMENT__ } = meta;

  const gotoAction = (row, entity) => {
    if(["Entity", "Builder"].includes(entity.name)) return row.is_single ? "update" : "list";
    if(["Page Builder", "View Builder"].includes(entity.name)) return "view";
  }

  const goTo = gotoAction(__DOCUMENT__, __ENTITY__);

  if (!docRef || !docRef.canUpdate) return null;
  return (
    <>
      <SaveButton />
      {!meta.__IS_NEW__ && goTo && (
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
  );
}

export function AppBarr({meta, sidebarOpen, viewTypeToggle, viewType, ...props}) {
  const context = ["create", "update"].includes(meta.action) ? "form" : meta.action;
  const {docRef} = useDocument();
  const { __ENTITY__, __DOCUMENT__ } = meta;

  const title = ((meta.title || context === 'module') ? meta.module_group :
      (['list', 'view'].includes(context) || meta.action === 'create' || __ENTITY__.is_single) ? __ENTITY__.name : __DOCUMENT__.name) || __ENTITY__.name;

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

  const customActions = docRef?.customActions || {};

  return (
    <>
      <div
        className="flex w-full flex-row justify-between border-b"
        style={{paddingRight: sidebarOpen ? "0" : "2rem"}}
      >
        <div className="gap-1">
          <h1 className="text-4xl font-bold">{title}</h1>
          <div className="flex flex-row items-center gap-1">
            {props.hasBreadcrumb ? <Breadcrumbs meta={meta}/> : <div className="py-2"/>}
          </div>
        </div>
        <div className="flex flex-row space-x-1 overflow-auto" style={{height: "fit-content"}}>
          {Object.values(customActions)}
          <FormPrimaryActions meta={meta}/>
          {listPrimaryActions()}
        </div>
      </div>
    </>
  );
}
