import _ from "../lodash.js";

const mergeEntries = (target, source) => {
    let sum = 0;
    let weight = 0;

    if (target.weight) {
        sum += target.barycenter * target.weight;
        weight += target.weight;
    }

    if (source.weight) {
        sum += source.barycenter * source.weight;
        weight += source.weight;
    }

    target.vs = source.vs.concat(target.vs);
    target.barycenter = sum / weight;
    target.weight = weight;
    target.i = Math.min(source.i, target.i);
    source.merged = true;
};

const doResolveConflicts = sourceSet => {
    const entries = [];

    const handleIn = vEntry => uEntry => {
        if (uEntry.merged) {
            return;
        }
        if (_.isUndefined(uEntry.barycenter) ||
            _.isUndefined(vEntry.barycenter) ||
            uEntry.barycenter >= vEntry.barycenter) {
            mergeEntries(vEntry, uEntry);
        }
    };

    const handleOut = vEntry => wEntry => {
        wEntry["in"].push(vEntry);
        if (--wEntry.indegree === 0) {
            sourceSet.push(wEntry);
        }
    };

    while (sourceSet.length) {
        const entry = sourceSet.pop();
        entries.push(entry);
        _.forEach(entry["in"].reverse(), handleIn(entry));
        _.forEach(entry.out, handleOut(entry));
    }

    return _.map(_.filter(entries, entry => !entry.merged),
        entry => _.pick(entry, [ "vs", "i", "barycenter", "weight" ]));

};

/*
 * Given a list of entries of the form {v, barycenter, weight} and a
 * constraint graph this function will resolve any conflicts between the
 * constraint graph and the barycenters for the entries. If the barycenters for
 * an entry would violate a constraint in the constraint graph then we coalesce
 * the nodes in the conflict into a new node that respects the contraint and
 * aggregates barycenter and weight information.
 *
 * This implementation is based on the description in Forster, "A Fast and
 * Simple Hueristic for Constrained Two-Level Crossing Reduction," thought it
 * differs in some specific details.
 *
 * Pre-conditions:
 *
 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
 *       no barycenter, then {v}.
 *
 * Returns:
 *
 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
 *    `vs` may either be a singleton or it may be an aggregation of nodes
 *    ordered such that they do not violate constraints from the constraint
 *    graph. The property `i` is the lowest original index of any of the
 *    elements in `vs`.
 */
export default (entries, cg) => {
    const mappedEntries = {};
    _.forEach(entries, (entry, i) => {
        const tmp = mappedEntries[entry.v] = {
            indegree: 0,
            "in": [],
            out: [],
            vs: [ entry.v ],
            i: i
        };
        if (!_.isUndefined(entry.barycenter)) {
            tmp.barycenter = entry.barycenter;
            tmp.weight = entry.weight;
        }
    });

    _.forEach(cg.edges(), e => {
        const entryV = mappedEntries[e.v];
        const entryW = mappedEntries[e.w];
        if (!_.isUndefined(entryV) && !_.isUndefined(entryW)) {
            entryW.indegree++;
            entryV.out.push(mappedEntries[e.w]);
        }
    });

    const sourceSet = _.filter(mappedEntries, entry => !entry.indegree);

    return doResolveConflicts(sourceSet);
}

