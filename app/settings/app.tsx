import React from "react";
import ReactDOM from "react-dom";

// Import root app
import App from "./containers/App";
// Import Language Provider
import LanguageProvider from "./containers/LanguageProvider";
// Import i18n messages
import { translationMessages, DEFAULT_LOCALE } from "./i18n";

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
    const MOUNT_NODE = document.getElementById("bitsky-settings") as HTMLElement;
    const render = (
      messages: any,
      Component = App
    ): void | Element | React.Component => {
      // hide loading page
      MOUNT_NODE.style.display = 'block';
      const loadingPage = document.getElementById("bitsky-loading") as HTMLElement;
      loadingPage.style.display = 'none';

      return ReactDOM.render(
        // tslint:disable-next-line:jsx-wrap-multiline
        <LanguageProvider locale={DEFAULT_LOCALE} messages={messages}>
          <Component />
        </LanguageProvider>,
        MOUNT_NODE
      );
    };

    render(translationMessages);
  }
}

new Root().setup();
