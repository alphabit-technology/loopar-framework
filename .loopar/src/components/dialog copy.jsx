import React from "react";
import loopar from "$loopar";
global.dialogsCount ??= 0;

import {
  Dialog as BaseDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default class Dialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      type: props.type,
      title: props.title,
      open: this.props.open !== "undefined" ? this.props.open : true,
      ok: props.ok,
      cancel: props.cancel,
      value: null,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.content !== this.props.content) {
      this.setState({
        content: this.props.content,
      });
    }

    if (prevProps.open !== this.props.open) {
      this.setState({
        open: this.props.open,
      });
    }

    this.type !== "prompt" && this.button_ok?.focus();
  }

  get buttons() {
    if(Array.isArray(this.props.buttons) && this.props.buttons.length === 0) return [];
    const buttons = this.state.buttons || [];
    if (buttons.length === 0) {
      buttons.push({
        name: "ok",
        text: "OK",
        onClick: () => {
          this.state.ok && this.state.ok(this.state.value);
          this.close();
        },
        dismiss: true,
      });

      this.state.type === "confirm" &&
        buttons.push({
          name: "cancel",
          text: "Cancel",
          onClick: () => {
            this.state.cancel && this.state.cancel();
            this.close();
          },
          dismiss: true,
        });
    } else {
      const okButton = buttons.find((b) => b.name === "ok");

      if (okButton) {
        const okFunc = okButton.onClick;
        okButton.onClick = () => {
          okFunc && okFunc();
          this.state.ok && this.state.ok();
          this.close();
        };
        //okButton.dismiss = true;
      }

      const cancelButton = buttons.find((b) => b.name === "cancel");

      if (cancelButton) {
        const cancelFunc = cancelButton.onClick;
        cancelButton.onClick = () => {
          cancelFunc && cancelFunc();
          this.state.cancel && this.state.cancel();
          this.close();
        };
        //cancelButton.dismiss = true;
      }
    }

    return buttons;
  }

  getIcon() {
    const { type } = this.state;
    const icons = {
      info: "fa-info-circle",
      alert: "fa-exclamation-circle",
      confirm: "fa-question-circle",
      error: "fa-exclamation-triangle",
      success: "fa-check-circle",
      prompt: "fa-question-circle",
    };

    const icon = this.props.icon || "fa " + icons[type];

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
  }

  render(body) {
    const { open, type = "info", zIndex } = this.state;
    const size = this.props.size || "sm";

    const hasFooter = this.props.hasFooter !== false;
    const content = body || this.props.children || this.props.content || this.props.message;
    const contentType = typeof content === "string" ? "text" : "react";

    const setOpen = (open) => {
      this.setState({ open }, () => {
        if (!open) {
          this.props.onClose && this.props.onClose();
        }
      });
    }

    const sizes = {
      sm: "md:min-w-[45%] lg:min-w-[40%] xl:min-w-[35%]",
      md: "md:min-w-[60%] lg:min-w-[50%] xl:min-w-[45%]",
      lg: "md:min-w-[75%] lg:min-w-[70%] xl:min-w-[60%]",
      full: "min-w-[100%] min-h-[100%] max-w-[100%] max-h-[100%]",
    }

    return (
      <BaseDialog
        open={open}
        onOpenChange={setOpen}
        key={this.props.id}
      >
        <DialogContent
         className={`sm:max-w-md ${sizes[size]}`}
        >
          <DialogHeader>
            <DialogTitle><h1 className="text-2xl">{this.props.title}</h1></DialogTitle>
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
            {hasFooter ? (
              <DialogFooter className="pt-5">
                {this.buttons.map((b) => {
                  return (
                    <button
                      type="button"
                      className={
                        b.className || `rounded bg-blue-900/50 px-4 py-2 font-bold text-white hover:bg-blue-900/80`
                      }
                      onClick={() => {
                        b.dismiss && this.close();
                        b.onClick();
                      }}
                      ref={(ref) => {
                        if (ref) {
                          this[`button_${b.name}`] = ref;
                        }
                      }}
                    >
                      {b.content || b.text || b.label}
                    </button>
                  );
                })}
              </DialogFooter>
            ) : null}
          </DialogHeader>
        </DialogContent>
      </BaseDialog>
    )
  }

  show(props) {
    global.dialogsCount++;
    this.setState(
      {
        ...props,
        open: true,
        zIndex: this.state.zIndex || 10000 + window.dialogsCount,
      },
      () => {
        this.state.onShow && this.state.onShow();
      }
    );
  }

  close() {
    this.setState({ open: false }, () => {
      this.props.onClose && this.props.onClose();
    });
  }
}

export class Prompt extends Dialog {
  type="prompt";
  constructor(props) {
    super(props);
  }

  render() {
    return super.render(
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="form-control">{this.props.label || ""}</Label>
        <Input 
          type="text"
            id="prompt-input"
            placeholder={this.props.placeholder || ""}
            className="w-full"
            onChange={(e) => {
              this.setState({
                value: e.target.value,
              });
            }}
        />
      </div>
    )
  }
}

export const Modal = (props, content) => {
  loopar.dialog({ ...props, content: props.content || content });
};
