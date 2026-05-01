import FormContext from '@context/form-context'
import React from 'react';

import { DocumentContext } from "@context/@/document-context";
import { DesignerContext } from "@context/@/designer-context";

const Sidebar = ({data}) => {
  return (
    <>
      
    </>
  );
}

const EntityFormContext = ({docRef, children, ...props}) => {
  const handleSave = () => {
    docRef.save();
  }

  return (
    <DocumentContext.Provider value={{handleSave}}>
      <DesignerContext.Provider 
        value={{}}
      >
       {children}
      </DesignerContext.Provider>
    </DocumentContext.Provider>
  )
}

export default class EntityForm extends FormContext {
  getSidebar() {
    const { meta = {} } = this.state;
    const data = meta.data || {};

    return <Sidebar data={data} docRef={this}/>
  }

  render() {
    return (
      <EntityFormContext docRef={this}>
        {super.render()}
      </EntityFormContext>
    )
  }
}