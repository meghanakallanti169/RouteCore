
import { describe, it, expect } from "vitest";
import Graph from "../src/graph/Graph.js";
import AStar from "../src/algorithms/AStar.js";

describe("A* Search Algorithm", () => {
    it("should find the optimal path using router coordinates", () => {
        const graph = new Graph();

        ["A", "B", "C", "D"].forEach(id => {
            graph.addRouter(id);
        });

        graph.addConnection("A", "B", 2);
        graph.addConnection("A", "C", 1);
        graph.addConnection("B", "D", 2);
        graph.addConnection("C", "D", 10);

        const positions = {
            A: { x: 0, y: 0 },
            B: { x: 1, y: 0 },
            C: { x: 0, y: 1 },
            D: { x: 2, y: 0 }
        };

        const result = AStar.findPath(
            graph, "A", "D", positions
        );

        expect(result.path).toEqual(["A", "B", "D"]);
        expect(result.distance).toBe(4);
        expect(result.hops).toBe(2);
    });

    it("should return null when no route exists", () => {
        const graph = new Graph();

        ["A", "B", "C"].forEach(id => {
            graph.addRouter(id);
        });

        graph.addConnection("A", "B", 5);

        const positions = {
            A: { x: 0, y: 0 },
            B: { x: 1, y: 0 },
            C: { x: 2, y: 0 }
        };

        const result = AStar.findPath(
            graph, "A", "C", positions
        );

        expect(result).toBeNull();
    });

    it("should handle zero-weight connections correctly", () => {
        const graph = new Graph();

        ["A", "B", "C"].forEach(id => {
            graph.addRouter(id);
        });

        graph.addConnection("A", "B", 0);
        graph.addConnection("B", "C", 2);
        graph.addConnection("A", "C", 5);

        const positions = {
            A: { x: 0, y: 0 },
            B: { x: 1, y: 0 },
            C: { x: 2, y: 0 }
        };

        const result = AStar.findPath(
            graph, "A", "C", positions
        );

        expect(result.path).toEqual(["A", "B", "C"]);
        expect(result.distance).toBe(2);
    });

    it("should work safely when router coordinates are missing", () => {
        const graph = new Graph();

        ["A", "B", "C"].forEach(id => {
            graph.addRouter(id);
        });

        graph.addConnection("A", "B", 2);
        graph.addConnection("B", "C", 3);
        graph.addConnection("A", "C", 10);

        const positions = {
            A: { x: 0, y: 0 }
        };

        const result = AStar.findPath(
            graph, "A", "C", positions
        );

        expect(result.path).toEqual(["A", "B", "C"]);
        expect(result.distance).toBe(5);
    });

    it("should return null for an invalid router", () => {
        const graph = new Graph();

        graph.addRouter("A");

        const result = AStar.findPath(
            graph, "A", "Z", {}
        );

        expect(result).toBeNull();
    });
});
