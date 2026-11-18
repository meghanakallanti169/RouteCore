
import { describe, it, expect } from "vitest";
import Graph from "../src/graph/Graph.js";
import FloydWarshall from "../src/algorithms/FloydWarshall.js";

function createGraph() {
    const graph = new Graph();

    ["A", "B", "C", "D", "E"].forEach(router => {
        graph.addRouter(router);
    });

    graph.addConnection("A", "B", 4);
    graph.addConnection("A", "C", 2);
    graph.addConnection("B", "C", 1);
    graph.addConnection("B", "D", 5);
    graph.addConnection("C", "D", 8);
    graph.addConnection("C", "E", 10);
    graph.addConnection("D", "E", 2);

    return graph;
}

describe("FloydWarshall Algorithm", () => {

    it("should find the shortest path between two routers", () => {
        const graph = createGraph();

        const result = FloydWarshall.findShortestPath(
            graph, "A", "E"
        );

        expect(result).toEqual({
            path: ["A", "C", "B", "D", "E"],
            distance: 10
        });
    });

    it("should return distance 0 when source and destination are the same", () => {
        const graph = createGraph();

        const result = FloydWarshall.findShortestPath(
            graph, "A", "A"
        );

        expect(result).toEqual({
            path: ["A"],
            distance: 0
        });
    });

    it("should return null when no path exists", () => {
        const graph = new Graph();

        graph.addRouter("A");
        graph.addRouter("B");
        graph.addRouter("C");

        graph.addConnection("A", "B", 5);

        const result = FloydWarshall.findShortestPath(
            graph, "A", "C"
        );

        expect(result).toBeNull();
    });

    it("should find the shortest alternative path when a connection is disabled", () => {
        const graph = createGraph();

        graph.disableConnection("B", "D");

        const result = FloydWarshall.findShortestPath(
            graph, "A", "E"
        );

        // A -> C -> E = 2 + 10 = 12
        expect(result).toEqual({
            path: ["A", "C", "E"],
            distance: 12
        });
    });

    it("should return null for an invalid source router", () => {
        const graph = createGraph();

        const result = FloydWarshall.findShortestPath(
            graph, "X", "E"
        );

        expect(result).toBeNull();
    });

    it("should return null for an invalid destination router", () => {
        const graph = createGraph();

        const result = FloydWarshall.findShortestPath(
            graph, "A", "X"
        );

        expect(result).toBeNull();
    });

    it("should avoid failed routers when finding a shortest path", () => {
        const graph = createGraph();

        graph.failRouter("C");

        const result = FloydWarshall.findShortestPath(
            graph, "A", "E"
        );

        expect(result).toEqual({
            path: ["A", "B", "D", "E"],
            distance: 11
        });
    });

    it("should return null when the source router has failed", () => {
        const graph = createGraph();

        graph.failRouter("A");

        const result = FloydWarshall.findShortestPath(
            graph, "A", "E"
        );

        expect(result).toBeNull();
    });

    it("should return null when the destination router has failed", () => {
        const graph = createGraph();

        graph.failRouter("E");

        const result = FloydWarshall.findShortestPath(
            graph, "A", "E"
        );

        expect(result).toBeNull();
    });

    it("should calculate shortest distances between all pairs", () => {
        const graph = createGraph();

        const result = FloydWarshall.findAllPairsWithStats(graph);

        expect(result.distances.A.E).toBe(10);
        expect(result.distances.E.A).toBe(10);
        expect(result.distances.A.D).toBe(8);
        expect(result.distances.B.E).toBe(7);
        expect(result.negativeCycle).toBe(false);
    });

    it("should record algorithm steps by default", () => {
        const graph = createGraph();

        const result = FloydWarshall.findAllPairsWithStats(graph);

        expect(result.steps.length).toBeGreaterThan(0);
        expect(result.visitedCount).toBe(5);
    });

    it("should not record steps when recordSteps is false", () => {
        const graph = createGraph();

        const result = FloydWarshall.findAllPairsWithStats(
            graph,
            { recordSteps: false }
        );

        expect(result.steps).toEqual([]);
        expect(result.distances.A.E).toBe(10);
    });

    it("should reconstruct a valid path", () => {
        const graph = createGraph();

        const result = FloydWarshall.findAllPairsWithStats(graph);

        const path = FloydWarshall.reconstructPath(
            result.next, "A", "E"
        );

        expect(path).toEqual(["A", "C", "B", "D", "E"]);
    });
});
