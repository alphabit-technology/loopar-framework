import Component from "$component";
import {Button as BaseButton} from "@/components/ui/button";
import {DocumentContext} from "@context/base/base-context";
import loopar from "$loopar";

const buttons = {
  primary: "primary",
  secondary: "secondary",
  default: "default",
  ghost: "ghost",
  destructive: "destructive",
};

export default class Button extends Component {
  className = "btn";
  droppable = false;
  static contextType = DocumentContext;

  render() {
    const data = this.data;

    const handleClick = (e) => {
      e.preventDefault();
      const docRef = this.context.docRef;

      if (data.action) {
        docRef[data.action] &&  docRef[data.action]();
      }
    }

    const getVariant = () => {
      return buttons[data.variant] || buttons.default;
    }

    return (
      <BaseButton
        {...loopar.utils.renderizableProps(this.props)}
        variant={getVariant()}
        onClick={handleClick}
      >
        {data.label || "Button"}
      </BaseButton>
    );
  }

  get metaFields() {
    return {
      group: "form",
      elements: {
        action: {
          element: INPUT,
          data: {
            description:
              "if you define url, button will be link; if you define simple action like save, print..., button will be call action function in your view",
          },
        },
        variant: {
          element: SELECT,
          data: {
            options: Object.keys(buttons).map((button) => {
              return {
                option: button,
                value: buttons[button],
              };
            }),
          },
        },
      },
    };
  }
}