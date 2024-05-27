import BaseText from "$base-text";

export default class SubTitle extends BaseText {
  droppable = false;
  draggable = true;

  render() {
    return super.render(
      <h3
        className={`font-bold leading-tight tracking-tighter md:text-xl lg:leading-[1.1] ${this.getAlign()} ${this.getSize()}`}
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
      </h3>
    );
  }
}
