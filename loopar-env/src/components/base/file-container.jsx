import React from 'react';

export default class FileContainer extends React.Component {
   constructor(props) {
      super(props);
   }

   render() {
      return <>
         <div 
            className="col-12"
            style={{
               height: this.props.height || '200px',
               overflow: 'auto',
               backgroundColor: 'var(--light)',
            }}
         >
            <div className="row file-preview-container grid-container">
               {this.props.children}
            </div>
         </div>
      </>
      /*return [
         div({ 
            className: "col-12",
            style: {
               height: this.props.height || '200px',
               overflow: 'auto',
               backgroundColor: 'var(--light)',
            }
         }, [
            div({
                className: "row file-preview-container grid-container",
                style: {
                  height: 'auto',//this.props.minHeight || '200px',
                  //overflow: 'auto',
               },
            }, [
               this.props.children
            ])
         ])
      ]*/
   }
}