
'use strict';

import ViewContext from '@context/view-context';

const ImageWithPlaceholder = ({ data }) => {
  const message = data.message || data.description || 'An error occurred';
  const status = Number(data.code) || 500;
  const scope = status >= 500 ? 'SERVER' : status >= 400 ? 'CLIENT' : 'INFO';
  const reason = data.frame ? 'PARSE ERROR'
    : status === 404 ? 'NOT FOUND'
    : status === 403 ? 'FORBIDDEN'
    : status === 401 ? 'UNAUTHORIZED'
    : 'ERROR';
  const detail = data.frame || data.stack || null;

  return (
    <div className="h-full w-full flex flex-1 flex-col justify-center items-center overflow-auto py-10 px-6">
      <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 mb-4 font-mono text-xs tracking-wide text-destructive">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
        {scope} · {reason}
      </span>

      <div
        className="text-6xl sm:text-8xl md:text-9xl font-extrabold text-primary bg-foreground/5 p-10 rounded-2xl tracking-widest shadow-2xl shadow-destructive/40"
        style={{ WebkitTextStroke: '3px rgb(212,212,216,0.6)', userSelect: 'none' }}
      >
        <div className="hover:transform transition-all duration-300 ease-in-out hover:scale-110">{status}</div>
      </div>

      <h1 className="text-4xl font-bold pt-14 text-foreground">{data.title}</h1>
      <span className="text-lg font-medium text-muted-foreground mt-2 text-center max-w-[92%]">{message}</span>

      {detail ? (
        <pre
          className="mt-8 w-full max-w-3xl overflow-auto rounded-xl border border-destructive/25 bg-muted/30 p-4 text-left font-mono text-xs md:text-sm leading-relaxed text-muted-foreground"
          style={{ whiteSpace: 'pre', maxHeight: '42vh' }}
        >
          {detail}
        </pre>
      ) : null}
    </div>
  );
}

export default class ErrorView extends ViewContext {
  constructor(props) {
    super(props);
  }

  render() {
    const data = this.Document?.data || {};

    return (
      <ImageWithPlaceholder 
        src={`/assets/images/illustration/${data.code || '500'}.svg`}
        data={data}
      />
    );
  }
}