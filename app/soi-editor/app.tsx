// import * as MonacoType from "monaco-editor";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router";
import * as MonacoType from "monaco-editor";
import history from "./utils/history";

// Import root app
import App from "./containers/App";

// Import Language Provider
import LanguageProvider from "./containers/LanguageProvider";

import configureStore from "./configureStore";

// Import i18n messages
import { translationMessages } from "./i18n";
/**
 * The top-level class controlling the whole app. This is *not* a React component,
 * but it does eventually render all components.
 *
 * @class App
 */
export class Root {
  public monaco: typeof MonacoType | null = null;

  constructor() {
    // Add init logic
  }

  public async setup(): Promise<void | Element | React.Component> {
    // Create redux store with history
    const initialState = {};
    const store = configureStore(initialState, history);
    const MOUNT_NODE = document.getElementById("munew-soi-app") as HTMLElement;
    const render = (
      messages: any,
      Component = App
    ): void | Element | React.Component => {
      // hide loading page
      MOUNT_NODE.style.display = 'block';
      const loadingPage = document.getElementById("munew-loading") as HTMLElement;
      loadingPage.style.display = 'none';
      return ReactDOM.render(
        // tslint:disable-next-line:jsx-wrap-multiline
        <Provider store={store}>
          <LanguageProvider messages={messages}>
            <ConnectedRouter history={history}>
              <Component />
            </ConnectedRouter>
          </LanguageProvider>
        </Provider>,
        MOUNT_NODE
      );
    };

    if (module.hot) {
      module.hot.accept(["./i18n", "./containers/App"], () => {
        ReactDOM.unmountComponentAtNode(MOUNT_NODE);
        // tslint:disable-next-line:max-line-length
        const App = require("./containers/App").default; // https://github.com/webpack/webpack-dev-server/issues/100
        render(translationMessages, App);
      });
    }
    // Chunked polyfill for browsers without Intl support
    if (!(window as any).Intl) {
      new Promise(resolve => {
        resolve(import("intl"));
      })
        .then(() =>
          Promise.all([
            import("intl/locale-data/jsonp/en.js"),
            import("intl/locale-data/jsonp/de.js")
          ])
        )
        .then(() => render(translationMessages))
        .catch(err => {
          throw err;
        });
    } else {
      render(translationMessages);
    }
  }
}

window.MunewDIA = window.MunewDIA || {};
window.MunewDIA.app = window.MunewDIA.app || new Root();
window.MunewDIA.app.setup();
