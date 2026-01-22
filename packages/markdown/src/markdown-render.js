import React from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { renderToString } from "react-dom/server";

function preprocessHTML(source) {
  if (!source) return '';
  
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('<') || trimmed.startsWith('</')) {
        return trimmed;
      }
      return line;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/mailto\\:/g, 'mailto:')
    .trim();
}

export function renderMarkdown(markdown) {
  if (!markdown || markdown.trim() === '') return '';
  
  return renderToString(
    React.createElement(MarkdownPreview, { 
      source: preprocessHTML(markdown)
    })
  );
}