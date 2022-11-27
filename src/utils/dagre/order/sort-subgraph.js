import _ from "../lodash.js";
import barycenter from "./barycenter.js";
import resolveConflicts from "./resolve-conflicts.js";
import sort from "./sort.js";

const expandSubgraphs = (entries, subgraphs) => {
    _.forEach(entries, entry => {
        entry.vs = _.flatten(entry.vs.map(v => {
            if (subgraphs[v]) {
                return subgraphs[v].vs;
            }
            return v;
        }), true);
    });
};

const mergeBarycenters = (target, other) => {
    if (!_.isUndefined(target.barycenter)) {
        target.barycenter = (target.barycenter * target.weight +
                other.barycenter * other.weight) /
            (target.weight + other.weight);
        target.weight += other.weight;
    } else {
        target.barycenter = other.barycenter;
        target.weight = other.weight;
    }
};

const sortSubgraph = (g, v, cg, biasRight) => {
    let movable = g.children(v);
    const node = g.node(v);
    const bl = node ? node.borderLeft : undefined;
    const br = node ? node.borderRight : undefined;
    const subgraphs = {};

    if (bl) {
        movable = _.filter(movable, w => w !== bl && w !== br);
    }

    const barycenters = barycenter(g, movable);
    _.forEach(barycenters, entry => {
        if (g.children(entry.v).length) {
            const subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
            subgraphs[entry.v] = subgraphResult;
            if (_.has(subgraphResult, "barycenter")) {
                mergeBarycenters(entry, subgraphResult);
            }
        }
    });

    const entries = resolveConflicts(barycenters, cg);
    expandSubgraphs(entries, subgraphs);

    const result = sort(entries, biasRight);

    if (bl) {
        result.vs = _.flatten([ bl, result.vs, br ], true);
        if (g.predecessors(bl).length) {
            const blPred = g.node(g.predecessors(bl)[0]),
                brPred = g.node(g.predecessors(br)[0]);
            if (!_.has(result, "barycenter")) {
                result.barycenter = 0;
                result.weight = 0;
            }
            result.barycenter = (result.barycenter * result.weight +
                blPred.order + brPred.order) / (result.weight + 2);
            result.weight += 2;
        }
    }

    return result;
};
export default sortSubgraph

