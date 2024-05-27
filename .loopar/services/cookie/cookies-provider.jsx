import React, { Component } from 'react';
import CookiesContext from './context';
import ClientManager from './client-manager';

export default class CookiesProvider extends Component {
  /*static defaultProps = {
    manager: new ClientManager()
  };*/

  render() {
    const { manager=new ClientManager({updater:this.props.updater}), children, updater } = this.props;

    return (
      <CookiesContext.Provider value={manager} updater={updater}>
        {children}
      </CookiesContext.Provider>
    );
  }
}