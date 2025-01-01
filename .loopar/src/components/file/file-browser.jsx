import { Modal } from "@dialog";
import React from "react";
import { Dynamic } from "@loader";

export function Browser(props) {
  return (
    <Dynamic
      Entity="File Manager"
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
      <Browser {...props} />
    </Modal>
  );
}