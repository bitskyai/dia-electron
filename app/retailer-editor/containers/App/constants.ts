/*
 * AppConstants
 * Each action has a corresponding type, which the reducer knows and picks up on.
 * To avoid weird typos between the reducer and the actions, we save them as
 * constants here. We prefix them with 'yourproject/YourComponent' so we avoid
 * reducers accidentally picking up actions they shouldn't.
 *
 * Follow this format:
 * export const YOUR_ACTION_CONSTANT = 'yourproject/YourContainer/YOUR_ACTION_CONSTANT';
 */
export const SHOW_OR_HIDE_CONSOLE = 'retailer-editor/App/SHOW_OR_HIDE_CONSOLE';
export const RESPONSED_TO_CONSOLE = 'retailer-editor/App/RESPONSED_TO_CONSOLE';
export const SHOW_OR_HIDE_EXPLORER = 'retailer-editor/App/SHOW_OR_HIDE_EXPLORER';
export const RESPONSED_TO_EXPLORER = 'retailer-editor/App/RESPONSED_TO_EXPLORER';
export const UPDATE_MOSAIC_NODES = 'retailer-editor/App/UPDATE_MOSAIC_NODES';
export const ADD_CONSOLE_LOG = 'retailer-editor/App/ADD_CONSOLE_LOG';
export const UPDATE_RETAILER_STATUS = 'retailer-editor/App/UPDATE_RETAILER_STATUS';
