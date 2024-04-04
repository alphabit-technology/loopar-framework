var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { C as Component } from "./component-hNq1V6er.js";
import "../entry-server.js";
import "./form-context-8n26Uc_0.js";
import { D as DesignerContext } from "./base-component-BnGRdg1n.js";
import "react";
import "./form-z4zN6fsS.js";
import "clsx";
import { MDXEditor, toolbarPlugin, KitchenSinkToolbar, listsPlugin, quotePlugin, headingsPlugin, linkPlugin, linkDialogPlugin, imagePlugin, tablePlugin, thematicBreakPlugin, frontmatterPlugin, codeBlockPlugin, codeMirrorPlugin, diffSourcePlugin, markdownShortcutPlugin } from "@mdxeditor/editor";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react-dom/server";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
function InitializedMDXEditor({ editorRef, ...props }) {
  return /* @__PURE__ */ jsx(
    MDXEditor,
    {
      plugins: [
        // Ejemplo de uso de complementos
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin()
      ],
      ...props
    }
  );
}
class MarkdownBase extends Component {
  constructor(props = {}) {
    super(props);
    __publicField(this, "isWritable", false);
    this.state = {
      ...this.state,
      parsedData: null,
      mounted: false
    };
  }
  render() {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("style", { children: `
          .dark .dark-editor {
            position: inherit !important;
            display: grid !important;
            --accentBase: var(--tomato-1);
            --accentBgSubtle: var(--tomato-2);
            --accentBg: var(--tomato-3);
            --accentBgHover: var(--tomato-4);
            --accentBgActive: var(--tomato-5);
            --accentLine: var(--tomato-6);
            --accentBorder: var(--tomato-7);
            --accentBorderHover: var(--tomato-8);
            --accentSolid: var(--tomato-9);
            --accentSolidHover: var(--tomato-10);
            --accentText: var(--tomato-11);
            --accentTextContrast: var(--tomato-12);

            --baseBase: var(--mauve-1);
            --baseBgSubtle: var(--mauve-2);
            --baseBg: var(--mauve-3);
            --baseBgHover: var(--mauve-4);
            --baseBgActive: var(--mauve-5);
            --baseLine: var(--mauve-6);
            --baseBorder: var(--mauve-7);
            --baseBorderHover: var(--mauve-8);
            --baseSolid: var(--mauve-9);
            --baseSolidHover: var(--mauve-10);
            --baseText: var(--mauve-11);
            --baseTextContrast: var(--mauve-12);

            --admonitionTipBg: var(--cyan4);
            --admonitionTipBorder: var(--cyan8);

            --admonitionInfoBg: var(--grass4);
            --admonitionInfoBorder: var(--grass8);

            --admonitionCautionBg: var(--amber4);
            --admonitionCautionBorder: var(--amber8);

            --admonitionDangerBg: var(--red4);
            --admonitionDangerBorder: var(--red8);

            --admonitionNoteBg: var(--mauve-4);
            --admonitionNoteBorder: var(--mauve-8);

            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

            color: var(--baseText);
            --basePageBg: var(--baseBg);
            background: var(--basePageBg);
          }` }),
      /* @__PURE__ */ jsx(
        MDXEditor,
        {
          className: "dark-editor",
          style: { position: "absolute" },
          markdown: "* Has a lot of plugins",
          plugins: [
            toolbarPlugin({ toolbarContents: () => /* @__PURE__ */ jsx(KitchenSinkToolbar, {}) }),
            listsPlugin(),
            quotePlugin(),
            headingsPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin(),
            tablePlugin(),
            thematicBreakPlugin(),
            frontmatterPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
            codeMirrorPlugin({ codeBlockLanguages: { js: "JavaScript", css: "CSS", txt: "text", tsx: "TypeScript" } }),
            diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "boo" }),
            markdownShortcutPlugin()
          ]
        }
      )
    ] });
  }
  componentDidMount() {
    super.componentDidMount();
    console.log("Markdown Mounted");
    this.setState({ mounted: true });
    return;
  }
  get metaFields() {
    return [
      {
        group: "custom",
        elements: {
          has_inside_data: {
            element: SWITCH,
            data: {
              description: "If you need to use data inside the markdown, check this option and use the variable {{ data }} inside the markdown."
            }
          },
          ref_data: {
            element: TEXTAREA,
            data: {
              description: "Define name of the variable to be used inside the markdown, this variable will be taked from the data of the document"
            }
          }
        }
      }
    ];
  }
}
__publicField(MarkdownBase, "contextType", DesignerContext);
export {
  InitializedMDXEditor,
  MarkdownBase as default
};
