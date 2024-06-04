import React, { useContext } from "react";

export const DeskLogo = (props) => {

  const imageProps = {
    src: `/assets/images/logo.svg`,
    alt: "Loopar Logo",
    className: 'hidden h-8 md:block',
    href: "/core/Desk/view",
  }
  return (
    <div className='p-1'>
      <div
        className='inline-flex items-center'
      >
        <img {...imageProps}/>
        <img {...imageProps} src="/assets/images/logo-dark-min.svg" className="h-8 w-20 md:hidden" style={{minWidth:40, maxWidth:40}}/>
      </div>
    </div>
  );
};
