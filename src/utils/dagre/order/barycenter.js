import _ from "../lodash.js";

export default (g, movable) => _.map(movable, v => {
    const inV = g.inEdges(v);
    if (!inV.length) {
        return { v: v };
    } else {
        const result = _.reduce(inV, (acc, e) => {
            const edge = g.edge(e),
                nodeU = g.node(e.v);
            return {
                sum: acc.sum + (edge.weight * nodeU.order),
                weight: acc.weight + edge.weight
            };
        }, { sum: 0, weight: 0 });

        return {
            v: v,
            barycenter: result.sum / result.weight,
            weight: result.weight
        };
    }
})
