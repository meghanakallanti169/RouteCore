
class Dijkstra {
    static findShortestPath(graph, start, target) {
        const result = this.findShortestPathWithStats(
            graph,
            start,
            target
        );

        if (!result || result.path === null) {
            return null;
        }

        return {
            path: result.path,
            distance: result.distance
        };
    }

    static findShortestPathWithStats(
        graph,
        start,
        target,
        options = {}
    ) {
        // Validate source and destination
        if (
            !graph.isRouterActive(start) ||
            !graph.isRouterActive(target)
        ) {
            return null;
        }

        const recordSteps = options.recordSteps !== false;

        // Include only active routers
        const unvisited = new Set(
            Object.keys(graph.adjacencyList).filter(
                router => graph.isRouterActive(router)
            )
        );

        const distances = {};
        const previous = {};
        const visitedNodes = [];
        const steps = [];

        for (const router of unvisited) {
            distances[router] = Infinity;
            previous[router] = null;
        }

        distances[start] = 0;

        // Get reachable routers in the frontier
        const getFrontier = () =>
            [...unvisited]
                .filter(router =>
                    Number.isFinite(distances[router])
                )
                .sort(
                    (a, b) => distances[a] - distances[b]
                );

        // Reconstruct path
        const getPathTo = destination => {
            if (!Number.isFinite(distances[destination])) {
                return [];
            }

            const path = [];
            let router = destination;

            while (router !== null) {
                path.unshift(router);
                router = previous[router];
            }

            return path;
        };

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
                distances: { ...distances }
            });
        };

        if (recordSteps) {
            recordStep(
                null,
                `Start at router ${start}. Set its distance to 0.`
            );
        }

        // Main Dijkstra algorithm
        while (unvisited.size > 0) {
            let current = null;
            let smallestDistance = Infinity;

            // Find the unvisited router with minimum distance
            for (const router of unvisited) {
                if (distances[router] < smallestDistance) {
                    smallestDistance = distances[router];
                    current = router;
                }
            }

            // No more reachable routers
            if (current === null) {
                if (recordSteps) {
                    recordStep(
                        null,
                        "No more reachable routers. Destination cannot be reached."
                    );
                }

                break;
            }

            unvisited.delete(current);
            visitedNodes.push(current);

            if (recordSteps) {
                recordStep(
                    current,
                    `Visit router ${current} with distance ${distances[current]}.`
                );
            }

            // Stop when destination is reached
            if (current === target) {
                if (recordSteps) {
                    recordStep(
                        current,
                        `Destination ${target} reached. Shortest distance is ${distances[target]}.`
                    );
                }

                break;
            }

            // Explore active neighbors
            for (const neighbor of graph.getNeighbors(current)) {
                if (!unvisited.has(neighbor)) {
                    continue;
                }

                const edgeWeight = graph.getWeight(
                    current,
                    neighbor
                );

                const newDistance =
                    distances[current] + edgeWeight;

                if (newDistance < distances[neighbor]) {
                    const oldDistance = distances[neighbor];

                    distances[neighbor] = newDistance;
                    previous[neighbor] = current;

                    if (recordSteps) {
                        recordStep(
                            current,
                            `Update ${neighbor}: ${
                                oldDistance === Infinity
                                    ? "∞"
                                    : oldDistance
                            } → ${newDistance} through ${current}.`
                        );
                    }
                } else if (recordSteps) {
                    recordStep(
                        current,
                        `Keep ${neighbor}'s distance at ${distances[neighbor]}; ${newDistance} is not shorter.`
                    );
                }
            }
        }

        // Destination is unreachable
        if (distances[target] === Infinity) {
            return {
                path: null,
                distance: Infinity,
                visitedCount: visitedNodes.length,
                visitedNodes,
                steps
            };
        }

        // Return shortest path and statistics
        return {
            path: getPathTo(target),
            distance: distances[target],
            visitedCount: visitedNodes.length,
            visitedNodes,
            steps
        };
    }
}

export default Dijkstra;
