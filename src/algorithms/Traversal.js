
class Traversal {
    // Breadth-First Search
    static BFS(graph, start, target) {
        if (
            !Object.hasOwn(graph.adjacencyList, start) ||
            !Object.hasOwn(graph.adjacencyList, target)
        ) {
            return null;
        }

        const queue = [[start]];
        const visited = new Set([start]);

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            if (current === target) {
                return path;
            }

            for (const neighbor of graph.getNeighbors(current)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }

        return null;
    }

    // Depth-First Search
    static DFS(graph, start, target) {
        if (
            !Object.hasOwn(graph.adjacencyList, start) ||
            !Object.hasOwn(graph.adjacencyList, target)
        ) {
            return null;
        }

        const visited = new Set();

        function explore(current, path) {
            if (current === target) {
                return path;
            }

            visited.add(current);

            for (const neighbor of graph.getNeighbors(current)) {
                if (!visited.has(neighbor)) {
                    const result = explore(
                        neighbor,
                        [...path, neighbor]
                    );

                    if (result !== null) {
                        return result;
                    }
                }
            }

            return null;
        }

        return explore(start, [start]);
    }
}

export default Traversal;
