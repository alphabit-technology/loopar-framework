# `src/document` — the client document system

Everything that turns a `Document` coming from the server into a screen.
Read it top-down, the way it mounts:

```
Workspace
  └─ <Entry kind>                 Entry.jsx — the door the server chose (Document.entry)
       └─ DocumentProvider        base/ — base: Document, controller, view options
            └─ Middleware         form/provider · list/provider · none — the kind's logic (useForm / useList)
                 └─ view          apps/**/client/<entity>-<kind>.jsx, optional; otherwise DefaultView
                      └─ Layout   form/layout · list/layout · page/layout — the chrome the view paints
```

## Folders

| Folder | What lives there | Public import |
|---|---|---|
| `Entry.jsx` | The chain above + the entry registry (`entries`: middleware, layout, defaults per kind) | — (used by `loader.jsx`) |
| `base/` | Base layer: `DocumentProvider`, `useDocument`, view options, `Layout` (generic), `DefaultView`, extension hooks | `@loopar/document` |
| `form/` | Form kind: `FormProvider`, `useForm`, `useFormEvents`, `FormLayout`, `ReportLayout`, `BareLayout` | `@loopar/form` |
| `list/` | List kind: `ListProvider`, `useList`, `ListLayout` | `@loopar/list` |
| `page/` | Page kind: `PageLayout`, `WebLayout` (no logic layer) | `@loopar/page` |
| `controller/` | `DocumentController`, `FormController` (plain classes), field store, view-options vocabulary, `useController` | internal |
| `chrome/` | Desk UI pieces used by layouts: `DeskUI`, `AppBar`, `Breadcrumbs` | internal |

Kinds (`Document.entry`): `form` `view` `report` `installer` `auth` → form middleware ·
`list` → list middleware · `page` `web` `controller` → base only.
The server picks the kind in the controller (`entry = "list"`); the view file
suffix (`-form`, `-list`, `-view`...) is only a file name.

## Writing a view

A view is a function with no props. It takes what it needs from its kind and
paints its layout with options:

```jsx
import { useDocument } from "@loopar/document";
import { useForm, useFormEvents, FormLayout } from "@loopar/form";

export const config = { hasHistory: false };            // static flags of the entry

export default function AppForm() {
  const { Document } = useDocument();
  const { getValue, setValue } = useForm();

  useFormEvents({ afterSave: (r) => loopar.notify(`Saved ${r.name}`) });

  return (
    <FormLayout
      slots={{ totals: () => <LiveTotals /> }}            // components rendered inside the structure
      actions={{ bump: <BumpVersionButton /> }}         // AppBar buttons
      sidebar={<Notes />}
    >
      {/* extra content below the structure */}
    </FormLayout>
  );
}
```

Only flags? `export const config = {...}; export { DefaultView as default } from "@loopar/document";`
No file at all? The entry renders `DefaultView` = its layout with defaults.

| I want to… | Where |
|---|---|
| Fixed flags (`canUpdate`, `hasSidebar`, `hasHistory`, `notRequireChanges`, `mapDocument`) | `export const config` |
| Content in the structure (`slot`), AppBar buttons, sidebar, list columns/cards | layout props: `slots`, `actions`, `sidebar`, `columns`, `gridTemplate`, `primaryAction` |
| React to save / a field change / a JSON button (`data.action`) | `useFormEvents`, `useFieldEvent`, `useHandlers` |
| Read / write values, submit | `useForm()` → `getValue`, `setValue`, `setError`, `save`, `send` |
| Document, `inModal`, the controller itself | `useDocument()` |

Rules: framework API comes through hooks; your own data and callbacks go
through props of your own components. Views never receive props.

## Options vocabulary (`controller/view-options.js`)

**View options** (React state, read by chrome/layouts): `slots` `actions` `handlers`
`columns` `gridTemplate` `sidebar` `sidebarHeader` `primaryAction` `canUpdate`
`hasSidebar` `hasHeader` `hasBreadcrumb` `hasHistory` `hasSearchForm` `hasSelectAll`
`hasSelectRow` `disabledSearchFields` `onlyList` `onlyGrid`.
Precedence: entry defaults < view `config` < hooks (`useActions`, `useHandlers`,
`useDocumentConfig`) < layout props.

**Controller options** (applied once on mount): `controller` `notRequireChanges`
`restoreScroll` `overrides` (raw methods, e.g. `getFormValues`) `mapDocument`.

## Field store (`controller/field-store.js`)

`ctrl.fields` keeps the rendered fields: refs (no re-render) and runtime meta
(`setFieldDf`, `on`) as immutable snapshots with subscribers. `Meta.jsx` reads a
field's meta with `useFieldMeta(fields, name)`, so changing one field's
visibility re-renders that field only.
