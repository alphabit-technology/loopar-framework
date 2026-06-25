import { Modal } from "@dialog";
import { Entity } from "@loopar/loader";

const InModal = (props) => {
  return (
    <Modal
      position="top"
      size="md"
      title="Login"
      scrollable={true}
      open={true}
      onClose={props.onClose}
    >
      {props.children}
    </Modal>
  );
}

export function Login(props) {
  return (
    <InModal onClose={props.onClose}>
      <Entity
        name="Auth"
        action="login"
        hasBreadcrumb={false}
        hasSidebar={false}
        inModal
        {...props}
      />
    </InModal>
  );
}

export function Profile(props) {
  return (
    <InModal onClose={props.onClose}>
      <Entity
        name="Profile"
        action="update"
        hasBreadcrumb={false}
        hasSidebar={false}
        inModal
        {...props}
      />
    </InModal>
  );
}
