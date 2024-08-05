import ComponentDefaults from "$component-defaults";
import loopar from "$loopar";
import React from "react";
import { Droppable } from "$droppable";
import {useDialog} from "@context/@/dialog-context";

export default function Generic({ ...props }) {
  const {elementsDict, data} = ComponentDefaults(props)
  const {Dialog} = useDialog();
  //blockComponent = true;
  //dontHaveContainer = true;
  //dontHaveMetaElements = ["label"];

  const validateTag=(tag)=>{
    const validTags = [
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "i",
      "ul",
      "li",
      "img",
      "input",
      "button",
      "form",
      "label",
      "select",
      "option",
      "textarea",
      "table",
      "tr",
      "td",
      "th",
      "thead",
      "tbody",
      "tfoot",
      "nav",
      "header",
      "footer",
      "main",
      "section",
      "article",
      "aside",
      "blockquote",
      "br",
      "hr",
      "iframe",
      "map",
      "area",
      "audio",
      "video",
      "canvas",
      "datalist",
      "details",
      "embed",
      "fieldset",
      "figure",
      "figcaption",
      "mark",
      "meter",
      "object",
      "output",
      "progress",
      "q",
      "ruby",
      "rt",
      "rp",
      "samp",
      "script",
      "style",
      "summary",
      "time",
      "track",
      "var",
      "wbr",
    ];

    return validTags.includes(tag);
  }

  const tag = props.tag || data.tag;
  let tagName = validateTag(tag) ? tag : "div";

  if (tagDontHaveChild(tagName) && elementsDict.length > 0) {
    Dialog({
      title: "Warning",
      message: `This element have a child element, but the tag "${tagName}" don't have child elements. will be used the tag "div" instead.`,
      buttons: [
        {
          label: "Ok",
          className: "btn btn-primary",
          onClick: () => {
            loopar.closeDialog();
          },
        },
      ],
    });

    tagName = "div";
  }

  if (tagDontHaveChild(tagName)) {
    return React.createElement(tagName, props);
  }

  return (
    <Droppable Component={tagName} {...props}/>
  )
}


Generic.getMetaFields = () => {
  return [
    {
      group: "HTML",
      elements: {
        tag: { element: INPUT },
      },
    },
  ];
}