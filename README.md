
# RouteCore

### Understanding the Intelligence Behind Network Routing

RouteCore is a graph-based network routing and simulation platform that demonstrates how computer networks discover efficient paths, transmit packets, handle connection failures, and recover through alternative routes.

## Features

- Network topology visualization
- Graph management using adjacency lists
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's shortest-path algorithm
- Packet transmission animation
- Adjustable packet speed
- Network failure simulation
- Automatic alternative route recovery
- Connection restoration
- Automated testing with Vitest

## Technology Stack

- JavaScript
- React
- Vite
- CSS
- Vitest
- Git and GitHub

## Project Architecture

```text
RouteCore/
├── src/
│   ├── graph/
│   │   └── Graph.js
│   └── algorithms/
│       ├── Traversal.js
│       ├── Dijkstra.js
│       └── NetworkRecovery.js
├── tests/
│   ├── Graph.test.js
│   ├── Traversal.test.js
│   ├── Dijkstra.test.js
│   └── NetworkRecovery.test.js
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── index.css
├── package.json
└── README.md
```

## Algorithms

### 1. Breadth-First Search (BFS)

Explores the graph level by level to find a path with the minimum number of edges.

- Time Complexity: O(V + E)

### 2. Depth-First Search (DFS)

Explores a path deeply before backtracking to explore other possible paths.

- Time Complexity: O(V + E)

### 3. Dijkstra's Algorithm

Finds the minimum-cost path between two routers using weighted connections.

- Current implementation: O(V² + E)
- Supports non-negative edge weights.

### 4. Network Recovery

Simulates network connection failures and recalculates alternative routes using Dijkstra's shortest-path algorithm.

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Git

### Clone the Repository

```bash
git clone https://github.com/meghanakallanti169/RouteCore.git
```

Navigate to the project directory:

```bash
cd RouteCore
```

### Install Root Dependencies

```bash
npm install
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Run the Application

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173/
```

## Running Tests

Navigate to the project root and execute:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Test Results

All 21 automated tests are currently passing.

| Module | Tests |
|---|---:|
| Graph | 7 |
| Traversal | 5 |
| Dijkstra | 5 |
| Network Recovery | 4 |
| **Total** | **21** |

## Future Enhancements

- A* shortest-path algorithm
- Dynamic router creation
- Dynamic connection management
- Network congestion simulation
- Multiple packet transmission
- Algorithm performance comparison
- Advanced routing protocol simulation

## Learning Outcomes

Through RouteCore, the project explores:

- Graph data structures and algorithms
- Weighted graph traversal
- Shortest-path optimization
- Network failure simulation
- Modular JavaScript architecture
- Frontend visualization of algorithms
- Automated testing and version control

## Author

**Meghana Kallanti**

B.Tech Computer Science and Engineering

GitHub: [@meghanakallanti169](https://github.com/meghanakallanti169)

## Project Status

Active Development
