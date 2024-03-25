import * as React from 'react';
import { GraphProvider } from '../store/graphContext';
import GraphComponent from "../components/graphComponent";


const App = () => {
    return (
        <GraphProvider>
            <div className="w-full h-full flex flex-col">
                <div className="w-full h-20 border-b p-5 shadow-md">
                    <h1 className="font-bold text-2xl">Lorem ipsum</h1>
                </div>
                <GraphComponent/>
            </div>
        </GraphProvider>
            );
}

export default App;
