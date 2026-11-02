
class Graph {
    constructor() {
        this.adjacencyList = {};
        this.activeConnections = new Set();
        this.weights = {};
    }

    addRouter(router) {
        if (!Object.hasOwn(this.adjacencyList, router)) {
            this.adjacencyList[router] = [];
        }
    }

    getConnectionId(router1, router2) {
        return [router1, router2].sort().join("--");
    }

    addConnection(router1, router2, weight = 1) {
        if (
            !Object.hasOwn(this.adjacencyList, router1) ||
            !Object.hasOwn(this.adjacencyList, router2) ||
            router1 === router2 ||
            !Number.isFinite(weight) ||
            weight < 0
        ) {
            return false;
        }

        const id = this.getConnectionId(router1, router2);

        if (this.weights[id] !== undefined) {
            return false;
        }

        this.adjacencyList[router1].push(router2);
        this.adjacencyList[router2].push(router1);

        this.weights[id] = weight;
        this.activeConnections.add(id);

        return true;
    }

    removeRouter(router) {
        if (!Object.hasOwn(this.adjacencyList, router)) {
            return false;
        }

        for (const neighbor of [...this.adjacencyList[router]]) {
            this.removeConnection(router, neighbor);
        }

        delete this.adjacencyList[router];
        return true;
    }

    removeConnection(router1, router2) {
        if (
            !Object.hasOwn(this.adjacencyList, router1) ||
            !Object.hasOwn(this.adjacencyList, router2)
        ) {
            return false;
        }

        const id = this.getConnectionId(router1, router2);

        if (this.weights[id] === undefined) {
            return false;
        }

        this.adjacencyList[router1] =
            this.adjacencyList[router1].filter(r => r !== router2);

        this.adjacencyList[router2] =
            this.adjacencyList[router2].filter(r => r !== router1);

        this.activeConnections.delete(id);
        delete this.weights[id];

        return true;
    }

    disableConnection(router1, router2) {
        const id = this.getConnectionId(router1, router2);

        if (!Object.hasOwn(this.weights, id)) {
            return false;
        }

        if (!this.activeConnections.has(id)) {
            return false;
        }

        this.activeConnections.delete(id);
        return true;
    }

    enableConnection(router1, router2) {
        const id = this.getConnectionId(router1, router2);

        if (!Object.hasOwn(this.weights, id)) {
            return false;
        }

        if (this.activeConnections.has(id)) {
            return false;
        }

        this.activeConnections.add(id);
        return true;
    }

    getNeighbors(router) {
        if (!Object.hasOwn(this.adjacencyList, router)) {
            return [];
        }

        return this.adjacencyList[router].filter(neighbor =>
            this.activeConnections.has(
                this.getConnectionId(router, neighbor)
            )
        );
    }

    getWeight(router1, router2) {
        return this.weights[this.getConnectionId(router1, router2)];
    }

    getNetworkState() {
        return {
            routers: Object.keys(this.adjacencyList),
            connections: [...this.activeConnections],
            weights: { ...this.weights },
            adjacencyList: this.adjacencyList
        };
    }
}

export default Graph;
