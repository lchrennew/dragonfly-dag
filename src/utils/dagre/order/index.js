import _ from "../lodash.js";
import initOrder from "./init-order.js";
import crossCount from "./cross-count.js";
import sortSubgraph from "./sort-subgraph.js";
import buildLayerGraph from "./build-layer-graph.js";
import addSubgraphConstraints from "./add-subgraph-constraints.js";
import { Graph } from "../../graphlib/index.js";
import * as util from "../util.js";


const buildLayerGraphs = (g, ranks, relationship) => _.map(ranks, rank => buildLayerGraph(g, rank, relationship));

const sweepLayerGraphs = (layerGraphs, biasRight) => {
    const cg = new Graph();
    _.forEach(layerGraphs, lg => {
        const root = lg.graph().root;
        const sorted = sortSubgraph(lg, root, cg, biasRight);
        _.forEach(sorted.vs, (v, i) => lg.node(v).order = i);
        addSubgraphConstraints(lg, cg, sorted.vs);
    });
};

const assignOrder = (g, layering) => _.forEach(layering, layer => _.forEach(layer, (v, i) => g.node(v).order = i));

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
export default g => {
    const maxRank = util.maxRank(g),
        downLayerGraphs = buildLayerGraphs(g, _.range(1, maxRank + 1), "inEdges"),
        upLayerGraphs = buildLayerGraphs(g, _.range(maxRank - 1, -1, -1), "outEdges");

    let layering = initOrder(g);
    assignOrder(g, layering);

    let bestCC = Number.POSITIVE_INFINITY,
        best;

    let i = 0, lastBest = 0;
    for (; lastBest < 4; ++i, ++lastBest) {
        sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

        layering = util.buildLayerMatrix(g);
        const cc = crossCount(g, layering);
        if (cc < bestCC) {
            lastBest = 0;
            best = _.cloneDeep(layering);
            bestCC = cc;
        }
    }

    assignOrder(g, best);
}
