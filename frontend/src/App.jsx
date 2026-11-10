import { useMemo, useState, useRef, useEffect } from "react";
import Graph from "../../src/graph/Graph.js";
import Dijkstra from "../../src/algorithms/Dijkstra.js";
import Traversal from "../../src/algorithms/Traversal.js";
import AStar from "../../src/algorithms/AStar.js";
import "./App.css";

const initialRouters = [
  { id: "A", x: 100, y: 180 },
  { id: "B", x: 300, y: 80 },
  { id: "C", x: 300, y: 280 },
  { id: "D", x: 520, y: 80 },
  { id: "E", x: 520, y: 280 },
];

const initialConnections = [
  ["A", "B", 4],
  ["A", "C", 2],
  ["B", "C", 1],
  ["B", "D", 5],
  ["C", "D", 8],
  ["C", "E", 10],
  ["D", "E", 2],
];

const additionalPositions = [
  { x: 730, y: 150 },
  { x: 730, y: 300 },
  { x: 100, y: 450 },
  { x: 300, y: 450 },
  { x: 520, y: 450 },
  { x: 730, y: 450 },
];

const allRouterPositions = {
  A: initialRouters[0],
  B: initialRouters[1],
  C: initialRouters[2],
  D: initialRouters[3],
  E: initialRouters[4],
  F: additionalPositions[0],
  G: additionalPositions[1],
  H: additionalPositions[2],
  I: additionalPositions[3],
  J: additionalPositions[4],
  K: additionalPositions[5],
};

function App() {
  const network = useMemo(() => {
    const graph = new Graph();

    initialRouters.forEach(router => {
      graph.addRouter(router.id);
    });

    initialConnections.forEach(([a, b, weight]) => {
      graph.addConnection(a, b, weight);
    });

    return graph;
  }, []);

  const [routers, setRouters] = useState(initialRouters);
  const [connections, setConnections] = useState(initialConnections);
  const [, setVersion] = useState(0);

  const [start, setStart] = useState("A");
  const [target, setTarget] = useState("E");
  const [result, setResult] = useState(null);
  const [calculated, setCalculated] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("Dijkstra");
  const [comparisonResults, setComparisonResults] = useState(null);
  const [visualizationSteps, setVisualizationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepPlaying, setIsStepPlaying] = useState(false);

  // Dijkstra vs A* synchronized comparison state.
  const [raceResults, setRaceResults] = useState(null);
  const [raceStepIndex, setRaceStepIndex] = useState(0);
  const [isRacePlaying, setIsRacePlaying] = useState(false);

  const [packetPosition, setPacketPosition] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [packetStatus, setPacketStatus] = useState("Not started");
  const [trafficStats, setTrafficStats] = useState({ sent: 0, delivered: 0, dropped: 0 });
  const [lastPacketLatency, setLastPacketLatency] = useState(null);
  const [networkLoad, setNetworkLoad] = useState(0);

  const [networkStatus, setNetworkStatus] = useState(null);
  const [recoveryInfo, setRecoveryInfo] = useState(null);
  const [recoveryHistory, setRecoveryHistory] = useState([]);
  const [recoveryComparison, setRecoveryComparison] = useState(null);

  const [connectionFrom, setConnectionFrom] = useState("A");
  const [connectionTo, setConnectionTo] = useState("B");
  const [connectionWeight, setConnectionWeight] = useState("3");

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // Advance the algorithm walkthrough while Play is enabled.
  useEffect(() => {
    if (!isStepPlaying || visualizationSteps.length === 0) return undefined;

    const timer = setInterval(() => {
      setCurrentStepIndex(index => {
        if (index >= visualizationSteps.length - 1) {
          setIsStepPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [isStepPlaying, visualizationSteps.length]);

  // Both algorithms advance on the same clock so their exploration can be compared.
  useEffect(() => {
    if (!isRacePlaying || !raceResults) return undefined;
    const maxSteps = Math.max(
      raceResults.Dijkstra?.steps?.length || 0,
      raceResults["A*"]?.steps?.length || 0
    );
    if (maxSteps <= 1) {
      setIsRacePlaying(false);
      return undefined;
    }
    const timer = setInterval(() => {
      setRaceStepIndex(index => {
        if (index >= maxSteps - 1) {
          setIsRacePlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [isRacePlaying, raceResults]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  function refresh() {
    setVersion(v => v + 1);
  }

  function stopAnimation() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsAnimating(false);
  }

  function clearPacket() {
    stopAnimation();
    setPacketPosition(null);
    setPacketStatus("Not started");
  }

  function clearRoute() {
    clearPacket();
    setResult(null);
    setCalculated(false);
    setComparisonResults(null);
    setVisualizationSteps([]);
    setCurrentStepIndex(0);
    setIsStepPlaying(false);
    setRaceResults(null);
    setRaceStepIndex(0);
    setIsRacePlaying(false);
  }

  // Run one algorithm and return its route plus measured statistics.
  function runAlgorithm(algorithm, source, destination) {
    // A router can always reach itself when it is operational: this is a
    // valid zero-hop route with no connection weight.
    if (source && source === destination) {
      if (!network.isRouterActive(source)) return null;
      return {
        path: [source],
        distance: 0,
        hops: 0,
        visitedCount: 1,
        visitedNodes: [source],
        steps: [{
          step: 0,
          current: source,
          action: "Source and destination are the same router. The route has zero hops and total cost 0.",
          visitedNodes: [source],
          frontier: [],
          path: [source],
          distances: { [source]: 0 },
          gScores: { [source]: 0 },
          fScores: { [source]: 0 },
        }],
      };
    }

    let result;

    if (algorithm === "BFS") {
      result = Traversal.BFSWithStats(network, source, destination);
    } else if (algorithm === "DFS") {
      result = Traversal.DFSWithStats(network, source, destination);
    } else if (algorithm === "Dijkstra") {
      result = Dijkstra.findShortestPathWithStats(
        network, source, destination
      );
    } else if (algorithm === "A*") {
      result = AStar.findPathWithStats(
        network, source, destination, allRouterPositions
      );
    } else {
      return null;
    }

    if (!result || !result.path) return null;

    // BFS and DFS optimize hop count, not total edge weight.
    let distance = result.distance;
    if (algorithm === "BFS" || algorithm === "DFS") {
      distance = 0;
      for (let i = 0; i < result.path.length - 1; i++) {
        distance += network.getWeight(
          result.path[i], result.path[i + 1]
        );
      }
    }

    return {
      path: result.path,
      distance,
      hops: result.hops ?? result.path.length - 1,
      visitedCount: result.visitedCount,
      visitedNodes: result.visitedNodes,
      steps: result.steps || [],
    };
  }

  // Average 30 runs to reduce timing noise on small networks.
  function calculateAlgorithm(
    algorithm,
    source = start,
    destination = target
  ) {
    const firstResult = runAlgorithm(algorithm, source, destination);
    if (!firstResult) return null;

    const benchmarkRuns = 30;
    const benchmarkStart = performance.now();

    for (let i = 0; i < benchmarkRuns; i++) {
      runAlgorithm(algorithm, source, destination);
    }

    const executionTime =
      (performance.now() - benchmarkStart) / benchmarkRuns;

    return { ...firstResult, executionTime };
  }

  function calculateAllAlgorithms() {
    return {
      BFS: calculateAlgorithm("BFS"),
      DFS: calculateAlgorithm("DFS"),
      Dijkstra: calculateAlgorithm("Dijkstra"),
      "A*": calculateAlgorithm("A*"),
    };
  }

  function findRoute() {
    clearPacket();

    const route = calculateAlgorithm(selectedAlgorithm);

    setResult(route);
    // All four algorithms now provide step records for the shared visualizer.
    setVisualizationSteps(route?.steps || []);
    setCurrentStepIndex(0);
    setIsStepPlaying(false);
    setCalculated(true);
    setComparisonResults(calculateAllAlgorithms());

    setNetworkStatus(
      route
        ? {
            type: "success",
            message: `${selectedAlgorithm} route calculated successfully.`,
          }
        : {
            type: "error",
            message: "No available route between these routers.",
          }
    );
  }

  // Run Dijkstra and A* against the exact same live network and endpoints.
  function runAlgorithmRace() {
    setIsRacePlaying(false);
    const dijkstraResult = calculateAlgorithm("Dijkstra", start, target);
    const aStarResult = calculateAlgorithm("A*", start, target);
    setRaceResults({ Dijkstra: dijkstraResult, "A*": aStarResult });
    setRaceStepIndex(0);
    setIsStepPlaying(false);
    setNetworkStatus(
      dijkstraResult || aStarResult
        ? { type: "success", message: `Algorithm race ready: ${start} → ${target}.` }
        : { type: "error", message: "Neither Dijkstra nor A* found an available route." }
    );
  }

  function addRouter() {
    if (routers.length >= 11) {
      setNetworkStatus({
        type: "error",
        message: "Maximum of 11 routers supported in this layout.",
      });
      return;
    }

    const availableId = "ABCDEFGHIJK".split("").find(
      id => !routers.some(router => router.id === id)
    );

    if (!availableId) return;

    const position = allRouterPositions[availableId];

    clearRoute();
    network.addRouter(availableId);

    setRouters(previous => [
      ...previous,
      {
        id: availableId,
        x: position.x,
        y: position.y,
      },
    ]);

    setNetworkStatus({
      type: "success",
      message: `Router ${availableId} added successfully. Add a connection to include it in a route.`,
    });

    refresh();
  }

  function deleteRouter(routerId) {
    const removed = network.removeRouter(routerId);

    if (!removed) return;

    setRouters(previous =>
      previous.filter(router => router.id !== routerId)
    );

    setConnections(previous =>
      previous.filter(
        ([a, b]) => a !== routerId && b !== routerId
      )
    );

    const remainingRouters = routers.filter(
      router => router.id !== routerId
    );

    if (start === routerId) {
      setStart(remainingRouters[0]?.id || "");
    }

    if (target === routerId) {
      setTarget(remainingRouters[0]?.id || "");
    }

    if (connectionFrom === routerId) {
      setConnectionFrom(remainingRouters[0]?.id || "");
    }

    if (connectionTo === routerId) {
      setConnectionTo(remainingRouters[1]?.id || "");
    }

    clearRoute();
    setRecoveryInfo(null);

    setNetworkStatus({
      type: "success",
      message: `Router ${routerId} deleted successfully.`,
    });

    refresh();
  }

  function addConnection() {
    const weight = Number(connectionWeight);

    if (!connectionFrom || !connectionTo) {
      setNetworkStatus({
        type: "error",
        message: "Select both routers.",
      });
      return;
    }

    if (connectionFrom === connectionTo) {
      setNetworkStatus({
        type: "error",
        message: "A router cannot connect to itself.",
      });
      return;
    }

    if (!Number.isFinite(weight) || weight < 0) {
      setNetworkStatus({
        type: "error",
        message: "Enter a valid non-negative connection weight.",
      });
      return;
    }

    const added = network.addConnection(
      connectionFrom,
      connectionTo,
      weight
    );

    if (!added) {
      setNetworkStatus({
        type: "error",
        message: "Connection already exists or could not be created.",
      });
      return;
    }

    setConnections(previous => [
      ...previous,
      [connectionFrom, connectionTo, weight],
    ]);

    clearPacket();

    if (calculated) {
      const newRoute = calculateAlgorithm(selectedAlgorithm);
      setResult(newRoute);
      setComparisonResults(calculateAllAlgorithms());
    }

    setNetworkStatus({
      type: "success",
      message: `Connection ${connectionFrom} - ${connectionTo} added successfully.`,
    });

    refresh();
  }

  function deleteConnection(router1, router2) {
    const removed = network.removeConnection(router1, router2);

    if (!removed) return;

    setConnections(previous =>
      previous.filter(
        ([a, b]) =>
          !(
            (a === router1 && b === router2) ||
            (a === router2 && b === router1)
          )
      )
    );

    clearRoute();

    setNetworkStatus({
      type: "success",
      message: `Connection ${router1} - ${router2} deleted successfully.`,
    });

    refresh();
  }

  function toggleConnection(router1, router2) {
    const id = network.getConnectionId(router1, router2);

    const isActive = network.activeConnections.has(id);

    if (isActive) {
      network.disableConnection(router1, router2);
    } else {
      network.enableConnection(router1, router2);
    }

    clearPacket();

    if (calculated) {
      const newRoute = calculateAlgorithm(selectedAlgorithm);
      setResult(newRoute);
      setComparisonResults(calculateAllAlgorithms());
    }

    setNetworkStatus({
      type: "success",
      message: isActive
        ? `Connection ${router1} - ${router2} disabled.`
        : `Connection ${router1} - ${router2} restored.`,
    });

    refresh();
  }


  // Reachability score: percentage of non-failed routers reachable from the source.
  function calculateResilienceScore(source) {
    const failed = new Set(network.getFailedRouters());
    const availableRouters = routers
      .map(router => router.id)
      .filter(id => !failed.has(id));

    if (!source || failed.has(source)) return 0;

    const visited = new Set([source]);
    const queue = [source];

    while (queue.length > 0) {
      const current = queue.shift();
      network.getNeighbors(current).forEach(neighbor => {
        if (!failed.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    return availableRouters.length === 0
      ? 0
      : Math.round((visited.size / availableRouters.length) * 100);
  }

  // Analyze the live network using only active, non-failed routers.
  // A critical router is one whose removal increases the number of
  // connected components in the current network.
  function calculateNetworkResilience() {
    const failedRouters = new Set(network.getFailedRouters());
    const activeRouters = routers
      .map(router => router.id)
      .filter(id => !failedRouters.has(id));

    function getComponents(excludedRouter = null) {
      const remaining = activeRouters.filter(id => id !== excludedRouter);
      const visited = new Set();
      const components = [];

      for (const routerId of remaining) {
        if (visited.has(routerId)) continue;

        const component = [];
        const queue = [routerId];
        visited.add(routerId);

        while (queue.length > 0) {
          const current = queue.shift();
          component.push(current);

          network.getNeighbors(current).forEach(neighbor => {
            if (
              neighbor !== excludedRouter &&
              !failedRouters.has(neighbor) &&
              !visited.has(neighbor)
            ) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }

        components.push(component);
      }

      return components;
    }

    const components = getComponents();
    const largestComponent = components.reduce(
      (largest, component) => Math.max(largest, component.length),
      0
    );
    const resilienceScore = activeRouters.length === 0
      ? 0
      : Math.round((largestComponent / activeRouters.length) * 100);

    const criticalRouters = activeRouters.filter(routerId =>
      getComponents(routerId).length > components.length
    );

    return {
      activeRouterCount: activeRouters.length,
      componentCount: components.length,
      connected: activeRouters.length > 0 && components.length === 1,
      resilienceScore,
      criticalRouters,
      components,
    };
  }

  function getActiveConnectionSnapshots() {
    return connections
      .filter(([a, b]) =>
        network.activeConnections.has(network.getConnectionId(a, b)) &&
        network.isRouterActive(a) &&
        network.isRouterActive(b)
      )
      .map(([a, b, weight]) => ({ a, b, weight }));
  }

  function failRouter(routerId) {
    if (network.isRouterFailed(routerId)) return;

    const beforeConnections = getActiveConnectionSnapshots();
    const originalRoute = calculateAlgorithm(selectedAlgorithm);
    const affectedConnections = beforeConnections.filter(
      edge => edge.a === routerId || edge.b === routerId
    ).length;
    const failed = network.failRouter(routerId);

    if (!failed) {
      setNetworkStatus({
        type: "error",
        message: `Could not fail router ${routerId}.`,
      });
      return;
    }

    clearPacket();
    const recoveryStartedAt = performance.now();
    const recoveredRoute = calculateAlgorithm(selectedAlgorithm);
    const recoveryTimeMs = performance.now() - recoveryStartedAt;
    const afterConnections = getActiveConnectionSnapshots();
    setRecoveryComparison({
      routerId,
      beforeConnections,
      afterConnections,
      originalPath: originalRoute?.path || null,
      updatedPath: recoveredRoute?.path || null,
      affectedConnections,
      recoveryTimeMs,
      eventType: "failure",
    });
    const comparisons = calculateAllAlgorithms();
    const score = calculateResilienceScore(start);
    const routeNeededRecovery = Boolean(
      originalRoute?.path?.includes(routerId)
    );

    setResult(recoveredRoute);
    setCalculated(true);
    setComparisonResults(comparisons);
    setRecoveryHistory(previous => [
      {
        id: `${Date.now()}-${routerId}-failed`,
        type: "failure",
        routerId,
        timestamp: new Date().toLocaleString(),
        originalPath: originalRoute?.path || null,
        updatedPath: recoveredRoute?.path || null,
        message: recoveredRoute
          ? "Network recalculated after router failure."
          : "No alternative route was available after this failure.",
      },
      ...previous,
    ]);

    setRecoveryInfo({
      failedRouter: routerId,
      originalPath: originalRoute?.path || null,
      recoveredPath: recoveredRoute?.path || null,
      recovered: routeNeededRecovery && Boolean(recoveredRoute),
      resilienceScore: score,
    });

    setNetworkStatus({
      type: recoveredRoute
        ? "success"
        : "error",
      message: recoveredRoute
        ? routeNeededRecovery
          ? `Router ${routerId} failed. A new route was calculated automatically.`
          : `Router ${routerId} failed. The selected route remains available.`
        : `Router ${routerId} failed. No alternative route is available.`,
    });

    refresh();
  }

  function restoreRouter(routerId) {
    const beforeConnections = getActiveConnectionSnapshots();
    const restored = network.restoreRouter(routerId);
    if (!restored) return;

    clearPacket();
    setRecoveryInfo(null);

    const recoveryStartedAt = performance.now();
    const restoredRoute = calculated
      ? calculateAlgorithm(selectedAlgorithm)
      : null;
    const recoveryTimeMs = performance.now() - recoveryStartedAt;
    const afterConnections = getActiveConnectionSnapshots();
    setRecoveryComparison({
      routerId,
      beforeConnections,
      afterConnections,
      originalPath: result?.path || null,
      updatedPath: restoredRoute?.path || null,
      affectedConnections: afterConnections.filter(
        edge => edge.a === routerId || edge.b === routerId
      ).length,
      recoveryTimeMs,
      eventType: "restoration",
    });
    setRecoveryHistory(previous => [
      {
        id: `${Date.now()}-${routerId}-restored`,
        type: "restoration",
        routerId,
        timestamp: new Date().toLocaleString(),
        originalPath: result?.path || null,
        updatedPath: restoredRoute?.path || null,
        message: "Router restored to the active network.",
      },
      ...previous,
    ]);

    if (calculated) {
      setResult(restoredRoute);
      setComparisonResults(calculateAllAlgorithms());
    }

    setNetworkStatus({
      type: "success",
      message: `Router ${routerId} restored successfully.`,
    });

    refresh();
  }

  function resetNetwork() {
    connections.forEach(([a, b]) => {
      network.enableConnection(a, b);
    });
    network.getFailedRouters().forEach(routerId => {
      network.restoreRouter(routerId);
    });

    setRecoveryInfo(null);
    clearRoute();

    setStart("A");
    setTarget("E");

    setNetworkStatus({
      type: "success",
      message: "All existing connections have been restored.",
    });

    refresh();
  }

  function sendPacket() {
    if (!result || !result.path || result.path.length === 0) {
      // Record a transmission attempt even when no route exists.
      setTrafficStats(stats => ({
        ...stats,
        sent: stats.sent + 1,
        dropped: stats.dropped + 1,
      }));
      setLastPacketLatency(null);
      setPacketPosition(null);
      setPacketStatus("Packet dropped: No route available.");
      setNetworkStatus({
        type: "error",
        message: `Packet dropped: no available route from ${start} to ${target}.`,
      });
      return;
    }

    // Recheck every hop immediately before transmission. A router or link
    // may have failed after the route was originally calculated.
    const path = result.path;
    const routeIsAvailable = path.every(routerId => network.isRouterActive(routerId)) &&
      path.slice(0, -1).every((routerId, index) =>
        network.activeConnections.has(
          network.getConnectionId(routerId, path[index + 1])
        )
      );

    if (!routeIsAvailable) {
      setTrafficStats(stats => ({ ...stats, sent: stats.sent + 1, dropped: stats.dropped + 1 }));
      setPacketStatus("Packet dropped: route is unavailable.");
      setNetworkStatus({
        type: "error",
        message: "Packet dropped because the selected route contains a failed router or connection. Recalculate the route.",
      });
      return;
    }

    stopAnimation();
    setLastPacketLatency(null);

    if (path.length === 1) {
      const router = routers.find(r => r.id === path[0]);
      setPacketPosition({ x: router?.x || 0, y: router?.y || 0 });
      setPacketStatus("Packet delivered successfully.");
      setLastPacketLatency(0);
      setTrafficStats(stats => ({ ...stats, sent: stats.sent + 1, delivered: stats.delivered + 1 }));
      return;
    }

    setTrafficStats(stats => ({ ...stats, sent: stats.sent + 1 }));

    const routeCoordinates = path.map(routerId => {
      const router = routers.find(r => r.id === routerId);
      return { x: router.x, y: router.y };
    });

    const segmentLengths = [];
    let totalLength = 0;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const dx = routeCoordinates[i + 1].x - routeCoordinates[i].x;
      const dy = routeCoordinates[i + 1].y - routeCoordinates[i].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(length);
      totalLength += length;
    }

    // Higher network load adds simulated queueing delay to the packet.
    const congestionMultiplier = 1 + (Number(networkLoad) / 100) * 2;
    // requestAnimationFrame timestamps are already measured in milliseconds.
    // Do not multiply this duration by 1000, or the packet will move extremely slowly.
    const duration = Math.max(250, (totalLength / (speed * 0.35)) * congestionMultiplier);
    startTimeRef.current = null;
    setPacketPosition(routeCoordinates[0]);
    setIsAnimating(true);
    setPacketStatus(networkLoad >= 70 ? "Packet in transit — high congestion" : "Packet in transit");

    function animate(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      let distanceTravelled = progress * totalLength;
      let segmentIndex = 0;

      while (
        segmentIndex < segmentLengths.length - 1 &&
        distanceTravelled > segmentLengths[segmentIndex]
      ) {
        distanceTravelled -= segmentLengths[segmentIndex];
        segmentIndex++;
      }

      const segmentProgress = segmentLengths[segmentIndex] === 0
        ? 0
        : distanceTravelled / segmentLengths[segmentIndex];
      const current = routeCoordinates[segmentIndex];
      const next = routeCoordinates[segmentIndex + 1];
      const x = current.x + (next.x - current.x) * segmentProgress;
      const y = current.y + (next.y - current.y) * segmentProgress;
      setPacketPosition({ x, y });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        setIsAnimating(false);
        setPacketStatus("Packet delivered successfully.");
        setLastPacketLatency(Number(elapsed.toFixed(2)));
        setTrafficStats(stats => ({ ...stats, delivered: stats.delivered + 1 }));
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }

  const activeConnections = connections.filter(([a, b]) =>
    network.activeConnections.has(network.getConnectionId(a, b))
  );

  const failedConnections = connections.filter(([a, b]) =>
    !network.activeConnections.has(network.getConnectionId(a, b))
  );

  const routeSet = new Set(result?.path || []);
  const activeVisualizationStep = visualizationSteps[currentStepIndex] || null;
  const stepVisitedSet = new Set(activeVisualizationStep?.visitedNodes || []);
  const stepFrontierSet = new Set(activeVisualizationStep?.frontier || []);

  function isRouteConnection(a, b) {
    if (!result?.path) return false;

    for (let i = 0; i < result.path.length - 1; i++) {
      if (
        (result.path[i] === a && result.path[i + 1] === b) ||
        (result.path[i] === b && result.path[i + 1] === a)
      ) {
        return true;
      }
    }

    return false;
  }

  function handleAlgorithmChange(value) {
    setSelectedAlgorithm(value);
    clearRoute();
  }

  function renderComparisonCard(algorithm, algorithmResult) {
    return (
      <div className="connection-item performance-card" key={algorithm}>
        <div>
          <strong>{algorithm}</strong>
          {algorithmResult ? (
            <>
              <p>Route: {algorithmResult.path.join(" → ")}</p>
              <p>Execution time: {algorithmResult.executionTime.toFixed(5)} ms</p>
              <p>Visited routers: {algorithmResult.visitedCount}</p>
              <p>Hops: {algorithmResult.hops}</p>
              <p>Total weight: {algorithmResult.distance}</p>
            </>
          ) : (
            <p>No route available</p>
          )}
        </div>
      </div>
    );
  }

  function renderPerformanceDashboard() {
    if (!comparisonResults) return null;

    const entries = Object.entries(comparisonResults).filter(
      ([, value]) => value
    );
    if (entries.length === 0) return null;

    const maxTime = Math.max(
      ...entries.map(([, value]) => value.executionTime),
      0.000001
    );
    const maxVisited = Math.max(
      ...entries.map(([, value]) => value.visitedCount),
      1
    );

    return (
      <div className="performance-dashboard">
        <div className="panel-heading">
          <div>
            <h3>Performance Dashboard</h3>
            <p>Average execution time over 30 runs; visited routers from one run.</p>
          </div>
        </div>

        <div className="performance-grid">
          <div className="performance-metric">
            <span>Fastest algorithm</span>
            <strong>
              {[...entries].sort((a, b) =>
                a[1].executionTime - b[1].executionTime
              )[0][0]}
            </strong>
          </div>
          <div className="performance-metric">
            <span>Lowest router visits</span>
            <strong>
              {[...entries].sort((a, b) =>
                a[1].visitedCount - b[1].visitedCount
              )[0][0]}
            </strong>
          </div>
          <div className="performance-metric">
            <span>Algorithms compared</span>
            <strong>{entries.length}</strong>
          </div>
        </div>

        <h4>Execution time comparison</h4>
        {entries.map(([algorithm, value]) => (
          <div className="performance-bar-row" key={`${algorithm}-time`}>
            <span>{algorithm}</span>
            <div className="performance-bar-track">
              <div
                className="performance-bar execution-bar"
                style={{ width: `${Math.max(
                  (value.executionTime / maxTime) * 100, 1
                )}%` }}
              />
            </div>
            <strong>{value.executionTime.toFixed(5)} ms</strong>
          </div>
        ))}

        <h4>Visited routers comparison</h4>
        {entries.map(([algorithm, value]) => (
          <div className="performance-bar-row" key={`${algorithm}-visited`}>
            <span>{algorithm}</span>
            <div className="performance-bar-track">
              <div
                className="performance-bar visited-bar"
                style={{ width: `${Math.max(
                  (value.visitedCount / maxVisited) * 100, 1
                )}%` }}
              />
            </div>
            <strong>{value.visitedCount}</strong>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>RouteCore</h1>
          <p>Understanding the intelligence behind network routing.</p>
        </div>

        <button
          className="secondary-button"
          onClick={resetNetwork}
        >
          Reset Network
        </button>
      </header>

      {networkStatus && (
        <div
          className={`status-message ${
            networkStatus.type === "error" ? "error" : "success"
          }`}
        >
          {networkStatus.message}
        </div>
      )}

      <section className="stats-container">
        <div className="stat-card">
          <span>Total Routers</span>
          <h2>{routers.length}</h2>
        </div>

        <div className="stat-card">
          <span>Active Connections</span>
          <h2>{activeConnections.length}</h2>
        </div>

        <div className="stat-card">
          <span>Failed Connections</span>
          <h2>{failedConnections.length}</h2>
        </div>

        <div className="stat-card">
          <span>Failed Routers</span>
          <h2>{network.getFailedRouters().length}</h2>
        </div>
      </section>

      <main className="dashboard">
        <section className="network-panel">
          <div className="panel-heading">
            <div>
              <h2>Network Topology</h2>
              <p>Visual representation of connected routers</p>
            </div>
          </div>

          <div className="network-visualization">
            <svg
              viewBox="0 0 850 540"
              className="network-svg"
              role="img"
              aria-label="Network topology diagram"
            >
              {connections.map(([a, b, weight]) => {
                const routerA = routers.find(r => r.id === a);
                const routerB = routers.find(r => r.id === b);

                if (!routerA || !routerB) return null;

                const active = network.activeConnections.has(
                  network.getConnectionId(a, b)
                );

                const onRoute = isRouteConnection(a, b);

                return (
                  <g key={`${a}-${b}`}>
                    <line
                      x1={routerA.x}
                      y1={routerA.y}
                      x2={routerB.x}
                      y2={routerB.y}
                      className={`connection-line ${
                        active ? "active" : "failed"
                      } ${onRoute ? "route-highlight" : ""}`}
                      style={{
                        opacity: activeVisualizationStep &&
                          (stepVisitedSet.has(a) || stepVisitedSet.has(b) ||
                           stepFrontierSet.has(a) || stepFrontierSet.has(b))
                          ? 1 : undefined,
                        stroke: activeVisualizationStep &&
                          (stepVisitedSet.has(a) && stepVisitedSet.has(b))
                          ? "#22c55e" : undefined,
                        strokeWidth: activeVisualizationStep &&
                          (stepVisitedSet.has(a) && stepVisitedSet.has(b))
                          ? 4 : undefined,
                      }}
                    />

                    <text
                      x={(routerA.x + routerB.x) / 2}
                      y={(routerA.y + routerB.y) / 2 - 10}
                      className="connection-weight"
                    >
                      {weight}
                    </text>
                  </g>
                );
              })}

              {routers.map(router => (
                <g key={router.id}>
                  <circle
                    cx={router.x}
                    cy={router.y}
                    r="25"
                    className={`router-circle ${
                      routeSet.has(router.id) ? "router-on-route" : ""
                    } ${
                      network.isRouterFailed(router.id) ? "router-failed" : ""
                    }`}
                    style={{
                      stroke: activeVisualizationStep?.current === router.id
                        ? "#f59e0b"
                        : stepVisitedSet.has(router.id)
                          ? "#22c55e"
                          : stepFrontierSet.has(router.id)
                            ? "#38bdf8"
                            : undefined,
                      strokeWidth: activeVisualizationStep &&
                        (activeVisualizationStep.current === router.id ||
                         stepVisitedSet.has(router.id) ||
                         stepFrontierSet.has(router.id)) ? 5 : undefined,
                      filter: activeVisualizationStep?.current === router.id
                        ? "drop-shadow(0 0 7px rgba(245, 158, 11, 0.8))"
                        : undefined,
                    }}
                  />

                  <text
                    x={router.x}
                    y={router.y + 5}
                    className="router-label"
                  >
                    {router.id}
                  </text>
                </g>
              ))}

              {packetPosition && (
                <circle
                  cx={packetPosition.x}
                  cy={packetPosition.y}
                  r="9"
                  className="packet"
                />
              )}
            </svg>
          </div>

          <div className="network-legend">
            <span>
              <i className="legend-dot active-dot" /> Active connection
            </span>
            <span>
              <i className="legend-dot failed-dot" /> Disabled connection
            </span>
            <span>
              <i className="legend-dot route-dot" /> Selected route
            </span>
          </div>
        </section>

        <section className="routing-panel">
          <div className="panel-heading">
            <div>
              <h2>Route Calculation</h2>
              <p>Find a path between two routers</p>
            </div>
          </div>

          <div className="routing-controls">
            <div className="form-group">
              <label htmlFor="algorithm">Routing Algorithm</label>
              <select
                id="algorithm"
                value={selectedAlgorithm}
                onChange={event =>
                  handleAlgorithmChange(event.target.value)
                }
              >
                <option value="Dijkstra">Dijkstra</option>
                <option value="A*">A* Search</option>
                <option value="BFS">Breadth-First Search (BFS)</option>
                <option value="DFS">Depth-First Search (DFS)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="source">Source Router</label>
              <select
                id="source"
                value={start}
                onChange={event => {
                  setStart(event.target.value);
                  clearRoute();
                }}
              >
                {routers.map(router => (
                  <option key={router.id} value={router.id}>
                    Router {router.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="destination">Destination Router</label>
              <select
                id="destination"
                value={target}
                onChange={event => {
                  setTarget(event.target.value);
                  clearRoute();
                }}
              >
                {routers.map(router => (
                  <option key={router.id} value={router.id}>
                    Router {router.id}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="primary-button"
              onClick={findRoute}
              disabled={!start || !target}
            >
              Find Route
            </button>
            <button
              className="secondary-button"
              onClick={runAlgorithmRace}
              disabled={!start || !target}
              style={{ marginTop: "8px" }}
            >
              Run Dijkstra vs A* Race
            </button>
          </div>

          {raceResults && (
            <div className="management-card" style={{ marginTop: "18px" }}>
              <div className="panel-heading">
                <div>
                  <h3>Algorithm Race: Dijkstra vs A*</h3>
                  <p>Both algorithms solve {start} → {target} on the same network. Step through their search in sync.</p>
                </div>
                <strong>Step {raceStepIndex + 1} / {Math.max(raceResults.Dijkstra?.steps?.length || 0, raceResults["A*"]?.steps?.length || 0, 1)}</strong>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "14px 0" }}>
                <button className="primary-button" onClick={() => {
                  const maxSteps = Math.max(raceResults.Dijkstra?.steps?.length || 0, raceResults["A*"]?.steps?.length || 0);
                  if (raceStepIndex >= maxSteps - 1) setRaceStepIndex(0);
                  setIsRacePlaying(true);
                }} disabled={isRacePlaying || Math.max(raceResults.Dijkstra?.steps?.length || 0, raceResults["A*"]?.steps?.length || 0) <= 1}>Play Race</button>
                <button className="secondary-button" onClick={() => setIsRacePlaying(false)} disabled={!isRacePlaying}>Pause</button>
                <button className="secondary-button" onClick={() => { setIsRacePlaying(false); setRaceStepIndex(i => Math.min(i + 1, Math.max(raceResults.Dijkstra?.steps?.length || 0, raceResults["A*"]?.steps?.length || 0) - 1)); }}>Next</button>
                <button className="secondary-button" onClick={() => { setIsRacePlaying(false); setRaceStepIndex(i => Math.max(0, i - 1)); }} disabled={raceStepIndex === 0}>Previous</button>
                <button className="secondary-button" onClick={() => { setIsRacePlaying(false); setRaceStepIndex(0); }}>Reset</button>
              </div>

              <div className="management-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {["Dijkstra", "A*"].map(algorithm => {
                  const data = raceResults[algorithm];
                  const steps = data?.steps || [];
                  const step = steps[Math.min(raceStepIndex, Math.max(steps.length - 1, 0))];
                  return (
                    <div className="management-card" key={`race-${algorithm}`}>
                      <h3>{algorithm}</h3>
                      {data ? (
                        <>
                          <p><strong>Current router:</strong> {step?.current || "Finished / none"}</p>
                          <p><strong>Action:</strong> {step?.action || "No step data available."}</p>
                          <p><strong>Visited routers:</strong> {step?.visitedNodes?.join(", ") || "None"}</p>
                          <p><strong>Frontier:</strong> {step?.frontier?.join(", ") || "Empty"}</p>
                          <p><strong>Final route:</strong> {data.path.join(" → ")}</p>
                          <div className="performance-grid">
                            <div className="performance-metric"><span>Visited count</span><strong>{data.visitedCount ?? data.visitedNodes?.length ?? "—"}</strong></div>
                            <div className="performance-metric"><span>Route cost</span><strong>{data.distance}</strong></div>
                            <div className="performance-metric"><span>Avg. runtime (30 runs)</span><strong>{data.executionTime.toFixed(5)} ms</strong></div>
                          </div>
                          <p style={{ marginTop: "10px" }}><strong>Progress:</strong> {steps.length ? `${Math.min(raceStepIndex + 1, steps.length)} / ${steps.length} steps` : "No recorded steps"}</p>
                        </>
                      ) : <p>No route available.</p>}
                    </div>
                  );
                })}
              </div>
              <p style={{ marginTop: "12px", fontSize: "0.88rem", opacity: 0.8 }}>
                Note: runtime is the average of 30 runs and can vary between runs. Fewer visited routers does not necessarily mean lower execution time on every network.
              </p>
            </div>
          )}

          {visualizationSteps.length > 0 && (
            <div className="management-card" style={{ marginTop: "18px" }}>
              <div className="panel-heading">
                <div>
                  <h3>{selectedAlgorithm} Step-by-Step Visualization</h3>
                  <p>Follow how the algorithm explores routers and builds a route.</p>
                </div>
                <strong>
                  Step {currentStepIndex + 1} / {visualizationSteps.length}
                </strong>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "14px 0" }}>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (currentStepIndex >= visualizationSteps.length - 1) {
                      setCurrentStepIndex(0);
                    }
                    setIsStepPlaying(true);
                  }}
                >
                  {isStepPlaying ? "Playing..." : "Play"}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setIsStepPlaying(false)}
                  disabled={!isStepPlaying}
                >
                  Pause
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setIsStepPlaying(false);
                    setCurrentStepIndex(index =>
                      Math.min(index + 1, visualizationSteps.length - 1)
                    );
                  }}
                  disabled={currentStepIndex >= visualizationSteps.length - 1}
                >
                  Next Step
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setIsStepPlaying(false);
                    setCurrentStepIndex(index => Math.max(index - 1, 0));
                  }}
                  disabled={currentStepIndex === 0}
                >
                  Previous Step
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setIsStepPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                >
                  Reset
                </button>
              </div>

              {activeVisualizationStep && (
                <div className="route-result" style={{ marginBottom: "14px" }}>
                  <p><strong>Current router:</strong> {activeVisualizationStep.current || "—"}</p>
                  <p><strong>Action:</strong> {activeVisualizationStep.action}</p>
                  <p><strong>Visited:</strong> {activeVisualizationStep.visitedNodes?.join(", ") || "None"}</p>
                  <p><strong>Frontier / pending:</strong> {activeVisualizationStep.frontier?.join(", ") || "Empty"}</p>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "14px", fontSize: "0.9rem" }}>
                <span><strong style={{ color: "#f59e0b" }}>●</strong> Current router</span>
                <span><strong style={{ color: "#22c55e" }}>●</strong> Visited</span>
                <span><strong style={{ color: "#38bdf8" }}>●</strong> Frontier</span>
              </div>

              <div className="connection-list" style={{ maxHeight: "220px", overflowY: "auto" }}>
                {visualizationSteps.map((step, index) => (
                  <button
                    type="button"
                    key={`${step.step ?? index}-${index}`}
                    onClick={() => {
                      setIsStepPlaying(false);
                      setCurrentStepIndex(index);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      marginBottom: "6px",
                      border: index === currentStepIndex
                        ? "1px solid #38bdf8"
                        : "1px solid rgba(120, 150, 190, 0.18)",
                      borderRadius: "8px",
                      background: index === currentStepIndex
                        ? "rgba(56, 189, 248, 0.12)"
                        : "transparent",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <strong>Step {index + 1}:</strong> {step.action}
                    {step.current ? ` (Router ${step.current})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="route-result">
              <h3>{selectedAlgorithm} Result</h3>

              <p>
                <strong>Route:</strong>{" "}
                {result.path.join(" → ")}
              </p>

              <p>
                <strong>Hops:</strong> {result.hops}
              </p>

              <p>
                <strong>Total weight:</strong> {result.distance}
              </p>

            </div>
          )}

          {recoveryInfo && (
            <div className="route-result recovery-panel">
              <h3>Network Failure Recovery</h3>
              <p><strong>Failed router:</strong> {recoveryInfo.failedRouter}</p>
              <p>
                <strong>Original route:</strong>{" "}
                {recoveryInfo.originalPath?.join(" → ") || "Not calculated"}
              </p>
              <p>
                <strong>Current route:</strong>{" "}
                {recoveryInfo.recoveredPath?.join(" → ") || "No alternative route"}
              </p>
              <p>
                <strong>Recovery status:</strong>{" "}
                {recoveryInfo.recovered
                  ? "Alternative route found"
                  : recoveryInfo.recoveredPath
                    ? "Existing route unaffected"
                    : "Network is disconnected"}
              </p>
              <p>
                <strong>Network resilience:</strong>{" "}
                {recoveryInfo.resilienceScore}%
              </p>
              <p className="recovery-note">
                Resilience is measured as the percentage of non-failed routers
                reachable from the selected source router.
              </p>
            </div>
          )}

          <div className="packet-controls">
            <h3>Packet Simulation</h3>

            <div className="form-group">
              <label htmlFor="speed">Packet Speed</label>
              <select
                id="speed"
                value={speed}
                onChange={event =>
                  setSpeed(Number(event.target.value))
                }
              >
                <option value="0.5">Slow</option>
                <option value="1">Normal</option>
                <option value="2">Fast</option>
                <option value="3">Very Fast</option>
              </select>
            </div>

            <button
              className="send-button"
              onClick={sendPacket}
              disabled={isAnimating}
            >
              {isAnimating ? "Sending Packet..." : "Send Packet"}
            </button>

            <p>
              <strong>Status:</strong> {packetStatus}
            </p>
          </div>

          <div className="management-card" style={{ marginTop: "18px" }}>
            <div className="panel-heading">
              <div>
                <h3>Network Traffic Monitor</h3>
                <p>Simulated packet delivery, latency, and congestion</p>
              </div>
            </div>
            <div className="performance-grid">
              <div className="performance-metric">
                <span>Packets sent</span>
                <strong>{trafficStats.sent}</strong>
              </div>
              <div className="performance-metric">
                <span>Packets delivered</span>
                <strong>{trafficStats.delivered}</strong>
              </div>
              <div className="performance-metric">
                <span>Packets dropped</span>
                <strong>{trafficStats.dropped}</strong>
              </div>
              <div className="performance-metric">
                <span>Last packet latency</span>
                <strong>{lastPacketLatency === null ? "—" : `${lastPacketLatency.toFixed(2)} ms`}</strong>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: "18px" }}>
              <label htmlFor="network-load">Simulated network congestion: {networkLoad}%</label>
              <input
                id="network-load"
                type="range"
                min="0"
                max="100"
                step="10"
                value={networkLoad}
                onChange={event => setNetworkLoad(Number(event.target.value))}
              />
              <p style={{ marginTop: "8px" }}>
                {networkLoad >= 70
                  ? "High congestion — packet queueing delay is increased."
                  : networkLoad >= 30
                    ? "Moderate congestion — packet transmission is slower."
                    : "Low congestion — packets travel with minimal simulated queueing delay."}
              </p>
            </div>
            <div className="connection-item">
              <span>Delivery rate</span>
              <strong>{trafficStats.sent === 0 ? "0.0%" : `${((trafficStats.delivered / trafficStats.sent) * 100).toFixed(1)}%`}</strong>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                setTrafficStats({ sent: 0, delivered: 0, dropped: 0 });
                setLastPacketLatency(null);
                setPacketStatus("Not started");
              }}
              disabled={isAnimating}
            >
              Reset Traffic Metrics
            </button>
          </div>

          {comparisonResults && (
            <div className="connections-panel">
              <div className="panel-heading">
                <div>
                  <h3>Algorithm Comparison</h3>
                  <p>Compare routes calculated by all four algorithms</p>
                </div>
              </div>

              <div className="connection-list">
                {renderComparisonCard(
                  "BFS",
                  comparisonResults.BFS
                )}

                {renderComparisonCard(
                  "DFS",
                  comparisonResults.DFS
                )}

                {renderComparisonCard(
                  "Dijkstra",
                  comparisonResults.Dijkstra
                )}

                {renderComparisonCard(
                  "A*",
                  comparisonResults["A*"]
                )}
              </div>

              {renderPerformanceDashboard()}
            </div>
          )}
        </section>
      </main>

      <section className="management-section">
        <div className="panel-heading">
          <div>
            <h2>Network Management</h2>
            <p>Manage network connections and simulate failures</p>
          </div>
        </div>

        <div className="management-grid">
          <div className="management-card">
            <h3>Router Management</h3>

            <button
              className="primary-button"
              onClick={addRouter}
              disabled={routers.length >= 11}
            >
              Add Router
            </button>

            <div className="connection-list">
              {routers.map(router => (
                <div
                  className="connection-item"
                  key={router.id}
                >
                  <span>Router {router.id}</span>

                  <div className="connection-actions">
                    {network.isRouterFailed(router.id) ? (
                      <button
                        className="enable-button"
                        onClick={() => restoreRouter(router.id)}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        className="disable-button"
                        onClick={() => failRouter(router.id)}
                      >
                        Fail Router
                      </button>
                    )}
                    <button
                      className="disable-button"
                      onClick={() => deleteRouter(router.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="management-card">
            <h3>Add Connection</h3>

            <div className="form-group">
              <label htmlFor="connectionFrom">Router 1</label>
              <select
                id="connectionFrom"
                value={connectionFrom}
                onChange={event =>
                  setConnectionFrom(event.target.value)
                }
              >
                {routers.map(router => (
                  <option key={router.id} value={router.id}>
                    Router {router.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="connectionTo">Router 2</label>
              <select
                id="connectionTo"
                value={connectionTo}
                onChange={event =>
                  setConnectionTo(event.target.value)
                }
              >
                {routers.map(router => (
                  <option key={router.id} value={router.id}>
                    Router {router.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="connectionWeight">Weight</label>
              <input
                id="connectionWeight"
                type="number"
                min="0"
                value={connectionWeight}
                onChange={event =>
                  setConnectionWeight(event.target.value)
                }
              />
            </div>

            <button
              className="primary-button"
              onClick={addConnection}
              disabled={routers.length < 2}
            >
              Add Connection
            </button>
          </div>

          <div className="management-card">
            <h3>Existing Connections</h3>

            <div className="connection-list">
              {connections.map(([a, b, weight]) => {
                const active = network.activeConnections.has(
                  network.getConnectionId(a, b)
                );

                return (
                  <div
                    className="connection-item"
                    key={`${a}-${b}`}
                  >
                    <div>
                      <strong>
                        {a} — {b}
                      </strong>
                      <p>Weight: {weight}</p>
                      <p>{active ? "Active" : "Disabled"}</p>
                    </div>

                    <div className="connection-actions">
                      <button
                        className={
                          active
                            ? "disable-button"
                            : "enable-button"
                        }
                        onClick={() => toggleConnection(a, b)}
                      >
                        {active ? "Disable" : "Restore"}
                      </button>

                      <button
                        className="disable-button"
                        onClick={() => deleteConnection(a, b)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {connections.length === 0 && (
                <p>No connections available.</p>
              )}
            </div>
          </div>
        </div>

        {(() => {
          const analysis = calculateNetworkResilience();
          const liveConnections = getActiveConnectionSnapshots();
          const inactiveConnectionCount = Math.max(0, connections.length - liveConnections.length);
          const routerDegrees = routers.map(router => ({
            id: router.id,
            degree: network.getNeighbors(router.id).length,
            failed: !network.isRouterActive(router.id),
          }));
          const maxDegree = Math.max(1, ...routerDegrees.map(item => item.degree));
          const averageWeight = liveConnections.length === 0
            ? 0
            : liveConnections.reduce((sum, edge) => sum + edge.weight, 0) / liveConnections.length;
          const maxDistribution = Math.max(1, liveConnections.length + inactiveConnectionCount);

          return (
            <div className="management-card" style={{ marginBottom: "18px" }}>
              <div className="panel-heading">
                <div>
                  <h3>Network Topology Analytics</h3>
                  <p>Live connectivity, router importance, and connection distribution</p>
                </div>
              </div>

              <div className="performance-grid" style={{ marginBottom: "20px" }}>
                <div className="performance-metric">
                  <span>Total routers</span>
                  <strong>{routers.length}</strong>
                </div>
                <div className="performance-metric">
                  <span>Operational routers</span>
                  <strong>{analysis.activeRouterCount}</strong>
                </div>
                <div className="performance-metric">
                  <span>Active connections</span>
                  <strong>{liveConnections.length}</strong>
                </div>
                <div className="performance-metric">
                  <span>Average active link weight</span>
                  <strong>{averageWeight.toFixed(2)}</strong>
                </div>
              </div>

              <div className="management-grid">
                <div className="connection-list">
                  <h4>Router connectivity</h4>
                  <p>Number of currently usable connections for each router</p>
                  {routerDegrees.map(item => (
                    <div key={item.id} style={{ margin: "14px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <strong>Router {item.id}</strong>
                        <span>{item.failed ? "Failed" : `${item.degree} links`}</span>
                      </div>
                      <div style={{ height: "9px", borderRadius: "20px", background: "rgba(120, 150, 190, 0.18)", overflow: "hidden" }}>
                        <div style={{ width: `${item.failed ? 0 : (item.degree / maxDegree) * 100}%`, height: "100%", borderRadius: "20px", background: "#2684ff", transition: "width 0.25s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="connection-list">
                  <h4>Connection distribution</h4>
                  <p>Current link availability across the network</p>
                  <div style={{ display: "flex", height: "18px", borderRadius: "20px", overflow: "hidden", background: "rgba(120, 150, 190, 0.18)", margin: "18px 0" }}>
                    <div style={{ width: `${(liveConnections.length / maxDistribution) * 100}%`, background: "#22c55e" }} />
                    <div style={{ width: `${(inactiveConnectionCount / maxDistribution) * 100}%`, background: "#ef4444" }} />
                  </div>
                  <div className="connection-item">
                    <span>Active connections</span>
                    <strong>{liveConnections.length}</strong>
                  </div>
                  <div className="connection-item">
                    <span>Unavailable connections</span>
                    <strong>{inactiveConnectionCount}</strong>
                  </div>
                  <div className="connection-item">
                    <span>Network health</span>
                    <strong>{analysis.connected ? "Connected" : "Fragmented"}</strong>
                  </div>
                </div>
              </div>

              <div className="connection-list" style={{ marginTop: "18px" }}>
                <h4>Router importance</h4>
                <p>Critical routers are articulation points whose removal increases the number of connected components.</p>
                <div className="connection-item">
                  <div>
                    <strong>Critical routers</strong>
                    <p>{analysis.criticalRouters.length > 0 ? `Potential single points of failure: ${analysis.criticalRouters.join(", ")}` : "No critical routers detected in the current topology"}</p>
                  </div>
                  <strong>{analysis.criticalRouters.length}</strong>
                </div>
                <div className="connection-item">
                  <div>
                    <strong>Resilience score</strong>
                    <p>Percentage of operational routers in the largest connected component</p>
                  </div>
                  <strong>{analysis.resilienceScore}%</strong>
                </div>
              </div>
            </div>
          );
        })()}

        {(() => {
          const analysis = calculateNetworkResilience();
          return (
            <div className="management-card" style={{ marginBottom: "18px" }}>
              <h3>Network Resilience Analysis</h3>
              <div className="connection-list">
                <div className="connection-item">
                  <div>
                    <strong>Network connectivity</strong>
                    <p>
                      {analysis.activeRouterCount === 0
                        ? "No active routers"
                        : analysis.connected
                          ? "All active routers are connected"
                          : "Network is split into separate components"}
                    </p>
                  </div>
                  <strong>{analysis.connected ? "Connected" : "Disconnected"}</strong>
                </div>
                <div className="connection-item">
                  <div>
                    <strong>Resilience score</strong>
                    <p>Share of active routers in the largest connected group</p>
                  </div>
                  <strong>{analysis.resilienceScore}%</strong>
                </div>
                <div className="connection-item">
                  <div>
                    <strong>Connected components</strong>
                    <p>Separate groups that can communicate internally</p>
                  </div>
                  <strong>{analysis.componentCount}</strong>
                </div>
                <div className="connection-item">
                  <div>
                    <strong>Critical routers</strong>
                    <p>Routers whose removal increases network fragmentation</p>
                  </div>
                  <strong>
                    {analysis.criticalRouters.length > 0
                      ? analysis.criticalRouters.join(", ")
                      : "None detected"}
                  </strong>
                </div>
              </div>
            </div>
          );
        })()}



        {recoveryComparison && (
          <div className="management-card" style={{ marginBottom: "18px" }}>
            <div className="panel-heading">
              <div>
                <h3>Network Recovery Visualization</h3>
                <p>Before-and-after network state for router {recoveryComparison.routerId}</p>
              </div>
              <strong>{recoveryComparison.eventType === "failure" ? "Failure impact" : "Restoration"}</strong>
            </div>
            <div className="performance-grid">
              <div className="performance-metric">
                <span>Affected connections</span>
                <strong>{recoveryComparison.affectedConnections}</strong>
              </div>
              <div className="performance-metric">
                <span>Route calculation time</span>
                <strong>{recoveryComparison.recoveryTimeMs.toFixed(4)} ms</strong>
              </div>
              <div className="performance-metric">
                <span>Connections after event</span>
                <strong>{recoveryComparison.afterConnections.length}</strong>
              </div>
            </div>
            <div className="management-grid" style={{ marginTop: "15px" }}>
              <div className="management-card">
                <h3>Before event</h3>
                <p>Active connections: {recoveryComparison.beforeConnections.length}</p>
                <div className="connection-list">
                  {recoveryComparison.beforeConnections.map(edge => (
                    <div className="connection-item" key={`before-${edge.a}-${edge.b}`}>
                      <span>{edge.a} — {edge.b}</span><strong>{edge.weight}</strong>
                    </div>
                  ))}
                </div>
                <p>Route: {recoveryComparison.originalPath?.join(" → ") || "Unavailable"}</p>
              </div>
              <div className="management-card">
                <h3>After event</h3>
                <p>Active connections: {recoveryComparison.afterConnections.length}</p>
                <div className="connection-list">
                  {recoveryComparison.afterConnections.map(edge => (
                    <div className="connection-item" key={`after-${edge.a}-${edge.b}`}>
                      <span>{edge.a} — {edge.b}</span><strong>{edge.weight}</strong>
                    </div>
                  ))}
                </div>
                <p>Updated route: {recoveryComparison.updatedPath?.join(" → ") || "No route available"}</p>
              </div>
            </div>
          </div>
        )}


        <div className="management-card" style={{ marginBottom: "18px" }}>
          <div className="panel-heading">
            <div>
              <h3>Network Recovery History</h3>
              <p>Router failures, restorations, and route changes</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => setRecoveryHistory([])}
              disabled={recoveryHistory.length === 0}
            >
              Clear History
            </button>
          </div>

          <div className="connection-list">
            {recoveryHistory.length === 0 ? (
              <p>No recovery events yet. Fail or restore a router to record an event.</p>
            ) : (
              recoveryHistory.map(event => (
                <div className="connection-item" key={event.id}>
                  <div>
                    <strong>
                      {event.type === "failure" ? "Router failure" : "Router restored"} — {event.routerId}
                    </strong>
                    <p>{event.timestamp}</p>
                    <p>{event.message}</p>
                    <p>
                      Previous route: {event.originalPath?.join(" → ") || "Unavailable"}
                    </p>
                    <p>
                      Updated route: {event.updatedPath?.join(" → ") || "No route available"}
                    </p>
                  </div>
                  <strong>{event.type === "failure" ? "Failure" : "Recovery"}</strong>
                </div>
              ))
            )}
          </div>
        </div>

      </section>
    </div>
  );
}

export default App;