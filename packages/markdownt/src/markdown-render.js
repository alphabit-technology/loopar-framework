import React from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { renderToString } from "react-dom/server";

export async function renderMarkdown(markdown) {
  return renderToString(
    React.createElement(MarkdownPreview, { source: markdown })
  );
}
