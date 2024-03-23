// GraphContext.tsx

import React, { createContext, useContext, Dispatch, ReactNode } from 'react';
import Graph from "../engine/graph";
import graphReducer from './graphReducer';
import { Edge } from 'reactflow';

// Define the type of the context
interface GraphContextType {
    state: Graph;
    dispatch: Dispatch<any>;
    edges?: Edge[]; 
    setEdges?: React.Dispatch<React.SetStateAction<Edge[]>>;
}

// Create the context with an null default value
export const GraphContext = createContext<GraphContextType | null>(null);

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
    if (!context) {
        throw new Error('useGraph must be used within a GraphProvider');
    }
    return context;
};
