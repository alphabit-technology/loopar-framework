import Component from "$component";
import {
  Card as CardComponent,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Droppable} from "$droppable";
import {cn} from "@/lib/utils";
import loopar from "$loopar";

export default class Card extends Component {
  dontHaveMetaElements = ["text"];

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      collapsed: false,
      hover: false,
    };
  }

  render() {
    const data = this.data;

    return (
      <>
      <CardHover
        {...loopar.utils.renderizableProps(this.props)}
      >
        <CardHeader>
          <CardTitle>{data.label}</CardTitle>
          <CardDescription>{data.description}</CardDescription>
        </CardHeader>
        <Droppable
          receiver={this}
          Component={CardContent}
        >
          {this.props.children || this.elements}
        </Droppable>
        {this.props.footer && (
          <CardFooter className="flex justify-between">
            {this.props.footer}
          </CardFooter>
        )}
      </CardHover>
      </>
    )
  }

  toggleHide() {
    this.setState({ collapsed: !this.state.collapsed });
  }
}

function CardHover(props){
  return (
    <CardComponent 
      className={cn(props.className, "hover:bg-card/50 transition-all hover:shadow-lg")}
    >
      {props.children}
    </CardComponent>
  )
}

export { CardHover as Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }