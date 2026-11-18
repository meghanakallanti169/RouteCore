# RouteCore – Network Routing Simulator

RouteCore is an interactive network routing simulator designed to visualize and compare graph traversal and shortest-path algorithms. It helps users understand how routing algorithms work, explore network structures, and evaluate algorithm performance through reproducible experiments.

## Features

### 1. Network Management

- Add and manage network routers.
- Create connections between routers.
- Assign weights to network connections.
- Visualize network structures.

### 2. Pathfinding Algorithms

RouteCore implements multiple graph algorithms:

- **BFS (Breadth-First Search):** Explores the network level by level.
- **DFS (Depth-First Search):** Explores paths deeply before backtracking.
- **Dijkstra's Algorithm:** Finds shortest paths in weighted graphs with non-negative edge weights.
- *A Search Algorithm:*\* Uses a heuristic to guide the search toward the destination.

### 3. Network Recovery

- Simulate network failures.
- Explore alternative paths after a failure.
- Evaluate how routing algorithms respond to network changes.

### 4. Reproducible Algorithm Experiments

RouteCore includes a benchmarking module to compare Dijkstra's algorithm and A\* using deterministic weighted networks.

**Experimental configuration:**

- Network sizes: 50, 100, 250 and 500 routers.
- Graph seeds: 5.
- Timed repetitions: 7.
- Warm-up runs: 1 per algorithm.
- Performance metrics: Median execution time and average routers visited.

Both algorithms are evaluated using the same generated graphs and endpoints.

#### Experimental Results

| Routers | Samples | Dijkstra Median (ms) | A\* Median (ms) | Dijkstra Visited | A\* Visited |
| ------: | ------: | -------------------: | --------------: | ---------------: | ----------: |
|      50 |      35 |                 0.20 |            0.30 |            26.80 |       10.40 |
|     100 |      35 |                 0.40 |            0.70 |            57.00 |       28.00 |
|     250 |      35 |                 0.50 |            1.60 |            97.80 |       39.60 |
|     500 |      35 |                 2.90 |            2.90 |           244.60 |       84.60 |

**Validation:** 140/140 shortest-path cost comparisons passed.

#### Key Observations

- A\* visited fewer routers than Dijkstra across all tested network sizes.
- Dijkstra achieved lower median execution time in the 50, 100 and 250 router experiments.
- Both algorithms had equal median execution time in the 500 router experiment.
- Fewer visited routers do not necessarily guarantee lower execution time.

*Note: These measurements are specific to the tested environment and graph configurations. They are not universal performance guarantees.*

## Technology Stack

| Technology     | Purpose                           |
| -------------- | --------------------------------- |
| JavaScript     | Core algorithm implementation     |
| React          | User interface                    |
| Vite           | Development server and build tool |
| CSS            | Interface styling                 |
| Vitest         | Algorithm testing                 |
| Git and GitHub | Version control                   |

## Project Structure

```text
RouteCore/
│
├── frontend/
│   ├── public/
│   ├── scripts/
│   │   └── benchmark.js
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── algorithms/
│   │   ├── graph/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── BenchmarkPanel.jsx
│   │   └── main.jsx
│   │
│   ├── tests/
│   ├── package.json
│   └── index.html
│
└── README.md
```

*Note: The structure above describes the main project organization; individual source folders may vary.*

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/meghanakallanti169/RouteCore.git
```

### 2. Navigate to the frontend directory

```bash
cd RouteCore/frontend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal to access RouteCore.

## Running Benchmark Experiments

From the `frontend` directory, execute:

```bash
npm run benchmark
```

This runs the reproducible command-line benchmark comparing Dijkstra and A\*.

## Running Tests

Run the project's test suite using:

```bash
npm test
```

Check `package.json` for the available test scripts.

## Future Enhancements

- Interactive network topology visualization.
- Additional shortest-path algorithms.
- Advanced network failure and recovery simulations.
- Larger-scale performance experiments.
- Exportable benchmark reports.
- More detailed algorithm performance analytics.

## Author

**Meghana Kallanti**

Computer Science and Engineering Student

GitHub: [@meghanakallanti169](https://github.com/meghanakallanti169)

---

RouteCore – Exploring Network Routing Through Algorithms, Visualization and Performance Experiments.
