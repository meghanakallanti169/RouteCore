
class BellmanFord {
    // Find shortest path between two routers
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

    // Bellman-Ford with statistics and visualization steps
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
        const routers = Object.keys(graph.adjacencyList).filter(
            router => graph.isRouterActive(router)
        );

        // Build directed edges from active connections
        const edges = [];

        for (const router of routers) {
            for (const neighbor of graph.getNeighbors(router)) {
                edges.push({
                    from: router,
                    to: neighbor,
                    weight: graph.getWeight(router, neighbor)
                });
            }
        }

        // Initialize distances and predecessors
        const distances = {};
        const previous = {};

        for (const router of routers) {
            distances[router] = Infinity;
            previous[router] = null;
        }

        distances[start] = 0;

        const visitedNodes = [];
        const steps = [];

        // Reconstruct shortest path
        const getPathTo = destination => {
            if (!Number.isFinite(distances[destination])) {
                return [];
            }

            const path = [];
            let current = destination;
            const visited = new Set();

            while (current !== null) {
                if (visited.has(current)) {
                    return [];
                }

                visited.add(current);
                path.unshift(current);

                current = previous[current];
            }

            return path;
        };

        // Get routers that currently have finite distances
        const getFrontier = () =>
            routers.filter(router =>
                Number.isFinite(distances[router])
            );

        // Record algorithm steps
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

        // Relax edges repeatedly
        for (let iteration = 1; iteration < routers.length; iteration++) {
            let updated = false;

            if (recordSteps) {
                recordStep(
                    null,
                    `Starting iteration ${iteration} of ${routers.length - 1}.`
                );
            }

            for (const edge of edges) {
                const { from, to, weight } = edge;

                if (!Number.isFinite(distances[from])) {
                    continue;
                }

                const newDistance =
                    distances[from] + weight;

                if (newDistance < distances[to]) {
                    const oldDistance = distances[to];

                    distances[to] = newDistance;
                    previous[to] = from;

                    updated = true;

                    if (!visitedNodes.includes(to)) {
                        visitedNodes.push(to);
                    }

                    if (recordSteps) {
                        recordStep(
                            from,
                            `Relax edge ${from} → ${to}: ${
                                oldDistance === Infinity
                                    ? "∞"
                                    : oldDistance
                            } → ${newDistance}.`
                        );
                    }
                }
            }

            // Stop early if no distance was updated
            if (!updated) {
                if (recordSteps) {
                    recordStep(
                        null,
                        `No updates in iteration ${iteration}. Algorithm converged.`
                    );
                }

                break;
            }
        }

        // Check for a reachable negative-weight cycle
        // This is defensive: the current Graph class rejects negative weights.
        for (const edge of edges) {
            const { from, to, weight } = edge;

            if (
                Number.isFinite(distances[from]) &&
                distances[from] + weight < distances[to]
            ) {
                if (recordSteps) {
                    recordStep(
                        from,
                        "A reachable negative-weight cycle was detected."
                    );
                }

                return {
                    path: null,
                    distance: -Infinity,
                    negativeCycle: true,
                    visitedCount: visitedNodes.length,
                    visitedNodes,
                    steps
                };
            }
        }

        // Destination is unreachable
        if (!Number.isFinite(distances[target])) {
            if (recordSteps) {
                recordStep(
                    null,
                    `No route exists from ${start} to ${target}.`
                );
            }

            return {
                path: null,
                distance: Infinity,
                negativeCycle: false,
                visitedCount: visitedNodes.length,
                visitedNodes,
                steps
            };
        }

        // Return shortest path and statistics
        const path = getPathTo(target);

        return {
            path,
            distance: distances[target],
            negativeCycle: false,
            visitedCount: visitedNodes.length,
            visitedNodes,
            steps
        };
    }
}

export default BellmanFord;
