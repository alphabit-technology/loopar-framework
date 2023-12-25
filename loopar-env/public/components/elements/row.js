import { div, span, button } from "../elements.js";
import Component from "../base/component.js";
import { elementManage } from "../element-manage.js";
import { loopar } from "/loopar.js";

export default class Row extends Component {
   blockComponent = true;
   className = "row";
   dontHaveMetaElements = ["label", "text"];

   constructor(props) {
      super(props);
   }

   setLayout(layout){
      const meta = this.props.meta;

      this.props.designerRef.updateElement(meta.data.key, {
         layout: JSON.stringify(layout),
      }, true);
   }

   getLayout(){
      const meta = this.props.meta;
      return (meta.data.layout && loopar.utils.isJSON(meta.data.layout)) ? JSON.parse(meta.data.layout) : [];
   }

   getColumnsSelector(){
      const sizes = [[100], [50,50], [66,33], [33,67], [25,25,25,25], [25,75], [75,25], [40,60], [60,40], [20,20,20,20,20,20], [20,40,40], [40,20,40]];
      const buttonsCount = sizes.length
      const bottonSize = 100 / sizes.length;

      return sizes.map((layout, layoutIndex) => {
         return div({
            className: `progress ${layoutIndex < buttonsCount - 1 ? "mr-1" : ""}`,
            style: {
               width: bottonSize + "%",
               borderRadius: 0,
               backgroundColor: 'transparent'
            },
            onClick: (e) => {
               e.stopPropagation();
               e.preventDefault();

               this.setLayout(layout);
            }
         }, [
            layout.map((size, index) => {
               return div({
                  className: `progress-bar`,
                  style: {
                     width: size + "%", border: "unset",
                     backgroundColor: `rgba(255,${Math.abs(150 - (index * 50))},0,${(index + 1) / layout.length})`
                  }
               })
            })
         ])
      })
   }
   render(content) {
      const data = this.props.meta?.data || {};
      const {horizontal_alignment, vertical_alignment, row_height} = data;

      const verticalAligments = {
         top: "start",
         center: "center",
         bottom: "end",
      }

      const horizontalAligment = `align-items-${horizontal_alignment || "left"}`;
      const verticalAligment = `align-items-${verticalAligments[vertical_alignment] || "start"}`;

      if(row_height && row_height !== "auto"){
         this.style = {
            ...this.style,
            minHeight: row_height + "vh",
         }
      }
      //const rowHeight = row_height && row_height !== "auto" ? `vh-${row_height}` : "";
      //this.addClass(horizontalAligment + " " + verticalAligment, false);

      this.extraClassName = horizontalAligment + " " + verticalAligment;

      return super.render([
         this.props.designer && div({
            className: "row-layout-selector",
            style: {
               position: "absolute",
               bottom: 0,
               left: 0,
               width: "100%",
               display: "none",
               zIndex: 99
            }
         }, [
            this.getColumnsSelector(),
         ]),
         this.props.children,
         content,
         this.elements
      ]);
   }

   get elements(){
      const columns = (this.meta?.elements || []).filter(el => el.element === COL);
      const layout = this.getLayout();

      if(this.props.designer && columns.length < layout.length){
         const pending = layout.length - columns.length;
         const newColumns = [];

         for(let i = 0; i < pending; i++){
            newColumns.push({
               element: COL,
               data: {
                  key: elementManage.getUniqueKey(),
               }
            });
         }

         this.setElements(newColumns);
         return;
      }

      let layoutIndexUsed = 0;
      return (this.meta?.elements || []).map(el => {
         let className = "";
         if(el.element === COL){
            if (layoutIndexUsed < layout.length) {
               className = `col-12 col-md-${(Math.round((layout[layoutIndexUsed] / 100) * 12))} `;
               layoutIndexUsed++;
            }else{
               ["xm", "sm", "md", "lg", "xl"].forEach(size => {
                  el.data[size] && (className += `col-${size}-${el.data[size]} `);
               });
            }
         }
         return this.getElement(el, {className})//, ...(this.props.designer ? {key: elementManage.getUniqueKey()} : {})});
      });
   }

   componentDidMount() {
      super.componentDidMount();


      /*if(this.options.designer){
         this.container.droppable_actions();
      }else{
         //this.addClass("position-relative pb-5 bg-light");
      }*/
   }

   get metaFields() {
      return {
         group: "custom",
         elements: {
            layout: {
               element: INPUT,
               data: {
                  disabled: true
               }
            },
            horizontal_alignment: {
               element: SELECT,
               data: {
                  options: [
                     { option: "left", value: "left" },
                     { option: "center", value: "center" },
                     { option: "right", value: "right" },
                  ]
               }
            },
            vertical_alignment: {
               element: SELECT,
               data: {
                  options: [
                     { option: "top", value: "top" },
                     { option: "center", value: "center" },
                     { option: "bottom", value: "bottom" },
                  ]
               }
            },
            row_height: {
               element: SELECT,
               data: {
                  options: [
                     { option: "auto", value: "auto" },
                     { option: "100", value: "100%" },
                     { option: "75", value: "75%" },
                     { option: "50", value: "50%" },
                     { option: "25", value: "25%" },
                  ],
                  description: "Define the height of the row based on the screen height.",
               }
            },
            full_height: {
               element: SWITCH,
               data: {
                  description: "If enabled the slider will have the height of the screen.",
               }
            },
         }
      }
   }
}