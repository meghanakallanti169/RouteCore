
class Dijkstra {
    static findShortestPath(graph, start, target) {
        const result = this.findShortestPathWithStats(graph, start, target);

        if (!result || result.path === null) {
            return null;
        }

        return {
            path: result.path,
            distance: result.distance
        };
    }

    static findShortestPathWithStats(graph, start, target) {
        if (
            !Object.hasOwn(graph.adjacencyList, start) ||
            !Object.hasOwn(graph.adjacencyList, target)
        ) {
            return null;
        }

        const distances = {};
        const previous = {};
        const unvisited = new Set(Object.keys(graph.adjacencyList));
        const visitedNodes = [];
        const steps = [];

        for (const router of unvisited) {
            distances[router] = Infinity;
            previous[router] = null;
        }

        distances[start] = 0;

        const getFrontier = () =>
            [...unvisited]
                .filter(router => Number.isFinite(distances[router]))
                .sort((a, b) => distances[a] - distances[b]);

        const getPathTo = destination => {
            if (!Number.isFinite(distances[destination])) return [];

            const path = [];
            let router = destination;

            while (router !== null) {
                path.unshift(router);
                router = previous[router];
            }

            return path;
        };

        const recordStep = (current, action) => {
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

        recordStep(null, `Start at router ${start}. Set its distance to 0.`);

        while (unvisited.size > 0) {
            let current = null;
            let smallestDistance = Infinity;

            for (const router of unvisited) {
                if (distances[router] < smallestDistance) {
                    smallestDistance = distances[router];
                    current = router;
                }
            }

            if (current === null) {
                recordStep(null, "No more reachable routers. Destination cannot be reached.");
                break;
            }

            unvisited.delete(current);
            visitedNodes.push(current);

            recordStep(
                current,
                `Visit router ${current} with distance ${distances[current]}.`
            );

            if (current === target) {
                recordStep(
                    current,
                    `Destination ${target} reached. Shortest distance is ${distances[target]}.`
                );
                break;
            }

            for (const neighbor of graph.getNeighbors(current)) {
                if (!unvisited.has(neighbor)) continue;

                const edgeWeight = graph.getWeight(current, neighbor);
                const newDistance = distances[current] + edgeWeight;

                if (newDistance < distances[neighbor]) {
                    const oldDistance = distances[neighbor];

                    distances[neighbor] = newDistance;
                    previous[neighbor] = current;

                    recordStep(
                        current,
                        `Update ${neighbor}: ${oldDistance === Infinity ? "∞" : oldDistance} → ${newDistance} through ${current}.`
                    );
                } else {
                    recordStep(
                        current,
                        `Keep ${neighbor}'s distance at ${distances[neighbor]}; ${newDistance} is not shorter.`
                    );
                }
            }
        }

        if (distances[target] === Infinity) {
            return {
                path: null,
                distance: Infinity,
                visitedCount: visitedNodes.length,
                visitedNodes,
                steps
            };
        }

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
