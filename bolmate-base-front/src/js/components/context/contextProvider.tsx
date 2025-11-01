import React, {createContext, PropsWithChildren, useState} from 'react';
import {ContextShape} from "../../util/interfaces";
import {ChangeContextConfig} from "../../util/types";

const defaultContext: ContextShape = {
    changeContext: () => {
    }
}
export const AppContext = createContext(defaultContext);

export default function ContextProvider({children}: PropsWithChildren) {
    const [context, setContext] = useState(defaultContext);

    function changeContext(config: ChangeContextConfig, callback?: (context: ContextShape) => void) {
        const newContext = {...context, ...config};
        setContext(newContext);
        if (callback) window.setTimeout(() => {
            callback(newContext);
        })
    }

    return (
        <AppContext.Provider value={{...context, changeContext}}>
            {children}
        </AppContext.Provider>
    )
}