import {
  Card as CardComponent,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@cn/components/ui/card"
import {Droppable} from "@droppable";
import {cn} from "@cn/lib/utils";
import loopar from "loopar";

export default function Card(props) {
  const data = props.data || {};

  return (
    <>
    <CardHover
      {...loopar.utils.renderizableProps(props)}
    >
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <Droppable
        Component={CardContent}
        {...props}
        className="p-4"
      />
      {props.footer && (
        <CardFooter className="flex justify-between">
          {props.footer}
        </CardFooter>
      )}
    </CardHover>
    </>
  )
}

Card.dontHaveMetaElements = ["text"];

function CardHover(props){
  return (
    <CardComponent 
      className={cn(props.className, "transition-all hover:shadow-lg")}
    >
      {props.children}
    </CardComponent>
  )
}

export function CardDescription(props){
  return (
    <div className="text-sm text-muted-foreground">
      {props.children}
    </div>
  )
}

export { CardHover as Card, CardHeader, CardFooter, CardTitle, CardContent }