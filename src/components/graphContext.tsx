// GraphContext.tsx

import React, { createContext, useContext, Dispatch, ReactNode } from 'react';
import Graph from "../engine/graph";
import graphReducer from './graphReducer';


// Define the type of the context
interface GraphContextType {
    state: Graph;
    dispatch: Dispatch<any>;
    addEdge?: (connection: { source: string; target: string; id?: string; }) => void;
}

// Create the context with an undefined default value
export const GraphContext = createContext<GraphContextType | undefined>(undefined);

interface GraphProviderProps {
    children: ReactNode; 
}

// Define a provider component with the corrected type
export const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
    const [state, dispatch] = React.useReducer(graphReducer, new Graph());

    return (
        <GraphContext.Provider value={{ state, dispatch }}>
            {children}
        </GraphContext.Provider>
    );
};

// Hook to use the graph context
export const useGraph = (): GraphContextType => {
    const context = useContext(GraphContext);
    if (context === undefined) {
        throw new Error('useGraph must be used within a GraphProvider');
    }
    return context;
};
