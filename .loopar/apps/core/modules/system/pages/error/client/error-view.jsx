
'use strict';

import ViewContext from '@context/view-context';
import React, { useState } from 'react';

const ImageWithPlaceholder = ({ data }) => {
  const message = data.message || data.description || 'An error occurred';
  const height = 800;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="relative flex justify-center items-center w-full"
      style={{ height }}
    >
      {!imageLoaded && <div className="absolute inset-0 animate-pulse"></div>}

      <div className="absolute inset-0 flex flex-col justify-center items-center bg-opacity-50 text-slate-600 dark:text-slate-400">
        <h1 
          className="text-9xl font-extrabold text-slate-800 dark:text-slate-600/50 text-opacity-50 bg-slate-300/50 dark:bg-card p-6 rounded-full tracking-widest shadow-2xl shadow-red-500/50"
          style={{
            WebkitTextStroke: '3px rgb(212,212,216,0.6)',
            userSelect: 'none'
          }}
        >
          {data.code}
        </h1>
        <h1 className="text-3xl font-bold p-2 pt-20 rounded">{data.title}</h1>
        <span className=" text-xl font-bold bg-opacity-50 rounded">
          {message}
        </span>
      </div>
    </div>
  );
}

export default class ErrorView extends ViewContext {
  constructor(props) {
    super(props);
  }

  render() {
    const data = this.props.meta.__DOCUMENT__;

    return (
      <ImageWithPlaceholder 
        src={`/assets/images/illustration/${data.code || '500'}.svg`}
        data={data}
      />
    );
  }
}