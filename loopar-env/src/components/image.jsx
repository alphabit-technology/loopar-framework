import Div from "#div";
import Component from "#component";
import loopar from "#loopar";

export default class Image extends Component {
   style = {
      //position: "relative",
      //width: "100%",
      top: 0,//, left: 0, right: 0, bottom: 0,
      //backgroundColor: "var(--secondary)",
      paddingTop: "60%",
      //overflow: "hidden"
   }
   //className = "image";

   //insideBackGround = true;

   //dontHaveContainer = true;
   //dontHaveBackground = true;

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         src: null
      }
   }

   componentDidUpdate(prevProps, prevState) {
      super.componentDidUpdate(prevProps, prevState);
      if (prevProps.meta.data.background_image !== this.props.meta.data.background_image) {
         this.setState({
            src: this.getSrc() || "/uploads/empty-image.svg",
         })
      }
   }

   render() {
      const data = this.props.meta?.data || {};
      const color = loopar.utils.rgba(data.color_overlay);
      const aspect_ratio = data.aspect_ratio || "4:3";

      this.style = {
         ...this.style,
         paddingTop: loopar.utils.aspectRatio(aspect_ratio) + "%",
         backgroundColor: color,
      }

      //this.className = this.className +  " " + data.class || "position-relative w-100 h-100";

      return super.render(
         <>
            <image
               style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: data.background_size || "cover",
                  borderRadius: "0.25rem",
               }}
               {...this.backGround(true)}
            />
            {/*<Div
               style = {{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: data.background_size || "cover",
                  borderRadius: "0.25rem",
               }}
               {...this.backGround(true)}
            />*/}
         </>
      )
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
   }

   get metaFields() {
      return [
         {
            group: "custom",
            elements: {
               aspect_ratio: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: "1:1", value: "1:1" },
                        { option: "4:3", value: "4:3" },
                        { option: "16:9", value: "16:9" },
                        { option: "21:9", value: "21:9" },
                        { option: "3:4", value: "3:4" },
                        { option: "9:16", value: "9:16" },
                        { option: "9:21", value: "9:21" },
                     ]
                  }
               },
            }
         }
      ]
   }
}