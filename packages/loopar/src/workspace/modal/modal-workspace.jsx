import BaseWorkspace from "@workspace/base/base-workspace";
import { useWorkspace } from "@workspace/workspace-provider";
import { Modal } from "@dialog";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";

export function ModalWorkspace(props){
  const {openNav, ActiveView, onClose: onModalClose} = useWorkspace();
  const menuData = props.menuData || [];
  const [open, setOpen] = useState(true)

  return (
    <BaseWorkspace menuData={menuData}>
      <Modal open={open} onClose={onModalClose ?? (() => setOpen(false))} size={props.size || "md"} buttons={[]}>
        <div className="space-y-4 p-2">
          {ActiveView?.length ? ActiveView : (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </Modal>
    </BaseWorkspace>
  )
}