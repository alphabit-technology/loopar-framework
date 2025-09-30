import {ComponentDefaults, tagDontHaveChild, validTags} from "./base/ComponentDefaults";
import loopar from "loopar";
import React from "react";
import { Droppable } from "@droppable";

export default function Generic({ ...props }) {
  const {elementsDict, data} = ComponentDefaults(props);

  const validateTag=(tag)=>{
    return validTags.includes(tag);
  }

  const tag = props.tag || data.tag;
  let tagName = validateTag(tag) ? tag : "div";

  if (tagDontHaveChild(tagName) && elementsDict.length > 0) {
    loopar.throw({
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

Generic.metaFields = () => {
  return [
    [
      {
        group: "HTML",
        elements: {
          tag: { element: "input", data: { format: "text" } },
        },
      }
    ]
  ]
}