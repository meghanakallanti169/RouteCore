
class Dijkstra {
    static findShortestPath(graph, start, target) {
        if (
            !Object.hasOwn(graph.adjacencyList, start) ||
            !Object.hasOwn(graph.adjacencyList, target)
        ) {
            return null;
        }

        const distances = {};
        const previous = {};
        const unvisited = new Set(
            Object.keys(graph.adjacencyList)
        );

        for (const router of unvisited) {
            distances[router] = Infinity;
            previous[router] = null;
        }

        distances[start] = 0;

        while (unvisited.size > 0) {
            let current = null;
            let smallestDistance = Infinity;

            for (const router of unvisited) {
                if (distances[router] < smallestDistance) {
                    smallestDistance = distances[router];
                    current = router;
                }
            }

            if (current === null) break;

            if (current === target) break;

            unvisited.delete(current);

            for (const neighbor of graph.getNeighbors(current)) {
                if (!unvisited.has(neighbor)) continue;

                const newDistance =
                    distances[current] +
                    graph.getWeight(current, neighbor);

                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    previous[neighbor] = current;
                }
            }
        }

        if (distances[target] === Infinity) {
            return null;
        }

        const path = [];
        let current = target;

        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }

        return {
            path,
            distance: distances[target]
        };
    }
}

export default Dijkstra;
