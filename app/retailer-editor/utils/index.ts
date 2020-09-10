/**
 * Loads monaco. If it's already loaded, it'll just set it on the current state.
 * We're doing things a bit roundabout to ensure that we're not overloading the
 * mobx state with a gigantic Monaco tree.
 */
export const loadMonaco = async () => {
  const { app } = window.BitskyDIA;
  const loader = require("monaco-loader");
  const monaco = app.monaco || (await loader());

  if (!app.monaco) {
    app.monaco = monaco;
  }

  return monaco;
};
