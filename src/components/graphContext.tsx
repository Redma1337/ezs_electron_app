// GraphContext.tsx

import React, { createContext, useContext, Dispatch, ReactNode } from 'react';
import Graph from "../engine/graph";
import graphReducer from './graphReducer'; // Make sure this import is correct


// Define the type of the context
interface GraphContextType {
    state: Graph;
    dispatch: Dispatch<any>; // Consider using a more specific action type
}

// Create the context with an undefined default value
const GraphContext = createContext<GraphContextType | undefined>(undefined);

interface GraphProviderProps {
    children: ReactNode; // Define the children prop explicitly
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
