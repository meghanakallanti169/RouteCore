
class Traversal {
    // Breadth-First Search
    static BFS(graph, start, target) {
        const result = Traversal.BFSWithStats(graph, start, target);
        return result ? result.path : null;
    }

    // BFS with performance statistics and visualization steps
    static BFSWithStats(graph, start, target) {
        if (
            !Object.hasOwn(graph.adjacencyList, start) ||
            !Object.hasOwn(graph.adjacencyList, target)
        ) {
            return null;
        }

        const queue = [[start]];
        const visited = new Set([start]);
        const visitedNodes = [];
        const steps = [];

        // Record the initial state
        steps.push({
            step: 0,
            current: null,
            action: `Starting BFS from router ${start}`,
            visitedNodes: [],
            frontier: [start],
            path: []
        });

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            visitedNodes.push(current);

            steps.push({
                step: steps.length,
                current,
                action: `Exploring router ${current}`,
                visitedNodes: [...visitedNodes],
                frontier: queue.map(p => p[p.length - 1]),
                path: [...path]
            });

            if (current === target) {
                steps.push({
                    step: steps.length,
                    current,
                    action: `Destination ${target} reached!`,
                    visitedNodes: [...visitedNodes],
                    frontier: queue.map(p => p[p.length - 1]),
                    path: [...path]
                });

                return {
                    path,
                    visitedCount: visitedNodes.length,
                    visitedNodes,
                    steps
                };
            }

            for (const neighbor of graph.getNeighbors(current)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);

                    steps.push({
                        step: steps.length,
                        current,
                        action: `Added router ${neighbor} to the BFS queue`,
                        visitedNodes: [...visitedNodes],
                        frontier: queue.map(p => p[p.length - 1]),
                        path: [...path, neighbor]
                    });
                }
            }
        }

        steps.push({
            step: steps.length,
            current: null,
            action: `No route found from ${start} to ${target}`,
            visitedNodes: [...visitedNodes],
            frontier: [],
            path: []
        });

        return {
            path: null,
            visitedCount: visitedNodes.length,
            visitedNodes,
            steps
        };
    }

    // Depth-First Search
    static DFS(graph, start, target) {
        const result = Traversal.DFSWithStats(graph, start, target);
        return result ? result.path : null;
    }

    // DFS with performance statistics and visualization steps
    static DFSWithStats(graph, start, target) {
        if (
            !Object.hasOwn(graph.adjacencyList, start) ||
            !Object.hasOwn(graph.adjacencyList, target)
        ) {
            return null;
        }

        const visited = new Set();
        const visitedNodes = [];
        const steps = [];

        steps.push({
            step: 0,
            current: null,
            action: `Starting DFS from router ${start}`,
            visitedNodes: [],
            frontier: [start],
            path: []
        });

        function explore(current, path) {
            visited.add(current);
            visitedNodes.push(current);

            steps.push({
                step: steps.length,
                current,
                action: `Exploring router ${current}`,
                visitedNodes: [...visitedNodes],
                frontier: [...path],
                path: [...path]
            });

            if (current === target) {
                steps.push({
                    step: steps.length,
                    current,
                    action: `Destination ${target} reached!`,
                    visitedNodes: [...visitedNodes],
                    frontier: [...path],
                    path: [...path]
                });

                return path;
            }

            for (const neighbor of graph.getNeighbors(current)) {
                if (!visited.has(neighbor)) {
                    steps.push({
                        step: steps.length,
                        current,
                        action: `Moving from ${current} to ${neighbor}`,
                        visitedNodes: [...visitedNodes],
                        frontier: [...path, neighbor],
                        path: [...path, neighbor]
                    });

                    const result = explore(
                        neighbor,
                        [...path, neighbor]
                    );

                    if (result !== null) {
                        return result;
                    }
                }
            }

            steps.push({
                step: steps.length,
                current,
                action: `Backtracking from router ${current}`,
                visitedNodes: [...visitedNodes],
                frontier: [...path],
                path: [...path]
            });

            return null;
        }

        const path = explore(start, [start]);

        if (path === null) {
            steps.push({
                step: steps.length,
                current: null,
                action: `No route found from ${start} to ${target}`,
                visitedNodes: [...visitedNodes],
                frontier: [],
                path: []
            });
        }

        return {
            path,
            visitedCount: visitedNodes.length,
            visitedNodes,
            steps
        };
    }
}

export default Traversal;
