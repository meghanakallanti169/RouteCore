
import Dijkstra from "./Dijkstra.js";

class NetworkRecovery {
    static findAlternativeRoute(graph, start, target) {
        const result = Dijkstra.findShortestPath(
            graph,
            start,
            target
        );

        if (!result) {
            return {
                success: false,
                message: "No alternative route available.",
                path: null
            };
        }

        return {
            success: true,
            message: "Alternative route found.",
            path: result.path,
            distance: result.distance
        };
    }

    static simulateFailure(graph, router1, router2, start, target) {
        const disabled = graph.disableConnection(router1, router2);

        if (!disabled) {
            return {
                success: false,
                message: "Connection could not be disabled."
            };
        }

        const recovery = this.findAlternativeRoute(
            graph,
            start,
            target
        );

        return {
            failedConnection: `${router1} - ${router2}`,
            ...recovery
        };
    }

    static recoverConnection(graph, router1, router2) {
        const recovered = graph.enableConnection(router1, router2);

        return {
            success: recovered,
            message: recovered
                ? "Connection successfully recovered."
                : "Connection could not be recovered."
        };
    }
}

export default NetworkRecovery;
