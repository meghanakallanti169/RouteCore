
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

### BFS
Explores the graph level by level.
- Time Complexity: O(V + E)

### DFS
Explores a path deeply before backtracking.
- Time Complexity: O(V + E)

### Dijkstra
Finds the minimum-cost path between two routers.
- Current implementation: O(V² + E)

### Network Recovery
Simulates link failures and recalculates alternative routes using Dijkstra.

## Installation

Clone the repository:

```bash
git clone https://github.com/meghanakallanti169/RouteCore.git
```

Navigate to the project:

```bash
cd RouteCore
```

Install root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the application:

```bash
npm run dev
```

## Running Tests

From the project root:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Test Results

Currently, all 21 automated tests pass.

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
- Network congestion simulation
- Multiple packet transmission
- Algorithm performance comparison
- Advanced routing protocol simulation

## Author

**Meghana Kallanti**

B.Tech Computer Science and Engineering

GitHub: [@meghanakallanti169](https://github.com/meghanakallanti169)

## Project Status

Active Development
