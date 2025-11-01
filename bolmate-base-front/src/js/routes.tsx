import React from 'react';
import {Navigate, RouteObject} from "react-router";
import App from "./components/app";
import HelloWorldController from "./components/context/helloWorld/helloWorldController";

export const Routes: Array<RouteObject> = [
    {
        path: '*', element: <App/>, children: [
            {path: 'hello-world', element: <HelloWorldController/>},
            {path: '*', element: <Navigate to='/hello-world'/>}
        ]
    }
]