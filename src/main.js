
import Graph from "./graph/Graph.js";
import NetworkRecovery from "./algorithms/NetworkRecovery.js";

const network = new Graph();

// Create routers
["A", "B", "C", "D", "E"].forEach(router => {
    network.addRouter(router);
});

// Create connections
network.addConnection("A", "B", 2);
network.addConnection("B", "C", 2);
network.addConnection("C", "E", 2);
network.addConnection("A", "D", 4);
network.addConnection("D", "E", 3);

// Simulate B-C failure
console.log("NETWORK FAILURE");

const result = NetworkRecovery.simulateFailure(
    network,
    "B",
    "C",
    "A",
    "E"
);

console.log(result);

// Recover B-C
console.log("NETWORK RECOVERY");

const recovery = NetworkRecovery.recoverConnection(
    network,
    "B",
    "C"
);

console.log(recovery);
