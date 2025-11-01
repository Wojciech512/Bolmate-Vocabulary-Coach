/*
 * Copyright (c) 2023 Bolmate B.V.
 */

import React from 'react';
import {createRoot} from 'react-dom/client';
import {Routes} from "./js/routes";
import {createBrowserRouter, RouterProvider} from 'react-router';
import ContextProvider from "./js/components/context/contextProvider";


const router = createBrowserRouter(Routes);

const rootElement = document.getElementById('content');
if (rootElement) {
    createRoot(rootElement).render(
        <ContextProvider>
            <RouterProvider router={router}/>
        </ContextProvider>
    );
}