import { Modal } from "@dialog";
import { Entity } from "@loopar/loader";

export function Browser(props) {
  return (
    <Entity
      name="File Manager"
      action="list"
      hasBreadcrumb={false}
      hasSidebar={false}
      {...props}
    />
  );
}

export function FileBrowser(props) {
  return (
    <Modal
      position="top"
      size="full"
      title="File Browser"
      scrollable={true}
      open={true}
      onClose={() => {
        props.onClose && props.onClose();
      }}
    >
      <Browser {...props} inModal={props.inModal}/>
    </Modal>
  );
}
