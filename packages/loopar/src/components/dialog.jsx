import React, { useRef, useId , useEffect, useState, use} from "react";
import loopar from "loopar";
import {Button} from "@cn/components/ui/button";
import { AlertCircle, InfoIcon, HelpCircle } from "lucide-react";
import { cn } from "@cn/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@cn/components/ui/dialog"

import { Label } from "@cn/components/ui/label";
import { Textarea } from "@cn/components/ui/textarea";

const DialogContext = React.createContext();
const DialogContextProvider = ({children}) => {
  return (
    <DialogContext.Provider value={{
      inDialog: true
    }}>
      {children}
    </DialogContext.Provider>
  )
}

export const useDialogContext = () => {
  return React.useContext(DialogContext) || {
    inDialog: false
  }
}

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
  const [open, setOpen] = useState(props.open || false);

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])
  
  const handleSetOpenClose = (open) => {
    loopar.handleOpenCloseDialog(props.id, open);
    if(open) props.onOpen && props.onOpen();
    if(!open) props.onClose && props.onClose();
  };

  const setDialogOpen = (open, validate=true) => {
    if(!open && validate && props.validate && !props.validate(props.value)) return;
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
        variant: "secondary",
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
          setDialogOpen(false, false);
        };
        //cancelButton.dismiss = true;
      }
    }

    return buttons;
  }

  return (
    <DialogContextProvider>
      <Dialog open={open} onOpenChange={handleSetOpenClose} key={props.id}>
        <DialogContent className={`sm:max-w-md ${sizes[props.size || "sm"]} flex flex-col`}>
          <DialogHeader>
            <DialogTitle className="flex space-x-2">
              {props.type && <Icon type={props.type} size={48} className="-mt-3 -ml-3 opacity-50"/>}
              <h2 className="text-2xl">{props.title}</h2>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className={`overflow-auto max-h-[80vh] ${props.size == 'full' && 'h-[100vh]'}`}>
            <>
            {
              contentType === "text" ? (
                  <div
                    className="h-full"
                  dangerouslySetInnerHTML={{ __html: `<p>${content}</p>` }}
                />
              ) : (
                <div className="h-full">{content}</div>
              )
            }
            <div className="fixed bottom-5 right-5 z-0 opacity-5" style={{zIndex:"-1"}}><Icon type={props.type} size={130}/></div>
            </>
          </DialogDescription>
          {props.hasFooter !== false && (
            <DialogFooter>
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
    </DialogContextProvider>
  );
};

export default MetaDialog;

export function Prompt (props) {
  const id = useId();
  const [value, setValue] = useState(props.initialValue || "");

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
          value={value}
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
    >
      {props.children}
    </MetaDialog>
  )
}

export function Alert (props) {
  return (
    <MetaDialog
      {...props}
      type="alert"
    >
      {props.children}
    </MetaDialog>
  )
}

export const Modal = (props) => {
  return <MetaDialog {...props} >{props.children}</MetaDialog>;
};