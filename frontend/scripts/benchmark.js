
import { performance } from "node:perf_hooks";

import Graph from "../../src/graph/Graph.js";
import Dijkstra from "../../src/algorithms/Dijkstra.js";
import AStar from "../../src/algorithms/AStar.js";

const NETWORK_SIZES = [50, 100, 250, 500, 1000];
const GRAPH_SEEDS = 5;
const REPEATS = 7;
const WARMUP_RUNS = 1;

function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateNetwork(nodeCount, seed) {
  const random = createRandom(seed);
  const graph = new Graph();
  const positions = {};

  const routerIds = Array.from(
    { length: nodeCount },
    (_, index) => `R${index}`
  );

  // Create routers and assign coordinates.
  for (const id of routerIds) {
    graph.addRouter(id);

    positions[id] = {
      x: random() * 1000,
      y: random() * 1000
    };
  }

  // Create weighted connections.
  function addWeightedConnection(a, b) {
    const dx = positions[a].x - positions[b].x;
    const dy = positions[a].y - positions[b].y;

    const geometricDistance = Math.hypot(dx, dy);

    const weight =
      geometricDistance * (1 + random());

    graph.addConnection(a, b, weight);
  }

  // Backbone guarantees connectivity.
  for (let i = 1; i < nodeCount; i++) {
    addWeightedConnection(
      routerIds[i - 1],
      routerIds[i]
    );
  }

  // Add deterministic random connections.
  const edgeProbability = Math.min(
    0.08,
    4 / (nodeCount - 1)
  );

  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (random() < edgeProbability) {
        addWeightedConnection(
          routerIds[i],
          routerIds[j]
        );
      }
    }
  }

  return {
    graph,
    positions,
    start: routerIds[0],
    target: routerIds[nodeCount - 1]
  };
}

function median(values) {
  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function average(values) {
  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function runDijkstra(network) {
  return Dijkstra.findShortestPathWithStats(
    network.graph,
    network.start,
    network.target
  );
}

function runAStar(network) {
  return AStar.findPathWithStats(
    network.graph,
    network.start,
    network.target,
    network.positions
  );
}

function measureExecutionTime(algorithm, network) {
  const startedAt = performance.now();

  const result = algorithm(network);

  const executionTime =
    performance.now() - startedAt;

  return {
    result,
    executionTime
  };
}

function runExperiment(nodeCount) {
  const dijkstraTimes = [];
  const aStarTimes = [];

  const dijkstraVisited = [];
  const aStarVisited = [];

  let matchingShortestPaths = 0;
  let totalComparisons = 0;

  for (
    let seedIndex = 0;
    seedIndex < GRAPH_SEEDS;
    seedIndex++
  ) {
    const network = generateNetwork(
      nodeCount,
      20261117 + seedIndex * 1009 + nodeCount
    );

    // Warm-up runs are excluded from measurements.
    for (let i = 0; i < WARMUP_RUNS; i++) {
      runDijkstra(network);
      runAStar(network);
    }

    for (
      let repeat = 0;
      repeat < REPEATS;
      repeat++
    ) {
      let dijkstraMeasurement;
      let aStarMeasurement;

      // Alternate order to reduce timing bias.
      if (repeat % 2 === 0) {
        dijkstraMeasurement =
          measureExecutionTime(runDijkstra, network);

        aStarMeasurement =
          measureExecutionTime(runAStar, network);
      } else {
        aStarMeasurement =
          measureExecutionTime(runAStar, network);

        dijkstraMeasurement =
          measureExecutionTime(runDijkstra, network);
      }

      const d = dijkstraMeasurement.result;
      const a = aStarMeasurement.result;

      dijkstraTimes.push(
        dijkstraMeasurement.executionTime
      );

      aStarTimes.push(
        aStarMeasurement.executionTime
      );

      dijkstraVisited.push(
        d?.visitedCount ?? 0
      );

      aStarVisited.push(
        a?.visitedCount ?? 0
      );

      // Validate that both algorithms return equal costs.
      const bothFoundPath =
        d?.path != null && a?.path != null;

      const sameCost =
        bothFoundPath &&
        Math.abs(d.distance - a.distance) <=
          1e-8 * Math.max(1, Math.abs(d.distance));

      if (sameCost) {
        matchingShortestPaths++;
      }

      totalComparisons++;
    }
  }

  return {
    routers: nodeCount,
    samples: totalComparisons,

    dijkstraMedianMs: median(dijkstraTimes),
    aStarMedianMs: median(aStarTimes),

    dijkstraAverageVisited: average(dijkstraVisited),
    aStarAverageVisited: average(aStarVisited),

    matchingShortestPaths,
    totalComparisons
  };
}

function main() {
  const results = [];

  for (const size of NETWORK_SIZES) {
    console.log(
      `Running experiment for ${size} routers...`
    );

    results.push(runExperiment(size));
  }

  console.log(
    "\nROUTECORE: DIJKSTRA VS A* — REPRODUCIBLE BENCHMARK\n"
  );

  console.log(
    `Graph seeds: ${GRAPH_SEEDS}; ` +
    `timed repetitions: ${REPEATS}; ` +
    `warm-up runs: ${WARMUP_RUNS}\n`
  );

  console.table(
    results.map(row => ({
      Routers: row.routers,
      Samples: row.samples,

      "Dijkstra median (ms)":
        row.dijkstraMedianMs.toFixed(5),

      "A* median (ms)":
        row.aStarMedianMs.toFixed(5),

      "Dijkstra avg visited":
        row.dijkstraAverageVisited.toFixed(2),

      "A* avg visited":
        row.aStarAverageVisited.toFixed(2),

      "Matching costs":
        `${row.matchingShortestPaths}/${row.totalComparisons}`
    }))
  );

  const matches = results.reduce(
    (sum, row) => sum + row.matchingShortestPaths,
    0
  );

  const comparisons = results.reduce(
    (sum, row) => sum + row.totalComparisons,
    0
  );

  console.log(
    `\nValidation: ${
      matches === comparisons ? "PASSED" : "WARNING"
    } (${matches}/${comparisons} matching path costs).`
  );
}

main();
