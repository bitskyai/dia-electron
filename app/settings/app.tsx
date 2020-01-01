import React from "react";
import ReactDOM from "react-dom";

// Import root app
import App from "./containers/App";
// Import Language Provider
import LanguageProvider from "./containers/LanguageProvider";
// Import i18n messages
import { translationMessages } from "./i18n";

/**
 * The top-level class controlling the whole app. This is *not* a React component,
 * but it does eventually render all components.
 *
 * @class App
 */
export class Root {
  constructor() {
    // Add init logic
  }

  public async setup(): Promise<void | Element | React.Component> {
    const MOUNT_NODE = document.getElementById("munew-settings") as HTMLElement;
    const render = (
      messages: any,
      Component = App
    ): void | Element | React.Component => {
      return ReactDOM.render(
        // tslint:disable-next-line:jsx-wrap-multiline
        <LanguageProvider messages={messages}>
          <Component />
        </LanguageProvider>,
        MOUNT_NODE
      );
    };

    render(translationMessages);

    // if (module.hot) {
    //   module.hot.accept(["./i18n", "./containers/App"], () => {
    //     ReactDOM.unmountComponentAtNode(MOUNT_NODE);
    //     // tslint:disable-next-line:max-line-length
    //     const App = require("./containers/App").default; // https://github.com/webpack/webpack-dev-server/issues/100
    //     render(translationMessages, App);
    //   });
    // }
    // Chunked polyfill for browsers without Intl support
    // if (!(window as any).Intl) {
    //   new Promise(resolve => {
    //     resolve(import("intl"));
    //   })
    //     .then(() =>
    //       Promise.all([
    //         import("intl/locale-data/jsonp/en.js"),
    //         import("intl/locale-data/jsonp/de.js")
    //       ])
    //     )
    //     .then(() => render(translationMessages))
    //     .catch(err => {
    //       throw err;
    //     });
    // } else {
    //   render(translationMessages);
    // }
  }
}

new Root().setup();
