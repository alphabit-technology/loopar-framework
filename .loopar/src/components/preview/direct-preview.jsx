import { Entity } from '@loader'

export function DirectPreview({ name, action }) {
  return <Entity name={name} action={action}/>
}

export default function MetaDirectPreview(props) {
  const { data } = props;
  const { entity_name, entity_action } = data;

  if(!entity_name || !entity_action) return <div className='text-center text-red-500'>Please provide a name and action</div>;
  return (
    <DirectPreview name={entity_name} action={entity_action} />
  )
}

MetaDirectPreview.metaFields = () => {
  return [
    [
      {
        group: "model",
        elements: {
          entity_name: { element: INPUT },
          entity_action: { element: INPUT }
        }
      }
    ]
  ]
}