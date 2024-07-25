import React, { useState, useRef, useEffect } from "react";
import loopar from "$loopar";
global.dialogsCount ??= 0;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MetaDialog = (props) => {
  const [state, setState] = useState({
    type: props.type,
    title: props.title,
    open: props.open !== undefined ? props.open : true,
    ok: props.ok,
    cancel: props.cancel,
    value: null,
  });

  const okButton = useRef(null);

   const handleUpdate = () => {
    if (props.content !== state.content) {
      setState((prevState) => ({
        ...prevState,
        content: props.content,
      }));
    }

    if (props.open !== state.open) {
      setState((prevState) => ({
        ...prevState,
        open: props.open,
      }));
    }
  };

  // useEffect para ejecutar la función de actualización condicional
  useEffect(() => {
    handleUpdate();
  }, [props.content, props.open]); // Dependencias para el useEffect


  const getIcon = () => {
    const { type } = state;
    const icons = {
      info: "fa-info-circle",
      alert: "fa-exclamation-circle",
      confirm: "fa-question-circle",
      error: "fa-exclamation-triangle",
      success: "fa-check-circle",
      prompt: "fa-question-circle",
    };

    const icon = props.icon || "fa " + icons[type];

    const textColors = {
      info: "text-blue",
      alert: "text-dark",
      confirm: "text-orange",
      error: "text-red",
      success: "text-green",
      prompt: "text-blue",
    };

    return typeof icon === "string" ? (
      <i className={`${icon} ${textColors[type]} mr-2`} />
    ) : (
      icon
    );
  };

  const setDialogOpen = (open) => {
    setState((prevState) => ({
      ...prevState,
      open,
    }), () => {
      if (!open) {
        props.onClose && props.onClose();
      }
    });
  };

  const sizes = {
    sm: "md:min-w-[45%] lg:min-w-[40%] xl:min-w-[35%]",
    md: "md:min-w-[60%] lg:min-w-[50%] xl:min-w-[45%]",
    lg: "md:min-w-[75%] lg:min-w-[70%] xl:min-w-[60%]",
    full: "min-w-[100%] min-h-[100%] max-w-[100%] max-h-[100%]",
  };

  const content = props.children || props.content || props.message;
  const contentType = typeof content === "string" ? "text" : "react";

  return (
    <Dialog open={state.open} onOpenChange={setDialogOpen} key={props.id}>
      <DialogContent className={`sm:max-w-md ${sizes[props.size || "sm"]}`}>
        <DialogHeader>
          <DialogTitle><h1 className="text-2xl">{props.title}</h1></DialogTitle>
          <DialogDescription>
            {
              contentType === "text" ? (
                <div
                  dangerouslySetInnerHTML={{ __html: `<p>${content}</p>` }}
                />
              ) : (
                <div>{content}</div>
              )
            }
          </DialogDescription>
          {props.hasFooter !== false && (
            <DialogFooter className="pt-5">
              {(props.buttons || []).map((b) => (
                <button
                  key={b.name}
                  type="button"
                  className={b.className || `rounded bg-blue-900/50 px-4 py-2 font-bold text-white hover:bg-blue-900/80`}
                  onClick={() => {
                    b.dismiss && setDialogOpen(false);
                    b.onClick();
                  }}
                  ref={b.name === "ok" ? okButton : null}
                >
                  {b.content || b.text || b.label}
                </button>
              ))}
            </DialogFooter>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default MetaDialog;


export function Prompt (props) {
  return (
    <MetaDialog
      {...props}
      type="prompt"
    >
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="form-control">{props.label || ""}</Label>
        <Input 
          type="text"
            id="prompt-input"
            placeholder={props.placeholder || ""}
            className="w-full"
            onChange={props.onChange}
        />
      </div>
    </MetaDialog>
  )
}

export const Modal = (props, content) => {
  loopar.dialog({ ...props, content: props.content || content });
};
