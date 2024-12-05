import React, { useRef, useId } from "react";
import loopar from "loopar";
import {Button} from "@/components/ui/button";
import { AlertCircle, InfoIcon, TriangleIcon, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils"

//global.dialogsCount ??= 0;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Icon = ({type, size, ...props}) => {
  const icons = {
    alert: [AlertCircle, "text-red-500"],
    info: [InfoIcon, "text-blue-500"],
    confirm: [HelpCircle, "text-yellow-500"],
    error: [AlertCircle, "text-red-500"],
  }

  const icon = icons[type] || icons.info;
  const [Icon, color] = icon

  return <Icon size={size || 24} className={cn(color, props.className)} />;
}

const MetaDialog = (props) => {
  const handleSetOpenClose = (open) => {
    loopar.handleOpenCloseDialog(props.id, open);
    if(open) props.onOpen && props.onOpen();
    if(!open) props.onClose && props.onClose();
  };

  const setDialogOpen = (open) => {
    if(!open && props.validate && !props.validate(props.value)) return;
    handleSetOpenClose(open);
  };

  const okButton = useRef(null);

  const sizes = {
    sm: "md:min-w-[45%] lg:min-w-[40%] xl:min-w-[35%]",
    md: "md:min-w-[60%] lg:min-w-[50%] xl:min-w-[45%]",
    lg: "md:min-w-[75%] lg:min-w-[70%] xl:min-w-[60%]",
    full: "min-w-[100%] min-h-[100%] max-w-[100%] max-h-[100%]",
  };

  const content = props.children || props.content || props.message;
  const contentType = typeof content === "string" ? "text" : "react";

  const getButtons = () => {
    if(Array.isArray(props.buttons) && props.buttons.length === 0) return [];

    const buttons = props.buttons || [];
    if (buttons.length === 0) {
      buttons.push({
        name: "ok",
        text: "OK",
        variant: "primary",
        onClick: () => {
          props.ok && props.ok(props.value);
          setDialogOpen(false);
        },
        dismiss: true,
      });

      props.type === "confirm" &&
        buttons.push({
          name: "cancel",
          text: "Cancel",
          variant: "secondary",
          onClick: () => {
            props.cancel && props.cancel();
            setDialogOpen(false);
          },
          dismiss: true,
        });
    } else {
      const okButton = buttons.find((b) => b.name === "ok");

      if (okButton) {
        const okFunc = okButton.onClick;
        okButton.onClick = () => {
          okFunc && okFunc();
          props.ok && props.ok();
          setDialogOpen(false);
        };
        //okButton.dismiss = true;
      }

      const cancelButton = buttons.find((b) => b.name === "cancel");

      if (cancelButton) {
        const cancelFunc = cancelButton.onClick;
        cancelButton.onClick = () => {
          cancelFunc && cancelFunc();
          props.cancel && props.cancel();
          setDialogOpen(false);
        };
        //cancelButton.dismiss = true;
      }
    }

    return buttons;
  }

  return (
    <Dialog open={props.open} onOpenChange={handleSetOpenClose} key={props.id}>
      <DialogContent className={`sm:max-w-md ${sizes[props.size || "sm"]}`}>
        <DialogHeader>
          <DialogTitle className="flex space-x-2">
            <Icon type={props.type} size={48} className="-mt-3 -ml-3 opacity-50"/>
            <h2 className="text-2xl">{props.title}</h2>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="overflow-auto max-h-[80vh]">
          <>
          {
            contentType === "text" ? (
              <div
                dangerouslySetInnerHTML={{ __html: `<p>${content}</p>` }}
              />
            ) : (
              <div>{content}</div>
            )
          }
          <div className="fixed bottom-5 right-5 z-0 opacity-5" style={{zIndex:"-1"}}><Icon type={props.type} size={130}/></div>
          </>
        </DialogDescription>
        {props.hasFooter !== false && (
          <DialogFooter className="pt-5">
            {(getButtons() || []).map((b) => (
              <Button
                key={b.name}
                variant={b.variant || "primary"}
                onClick={(e) => {
                  e.preventDefault();

                  b.dismiss && setDialogOpen(false);
                  b.onClick();
                }}
                ref={b.name === "ok" ? okButton : null}
              >
                {b.content || b.text || b.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MetaDialog;

export function Prompt (props) {
  const id = useId();
  const [value, setValue] = React.useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
  }

  const getRows = () => {
    return {"sm": 5, "md": 10, "lg": 15, "full": 20}[props.size || "md"]
  }

  return (
    <MetaDialog
      {...props}
      value={value}
      type="prompt"
      ok={() => props.ok(value)}
      size={props.size || "md"}
    >
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="form-control">{props.label || ""}</Label>
        <Textarea 
          type="text"
          id={`prompt-input-${id}`}
          placeholder={props.placeholder || ""}
          className="border border-input rounded-xm bg-transparent p-2 mt-2"
          onChange={handleChange}
          rows={getRows()}
        />
      </div>
    </MetaDialog>
  )
}

export function Confirm (props) {
  return (
    <MetaDialog
      {...props}
      type="confirm"
    />
  )
}

export function Alert (props) {
  return (
    <MetaDialog
      {...props}
      type="alert"
    />
  )
}

export const Modal = (props) => {
  return <MetaDialog {...props} />;
};

/*export const Modal = (props, content) => {
  return loopar.dialog({ ...props, content: props.content || content });
};*/
