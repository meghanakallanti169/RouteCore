
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

  it("should find a path using BFS", () => {
    const path = Traversal.BFS(graph, "A", "E");

    expect(path).toEqual(["A", "C", "E"]);
  });

  it("should find a path using DFS", () => {
    const path = Traversal.DFS(graph, "A", "E");

    expect(path).not.toBeNull();
    expect(path[0]).toBe("A");
    expect(path[path.length - 1]).toBe("E");
  });

  it("should return null for an unreachable destination", () => {
    graph.disableConnection("A", "B");
    graph.disableConnection("A", "C");

    expect(Traversal.BFS(graph, "A", "E")).toBeNull();
    expect(Traversal.DFS(graph, "A", "E")).toBeNull();
  });

  it("should return null for an invalid router", () => {
    expect(Traversal.BFS(graph, "X", "E")).toBeNull();
    expect(Traversal.DFS(graph, "A", "X")).toBeNull();
  });

  it("should return the same router when start equals target", () => {
    expect(Traversal.BFS(graph, "A", "A")).toEqual(["A"]);
    expect(Traversal.DFS(graph, "A", "A")).toEqual(["A"]);
  });
});
