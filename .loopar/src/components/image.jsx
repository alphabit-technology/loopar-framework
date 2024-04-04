import Component from "$component";
import loopar from "$loopar";
import {useState} from "react";

export function Image ({imageProps, coverProps, ...props}) {
  const renderizableProps = loopar.utils.renderizableProps(props);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isValidImage, setIsValidImage] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleImageError = (e) => {
    setIsImageLoading(false);
    setImageLoaded(false);
    setIsValidImage(false);
  }

  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsImageLoading(false);
    setIsValidImage(true);
  }

  const aspectRatio = () => {
    if(props.aspect) {
      const [w=1, h=1] = props.aspect.split("/");
      return (h / w) * 100;
    }

    return 60;
  }

  return (
    <div 
      className={`relative top-0`}
      style={{paddingTop: `${aspectRatio()}%`}}
    >
      <img
        {...loopar.utils.renderizableProps(props)}
        className={`absolute aspect-auto top-0 left-0 right-0 bottom-0 w-full h-full rounded-sm`}
        {...imageProps}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{display: "none"}}
      />
      <div
        className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-full rounded-sm"
        {...coverProps}
        //{...(isValidImage ? {} : {style: {backgroundColor: `trasnparent`}})}
      />
    </div>
  );
}

export default class BaseImage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      src: null,
    };
  }

  render (){
    return (
      <Image {...this.props} />
    )
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
              ],
            },
          },
        },
      },
    ];
  }
}
