
import { describe, it, expect, beforeEach } from "vitest";
import Graph from "../src/graph/Graph.js";
import Traversal from "../src/algorithms/Traversal.js";

describe("Graph Traversal", () => {
    let graph;

    beforeEach(() => {
        graph = new Graph();

        ["A", "B", "C", "D", "E"].forEach(router => {
            graph.addRouter(router);
        });

        graph.addConnection("A", "B");
        graph.addConnection("A", "C");
        graph.addConnection("B", "D");
        graph.addConnection("C", "E");
        graph.addConnection("D", "E");
    });

    // Test 1: BFS
    it("should find a path using BFS", () => {
        const path = Traversal.BFS(graph, "A", "E");

        expect(path).toEqual(["A", "C", "E"]);
    });

    // Test 2: DFS
    it("should find a path using DFS", () => {
        const path = Traversal.DFS(graph, "A", "E");

        expect(path).not.toBeNull();
        expect(path[0]).toBe("A");
        expect(path[path.length - 1]).toBe("E");
    });

    // Test 3: Unreachable destination
    it("should return null for an unreachable destination", () => {
        graph.disableConnection("A", "B");
        graph.disableConnection("A", "C");

        expect(Traversal.BFS(graph, "A", "E")).toBeNull();
        expect(Traversal.DFS(graph, "A", "E")).toBeNull();
    });

    // Test 4: Invalid router
    it("should return null for an invalid router", () => {
        expect(Traversal.BFS(graph, "X", "E")).toBeNull();
        expect(Traversal.DFS(graph, "A", "X")).toBeNull();
    });

    // Test 5: Same source and destination
    it("should return the same router when start equals target", () => {
        expect(Traversal.BFS(graph, "A", "A")).toEqual(["A"]);
        expect(Traversal.DFS(graph, "A", "A")).toEqual(["A"]);
    });

    // Test 6: Failed intermediate router
    it("should find an alternative path when an intermediate router fails", () => {
        graph.failRouter("B");

        const bfsPath = Traversal.BFS(graph, "A", "D");
        const dfsPath = Traversal.DFS(graph, "A", "D");

        expect(bfsPath).toEqual(["A", "C", "E", "D"]);

        expect(dfsPath).not.toBeNull();
        expect(dfsPath[0]).toBe("A");
        expect(dfsPath[dfsPath.length - 1]).toBe("D");
        expect(dfsPath).not.toContain("B");
    });

    // Test 7: Failed source router
    it("should return null when the source router has failed", () => {
        graph.failRouter("A");

        expect(Traversal.BFS(graph, "A", "E")).toBeNull();
        expect(Traversal.DFS(graph, "A", "E")).toBeNull();
    });

    // Test 8: Failed destination router
    it("should return null when the destination router has failed", () => {
        graph.failRouter("E");

        expect(Traversal.BFS(graph, "A", "E")).toBeNull();
        expect(Traversal.DFS(graph, "A", "E")).toBeNull();
    });
});
