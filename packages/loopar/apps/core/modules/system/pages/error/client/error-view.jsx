
'use strict';

import ViewContext from '@context/view-context';

const ImageWithPlaceholder = ({ data }) => {
  const message = data.message || data.description || 'An error occurred';

  return (
    <div
      className="h-full inset-0 flex flex-1 flex-col justify-center items-center bg-opacity-50"
    >
        <div 
          className="text-6xl sm:text-9xl md:text-[11rem] lg:text-[14rem] font-extrabold text-primary bg-foreground/5 p-12 rounded tracking-widest shadow-2xl shadow-red-500/50 "
          style={{
            WebkitTextStroke: '3px rgb(212,212,216,0.6)',
            userSelect: 'none'
          }}
        >
          <div className='hover:transform transition-all duration-300 ease-in-out hover:scale-110'>{data.code}</div>
        </div>
        <h1 className="text-4xl font-bold p-2 pt-20 rounded">{data.title}</h1>
        <span className="text-xl font-bold bg-opacity-50 rounded items-center text-center">
          {message}
        </span>
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