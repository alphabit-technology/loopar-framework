import { div } from "/components/elements.js";


class FileContainerClass extends React.Component {
   constructor(props) {
      super(props);
   }

   render() {
      return [
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
      ]
   }
}

export const FileContainer = (props, children) => {
   return React.createElement(FileContainerClass, props, children);
}