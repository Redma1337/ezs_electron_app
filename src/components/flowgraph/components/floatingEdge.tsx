import React, {memo, useCallback} from 'react';
import {BaseEdge, EdgeProps, getStraightPath, Position, ReactFlowState, useStore} from 'reactflow';
import {getParallelEdgeParams} from "../../../utils/mathUtils";

export type GetSpecialPathParams = {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
};

const FloatingEdge = memo(({ id, source, target, markerEnd, style } : EdgeProps) => {
    const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
    const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

    if (!sourceNode || !targetNode) {
        return null;
    }

    const isBiDirectionEdge = useStore((s: ReactFlowState) => {
        const edgeExists = s.edges.some(
            (e) =>
                (e.source === target && e.target === source) || (e.target === source && e.source === target)
        );

        return edgeExists;
    });

    const { intersects, sourcePos } = getParallelEdgeParams(sourceNode, targetNode, 30);
    const { original, parallel } = intersects;
    let path = "";
    if (isBiDirectionEdge) {
        if (sourcePos == Position.Left) {
            [path] = getStraightPath({
                sourceX: parallel.sourceIntersect.x,
                sourceY: parallel.sourceIntersect.y,
                targetX: parallel.targetIntersect.x,
                targetY: parallel.targetIntersect.y,
            });
            console.log("parallel left");
            console.log(path);
        } else {

        }
    } else {
        [path] = getStraightPath({
            sourceX: original.sourceIntersect.x,
            sourceY: original.sourceIntersect.y,
            targetX: original.targetIntersect.x,
            targetY: original.targetIntersect.y,
        });
    }


    return (
        <>
            <BaseEdge
                id={id}
                path={path}
                markerEnd={markerEnd}
                style={style}
            />
        </>
    );
})

export default FloatingEdge;