import {image, div} from "../elements.js";
import Component from "../base/component.js";
import { fileManager } from "../tools/file-manager.js";


export default class Gallery extends Component {
   constructor(props){
      super(props);

      this.state = {
         ...this.state,
         src: null
      }
   }

   render(){
      return super.render([
         div({ className: "pswp pswp--supports-fs pswp--open pswp--notouch pswp--css_animation pswp--svg pswp--visible pswp--animated-in pswp--has_mouse"}, [
            div({ className: "pswp__bg"}),
            div({ className: "pswp__scroll-wrap"}, [
               div({ className: "pswp__container"}, [
                  div({ className: "pswp__item"}),
                  div({ className: "pswp__item"}),
                  div({ className: "pswp__item"})
               ]),
               div({ className: "pswp__ui pswp__ui--hidden"}, [
               ])
            ])
         ]),
      ])
   }

   componentDidMount(){
      super.componentDidMount();
      //const {items} = this.props.meta.data;
      const {src} = this.state;
      const {color_overlay={}} = this.props.meta.data;
      const {color, alpha} = color_overlay;

      const pswpElement = this.node;
      const items = [
         {
               src: 'https://placekitten.com/600/400',
               w: 600,
               h: 400
            },
            {
               src: 'https://placekitten.com/1200/900',
               w: 1200,
               h: 900
            }
      ];

      const options = {
         // optionName: 'option value'
         // for example:
         index: 0 // start at first slide
      };

      // Initializes and opens PhotoSwipe

      /*const gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
      gallery.init();*/

      /*const gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
      gallery.init();*/

      /*const gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);*/
   }
}