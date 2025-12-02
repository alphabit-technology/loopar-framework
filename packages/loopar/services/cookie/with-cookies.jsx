import { Component } from 'react';
import CookiesContext from './context';

export default function withCookies(ComposedComponent) {
  const name = ComposedComponent.displayName || ComposedComponent.name;

  return class extends Component {
    static displayName = `withCookies(${name})`;

    render() {
      return (
        <CookiesContext.Consumer>
          {manager => (
            <ComposedComponent
              cookies={manager.getAll()}
              setCookie={manager.set.bind(manager)}
              {...this.props} />
          )}
        </CookiesContext.Consumer>
      );
    }
  };
}