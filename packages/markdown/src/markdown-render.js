import React from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { renderToString } from "react-dom/server";

// Block-level HTML tags that interrupt CommonMark flow. When markdown is
// authored inside any of these (as the mdxeditor does), the markdown content
// must be separated by blank lines so CommonMark re-enters markdown mode.
const BLOCK_TAGS = 'div|section|header|footer|article|aside|main|nav|ul|ol|table';

// Split source into alternating segments: prose (markdown/HTML) and fenced
// code blocks (``` or ~~~). Fenced content must be passed through untouched —
// dedenting or inserting blank lines inside it corrupts code/JSON indentation.
function splitFences(source) {
  const segments = [];
  const lines = source.split('\n');
  let buffer = [];
  let fence = null; // { char, len } while inside a fence

  const flush = (isCode) => {
    if (buffer.length) segments.push({ isCode, text: buffer.join('\n') });
    buffer = [];
  };

  for (const line of lines) {
    const m = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (!fence) {
      if (m) {
        flush(false);
        fence = { char: m[1][0], len: m[1].length };
      }
      buffer.push(line);
    } else {
      buffer.push(line);
      if (m && m[1][0] === fence.char && m[1].length >= fence.len && /^\s{0,3}(`{3,}|~{3,})\s*$/.test(line)) {
        flush(true);
        fence = null;
      }
    }
  }
  flush(!!fence);
  return segments;
}

function preprocessProse(text) {
  // Strip leading whitespace from every line. Editors (mdxeditor included)
  // pretty-print HTML with indentation, and 4+ leading spaces would otherwise
  // be interpreted by CommonMark as an indented code block.
  let result = text.split('\n').map(line => line.trimStart()).join('\n');

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
    .replace(/mailto\\:/g, 'mailto:');
}

function preprocessMarkdown(source) {
  if (!source) return '';

  const normalized = source.replace(/\r\n/g, '\n');

  return splitFences(normalized)
    .map(seg => (seg.isCode ? seg.text : preprocessProse(seg.text)))
    .join('\n')
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