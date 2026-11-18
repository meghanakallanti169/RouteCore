import { useState } from "react";
import Graph from "../../src/graph/Graph.js";
import Traversal from "../../src/algorithms/Traversal.js";
import Dijkstra from "../../src/algorithms/Dijkstra.js";
import AStar from "../../src/algorithms/AStar.js";
import BellmanFord from "../../src/algorithms/BellmanFord.js";
import FloydWarshall from "../../src/algorithms/FloydWarshall.js";

const DEFAULT_SIZES = [50, 100, 250, 500, 1000];
const SIX_ALGORITHM_SIZES = [10, 25, 50, 100, 150];
const BASE_SEED = 20261117;
const ALGORITHMS = ["BFS", "DFS", "Dijkstra", "A*", "Bellman-Ford", "Floyd-Warshall"];

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
  const ids = Array.from({ length: nodeCount }, (_, i) => `R${i}`);

  for (const id of ids) {
    graph.addRouter(id);
    positions[id] = { x: random() * 1000, y: random() * 1000 };
  }

  const addWeightedConnection = (a, b) => {
    const dx = positions[a].x - positions[b].x;
    const dy = positions[a].y - positions[b].y;
    const euclideanDistance = Math.hypot(dx, dy);
    graph.addConnection(a, b, euclideanDistance * (1 + random()));
  };

  // A backbone guarantees that the selected source and target are connected.
  for (let i = 1; i < nodeCount; i++) {
    addWeightedConnection(ids[i - 1], ids[i]);
  }

  const edgeProbability = Math.min(0.08, 4 / Math.max(1, nodeCount - 1));
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (random() < edgeProbability) addWeightedConnection(ids[i], ids[j]);
    }
  }

  return { graph, positions, start: ids[0], target: ids[nodeCount - 1] };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function pathWeight(graph, path) {
  if (!Array.isArray(path) || path.length === 0) return Infinity;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const weight = graph.getWeight(path[i], path[i + 1]);
    if (!Number.isFinite(weight)) return Infinity;
    total += weight;
  }
  return total;
}

function runAlgorithm(name, network) {
  const { graph, start, target, positions } = network;

  if (name === "BFS") {
    const result = Traversal.BFSWithStats(graph, start, target);
    if (!result?.path) return null;
    return {
      path: result.path,
      distance: pathWeight(graph, result.path),
      visitedCount: result.visitedCount ?? result.visitedNodes?.length ?? 0,
    };
  }

  if (name === "DFS") {
    const result = Traversal.DFSWithStats(graph, start, target);
    if (!result?.path) return null;
    return {
      path: result.path,
      distance: pathWeight(graph, result.path),
      visitedCount: result.visitedCount ?? result.visitedNodes?.length ?? 0,
    };
  }

  if (name === "Dijkstra") {
    const result = Dijkstra.findShortestPathWithStats(
      graph, start, target, { recordSteps: false }
    );
    if (!result?.path) return null;
    return {
      path: result.path,
      distance: result.distance,
      visitedCount: result.visitedCount ?? result.visitedNodes?.length ?? 0,
    };
  }

  if (name === "A*") {
    const result = AStar.findPathWithStats(
      graph, start, target, positions, { recordSteps: false }
    );
    if (!result?.path) return null;
    return {
      path: result.path,
      distance: result.distance,
      visitedCount: result.visitedCount ?? result.visitedNodes?.length ?? 0,
    };
  }

  if (name === "Bellman-Ford") {
    const result = BellmanFord.findShortestPathWithStats(
      graph, start, target, { recordSteps: false }
    );
    if (!result?.path || result.negativeCycle) return null;
    return {
      path: result.path,
      distance: result.distance,
      visitedCount: result.visitedCount ?? result.visitedNodes?.length ?? 0,
    };
  }

  if (name === "Floyd-Warshall") {
    const result = FloydWarshall.findAllPairsWithStats(
      graph, { recordSteps: false }
    );
    if (result.negativeCycle) return null;

    const distance = result.distances?.[start]?.[target];
    const path = FloydWarshall.reconstructPath(result.next, start, target);
    if (!Array.isArray(path) || path.length === 0 || !Number.isFinite(distance)) {
      return null;
    }

    return {
      path,
      distance,
      // Floyd-Warshall processes the complete all-pairs matrix. Its visited
      // count is therefore the number of routers in the matrix, not a
      // single-source exploration count.
      visitedCount: result.routers?.length ?? Object.keys(result.distances ?? {}).length,
    };
  }

  return null;
}

function measure(fn, network) {
  const started = performance.now();
  const result = fn(network);
  return { result, ms: performance.now() - started };
}

function runDijkstra(network) {
  return runAlgorithm("Dijkstra", network);
}

function runAStar(network) {
  return runAlgorithm("A*", network);
}

function runDijkstraAStarExperiment(nodeCount, seeds, repeats) {
  const dTimes = [];
  const aTimes = [];
  const dVisited = [];
  const aVisited = [];
  let matching = 0;
  const comparisons = seeds * repeats;

  for (let seedIndex = 0; seedIndex < seeds; seedIndex++) {
    const network = generateNetwork(
      nodeCount, BASE_SEED + seedIndex * 1009 + nodeCount
    );

    runDijkstra(network);
    runAStar(network);

    for (let repeat = 0; repeat < repeats; repeat++) {
      let d, a;
      if (repeat % 2 === 0) {
        d = measure(runDijkstra, network);
        a = measure(runAStar, network);
      } else {
        a = measure(runAStar, network);
        d = measure(runDijkstra, network);
      }

      dTimes.push(d.ms);
      aTimes.push(a.ms);
      dVisited.push(d.result?.visitedCount ?? 0);
      aVisited.push(a.result?.visitedCount ?? 0);

      const valid = d.result && a.result;
      const tolerance = 1e-8 * Math.max(1, Math.abs(d.result?.distance ?? 0));
      if (valid && Math.abs(d.result.distance - a.result.distance) <= tolerance) {
        matching++;
      }
    }
  }

  const dijkstraMedianMs = median(dTimes);
  const aStarMedianMs = median(aTimes);
  const faster = dijkstraMedianMs > aStarMedianMs
    ? "A*"
    : dijkstraMedianMs < aStarMedianMs
      ? "Dijkstra"
      : "Tie";

  return {
    routers: nodeCount,
    samples: comparisons,
    dijkstraMedianMs,
    aStarMedianMs,
    dijkstraAverageVisited: average(dVisited),
    aStarAverageVisited: average(aVisited),
    matchingShortestPaths: matching,
    totalComparisons: comparisons,
    faster,
  };
}

function runSixAlgorithmExperiment(nodeCount, seeds, repeats) {
  const samples = Object.fromEntries(ALGORITHMS.map(name => [name, []]));
  const visited = Object.fromEntries(ALGORITHMS.map(name => [name, []]));
  const distances = Object.fromEntries(ALGORITHMS.map(name => [name, []]));
  const matchingSamples = Object.fromEntries(ALGORITHMS.map(name => [name, 0]));
  const validSamples = Object.fromEntries(ALGORITHMS.map(name => [name, 0]));
  let validComparisons = 0;
  let matchingShortestPaths = 0;
  const totalComparisons = seeds * repeats;

  for (let seedIndex = 0; seedIndex < seeds; seedIndex++) {
    const network = generateNetwork(
      nodeCount, BASE_SEED + 7919 + seedIndex * 1009 + nodeCount
    );

    // Warm up each implementation once; warm-up timings are not recorded.
    for (const name of ALGORITHMS) runAlgorithm(name, network);

    for (let repeat = 0; repeat < repeats; repeat++) {
      // Rotate execution order to reduce systematic first/last timing bias.
      const offset = repeat % ALGORITHMS.length;
      const order = [...ALGORITHMS.slice(offset), ...ALGORITHMS.slice(0, offset)];
      const current = {};

      for (const name of order) {
        const measured = measure(n => runAlgorithm(name, n), network);
        current[name] = measured.result;
        samples[name].push(measured.ms);
        visited[name].push(measured.result?.visitedCount ?? 0);
        distances[name].push(measured.result?.distance ?? Infinity);
      }

      // Compare each algorithm with Dijkstra on this exact graph and repetition.
      const reference = current.Dijkstra?.distance;
      if (Number.isFinite(reference)) {
        for (const name of ALGORITHMS) {
          const candidate = current[name]?.distance;
          if (!Number.isFinite(candidate)) continue;

          validSamples[name]++;
          validComparisons++;
          const tolerance = 1e-8 * Math.max(1, Math.abs(reference));
          if (Math.abs(candidate - reference) <= tolerance) {
            matchingSamples[name]++;
            matchingShortestPaths++;
          }
        }
      }
    }
  }

  const rows = ALGORITHMS.map(name => {
    const valid = validSamples[name];
    const matching = matchingSamples[name];
    return {
      name,
      medianMs: median(samples[name]),
      averageVisited: average(visited[name]),
      averageDistance: average(distances[name].filter(Number.isFinite)),
      validSamples: valid,
      matchingSamples: matching,
      matchRate: valid ? (matching / valid) * 100 : 0,
      // A fully matching result means every valid sample matched Dijkstra.
      costMatchesDijkstra: valid > 0 && matching === valid,
    };
  });

  return {
    routers: nodeCount,
    samplesPerAlgorithm: totalComparisons,
    rows,
    matchingShortestPaths,
    validComparisons,
  };
}

function BarRows({ rows, valueKey, format, colorClass = "benchmark-dijkstra" }) {
  const max = Math.max(0, ...rows.map(row => Number(row[valueKey]) || 0));
  return (
    <div className="benchmark-metric-rows">
      {rows.map(row => {
        const value = Number(row[valueKey]) || 0;
        const width = max > 0 ? Math.max(1, (value / max) * 100) : 0;
        return (
          <div className="benchmark-metric-row" key={row.name}>
            <span className="benchmark-metric-label">{row.name}</span>
            <div className="benchmark-metric-track">
              <div
                className={`benchmark-metric-fill ${colorClass}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <strong className="benchmark-metric-value">{format(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function MiniBarChart({ results, firstKey, secondKey, firstLabel, secondLabel, format }) {
  if (!results.length) return null;
  const max = Math.max(1, ...results.flatMap(row => [row[firstKey], row[secondKey]]));
  return (
    <div className="benchmark-chart" role="img" aria-label={`${firstLabel} and ${secondLabel} comparison chart`}>
      {results.map(row => (
        <div className="benchmark-chart-group" key={row.routers}>
          <div className="benchmark-chart-bars">
            <div
              className="benchmark-chart-bar benchmark-dijkstra"
              style={{ height: `${Math.max(2, (row[firstKey] / max) * 100)}%` }}
              title={`${firstLabel}: ${format(row[firstKey])}`}
            />
            <div
              className="benchmark-chart-bar benchmark-astar"
              style={{ height: `${Math.max(2, (row[secondKey] / max) * 100)}%` }}
              title={`${secondLabel}: ${format(row[secondKey])}`}
            />
          </div>
          <strong>{row.routers}</strong>
        </div>
      ))}
    </div>
  );
}

export default function BenchmarkPanel() {
  const [mode, setMode] = useState("six");
  const [sizes, setSizes] = useState(SIX_ALGORITHM_SIZES.join(", "));
  const [seedCount, setSeedCount] = useState(3);
  const [repeats, setRepeats] = useState(5);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [completedAt, setCompletedAt] = useState("");

  function changeMode(nextMode) {
    setMode(nextMode);
    setResults([]);
    setError("");
    setSizes((nextMode === "six" ? SIX_ALGORITHM_SIZES : DEFAULT_SIZES).join(", "));
  }

  async function runBenchmark() {
    const parsedSizes = [...new Set(
      sizes.split(",").map(value => Number(value.trim()))
    )];

    const maxSize = mode === "six" ? 150 : 1000;
    if (
      !parsedSizes.length ||
      parsedSizes.some(value =>
        !Number.isInteger(value) || value < 10 || value > maxSize
      )
    ) {
      setError(
        mode === "six"
          ? "For the six-algorithm comparison, enter router counts from 10 to 150. Example: 10, 25, 50, 100."
          : "Enter router counts between 10 and 1,000. Example: 50, 100, 250."
      );
      return;
    }

    if (
      !Number.isInteger(Number(seedCount)) ||
      seedCount < 1 ||
      seedCount > 20 ||
      !Number.isInteger(Number(repeats)) ||
      repeats < 3 ||
      repeats > 30
    ) {
      setError("Use 1–20 graph seeds and 3–30 timed repetitions.");
      return;
    }

    setError("");
    setResults([]);
    setRunning(true);

    try {
      const collected = [];
      for (const size of parsedSizes) {
        // Yield to the browser between network sizes so the interface can update.
        await new Promise(resolve => setTimeout(resolve, 0));
        const row = mode === "six"
          ? runSixAlgorithmExperiment(size, Number(seedCount), Number(repeats))
          : runDijkstraAStarExperiment(size, Number(seedCount), Number(repeats));
        collected.push(row);
        setResults([...collected]);
      }
      setCompletedAt(new Date().toLocaleString());
    } catch (runError) {
      setError(runError instanceof Error
        ? runError.message
        : "The benchmark could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  const sixRows = results.length ? results[results.length - 1].rows ?? [] : [];
  const fastestSix = sixRows.length
    ? sixRows.reduce((best, row) => row.medianMs < best.medianMs ? row : best)
    : null;
  const correctnessCounts = {
    optimal: sixRows.filter(row => row.validSamples > 0 && row.matchingSamples === row.validSamples).length,
    nonOptimal: sixRows.filter(row => row.validSamples > 0 && row.matchingSamples < row.validSamples).length,
    failed: sixRows.filter(row => row.validSamples === 0).length,
  };
  const allSixValid = sixRows.length === ALGORITHMS.length &&
    sixRows.every(row => row.validSamples > 0);

  const allValidated = results.length > 0 &&
    results.every(row => row.matchingShortestPaths === row.totalComparisons);

  return (
    <section className="benchmark-panel" aria-labelledby="benchmark-title">
      <div className="panel-heading">
        <div>
          <h3 id="benchmark-title">Reproducible Algorithm Experiments</h3>
          <p>
            {mode === "six"
              ? "Six-algorithm comparison on deterministic weighted networks"
              : "Controlled Dijkstra vs A* evaluation on deterministic weighted networks"}
          </p>
        </div>
        <span className={`benchmark-status ${running ? "is-running" : results.length ? "is-valid" : ""}`}>
          {running ? "Running" : results.length ? "Completed" : "Not run"}
        </span>
      </div>

      <div className="benchmark-mode-switch" role="group" aria-label="Benchmark mode">
        <button
          type="button"
          className={mode === "six" ? "primary-button" : "secondary-button"}
          onClick={() => changeMode("six")}
          disabled={running}
        >
          Six algorithms
        </button>
        <button
          type="button"
          className={mode === "pair" ? "primary-button" : "secondary-button"}
          onClick={() => changeMode("pair")}
          disabled={running}
        >
          Dijkstra vs A*
        </button>
      </div>

      <div className="benchmark-controls">
        <div className="form-group">
          <label htmlFor="benchmark-sizes">Network sizes (comma-separated)</label>
          <input
            id="benchmark-sizes"
            value={sizes}
            onChange={event => setSizes(event.target.value)}
            disabled={running}
          />
          <small>{mode === "six" ? "Allowed: 10–150 routers" : "Allowed: 10–1,000 routers"}</small>
        </div>

        <div className="form-group">
          <label htmlFor="benchmark-seeds">Graph seeds (1–20)</label>
          <input
            id="benchmark-seeds"
            type="number"
            min="1"
            max="20"
            value={seedCount}
            onChange={event => setSeedCount(Number(event.target.value))}
            disabled={running}
          />
        </div>

        <div className="form-group">
          <label htmlFor="benchmark-repeats">Timed repetitions (3–30)</label>
          <input
            id="benchmark-repeats"
            type="number"
            min="3"
            max="30"
            value={repeats}
            onChange={event => setRepeats(Number(event.target.value))}
            disabled={running}
          />
        </div>

        <button
          className="primary-button benchmark-run-button"
          onClick={runBenchmark}
          disabled={running}
        >
          {running ? "Running experiments…" : "Run benchmark"}
        </button>
      </div>

      <p className="benchmark-method-note">
        Each seeded graph is connected by a backbone plus random weighted links.
        Every algorithm receives the same graph and endpoints. Warm-up calls are
        excluded, and execution order rotates between repetitions. Edge weights
        are at least their Euclidean lengths, making the geometric A* heuristic admissible.
      </p>

      {mode === "six" && (
        <p className="benchmark-method-note">
          The six-algorithm experiment is limited to 150 routers to keep the
          O(V³) Floyd–Warshall computation manageable. Floyd–Warshall computes
          all-pairs shortest paths; its router-visit metric represents the full
          matrix, not a single-source search. BFS and DFS report the weight of
          the route they find, although they optimize hop count rather than weight.
        </p>
      )}

      {error && <p className="benchmark-error" role="alert">{error}</p>}

      {results.length > 0 && mode === "six" && (
        <>
          <div className="performance-grid benchmark-summary-grid">
            <div className="performance-metric">
              <span>Algorithms compared</span>
              <strong>6</strong>
            </div>
            <div className="performance-metric">
              <span>Fastest median</span>
              <strong>{fastestSix?.name ?? "—"}</strong>
            </div>
            <div className="performance-metric">
              <span>Routers in latest test</span>
              <strong>{results[results.length - 1].routers}</strong>
            </div>
            <div className="performance-metric">
              <span>Algorithms matching every sample</span>
              <strong>{correctnessCounts.optimal}/6</strong>
            </div>
          </div>

          <h4>Median execution time (ms)</h4>
          <BarRows rows={sixRows} valueKey="medianMs" format={value => `${value.toFixed(5)} ms`} />

          <h4>Average routers visited / processed</h4>
          <BarRows
            rows={sixRows}
            valueKey="averageVisited"
            format={value => value.toFixed(1)}
            colorClass="benchmark-astar"
          />

          <h4>Latest network results</h4>
          <div className="benchmark-table-wrap">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Median time (ms)</th>
                  <th>Avg. routers visited / processed</th>
                  <th>Avg. path cost</th>
                  <th>Valid samples</th>
                  <th>Matches Dijkstra</th>
                  <th>Correctness</th>
                </tr>
              </thead>
              <tbody>
                {sixRows.map(row => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.medianMs.toFixed(5)}</td>
                    <td>{row.averageVisited.toFixed(2)}</td>
                    <td>{Number.isFinite(row.averageDistance) ? row.averageDistance.toFixed(3) : "No route"}</td>
                    <td>{row.validSamples}/{results[results.length - 1].samplesPerAlgorithm}</td>
                    <td>{row.matchingSamples}/{row.validSamples} ({row.matchRate.toFixed(1)}%)</td>
                    <td>
                      {row.validSamples === 0
                        ? <span className="benchmark-correctness benchmark-correctness-failed">No route</span>
                        : row.matchingSamples === row.validSamples
                          ? <span className="benchmark-correctness benchmark-correctness-optimal">All samples match</span>
                          : <span className="benchmark-correctness benchmark-correctness-nonoptimal">Some differ</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="benchmark-footnote">
            Each valid result is compared with Dijkstra on the same generated
            graph and repetition, using a small floating-point tolerance.
            "Matches Dijkstra" reports the number and percentage of valid
            samples with the same path cost; it does not compare averages.
            BFS and DFS optimize hop count rather than weighted path cost, so
            their costs may differ. Floyd-Warshall computes all-pairs paths;
            its displayed path is the selected start-to-target route.
            Timing differences depend on the machine and runtime.
          </p>
        </>
      )}

      {results.length > 0 && mode === "pair" && (
        <>
          <div className="performance-grid benchmark-summary-grid">
            <div className="performance-metric">
              <span>Completed network sizes</span>
              <strong>{results.length}</strong>
            </div>
            <div className="performance-metric">
              <span>Shortest-path cost matches</span>
              <strong>{results.reduce((sum, row) => sum + row.matchingShortestPaths, 0)}/{results.reduce((sum, row) => sum + row.totalComparisons, 0)}</strong>
            </div>
            <div className="performance-metric">
              <span>Validation</span>
              <strong>{allValidated ? "Passed" : "Review"}</strong>
            </div>
          </div>

          <h4>Median execution time (ms)</h4>
          <MiniBarChart
            results={results}
            firstKey="dijkstraMedianMs"
            secondKey="aStarMedianMs"
            firstLabel="Dijkstra"
            secondLabel="A*"
            format={value => `${value.toFixed(4)} ms`}
          />
          <div className="benchmark-legend">
            <span><i className="benchmark-dijkstra" />Dijkstra</span>
            <span><i className="benchmark-astar" />A*</span>
          </div>

          <h4>Average routers visited</h4>
          <MiniBarChart
            results={results}
            firstKey="dijkstraAverageVisited"
            secondKey="aStarAverageVisited"
            firstLabel="Dijkstra"
            secondLabel="A*"
            format={value => value.toFixed(1)}
          />

          <h4>Experiment results</h4>
          <div className="benchmark-table-wrap">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Routers</th>
                  <th>Samples</th>
                  <th>Dijkstra median (ms)</th>
                  <th>A* median (ms)</th>
                  <th>Dijkstra visited</th>
                  <th>A* visited</th>
                  <th>Faster median</th>
                  <th>Cost matches</th>
                </tr>
              </thead>
              <tbody>
                {results.map(row => (
                  <tr key={row.routers}>
                    <td>{row.routers}</td>
                    <td>{row.samples}</td>
                    <td>{row.dijkstraMedianMs.toFixed(5)}</td>
                    <td>{row.aStarMedianMs.toFixed(5)}</td>
                    <td>{row.dijkstraAverageVisited.toFixed(2)}</td>
                    <td>{row.aStarAverageVisited.toFixed(2)}</td>
                    <td>{row.faster}</td>
                    <td>{row.matchingShortestPaths}/{row.totalComparisons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="benchmark-footnote">
            Faster median describes only the measured median on this run and
            machine. Small timing differences can be affected by runtime and
            system load.
          </p>
        </>
      )}

      {results.length > 0 && (
        <p className="benchmark-footnote">
          {completedAt ? `Last completed: ${completedAt}. ` : ""}
          Results are measured on this machine and should be interpreted as
          comparative experiments, not universal performance guarantees.
        </p>
      )}
    </section>
  );
}
