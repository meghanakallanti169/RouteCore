
class AStar {
    static findPath(graph, start, target, positions) {
        const result = this.findPathWithStats(
            graph,
            start,
            target,
            positions
        );

        if (!result || result.path === null) {
            return null;
        }

        return {
            path: result.path,
            distance: result.distance,
            hops: result.hops
        };
    }

    static findPathWithStats(
        graph,
        start,
        target,
        positions,
        options = {}
    ) {
        // Validate source and destination
        // Failed routers cannot participate in routing
        if (
            !graph.isRouterActive(start) ||
            !graph.isRouterActive(target)
        ) {
            return null;
        }

        const recordSteps = options.recordSteps !== false;

        // Calculate Euclidean distance between two routers
        const euclideanDistance = (a, b) => {
            if (!positions?.[a] || !positions?.[b]) {
                return null;
            }

            const dx = positions[a].x - positions[b].x;
            const dy = positions[a].y - positions[b].y;

            return Math.hypot(dx, dy);
        };

        // Calculate a safe heuristic scaling factor
        let scale = Infinity;

        for (const router of Object.keys(graph.adjacencyList)) {
            for (const neighbor of graph.getNeighbors(router)) {
                const distance = euclideanDistance(
                    router,
                    neighbor
                );

                if (distance === null) {
                    scale = 0;
                    break;
                }

                if (distance > 0) {
                    scale = Math.min(
                        scale,
                        graph.getWeight(router, neighbor) / distance
                    );
                }
            }

            if (scale === 0) break;
        }

        if (!Number.isFinite(scale)) {
            scale = 0;
        }

        // Heuristic function
        const heuristic = router => {
            const distance = euclideanDistance(
                router,
                target
            );

            return distance === null ? 0 : scale * distance;
        };

        // A* data structures
        const openSet = new Set([start]);
        const closedSet = new Set();

        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        const visitedNodes = [];
        const steps = [];

        for (const router of Object.keys(graph.adjacencyList)) {
            gScore[router] = Infinity;
            fScore[router] = Infinity;
        }

        gScore[start] = 0;
        fScore[start] = heuristic(start);

        // Reconstruct path
        const getPathTo = destination => {
            if (!Number.isFinite(gScore[destination])) {
                return [];
            }

            const path = [destination];
            let router = destination;

            while (cameFrom[router] !== undefined) {
                router = cameFrom[router];
                path.unshift(router);
            }

            return path;
        };

        // Get current frontier
        const getFrontier = () =>
            [...openSet].sort(
                (a, b) => fScore[a] - fScore[b]
            );

        // Record algorithm steps for visualization
        const recordStep = (current, action) => {
            if (!recordSteps) return;

            steps.push({
                step: steps.length,
                current,
                action,
                visitedNodes: [...visitedNodes],
                frontier: getFrontier(),
                path: getPathTo(target),
                gScores: { ...gScore },
                fScores: { ...fScore }
            });
        };

        if (recordSteps) {
            recordStep(
                null,
                `Start at router ${start}. Set g(${start}) = 0 and calculate its f-score.`
            );
        }

        // Main A* algorithm
        while (openSet.size > 0) {
            let current = null;
            let lowestScore = Infinity;

            // Find router with the lowest f-score
            for (const router of openSet) {
                if (fScore[router] < lowestScore) {
                    lowestScore = fScore[router];
                    current = router;
                }
            }

            if (current === null) {
                break;
            }

            openSet.delete(current);
            closedSet.add(current);
            visitedNodes.push(current);

            if (recordSteps) {
                recordStep(
                    current,
                    `Explore ${current}: g = ${gScore[current]}, f = ${fScore[current]}.`
                );
            }

            // Destination reached
            if (current === target) {
                const path = getPathTo(target);

                if (recordSteps) {
                    recordStep(
                        current,
                        `Destination ${target} reached. Total path cost is ${gScore[target]}.`
                    );
                }

                return {
                    path,
                    distance: gScore[target],
                    hops: path.length - 1,
                    visitedCount: visitedNodes.length,
                    visitedNodes,
                    steps
                };
            }

            // Explore active neighbors
            for (const neighbor of graph.getNeighbors(current)) {
                const tentativeG =
                    gScore[current] +
                    graph.getWeight(current, neighbor);

                if (tentativeG < gScore[neighbor]) {
                    const oldG = gScore[neighbor];

                    cameFrom[neighbor] = current;

                    gScore[neighbor] = tentativeG;

                    fScore[neighbor] =
                        tentativeG + heuristic(neighbor);

                    // Reopen router if a better path is found
                    if (closedSet.has(neighbor)) {
                        closedSet.delete(neighbor);
                    }

                    openSet.add(neighbor);

                    if (recordSteps) {
                        recordStep(
                            current,
                            `Improve ${neighbor}: g ${
                                oldG === Infinity ? "∞" : oldG
                            } → ${tentativeG}; f = ${fScore[neighbor]}.`
                        );
                    }
                } else if (recordSteps) {
                    recordStep(
                        current,
                        `Keep the current route to ${neighbor}; new cost ${tentativeG} is not better.`
                    );
                }
            }
        }

        // No route exists
        if (recordSteps) {
            recordStep(
                null,
                "The open set is empty. No route to the destination exists."
            );
        }

        return {
            path: null,
            distance: Infinity,
            hops: 0,
            visitedCount: visitedNodes.length,
            visitedNodes,
            steps
        };
    }
}

export default AStar;
