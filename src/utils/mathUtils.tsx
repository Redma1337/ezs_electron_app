import {Node, XYPosition} from 'reactflow';

function createParallelLine(p1: XYPosition, p2: XYPosition, offsetDistance: number): { parallelP1: XYPosition; parallelP2: XYPosition } {
    if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
        [p1, p2] = [p2, p1];
    }

    const directionVector = { x: p2.x - p1.x, y: p2.y - p1.y };
    const magnitude = Math.sqrt(directionVector.x ** 2 + directionVector.y ** 2);
    const unitPerpendicularVector = {
        x: -directionVector.y / magnitude,
        y: directionVector.x / magnitude,
    };

    return {
        parallelP1: {
            x: p1.x + unitPerpendicularVector.x * offsetDistance,
            y: p1.y + unitPerpendicularVector.y * offsetDistance,
        },
        parallelP2: {
            x: p2.x + unitPerpendicularVector.x * offsetDistance,
            y: p2.y + unitPerpendicularVector.y * offsetDistance,
        }
    };
}

function getNodeCenter(node: Node) {
    const { width: w, height: h, positionAbsolute: pos } = node;

    return {
        x: pos.x + w / 2,
        y: pos.y + h / 2
    };
}

function findIntersectionsWithNode(node: Node, x1: number, y1: number, x2: number, y2: number) {
    const { width: w, height: h, positionAbsolute: pos } = node;

    const left = pos.x, right = pos.x + w, top = pos.y, bottom = pos.y + h;
    const m = (y2 - y1) / (x2 - x1);
    const c = y1 - m * x1;
    let intersections = [];

    if (x2 !== x1) {
        // Top side
        let intersectX = (top - c) / m;
        if (intersectX >= left && intersectX <= right) intersections.push({x: intersectX, y: top});

        // Bottom side
        intersectX = (bottom - c) / m;
        if (intersectX >= left && intersectX <= right) intersections.push({x: intersectX, y: bottom});
    }

    if (y2 !== y1) {
        // Left side
        let intersectY = m * left + c;
        if (intersectY >= top && intersectY <= bottom) intersections.push({x: left, y: intersectY});

        // Right side
        intersectY = m * right + c;
        if (intersectY >= top && intersectY <= bottom) intersections.push({x: right, y: intersectY});
    }

    if (x1 === x2) { // Vertical line
        intersections.push({x: x1, y: top}, {x: x1, y: bottom});
    }
    if (y1 === y2) { // Horizontal line
        intersections.push({x: left, y: y1}, {x: right, y: y1});
    }

    return intersections;
}

function distanceBetween(point1: XYPosition, point2: XYPosition) {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
}

export const calculateNodeIntersections = (sourceNode: Node, targetNode: Node, p1: XYPosition, p2: XYPosition) => {
    let sourceNodeIntersects = findIntersectionsWithNode(sourceNode, p1.x, p1.y, p2.x, p2.y);
    let targetNodeIntersects = findIntersectionsWithNode(targetNode, p1.x, p1.y, p2.x, p2.y);

    const center1 = getNodeCenter(sourceNode);
    const center2 = getNodeCenter(targetNode);

    let closestSourceNodeIntersects = sourceNodeIntersects.reduce((a, b) =>
        distanceBetween(center2, a) < distanceBetween(center2, b) ? a : b);

    let closestTargetNodeIntersects = targetNodeIntersects.reduce((a, b) =>
        distanceBetween(center1, a) < distanceBetween(center1, b) ? a : b);

    return { sourceNodeIntersectPos: closestSourceNodeIntersects, targetNodeIntersectPos: closestTargetNodeIntersects };
}

export const getBetterFloatingStraightPath = (targetNode: Node, sourceNode: Node, parallel: boolean = false, distance: number = 10 ) => {
    const sourceCenter = getNodeCenter(sourceNode);
    const targetCenter = getNodeCenter(targetNode);

    const { sourceNodeIntersectPos, targetNodeIntersectPos } = calculateNodeIntersections(sourceNode, targetNode, sourceCenter, targetCenter);

    let path = "";
    let parallelPath = "";
    if (parallel) {
        const parallelToCenterLine = createParallelLine(sourceCenter, targetCenter, distance);
        const { sourceNodeIntersectPos, targetNodeIntersectPos } = calculateNodeIntersections(sourceNode, targetNode, parallelToCenterLine.parallelP1, parallelToCenterLine.parallelP2);
        parallelPath += `M ${sourceNodeIntersectPos.x} ${sourceNodeIntersectPos.y} L ${targetNodeIntersectPos.x} ${targetNodeIntersectPos.y}`;
    }

    path += `M ${sourceNodeIntersectPos.x} ${sourceNodeIntersectPos.y} L ${targetNodeIntersectPos.x} ${targetNodeIntersectPos.y}`
    return { path, parallelPath };
};


export const getREALStraightPath = (targetNode: Node, sourceNode: Node, parallel: boolean = false, distance: number = 10 ) => {
    const sourceCenter = getNodeCenter(sourceNode);
    const targetCenter = getNodeCenter(targetNode);

    let path = "";
    if (parallel) {
        const { parallelP1, parallelP2  } = createParallelLine(sourceCenter, targetCenter, distance);
        path += `M ${parallelP1.x} ${parallelP1.y} L ${parallelP2.x} ${parallelP2.y}`;
    }

    path += `M ${sourceCenter.x} ${sourceCenter.y} L ${targetCenter.x} ${targetCenter.y}`
    return path;
};


