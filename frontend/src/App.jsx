
import { useMemo, useState, useRef, useEffect } from "react";
import Graph from "../../src/graph/Graph.js";
import Dijkstra from "../../src/algorithms/Dijkstra.js";
import "./App.css";

const routers = [
  { id: "A", x: 100, y: 180 },
  { id: "B", x: 300, y: 80 },
  { id: "C", x: 300, y: 280 },
  { id: "D", x: 520, y: 80 },
  { id: "E", x: 520, y: 280 },
];

const connections = [
  ["A", "B", 4],
  ["A", "C", 2],
  ["B", "C", 1],
  ["B", "D", 5],
  ["C", "D", 8],
  ["C", "E", 10],
  ["D", "E", 2],
];

function App() {
  const network = useMemo(() => {
    const graph = new Graph();

    routers.forEach(router => graph.addRouter(router.id));

    connections.forEach(([a, b, weight]) => {
      graph.addConnection(a, b, weight);
    });

    return graph;
  }, []);

  const [, setVersion] = useState(0);

  const [start, setStart] = useState("A");
  const [target, setTarget] = useState("E");
  const [result, setResult] = useState(null);
  const [calculated, setCalculated] = useState(false);

  const [packetPosition, setPacketPosition] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [packetStatus, setPacketStatus] = useState("Not started");

  const [networkStatus, setNetworkStatus] = useState(null);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

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

  function findRoute() {
    clearPacket();

    const route = Dijkstra.findShortestPath(
      network,
      start,
      target
    );

    setResult(route);
    setCalculated(true);

    setNetworkStatus(
      route
        ? {
            type: "success",
            message: "Shortest route calculated successfully.",
          }
        : {
            type: "error",
            message: "No available route between these routers.",
          }
    );
  }

  function toggleConnection(a, b) {
    const id = network.getConnectionId(a, b);
    const wasActive = network.activeConnections.has(id);

    const oldPath = result?.path || [];

    const routeWasAffected = oldPath.some(
      (node, index) =>
        index < oldPath.length - 1 &&
        (
          (node === a && oldPath[index + 1] === b) ||
          (node === b && oldPath[index + 1] === a)
        )
    );

    clearPacket();

    if (wasActive) {
      network.disableConnection(a, b);
    } else {
      network.enableConnection(a, b);
    }

    refresh();

    if (!calculated) {
      setResult(null);
      setNetworkStatus({
        type: "info",
        message: wasActive
          ? `Connection ${a} — ${b} disabled.`
          : `Connection ${a} — ${b} restored.`,
      });
      return;
    }

    const newRoute = Dijkstra.findShortestPath(
      network,
      start,
      target
    );

    setResult(newRoute);

    if (!newRoute) {
      setNetworkStatus({
        type: "error",
        message: "Network outage! No alternative route is available.",
      });
      setPacketStatus("Route unavailable");
      return;
    }

    if (wasActive && routeWasAffected) {
      setNetworkStatus({
        type: "success",
        message: "Connection failed! Alternative route found automatically.",
      });
    } else if (wasActive) {
      setNetworkStatus({
        type: "info",
        message: "Connection disabled. Existing route is unaffected.",
      });
    } else {
      setNetworkStatus({
        type: "success",
        message: "Connection restored. Network routes recalculated.",
      });
    }
  }

  function resetNetwork() {
    clearPacket();

    connections.forEach(([a, b]) => {
      network.enableConnection(a, b);
    });

    setResult(null);
    setCalculated(false);
    setNetworkStatus({
      type: "info",
      message: "Network reset. All connections are active.",
    });

    refresh();
  }

  function sendPacket() {
    if (!result?.path || isAnimating) return;

    stopAnimation();

    setPacketPosition(0);
    setPacketStatus("Transmitting");
    setIsAnimating(true);

    startTimeRef.current = null;

    const totalSegments = result.path.length - 1;
    const duration = 1000 / speed;

    function animate(timestamp) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, totalSegments);

      setPacketPosition(progress);

      if (progress >= totalSegments) {
        animationRef.current = null;
        setIsAnimating(false);
        setPacketStatus("Delivered successfully");
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);
  }

  const activeCount = network.activeConnections.size;

  let packetCoordinates = null;

  if (packetPosition !== null && result?.path) {
    const path = result.path;

    if (path.length === 1) {
      const router = routers.find(r => r.id === path[0]);

      if (router) {
        packetCoordinates = { x: router.x, y: router.y };
      }
    } else {
      const segment = Math.min(
        Math.floor(packetPosition),
        path.length - 2
      );

      const progress = packetPosition >= path.length - 1
        ? 1
        : packetPosition - segment;

      const first = routers.find(r => r.id === path[segment]);
      const second = routers.find(r => r.id === path[segment + 1]);

      if (first && second) {
        packetCoordinates = {
          x: first.x + (second.x - first.x) * progress,
          y: first.y + (second.y - first.y) * progress,
        };
      }
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">R</span>
          <div>
            <h1>RouteCore</h1>
            <p>NETWORK ROUTING SIMULATOR</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          NETWORK ONLINE
        </div>
      </header>

      <main className="dashboard">
        <section className="intro">
          <p className="eyebrow">NETWORK INTELLIGENCE PLATFORM</p>
          <h2>Understand how networks find their way.</h2>
          <p className="subtitle">
            Explore connections, simulate failures and calculate
            the shortest available route.
          </p>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span>ROUTERS</span>
            <strong>{routers.length}</strong>
          </div>

          <div className="stat-card">
            <span>ACTIVE CONNECTIONS</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="stat-card">
            <span>FAILED CONNECTIONS</span>
            <strong>{connections.length - activeCount}</strong>
          </div>
        </section>

        <section className="workspace">
          <div className="network-panel">
            <div className="panel-heading">
              <div>
                <h3>Network topology</h3>
                <p>Disable a connection to simulate network failure.</p>
              </div>
              <span className="live-label">LIVE SIMULATION</span>
            </div>

            <div className="network-canvas">
              <svg viewBox="0 0 650 370">
                {connections.map(([a, b, weight]) => {
                  const first = routers.find(r => r.id === a);
                  const second = routers.find(r => r.id === b);
                  const id = network.getConnectionId(a, b);
                  const active = network.activeConnections.has(id);

                  const onPath =
                    result?.path &&
                    result.path.some((node, index) =>
                      index < result.path.length - 1 &&
                      (
                        (node === a && result.path[index + 1] === b) ||
                        (node === b && result.path[index + 1] === a)
                      )
                    );

                  return (
                    <g key={id}>
                      <line
                        x1={first.x}
                        y1={first.y}
                        x2={second.x}
                        y2={second.y}
                        className={
                          !active
                            ? "edge failed"
                            : onPath
                              ? "edge selected"
                              : "edge"
                        }
                      />

                      <text
                        x={(first.x + second.x) / 2}
                        y={(first.y + second.y) / 2 - 10}
                        className="edge-weight"
                      >
                        {weight}
                      </text>
                    </g>
                  );
                })}

                {packetCoordinates && (
                  <g>
                    <circle
                      cx={packetCoordinates.x}
                      cy={packetCoordinates.y}
                      r="15"
                      className="packet-pulse"
                    />

                    <circle
                      cx={packetCoordinates.x}
                      cy={packetCoordinates.y}
                      r="9"
                      className="packet"
                    />
                  </g>
                )}

                {routers.map(router => (
                  <g key={router.id}>
                    <circle
                      cx={router.x}
                      cy={router.y}
                      r="25"
                      className="router-node"
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
              </svg>
            </div>

            <div className="legend">
              <span><i className="legend-line"></i> Active</span>
              <span><i className="legend-line failed-line"></i> Failed</span>
              <span><i className="legend-line selected-line"></i> Shortest path</span>
              <span><i className="legend-packet"></i> Packet</span>
            </div>
          </div>

          <aside className="control-panel">
            <h3>Routing controls</h3>

            <p className="control-description">
              Select the source and destination routers.
            </p>

            <label>Source router</label>
            <select
              value={start}
              onChange={e => {
                clearPacket();
                setStart(e.target.value);
                setResult(null);
                setCalculated(false);
                setNetworkStatus(null);
              }}
            >
              {routers.map(r => (
                <option key={r.id} value={r.id}>{r.id}</option>
              ))}
            </select>

            <label>Destination router</label>
            <select
              value={target}
              onChange={e => {
                clearPacket();
                setTarget(e.target.value);
                setResult(null);
                setCalculated(false);
                setNetworkStatus(null);
              }}
            >
              {routers.map(r => (
                <option key={r.id} value={r.id}>{r.id}</option>
              ))}
            </select>

            <button
              className="primary-button"
              onClick={findRoute}
              disabled={start === target}
            >
              Calculate shortest route
            </button>

            <button
              className="secondary-button"
              onClick={resetNetwork}
            >
              Reset network
            </button>

            <label>Packet speed</label>
            <select
              value={speed}
              onChange={e => {
                clearPacket();
                setSpeed(Number(e.target.value));
              }}
            >
              <option value="0.5">Slow</option>
              <option value="1">Normal</option>
              <option value="2">Fast</option>
            </select>

            <button
              className="send-button"
              onClick={sendPacket}
              disabled={!result || isAnimating}
            >
              {isAnimating ? "Packet in transit..." : "Send packet"}
            </button>

            {result && (
              <div className="route-result">
                <span>SHORTEST ROUTE</span>
                <strong>{result.path.join(" → ")}</strong>
                <p>Total cost: {result.distance}</p>
              </div>
            )}

            {calculated && !result && (
              <p className="error-message">
                No available route between these routers.
              </p>
            )}

            {!calculated && (
              <p className="hint">
                Calculate a route to see the result here.
              </p>
            )}

            <div className="packet-status">
              <span>PACKET STATUS</span>
              <strong
                className={
                  packetStatus === "Delivered successfully"
                    ? "delivered"
                    : isAnimating
                      ? "transmitting"
                      : ""
                }
              >
                {packetStatus}
              </strong>
            </div>
          </aside>
        </section>

        {networkStatus && (
          <section className={`network-message ${networkStatus.type}`}>
            <strong>NETWORK EVENT</strong>
            <p>{networkStatus.message}</p>
          </section>
        )}

        <section className="connections-panel">
          <h3>Connection management</h3>
          <p>Disable or restore individual network connections.</p>

          <div className="connection-list">
            {connections.map(([a, b, weight]) => {
              const id = network.getConnectionId(a, b);
              const active = network.activeConnections.has(id);

              return (
                <div className="connection-item" key={id}>
                  <div>
                    <strong>{a} — {b}</strong>
                    <span>Weight: {weight}</span>
                  </div>

                  <button
                    className={active ? "disable-button" : "enable-button"}
                    onClick={() => toggleConnection(a, b)}
                  >
                    {active ? "Disable" : "Restore"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer>
        RouteCore · Network routing and simulation platform
      </footer>
    </div>
  );
}

export default App;
