import {ContextShape} from "./interfaces";

export type ChangeContext = (config: ChangeContextConfig, callback?: (context: ContextShape) => void) => void;
export type ChangeContextConfig = {};