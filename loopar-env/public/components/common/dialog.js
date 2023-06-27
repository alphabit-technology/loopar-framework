import {div,h5,button,span,i,label,input} from "/components/elements.js";
import {loopar} from "/loopar.js";

export default class Dialog extends React.Component {
   constructor(props) {
      super(props);
      window.dialogsCount ??= 0;
      window.dialogsCount++;

      this.state = {
         type: props.type,
         title: props.title,
         content: props.children || props.content || props.message,
         buttons: props.buttons,
         open: (this.props.open !== "undefined" ? this.props.open : true),
         ok: props.ok,
         cancel: props.cancel,
         onClose: props.onClose,
         value: null
      };
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      if (prevProps.content !== this.props.content) {
         this.setState({
            content: this.props.content
         });
      }

      if(prevProps.open !== this.props.open){
         this.setState({
            open: this.props.open
         });
      }
   }

   get buttons(){
      const buttons = this.state.buttons || [];
      if(buttons.length === 0) {
         buttons.push({
            text: 'OK',
            onClick: () => {
               this.state.ok && this.state.ok(this.state.value);
               this.close();
            },
            dismiss: true
         });

         this.state.type === "confirm" &&
         buttons.push({
            text: 'Cancel',
            onClick: () => {
               this.state.cancel && this.state.cancel();
               this.close();
            },
            dismiss: true
         });
      }else{
         const ok_button = buttons.find(b => b.name === "ok");

         if(ok_button){
            const okFunc = ok_button.onClick;
            ok_button.onClick = () => {
               okFunc && okFunc();
               this.state.ok && this.state.ok();
               this.close();
            };
            //ok_button.dismiss = true;
         }

         const cancel_button = buttons.find(b => b.name === "cancel");

         if(cancel_button){
            const cancelFunc = cancel_button.onClick;
            cancel_button.onClick = () => {
               cancelFunc && cancelFunc();
               this.state.cancel && this.state.cancel();
               this.close();
            };
            //cancel_button.dismiss = true;
         }
      }

      return buttons;
   }

   render(body) {
      const {open, title, content=body, type="info"} = this.state;

      let icon = this.props.icon// 'fa-info-circle';
      const hasFooter = this.props.hasFooter !== false;
      if(type === 'alert')
         icon = 'fa-exclamation-circle';
      else if(type === 'confirm')
         icon = 'fa-question-circle';
      else if(type === 'error')
         icon = 'fa-exclamation-triangle';
      else if(type === 'success')
         icon = 'fa-check-circle';

      const text_colors = {
         info: 'text-blue',
         alert: 'text-dark',
         confirm: 'text-orange',
         error: 'text-red',
         success: 'text-green'
      };

      const contentType = typeof content === "string" ? "text" : "react";

      return [
         div({ 
            className: `modal-backdrop fade ${open ? 'show' : ''}`, 
            style: { zIndex: 10000 + window.dialogsCount, display: open ? 'block' : 'none'}
         }),
         div({
            className: `modal modal-${type} fade has-shown ${open ? 'show' : ''}`,
            style: {display: open ? 'block' : 'none', zIndex: 10000 + window.dialogsCount, ...this.props.style || {}},
            onClick: (e) => {
               if(e.target === e.currentTarget){
                  this.close();
               }
            }
         },
            div({ 
               className: `modal-dialog modal-${this.props.size || "md"} modal-dialog-${this.props.position || 'centered'} ${this.props.scrollable ? 'modal-dialog-scrollable' : ''}`, 
               role: 'document'
            },
               div({className: 'modal-content'}, [
                  div({ className: `modal-header ${this.props.scrollable ? 'modal-body-scrolled' :''}`},[
                     h5({className: 'modal-title'}, [
                        i({className: `fa ${this.props.icon || icon} ${text_colors[type]} mr-2`}),
                        title
                     ]),
                     button({
                        type: 'button',
                        className: 'close',
                        onClick: () => this.close()
                     },
                        span({'aria-hidden': 'true'}, '×')
                     )
                  ]),
                  div({
                     className: 'modal-body',
                  }, [
                     contentType === "text" ? 
                        React.createElement("div", { dangerouslySetInnerHTML: { __html: `<p>${content}</p>` } }) :
                        div({}, content)
                  ]),
                  hasFooter ? div({className: 'modal-footer'}, this.buttons.map(b => {
                     return button({
                        type: 'button',
                        className: b.className || `btn btn-${b.type || 'primary'}`,
                        onClick: () => {
                           b.dismiss && this.close();
                           b.onClick();
                        }
                     }, b.content || b.text || b.label);
                  })) : null
               ])
            )
         )
      ];
   }

   show(props) {
      this.setState({...props, open: true}, () => {
         this.state.onShow && this.state.onShow();
      });
   }

   close() {
      this.setState({open: false}, () => {
         this.state.onClose && this.state.onClose();
         
      });
   }
}

class PropmtClass extends Dialog{
   constructor(props) {
      super(props);
   }

   render(){
      return super.render([
         div({className: "form-group"}, [
            label({htmlFor: "prompt-input"}, this.props.label || ""),
            input({
               type: "text", 
               className: "form-control", id: "prompt-input", 
               placeholder: this.props.placeholder || "",
               onChange: (e) => {
                  this.setState({
                     value: e.target.value
                  });
               }
            })
         ])
      ])
   }
}

export const _Prompt = (props) => {
   return React.createElement(PropmtClass, props);
}

export const Prompt = (props) => {
   loopar.prompt({ ...props});
}

export const Modal = (props, content) => {
   loopar.dialog({ ...props, content: props.content || content });
}

