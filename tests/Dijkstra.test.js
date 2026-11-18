
import { describe, it, expect, beforeEach } from "vitest";
import Graph from "../src/graph/Graph.js";
import Dijkstra from "../src/algorithms/Dijkstra.js";

describe("Dijkstra Algorithm", () => {
    let graph;

    beforeEach(() => {
        graph = new Graph();

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
    });

    // Test 1: Find shortest path
    it("should find the shortest path", () => {
        const result = Dijkstra.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result.path).toEqual([
            "A", "C", "B", "D", "E"
        ]);

        expect(result.distance).toBe(10);
    });

    // Test 2: Same source and destination
    it("should return a distance of zero for the same router", () => {
        const result = Dijkstra.findShortestPath(
            graph,
            "A",
            "A"
        );

        expect(result).toEqual({
            path: ["A"],
            distance: 0
        });
    });

    // Test 3: Unreachable destination
    it("should return null for an unreachable destination", () => {
        graph.disableConnection("D", "E");
        graph.disableConnection("C", "E");

        expect(
            Dijkstra.findShortestPath(graph, "A", "E")
        ).toBeNull();
    });

    // Test 4: Ignore disabled connections
    it("should ignore disabled connections", () => {
        graph.disableConnection("A", "C");

        const result = Dijkstra.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result.path).toEqual([
            "A", "B", "D", "E"
        ]);

        expect(result.distance).toBe(11);
    });

    // Test 5: Invalid router
    it("should return null for an invalid router", () => {
        expect(
            Dijkstra.findShortestPath(graph, "X", "E")
        ).toBeNull();
    });

    // Test 6: Ignore failed routers
    it("should ignore failed routers", () => {
        graph.failRouter("C");

        const result = Dijkstra.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result.path).toEqual([
            "A", "B", "D", "E"
        ]);

        expect(result.distance).toBe(11);
    });

    // Test 7: Failed source router
    it("should return null when the source router has failed", () => {
        graph.failRouter("A");

        const result = Dijkstra.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result).toBeNull();
    });

    // Test 8: Failed destination router
    it("should return null when the destination router has failed", () => {
        graph.failRouter("E");

        const result = Dijkstra.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result).toBeNull();
    });
});
