import React, {memo, useCallback} from 'react';
import {BaseEdge, EdgeProps, ReactFlowState, useStore} from 'reactflow';
import {getBetterFloatingStraightPath} from "../../../utils/mathUtils";
import Activity from "../../../engine/activity";

type FloatingEdgeData = {
    isActive: boolean;
}

const FloatingEdge = memo(({id, source, target, markerEnd, style, data }: EdgeProps<FloatingEdgeData>) => {
    const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

    if (!sourceNode || !targetNode) {
        return null;
    }

    const isBiDirectionEdge = useStore((s: ReactFlowState) => {
        return s.edges.some(
            (e) =>
                (e.source === target && e.target === source) || (e.target === source && e.source === target)
        );
    });

    const { path, parallelPath } = getBetterFloatingStraightPath(targetNode, sourceNode, true, 20);

    const edgeColor = data.isActive ? 'green' : 'red';

    return (
        <>
            {
                isBiDirectionEdge && sourceNode.id < targetNode.id ?
                    <BaseEdge
                        id={id}
                        path={path}
                        markerEnd={markerEnd}
                        style={{ ...style, stroke: edgeColor }}
                    />
                :
                    <BaseEdge
                        id={id}
                        path={parallelPath}
                        markerEnd={markerEnd}
                        style={{ ...style, stroke: edgeColor }}
                    />
            }
        </>
    );
})

export default FloatingEdge;