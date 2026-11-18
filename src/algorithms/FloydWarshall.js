
class FloydWarshall {
    // Calculate shortest path between any two routers
    static findShortestPath(graph, start, target) {
        const result = this.findAllPairsWithStats(graph);

        if (
            !result ||
            !Object.hasOwn(result.distances, start) ||
            !Object.hasOwn(result.distances, target) ||
            !Number.isFinite(result.distances[start][target])
        ) {
            return null;
        }

        const path = this.reconstructPath(
            result.next,
            start,
            target
        );

        if (!path) return null;

        return {
            path,
            distance: result.distances[start][target]
        };
    }

    // Reconstruct path using the next-hop matrix
    static reconstructPath(next, start, target) {
        if (
            next[start]?.[target] === null ||
            next[start]?.[target] === undefined
        ) {
            return null;
        }

        const path = [start];
        let current = start;
        const visited = new Set([start]);

        while (current !== target) {
            current = next[current][target];

            if (
                current === null ||
                current === undefined ||
                visited.has(current)
            ) {
                return null;
            }

            path.push(current);
            visited.add(current);
        }

        return path;
    }

    // Floyd-Warshall with statistics and visualization steps
    static findAllPairsWithStats(graph, options = {}) {
        const recordSteps = options.recordSteps !== false;

        // Include only active routers
        const routers = Object.keys(graph.adjacencyList).filter(
            router => graph.isRouterActive(router)
        );

        const distances = {};
        const next = {};

        const visitedNodes = [];
        const steps = [];

        // Initialize distance and next-hop matrices
        for (const router of routers) {
            distances[router] = {};
            next[router] = {};

            for (const destination of routers) {
                distances[router][destination] =
                    router === destination ? 0 : Infinity;

                next[router][destination] =
                    router === destination ? router : null;
            }
        }

        // Initialize direct connections
        for (const router of routers) {
            for (const neighbor of graph.getNeighbors(router)) {
                const weight = graph.getWeight(
                    router,
                    neighbor
                );

                distances[router][neighbor] = Math.min(
                    distances[router][neighbor],
                    weight
                );

                next[router][neighbor] = neighbor;
            }
        }

        // Record visualization steps
        const recordStep = (current, action) => {
            if (!recordSteps) return;

            steps.push({
                step: steps.length,
                current,
                action,
                visitedNodes: [...visitedNodes],
                frontier: [...routers],
                distances: Object.fromEntries(
                    routers.map(router => [
                        router,
                        { ...distances[router] }
                    ])
                )
            });
        };

        if (recordSteps) {
            recordStep(
                null,
                "Initialize the distance matrix using direct connections."
            );
        }

        // Main Floyd-Warshall algorithm
        for (const intermediate of routers) {
            if (!visitedNodes.includes(intermediate)) {
                visitedNodes.push(intermediate);
            }

            recordStep(
                intermediate,
                `Consider router ${intermediate} as an intermediate router.`
            );

            for (const from of routers) {
                for (const to of routers) {
                    const firstDistance =
                        distances[from][intermediate];

                    const secondDistance =
                        distances[intermediate][to];

                    if (
                        !Number.isFinite(firstDistance) ||
                        !Number.isFinite(secondDistance)
                    ) {
                        continue;
                    }

                    const newDistance =
                        firstDistance + secondDistance;

                    if (newDistance < distances[from][to]) {
                        const oldDistance = distances[from][to];

                        distances[from][to] = newDistance;

                        next[from][to] =
                            next[from][intermediate];

                        recordStep(
                            intermediate,
                            `Improve route ${from} → ${to}: ${
                                oldDistance === Infinity
                                    ? "∞"
                                    : oldDistance
                            } → ${newDistance} through ${intermediate}.`
                        );
                    }
                }
            }
        }

        // Detect negative cycles defensively
        const negativeCycle = routers.some(
            router => distances[router][router] < 0
        );

        if (negativeCycle) {
            recordStep(
                null,
                "A negative-weight cycle was detected."
            );
        }

        return {
            routers,
            distances,
            next,
            negativeCycle,
            visitedCount: visitedNodes.length,
            visitedNodes,
            steps
        };
    }
}

export default FloydWarshall;
