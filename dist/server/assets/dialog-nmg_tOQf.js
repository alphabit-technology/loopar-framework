var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs } from "react/jsx-runtime";
import React__default from "react";
import { l as loopar } from "../entry-server.js";
import { D as Dialog$1, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-9N_htvR6.js";
import { I as Input$1 } from "./input-LY3ihqM_.js";
import { L as Label } from "./label-yp0wPYLz.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "@radix-ui/react-dialog";
import "./x-3j0F7ehT.js";
import "./createLucideIcon-SgSXnVj5.js";
import "@radix-ui/react-label";
global.dialogsCount ?? (global.dialogsCount = 0);
class Dialog extends React__default.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: props.type,
      title: props.title,
      //content: props.children || props.content || props.message,
      //buttons: props.buttons,
      open: this.props.open !== "undefined" ? this.props.open : true,
      ok: props.ok,
      cancel: props.cancel,
      value: null
    };
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    var _a;
    if (prevProps.content !== this.props.content) {
      this.setState({
        content: this.props.content
      });
    }
    if (prevProps.open !== this.props.open) {
      this.setState({
        open: this.props.open
      });
    }
    this.type !== "prompt" && ((_a = this.button_ok) == null ? void 0 : _a.focus());
  }
  get buttons() {
    const buttons = this.state.buttons || [];
    if (buttons.length === 0) {
      buttons.push({
        name: "ok",
        text: "OK",
        onClick: () => {
          this.state.ok && this.state.ok(this.state.value);
          this.close();
        },
        dismiss: true
      });
      this.state.type === "confirm" && buttons.push({
        name: "cancel",
        text: "Cancel",
        onClick: () => {
          this.state.cancel && this.state.cancel();
          this.close();
        },
        dismiss: true
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
      }
      const cancelButton = buttons.find((b) => b.name === "cancel");
      if (cancelButton) {
        const cancelFunc = cancelButton.onClick;
        cancelButton.onClick = () => {
          cancelFunc && cancelFunc();
          this.state.cancel && this.state.cancel();
          this.close();
        };
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
      prompt: "fa-question-circle"
    };
    const icon = this.props.icon || "fa " + icons[type];
    const textColors = {
      info: "text-blue",
      alert: "text-dark",
      confirm: "text-orange",
      error: "text-red",
      success: "text-green",
      prompt: "text-blue"
    };
    return typeof icon === "string" ? /* @__PURE__ */ jsx("i", { className: `${icon} ${textColors[type]} mr-2` }) : icon;
  }
  render(body) {
    const { open, type = "info", zIndex } = this.state;
    const size = this.props.size || "sm";
    const hasFooter = this.props.hasFooter !== false;
    const content = body || this.props.children || this.props.content || this.props.message;
    const contentType = typeof content === "string" ? "text" : "react";
    const setOpen = (open2) => {
      this.setState({ open: open2 }, () => {
        if (!open2) {
          this.props.onClose && this.props.onClose();
        }
      });
    };
    const sizes = {
      sm: "md:min-w-[45%] lg:min-w-[40%] xl:min-w-[35%]",
      md: "md:min-w-[60%] lg:min-w-[50%] xl:min-w-[45%]",
      lg: "md:min-w-[75%] lg:min-w-[70%] xl:min-w-[60%]",
      full: "min-w-[100%] min-h-[100%] max-w-[100%] max-h-[100%]"
    };
    return /* @__PURE__ */ jsx(
      Dialog$1,
      {
        open,
        onOpenChange: setOpen,
        children: /* @__PURE__ */ jsx(
          DialogContent,
          {
            className: `sm:max-w-md ${sizes[size]}`,
            children: /* @__PURE__ */ jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsx(DialogTitle, { children: /* @__PURE__ */ jsx("h1", { className: "text-2xl", children: this.props.title }) }),
              /* @__PURE__ */ jsx(DialogDescription, { children: contentType === "text" ? /* @__PURE__ */ jsx(
                "div",
                {
                  dangerouslySetInnerHTML: { __html: `<p>${content}</p>` }
                }
              ) : /* @__PURE__ */ jsx("div", { children: content }) }),
              hasFooter ? /* @__PURE__ */ jsx(DialogFooter, { className: "pt-5", children: this.buttons.map((b) => {
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: b.className || `rounded bg-blue-900/50 px-4 py-2 font-bold text-white hover:bg-blue-900/80`,
                    onClick: () => {
                      b.dismiss && this.close();
                      b.onClick();
                    },
                    ref: (ref) => {
                      if (ref) {
                        this[`button_${b.name}`] = ref;
                      }
                    },
                    children: b.content || b.text || b.label
                  }
                );
              }) }) : null
            ] })
          }
        )
      },
      this.props.id
    );
  }
  show(props) {
    global.dialogsCount++;
    this.setState(
      {
        ...props,
        open: true,
        zIndex: this.state.zIndex || 1e4 + window.dialogsCount
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
class Prompt extends Dialog {
  constructor(props) {
    super(props);
    __publicField(this, "type", "prompt");
  }
  render() {
    return super.render(
      /* @__PURE__ */ jsxs("div", { className: "grid w-full items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "form-control", children: this.props.label || "" }),
        /* @__PURE__ */ jsx(
          Input$1,
          {
            type: "text",
            id: "prompt-input",
            placeholder: this.props.placeholder || "",
            className: "w-full",
            onChange: (e) => {
              this.setState({
                value: e.target.value
              });
            }
          }
        )
      ] })
    );
  }
}
const Modal = (props, content) => {
  loopar.dialog({ ...props, content: props.content || content });
};
export {
  Modal,
  Prompt,
  Dialog as default
};
