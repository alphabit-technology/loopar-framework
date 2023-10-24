import {li, span, i, strong} from '/components/elements.js'

export function Divider(props){
    return [
      li({...props, className: "log-divider " + props.className}, [
        span([
            props.icon ? i({className: props.icon}) : null,
            props.label ? strong(props.label) : null
        ])
      ])
    ]
}