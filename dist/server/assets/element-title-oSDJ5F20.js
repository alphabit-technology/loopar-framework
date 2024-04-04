import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { c as cn, B as Button } from "../entry-server.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Pencil = createLucideIcon("Pencil", [
  ["path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", key: "5qss01" }],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Trash2 = createLucideIcon("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
function ElementTitle({ element, active, handleEditElement, handleDeleteElement, ...props }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("absolute right-0 z-10 flex flex-row justify-end", props.className || ""),
      ...props,
      children: [
        active && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "destructive",
              size: "xs",
              onClick: handleEditElement,
              className: "h-5 w-8 rounded-none",
              children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "destructive",
              size: "xs",
              onClick: handleDeleteElement,
              className: "h-5 w-8 rounded-none",
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "secondary",
            size: "xs",
            className: "h-5 rounded-none px-2",
            onClick: (e) => {
              e.stopPropagation();
              e.preventDefault();
            },
            children: (element.elementTitle || element.element).toString().split(".")[0].toUpperCase()
          }
        )
      ]
    }
  );
}
const elementTitle = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ElementTitle
}, Symbol.toStringTag, { value: "Module" }));
export {
  ElementTitle as E,
  Pencil as P,
  Trash2 as T,
  elementTitle as e
};
