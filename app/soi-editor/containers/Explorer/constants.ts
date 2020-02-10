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
export const GET_SOI_FOLDER_STRUCTURE = 'soi-editor/Exporer/GET_SOI_FOLDER_STRUCTURE';
export const UPDATE_CURRENT_SELECTED_FILE = 'soi-editor/Exporer/UPDATE_CURRENT_SELECTED_FILE';