import {Node, Position, XYPosition} from 'reactflow';

function createParallelLine(x1: number, y1: number, x2: number, y2: number, offsetDistance: number): { newX1: number; newY1: number; newX2: number; newY2: number } {
    // Ensure that the first point is always the one with the lower x-value
    // or if equal, the lower y-value to ensure consistency
    if (x1 > x2 || (x1 === x2 && y1 > y2)) {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
    }

    // Calculate the direction vector from (x1, y1) to (x2, y2)
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Calculate a unit vector that's perpendicular to the direction vector
    const magnitude = Math.sqrt(dx ** 2 + dy ** 2);
    const perpVectorX = -dy / magnitude;
    const perpVectorY = dx / magnitude;

    [x1, x2] = [x2, x1];
    [y1, y2] = [y2, y1];

    // Calculate the new coordinates by moving along the perpendicular vector
    const newX1 = x1 + perpVectorX * offsetDistance;
    const newY1 = y1 + perpVectorY * offsetDistance;
    const newX2 = x2 + perpVectorX * offsetDistance;
    const newY2 = y2 + perpVectorY * offsetDistance;

    return { newX1, newY1, newX2, newY2 };
}


// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getParallelNodeIntersection(intersectionNode: Node, targetNode: Node, distance: number) {
    // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
    const {
        width: intersectionNodeWidth,
        height: intersectionNodeHeight,
        positionAbsolute: intersectionNodePosition,
    } = intersectionNode;

    const targetPosition = targetNode.positionAbsolute;

    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;

    let x2 = intersectionNodePosition.x + w;
    let y2 = intersectionNodePosition.y + h;
    let x1 = targetPosition.x + targetNode.width / 2;
    let y1 = targetPosition.y + targetNode.height / 2;

    const newPos = createParallelLine(
        x1, y1, x2, y2,
        distance
    );

    x1 = newPos.newX1
    x2 = newPos.newX2
    y1 = newPos.newY1
    y2 = newPos.newY2

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
}

function getNodeIntersection(intersectionNode: Node, targetNode: Node) {
    // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
    const {
        width: intersectionNodeWidth,
        height: intersectionNodeHeight,
        positionAbsolute: intersectionNodePosition,
    } = intersectionNode;
    const targetPosition = targetNode.positionAbsolute;

    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;

    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;
    const x1 = targetPosition.x + targetNode.width / 2;
    const y1 = targetPosition.y + targetNode.height / 2;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
}

function getEdgePosition(node: Node, intersectionPoint: XYPosition) {
    const n = { ...node.positionAbsolute, ...node };
    const nx = Math.round(n.x);
    const ny = Math.round(n.y);
    const px = Math.round(intersectionPoint.x);
    const py = Math.round(intersectionPoint.y);

    if (px <= nx + 1) {
        return Position.Left;
    }
    if (px >= nx + n.width - 1) {
        return Position.Right;
    }
    if (py <= ny + 1) {
        return Position.Top;
    }
    if (py >= n.y + n.height - 1) {
        return Position.Bottom;
    }

    return Position.Top;
}

export function getParallelEdgeParams(source: Node, target: Node, distance: number) {
    const intersects = {
        original: {
            sourceIntersect: getNodeIntersection(source, target),
            targetIntersect: getNodeIntersection(target, source),
        },
        parallel: {
            sourceIntersect: getParallelNodeIntersection(source, target, distance),
            targetIntersect: getParallelNodeIntersection(target, source, distance)
        }
    };

    const sourcePos = getEdgePosition(
        source,
        {
            x: intersects.original.sourceIntersect.x,
            y: intersects.original.sourceIntersect.y,
        }
    );
    return { intersects: intersects, sourcePos };
}


