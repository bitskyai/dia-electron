import * as MonacoType from 'monaco-editor';

// Type-only-import
import { App as AppType } from './renderer/app';

declare global {
  interface Window {
    MunewDIA: {
      app: AppType;
    };
  }
}
