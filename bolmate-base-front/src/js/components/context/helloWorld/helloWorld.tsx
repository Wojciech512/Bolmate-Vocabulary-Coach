import './style/helloWorld.scss';

import React from 'react';

interface Props {
    message: string;
}

export default function HelloWorld(props: Props) {
    const {message} = props;
    return (
        <div className='hello-world'>
            <h1 className='page-title'>{message}</h1>
        </div>
    )
}