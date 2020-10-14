import { READ_FILE } from "./constants";

export const readFile = (filepath) => {
  return {
    type: READ_FILE,
    payload:{
      filepath
    }
  }
}