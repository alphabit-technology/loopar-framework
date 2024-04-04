import BaseText from "$base-text";

export default class Title extends BaseText {
  droppable = false;
  draggable = true;
  dontHaveContainer = true;

  render() {
    return super.render(
      <div className="flex">
        <h1 
          className={`${this.getAlign()} ${this.getSize()} w-full font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]`}
          {...(this.props.designer
            ? {
                style: {
                  maxHeight: "3em",
                  overflow: "auto",
                  display: "-webkit-box",
                  "-webkit-line-clamp": 5,
                  "-webkit-box-orient": "vertical",
                },
              }
            : {})}
        >
          {this.getText()}
        </h1>
      </div>
    );
  }
}
