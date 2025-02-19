export default function Divider(props){
  return (
    <li {...props} className={`log-divider ${props.className}`}>
      <span>
        {props.icon ? <i className={props.icon} /> : null}
        {props.label ? <strong>{props.label}</strong> : null}
      </span>
    </li>
  );
}