
import { describe, it, expect, beforeEach } from "vitest";
import Graph from "../src/graph/Graph.js";

describe("Graph", () => {
  let graph;

  beforeEach(() => {
    graph = new Graph();
    graph.addRouter("A");
    graph.addRouter("B");
    graph.addRouter("C");
  });

  it("should add routers", () => {
    expect(Object.keys(graph.adjacencyList)).toEqual([
      "A", "B", "C"
    ]);
  });

  it("should add a connection between routers", () => {
    expect(graph.addConnection("A", "B", 5)).toBe(true);
    expect(graph.getNeighbors("A")).toContain("B");
    expect(graph.getNeighbors("B")).toContain("A");
  });

  it("should reject duplicate connections", () => {
    graph.addConnection("A", "B", 5);

    expect(graph.addConnection("A", "B", 5)).toBe(false);
  });

  it("should reject invalid connections", () => {
    expect(graph.addConnection("A", "X", 5)).toBe(false);
    expect(graph.addConnection("A", "A", 5)).toBe(false);
    expect(graph.addConnection("A", "B", -2)).toBe(false);
  });

  it("should disable and enable connections", () => {
    graph.addConnection("A", "B", 5);

    expect(graph.disableConnection("A", "B")).toBe(true);
    expect(graph.getNeighbors("A")).not.toContain("B");

    expect(graph.enableConnection("A", "B")).toBe(true);
    expect(graph.getNeighbors("A")).toContain("B");
  });

  it("should remove connections", () => {
    graph.addConnection("A", "B", 5);

    expect(graph.removeConnection("A", "B")).toBe(true);
    expect(graph.getNeighbors("A")).not.toContain("B");
  });

  it("should remove routers and their connections", () => {
    graph.addConnection("A", "B", 5);

    expect(graph.removeRouter("A")).toBe(true);
    expect(graph.adjacencyList.A).toBeUndefined();
    expect(graph.getNeighbors("B")).not.toContain("A");
  });
});
