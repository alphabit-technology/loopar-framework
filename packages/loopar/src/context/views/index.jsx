import { useDocumentController, useFormController } from "../hooks/use-document-controller";
import { DocumentShell } from "./document-shell";
import {
  FormLayout, ListLayout, PageLayout, WebLayout, ReportLayout, BareFormLayout,
} from "./layouts";

/**
 * Functional entry points, one per `Document.context` kind. The loader
 * mounts these when an app ships no `client/<entity>-<kind>.jsx`.
 *
 * Props: `Document` (required), `inModal`, `onClose`, `onSaved`, plus
 * chrome flags (`hasSidebar`, `hasHeader`, `hasBreadcrumb`, `hasSearchForm`)
 * and `overrides` — the functional replacement for subclass overrides:
 * `{ customColumns, gridTemplate, getSidebar, primaryAction, setCustomActions,
 *    controller, canUpdate, ... }`. `slots` reach the structure through
 * `useDocument().slots`.
 */

const FORM_DEFAULTS = {
  canUpdate: true, hasSidebar: true, hasHeader: true, hasHistory: true, donHaveContainer: true,
};

export function FormView({ overrides, slots, children, ...props }) {
  const ctrl = useFormController(props, { ...FORM_DEFAULTS, ...overrides });
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <FormLayout ctrl={ctrl}>{children}</FormLayout>
    </DocumentShell>
  );
}

export function ViewView({ overrides, slots, children, ...props }) {
  const ctrl = useFormController(props, { ...FORM_DEFAULTS, canUpdate: false, ...overrides });
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <FormLayout ctrl={ctrl}>{children}</FormLayout>
    </DocumentShell>
  );
}

const LIST_DEFAULTS = {
  hasHeader: true, hasSidebar: true, context: 'index', renderStructure: false,
  hasSearchForm: true, hasSelectAll: true, hasSelectRow: true,
};

export function ListView({ overrides, slots, children, onlyGrid, onlyList, ...props }) {
  const ctrl = useDocumentController(props, { ...LIST_DEFAULTS, onlyGrid, onlyList, ...overrides });
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <ListLayout
        ctrl={ctrl}
        hasSearchForm={ctrl.hasSearchForm}
        onlyGrid={ctrl.onlyGrid}
        onlyList={ctrl.onlyList}
      >
        {children}
      </ListLayout>
    </DocumentShell>
  );
}

export function PageView({ overrides, slots, children, ...props }) {
  const ctrl = useDocumentController(props, overrides);
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <PageLayout ctrl={ctrl}>{children}</PageLayout>
    </DocumentShell>
  );
}

export function WebView({ overrides, slots, children, ...props }) {
  const ctrl = useDocumentController(props, overrides);
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <WebLayout ctrl={ctrl}>{children}</WebLayout>
    </DocumentShell>
  );
}

const REPORT_DEFAULTS = { hasSidebar: true, hasHeader: true, hasHistory: true };

export function ReportView({ overrides, slots, children, ...props }) {
  const ctrl = useDocumentController(props, { ...REPORT_DEFAULTS, ...overrides });
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <ReportLayout ctrl={ctrl}>{children}</ReportLayout>
    </DocumentShell>
  );
}

export function InstallerView({ overrides, slots, children, ...props }) {
  const ctrl = useFormController(props, {
    notRequireChanges: true,
    controller: "System",
    install() { return this.send({ action: "install" }); },
    connect() { return this.send({ action: "connect" }); },
    ...overrides,
  });
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <BareFormLayout ctrl={ctrl}>{children}</BareFormLayout>
    </DocumentShell>
  );
}

export function AuthView({ overrides, slots, children, ...props }) {
  const ctrl = useFormController(props, { controller: "Auth", ...overrides });
  return (
    <DocumentShell ctrl={ctrl} slots={slots}>
      <BareFormLayout ctrl={ctrl} withStructure={false}>{children}</BareFormLayout>
    </DocumentShell>
  );
}

/** Plain document (controllers with no structure of their own). */
export function ControllerView({ overrides, slots, children, ...props }) {
  const ctrl = useDocumentController(props, overrides);
  return <DocumentShell ctrl={ctrl} slots={slots}>{children}</DocumentShell>;
}
