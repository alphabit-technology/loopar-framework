import React from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { renderToString } from "react-dom/server";

// Block-level HTML tags that interrupt CommonMark flow. When markdown is
// authored inside any of these (as the mdxeditor does), the markdown content
// must be separated by blank lines so CommonMark re-enters markdown mode.
const BLOCK_TAGS = 'div|section|header|footer|article|aside|main|nav|ul|ol|table';

function preprocessMarkdown(source) {
  if (!source) return '';

  let result = source.replace(/\r\n/g, '\n');

  // Strip leading whitespace from every line. Editors (mdxeditor included)
  // pretty-print HTML with indentation, and 4+ leading spaces would otherwise
  // be interpreted by CommonMark as an indented code block.
  result = result.split('\n').map(line => line.trimStart()).join('\n');

  // Insert a blank line AFTER block-tag openings and BEFORE block-tag closings.
  // CommonMark rule: an HTML block ends at a blank line, after which markdown
  // is processed normally. This bridges the HTML/markdown boundary so authors
  // can mix headings, lists, bold, links, etc. inside <div> wrappers — which
  // is what mdxeditor lets you do via its MDX-aware parser.
  result = result.replace(
    new RegExp(`(<(?:${BLOCK_TAGS})\\b[^>]*>)\\n(?!\\n)`, 'g'),
    '$1\n\n'
  );
  result = result.replace(
    new RegExp(`(?<!\\n)\\n(</(?:${BLOCK_TAGS})>)`, 'g'),
    '\n\n$1'
  );

  // Collapse 3+ consecutive newlines, normalize escaped mailto.
  return result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/mailto\\:/g, 'mailto:')
    .trim();
}

export function renderMarkdown(markdown) {
  if (!markdown || markdown.trim() === '') return '';

  return renderToString(
    React.createElement(MarkdownPreview, {
      source: preprocessMarkdown(markdown)
    })
  );
}