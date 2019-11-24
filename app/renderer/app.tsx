// import * as MonacoType from "monaco-editor";
import { Button } from "antd";
import Explorer from "./components/Explorer";
import TouchBarManager from "./components/TouchBarManager";

/**
 * The top-level class controlling the whole app. This is *not* a React component,
 * but it does eventually render all components.
 *
 * @class App
 */
export class App {
  constructor() {
    // Add init logic
  }

  public async setup(): Promise<void | Element | React.Component> {
    const React = await import("react");
    const { render } = await import("react-dom");
    const app = (
      <div>
        <Explorer />
        <div>
          <div>
            <TouchBarManager />
          </div>
          <div>
            <Button type="primary">Primary</Button>
            <Button>Default</Button>
            <Button type="dashed">Dashed</Button>
            <Button type="danger">Danger</Button>
            <Button type="link">Link</Button>
          </div>
        </div>
      </div>
    );
    const rendered = render(app, document.getElementById("app"));

    return rendered;
  }
}

window.MunewDIA = window.MunewDIA || {};
window.MunewDIA.app = window.MunewDIA.app || new App();
window.MunewDIA.app.setup();