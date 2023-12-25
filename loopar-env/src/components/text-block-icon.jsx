import BaseTextBlock from "#base-textblock";

export default class TextBlockIcon extends BaseTextBlock {
   droppable = false;
   className = "card shadow";
   dontHaveBackground = true;

   constructor(props) {
      super(props);
   }

   render() {
      const data = this.props.meta.data || {};
      const { label = "Text Block", text } = data;

      return super.render(
         <>
            <div className="card shadow">
               <div className="card-body p-4">
                  <div className="d-sm-flex align-items-start text-center text-sm-left">
                     <img src={((this.getSrc() || [])[0] || {}).src} className="mr-sm-4 mb-3 mb-sm-0" width="72" />
                     <div className="flex-fill">
                        <h3 className="mt-0">{label}</h3>
                        <p className="text-muted font-size-lg">{text}</p>
                     </div>
                  </div>
               </div>
            </div>
         </>
      );
   }
}