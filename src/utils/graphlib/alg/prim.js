import _ from "../lodash.js";
import Graph from "../graph.js";
import PriorityQueue from "../data/priority-queue.js";

export default (g, weightFunc) => {
    const result = new Graph();
    const parents = {};
    const pq = new PriorityQueue();
    let v;

    const updateNeighbors = edge => {
        const w = edge.v === v ? edge.w : edge.v;
        const pri = pq.priority(w);
        if (pri !== undefined) {
            const edgeWeight = weightFunc(edge);
            if (edgeWeight < pri) {
                parents[w] = v;
                pq.decrease(w, edgeWeight);
            }
        }
    };

    if (g.nodeCount() === 0) {
        return result;
    }

    _.each(g.nodes(), v => {
        pq.add(v, Number.POSITIVE_INFINITY);
        result.setNode(v);
    });

    // Start from an arbitrary node
    pq.decrease(g.nodes()[0], 0);

    let init = false;
    while (pq.size() > 0) {
        v = pq.removeMin();
        if (_.has(parents, v)) {
            result.setEdge(v, parents[v]);
        } else if (init) {
            throw new Error("Input graph is not connected: " + g);
        } else {
            init = true;
        }

        g.nodeEdges(v).forEach(updateNeighbors);
    }

    return result;
};
