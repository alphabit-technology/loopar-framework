import React from 'react';

export default class Dialog extends React.Component {
   constructor(props) {
      super(props);

      this.state = {
         type: props.type || 'success',
         title: props.title,
         message: props.message,
         visible: true,
         timeout:  props.timeout || 4000,
      };
   }

   render() {
      const {visible, message, type} = this.state;

      return visible ? div({className: `alert alert-${type} alert-dismissible fade show`, style: {display: visible ? "block" : "none", backgroundColor: "var(--light)"}},[
         button({type: "button", className: "close", onClick: () => this.hide()}, "×"),
         strong(message)
      ]) : null;
   }

   show(props) {
      this.setState({...props, visible: true});

      setTimeout(() => this.hide(), this.state.timeout || 4000);
   }

   hide() {
      this.state.visible && this.setState({visible: false});
   }
}