// GraphContext.tsx

import React, { createContext, useContext, Dispatch, ReactNode } from 'react';
import Graph from "../engine/graph";
import graphReducer from './graphReducer';

type VersionedGraph = {
    graph: Graph;
    version: number;
}

// Define the type of the context
interface GraphContextType {
    state: VersionedGraph;
    dispatch: Dispatch<any>;
}

// Create the context with an null default value
export const GraphContext = createContext<GraphContextType | null>(null);

interface GraphProviderProps {
    children: ReactNode; 
}

// Define a provider component with the corrected type
export const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
    const [state, dispatch] = React.useReducer(graphReducer, { graph: new Graph(), version: 0 });

    return (
        <GraphContext.Provider value={{ state, dispatch }}>
            {children}
        </GraphContext.Provider>
    );
};

// Hook to use the graph context
export const useGraph = (): GraphContextType => {
    const context = useContext(GraphContext);
    if (!context) {
        throw new Error('useGraph must be used within a GraphProvider');
    }
    return context;
};
