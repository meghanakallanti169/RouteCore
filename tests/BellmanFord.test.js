
import { describe, it, expect, beforeEach } from "vitest";
import Graph from "../src/graph/Graph.js";
import BellmanFord from "../src/algorithms/BellmanFord.js";

describe("Bellman-Ford Algorithm", () => {
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
        const result = BellmanFord.findShortestPath(
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
    it("should return a distance of zero when source equals destination", () => {
        const result = BellmanFord.findShortestPath(
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
    it("should return null when the destination is unreachable", () => {
        graph.disableConnection("D", "E");
        graph.disableConnection("C", "E");

        const result = BellmanFord.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result).toBeNull();
    });

    // Test 4: Ignore disabled connections
    it("should ignore disabled connections", () => {
        graph.disableConnection("A", "C");

        const result = BellmanFord.findShortestPath(
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
        const result = BellmanFord.findShortestPath(
            graph,
            "X",
            "E"
        );

        expect(result).toBeNull();
    });

    // Test 6: Failed intermediate router
    it("should find an alternative path when an intermediate router fails", () => {
        graph.failRouter("C");

        const result = BellmanFord.findShortestPath(
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

        const result = BellmanFord.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result).toBeNull();
    });

    // Test 8: Failed destination router
    it("should return null when the destination router has failed", () => {
        graph.failRouter("E");

        const result = BellmanFord.findShortestPath(
            graph,
            "A",
            "E"
        );

        expect(result).toBeNull();
    });

    // Test 9: Statistics and visualization steps
    it("should return statistics and visualization steps", () => {
        const result = BellmanFord.findShortestPathWithStats(
            graph,
            "A",
            "E"
        );

        expect(result.path).toEqual([
            "A", "C", "B", "D", "E"
        ]);

        expect(result.distance).toBe(10);
        expect(result.visitedCount).toBeGreaterThan(0);
        expect(result.visitedNodes).toContain("E");
        expect(result.steps.length).toBeGreaterThan(0);
    });

    // Test 10: Disable step recording
    it("should calculate the shortest path without recording steps", () => {
        const result = BellmanFord.findShortestPathWithStats(
            graph,
            "A",
            "E",
            { recordSteps: false }
        );

        expect(result.distance).toBe(10);
        expect(result.path).toEqual([
            "A", "C", "B", "D", "E"
        ]);

        expect(result.steps).toEqual([]);
    });
});
