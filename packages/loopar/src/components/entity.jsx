import {Entity as EntityComponent} from "../loader.jsx"
const Entity = (props) =>{
  const data = props.data;

  if(!data.name || !data.action){
    return (
      <div>
        <h1>Entity</h1>
        <p>Name and Action are required</p>
        <p>Name: {data.name}</p>
        <p>Action: {data.action}</p>
        <p>Name and Action are required</p>
        <p>Name: {data.name}</p>
        <p>Action: {data.action}</p>
        <p>Name and Action are required</p>
        <p>Name: {data.name}</p>
        <p>Action: {data.action}</p>
      </div>
    );
  }

  return (
    <EntityComponent name={data.name} action={data.action}>
      {props.children}
    </EntityComponent>
  )
}

Entity.metaFields = () => {
  return [[
    {
      group: "General",
      elements: {
        name: {
          element: INPUT,
          data: {
            label: "Name",
            description: "Name of Entity"
          }
        },
        action: {
          element: INPUT,
          data: {
            label: "Action in Controller",
            description: "Action in Controller"
          }
        },
      }
    },
  ]];
};

export default Entity