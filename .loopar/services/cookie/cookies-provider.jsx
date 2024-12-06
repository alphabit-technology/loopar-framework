import React, { Component } from 'react';
import CookiesContext from './context';
import ClientManager from './client-manager';

export default function CookiesProvider(props) {
  /*static defaultProps = {
    manager: new ClientManager()
  };*/

    const { manager=new ClientManager({updater: props.updater}), children, updater } = props;

    return (
      <CookiesContext.Provider value={manager} updater={updater}>
        {children}
      </CookiesContext.Provider>
    );
}