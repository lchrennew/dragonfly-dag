import _ from "../lodash.js";

const DEFAULT_WEIGHT_FUNC = _.constant(1);

const runFloydWarshall = (g, weightFn, edgeFn) => {
    const results = {};
    const nodes = g.nodes();

    nodes.forEach(v => {
        results[v] = {};
        results[v][v] = { distance: 0 };
        nodes.forEach(w => {
            if (v !== w) {
                results[v][w] = { distance: Number.POSITIVE_INFINITY };
            }
        });
        edgeFn(v).forEach(edge => {
            const w = edge.v === v ? edge.w : edge.v;
            const d = weightFn(edge);
            results[v][w] = { distance: d, predecessor: v };
        });
    });

    nodes.forEach(k => {
        const rowK = results[k];
        nodes.forEach(i => {
            const rowI = results[i];
            nodes.forEach(j => {
                const ik = rowI[k];
                const kj = rowK[j];
                const ij = rowI[j];
                const altDistance = ik.distance + kj.distance;
                if (altDistance < ij.distance) {
                    ij.distance = altDistance;
                    ij.predecessor = kj.predecessor;
                }
            });
        });
    });

    return results;
};

export default (g, weightFn, edgeFn) => runFloydWarshall(g,
    weightFn || DEFAULT_WEIGHT_FUNC,
    edgeFn || (v => g.outEdges(v)));
