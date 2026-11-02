
import { describe, it, expect, beforeEach } from "vitest";
import Graph from "../src/graph/Graph.js";
import NetworkRecovery from "../src/algorithms/NetworkRecovery.js";

describe("Network Recovery", () => {
  let graph;

  beforeEach(() => {
    graph = new Graph();

    ["A", "B", "C", "D"].forEach(router => {
      graph.addRouter(router);
    });

    graph.addConnection("A", "B", 1);
    graph.addConnection("B", "D", 1);
    graph.addConnection("A", "C", 2);
    graph.addConnection("C", "D", 2);
  });

  it("should find an alternative route", () => {
    graph.disableConnection("A", "B");

    const result = NetworkRecovery.findAlternativeRoute(
      graph, "A", "D"
    );

    expect(result.success).toBe(true);
    expect(result.path).toEqual(["A", "C", "D"]);
    expect(result.distance).toBe(4);
  });

  it("should simulate a connection failure", () => {
    const result = NetworkRecovery.simulateFailure(
      graph, "A", "B", "A", "D"
    );

    expect(result.success).toBe(true);
    expect(result.failedConnection).toBe("A - B");
    expect(result.path).toEqual(["A", "C", "D"]);
  });

  it("should report failure when no alternative route exists", () => {
    graph.disableConnection("A", "C");

    const result = NetworkRecovery.simulateFailure(
      graph, "A", "B", "A", "D"
    );

    expect(result.success).toBe(false);
    expect(result.path).toBeNull();
  });

  it("should restore a failed connection", () => {
    graph.disableConnection("A", "B");

    const result = NetworkRecovery.recoverConnection(
      graph, "A", "B"
    );

    expect(result.success).toBe(true);
    expect(graph.getNeighbors("A")).toContain("B");
  });
});
