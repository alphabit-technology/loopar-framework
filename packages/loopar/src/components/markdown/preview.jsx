import MarkdownPreview from '@uiw/react-markdown-preview';

/**
 * Read-only markdown rendering. Kept apart from markdown.jsx on purpose:
 * that module pulls in the whole MDX editor (+ CodeMirror, Lexical, CSS),
 * which must never ride along with code that only needs to DISPLAY markdown
 * (read-only fields, print, collection detail pages).
 */
export function Preview({ source }) {
  return (
    <div className="lp-markdown p-2">
      <MarkdownPreview source={source} />
    </div>
  );
}

export default Preview;
