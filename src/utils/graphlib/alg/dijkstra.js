import _ from "../lodash.js";

import PriorityQueue from "../data/priority-queue.js";

const DEFAULT_WEIGHT_FUNC = _.constant(1);

const runDijkstra = (g, source, weightFn, edgeFn) => {
    const results = {};
    const pq = new PriorityQueue();
    let v, vEntry;

    const updateNeighbors = edge => {
        const w = edge.v !== v ? edge.v : edge.w;
        const wEntry = results[w];
        const weight = weightFn(edge);
        const distance = vEntry.distance + weight;

        if (weight < 0) {
            throw new Error("dijkstra does not allow negative edge weights. " +
                "Bad edge: " + edge + " Weight: " + weight);
        }

        if (distance < wEntry.distance) {
            wEntry.distance = distance;
            wEntry.predecessor = v;
            pq.decrease(w, distance);
        }
    };

    g.nodes().forEach(v => {
        const distance = v === source ? 0 : Number.POSITIVE_INFINITY;
        results[v] = { distance: distance };
        pq.add(v, distance);
    });

    while (pq.size() > 0) {
        v = pq.removeMin();
        vEntry = results[v];
        if (vEntry.distance === Number.POSITIVE_INFINITY) {
            break;
        }

        edgeFn(v).forEach(updateNeighbors);
    }

    return results;
};

export default (g, source, weightFn, edgeFn) => runDijkstra(g, String(source),
    weightFn || DEFAULT_WEIGHT_FUNC,
    edgeFn || (v => g.outEdges(v)))
