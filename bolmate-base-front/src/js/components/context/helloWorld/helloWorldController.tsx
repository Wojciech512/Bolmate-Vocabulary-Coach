import React, {useEffect, useState} from 'react';
import HelloWorld from "./helloWorld";

export default function HelloWorldController() {
    const [message, setMessage] = useState('Loading...');

    function loadMessage() {
        fetch('http://127.0.0.1:30377/v1/hello-world').then((response: Response) => {
            if (response.ok) response.json().then((data: Record<string, any>) => {
                setMessage(data.message);
            })
        }).catch((err: any) => {
            window.alert(err);
        });
    }

    useEffect(() => {
        loadMessage();
    }, []);

    return (
        <HelloWorld message={message}/>
    )
}