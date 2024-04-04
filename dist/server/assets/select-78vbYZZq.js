var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _model, _search, search_fn;
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import { c as cn, h as http, B as Button } from "../entry-server.js";
import * as React from "react";
import { useState } from "react";
import { Cross2Icon, CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { u as useFormContext } from "./form-context-8n26Uc_0.js";
import { Command as Command$1 } from "cmdk";
import "./dialog-9N_htvR6.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-orKr8AdK.js";
import { F as FormLabel, b as FormDescription } from "./form-z4zN6fsS.js";
import "./base-component-BnGRdg1n.js";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./element-title-oSDJ5F20.js";
import "./form-field-WWLBJIO2.js";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "@radix-ui/react-dialog";
import "./x-3j0F7ehT.js";
import "@radix-ui/react-popover";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Search = createLucideIcon("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);
const Command = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1,
  {
    ref,
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = Command$1.displayName;
const CommandInput = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ jsx(
    Command$1.Input,
    {
      ref,
      className: cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = Command$1.Input.displayName;
const CommandList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.List,
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = Command$1.List.displayName;
const CommandEmpty = React.forwardRef((props, ref) => /* @__PURE__ */ jsx(
  Command$1.Empty,
  {
    ref,
    className: "py-6 text-center text-sm",
    ...props
  }
));
CommandEmpty.displayName = Command$1.Empty.displayName;
const CommandGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Group,
  {
    ref,
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = Command$1.Group.displayName;
const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Separator,
  {
    ref,
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = Command$1.Separator.displayName;
const CommandItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props
  }
));
CommandItem.displayName = Command$1.Item.displayName;
function SelectFn({ search, selectData, onSelect, options, field, ...props }) {
  var _a;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [searching, setSearching] = useState(false);
  useFormContext();
  const openHandler = (e) => {
    setSearching(true);
    setOpen(e);
    search(null, false).then((result) => {
      setSearching(false);
    });
  };
  const searchHandler = (e) => {
    search(e, true);
  };
  const setValueHandler = (e) => {
    setOpen(false);
    onSelect(e);
  };
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: openHandler, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        role: "combobox",
        className: cn(
          "w-full justify-between pr-1",
          // max-w-sm
          !field.value && "text-muted-foreground"
        ),
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          openHandler(!open);
        },
        onMouseEnter: setActive,
        onMouseLeave: () => setActive(false),
        children: [
          field.value ? ((_a = options.find(
            (option) => option.option === field.value
          )) == null ? void 0 : _a.option) || `Select ${selectData.label}` : `Select ${selectData.label}`,
          /* @__PURE__ */ jsxs("div", { className: "flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsx(
              Cross2Icon,
              {
                className: `h-5 w-5 shrink-0 ${active ? "opacity-50" : "opacity-0"}`,
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setValueHandler(null);
                  searchHandler(null);
                }
              }
            ),
            /* @__PURE__ */ jsx(CaretSortIcon, { className: "ml-1 h-5 w-5 shrink-0 opacity-50" })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(PopoverContent, { className: "w-full min-w-[var(--radix-popover-trigger-width)]", align: "start", children: /* @__PURE__ */ jsxs(Command, { children: [
      /* @__PURE__ */ jsx(
        CommandInput,
        {
          placeholder: `Search ${selectData.label}...`,
          className: "h-9",
          onKeyUp: searchHandler
        }
      ),
      /* @__PURE__ */ jsx(CommandEmpty, { children: "No results found." }),
      /* @__PURE__ */ jsx(CommandGroup, { children: options.map((option) => /* @__PURE__ */ jsxs(
        CommandItem,
        {
          value: option.option,
          onSelect: () => setValueHandler(option.option),
          children: [
            option.title || option.value || option.option,
            /* @__PURE__ */ jsx(
              CheckIcon,
              {
                className: cn(
                  "ml-auto h-4 w-4",
                  option.option === field.value ? "opacity-100" : "opacity-0"
                )
              }
            )
          ]
        },
        option.option
      )) })
    ] }) })
  ] });
}
class Select extends BaseInput {
  /*get requires() {
    return {
      css: ["/assets/plugins/bootstrap/css/select2"],
    };
  }*/
  constructor(props) {
    super(props);
    __privateAdd(this, _search);
    __privateAdd(this, _model, null);
    __publicField(this, "filteredOptions", []);
    __publicField(this, "titleFields", ["value"]);
    this.state = {
      ...this.state,
      valid: true,
      rows: []
    };
  }
  render() {
    const data = this.data || { label: "Select", name: "select", value: "" };
    this.assignedValue = data.value;
    return this.renderInput((field) => /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(FormLabel, { children: data.label }),
      /* @__PURE__ */ jsx(
        SelectFn,
        {
          field,
          initialValue: this.optionValue(),
          options: this.state.rows,
          search: (delay) => __privateMethod(this, _search, search_fn).call(this, delay),
          selectData: data,
          onSelect: field.onChange
        }
      ),
      data.description && /* @__PURE__ */ jsx(FormDescription, { children: data.description })
    ] }));
  }
  componentDidMount() {
    super.componentDidMount();
    this.setState({ rows: this.optionsSelect });
  }
  get isLocal() {
    return this.optionsSelect.length > 1;
  }
  get model() {
    return __privateGet(this, _model).option || __privateGet(this, _model).name;
  }
  get options() {
  }
  get optionsSelect() {
    const opts = this.data.options || "";
    if (typeof opts == "object") {
      if (Array.isArray(opts)) {
        return opts;
      } else {
        return Object.keys(opts).map((key) => ({
          option: key,
          title: opts[key]
        }));
      }
    } else if (typeof opts == "string") {
      return opts.split(/\r?\n/).map((item) => {
        const [option, title] = item.split(":");
        return { option, title: option || title };
      });
    }
  }
  get searchQuery() {
    var _a, _b;
    return ((_b = (_a = this.inputSearch) == null ? void 0 : _a.node) == null ? void 0 : _b.value) || "";
  }
  getServerData(q) {
    return new Promise((resolve, reject) => {
      http.send({
        action: `/api/${this.model}/search`,
        params: { q },
        success: (r) => {
          this.titleFields = r.titleFields;
          this.filteredOptions = this.getPrepareOptions(r.rows);
          resolve(this.renderResult());
        },
        error: (r) => {
          console.log(r);
        },
        freeze: false
      });
    });
  }
  renderResult() {
    this.setState({ rows: this.filteredOptions });
  }
  optionValue(option = this.currentSelection) {
    const value = (data) => {
      if (data && typeof data == "object") {
        if (Array.isArray(this.titleFields)) {
          const values = this.titleFields.map((item) => data[item]);
          return values.reduce((a, b) => {
            return [
              ...a,
              [...a.map((item) => item.toLowerCase())].includes(
                b.toLowerCase()
              ) ? "" : b
            ];
          }, []).join(" ");
        } else {
          return data[this.titleFields];
        }
      }
    };
    return option && typeof option == "object" ? {
      option: option.option || option.name,
      title: value(option)
      //option[this.titleFields] || option.value || option.option
    } : {
      option: option || this.assignedValue,
      title: option || this.assignedValue
    };
  }
  /**
   *
   * #param {string || object} val
   * #param {boolean} trigger_change
   * #returns
   */
  val(val = null, { trigger_change = true } = {}) {
    if (val != null) {
      this.assignedValue = val;
      this.renderValue(trigger_change);
      return this;
    } else {
      return this.data.value;
    }
  }
  getPrepareOptions(options) {
    return options.map((item) => {
      return typeof item == "object" ? { option: item.title || item.name, title: item.value || item.description || item.title } : { option: item, title: item };
    });
  }
  get currentSelection() {
    return Object.keys(this.filteredOptions || {}) > 0 ? this.filteredOptions.filter(
      (item) => this.optionValue(item).option === this.optionValue(this.assignedValue).option
    )[0] : this.assignedValue;
  }
  get metaFields() {
    const data = super.metaFields[0];
    data.elements.options = {
      element: TEXTAREA,
      data: {
        description: "For simple select insert the options separated by enter. For Document Select insert the Document Name"
      }
    };
    return [data];
  }
}
_model = new WeakMap();
_search = new WeakSet();
search_fn = function(target, delay = true) {
  var _a;
  const q = ((_a = target == null ? void 0 : target.target) == null ? void 0 : _a.value) || "";
  return new Promise((resolve, reject) => {
    if (this.isLocal) {
      this.filteredOptions = this.optionsSelect.filter((row) => {
        return (typeof row == "object" ? `${row.option} ${row.title}` : row).toLowerCase().includes(q);
      }).map((row) => {
        return typeof row == "object" ? row : { option: row, title: row };
      });
      resolve(this.renderResult());
    } else {
      __privateSet(this, _model, this.optionsSelect[0]);
      if (delay) {
        clearTimeout(this.lastSearch);
        this.lastSearch = setTimeout(() => {
          this.getServerData(q).then(resolve);
        }, 200);
      } else {
        this.getServerData(q).then(resolve);
      }
    }
  });
};
export {
  Select as default
};
