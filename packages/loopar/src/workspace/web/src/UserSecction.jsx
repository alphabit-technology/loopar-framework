import { Modal } from "@dialog";
import { Entity } from "@loopar/loader";

export function Profile(props) {
  return (
    <Modal open={true} size="lg" title="Profile" onClose={props.onClose} buttons={[]}>
      <Entity
        name="Profile"
        action="update"
        hasBreadcrumb={false}
        hasSidebar={false}
        inModal
        onClose={props.onClose}
      />
    </Modal>
  );
}
