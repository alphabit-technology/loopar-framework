import { Entity } from '@loopar/loader';
import {useEffect, useState} from 'react';

export function DirectPreview({ name, action, entityName }) {
  return (
    <Entity
      name={name}
      action={action} 
      entityName={entityName}
      hasHeader={false}
    />
  )
}

export default function MetaDirectPreview(props) {
  const [ state, setState ] = useState({});

  useEffect(() => {
    const data = props.data || {};
    setState({
      entity: data.entity || '',
      action: data.action || '',
      entity_name: data.entity_name || '',
    });
  }, []);
  const { entity, action, entity_name } = state;

  if (!entity || !action || !entity_name) return null;
  return(
    <DirectPreview name={entity} action={action} entityName={entity_name} />
  )
}

MetaDirectPreview.metaFields = () => {
  return [
    [
      {
        group: "model",
        elements: {
          entity: { element: INPUT },
          action: { element: INPUT },
          entity_name: { element: INPUT },
        }
      }
    ]
  ]
}