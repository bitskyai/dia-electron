import * as MonacoType from "monaco-editor";

// Type-only-import

declare global {
  interface Window {
    MunewDIA: {
      app: any;
      editors: Record<string, MonacoType.editor.IStandaloneCodeEditor | null>;
    };
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: Function;
  }
  interface NodeModule {
    hot: any;
  }
  namespace NodeJs {
    export interface Global {
      browserWindows: {
        retailerEditor: any;
        main: any;
      };
    }
  }
}
