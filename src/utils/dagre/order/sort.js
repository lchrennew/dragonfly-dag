import _ from "../lodash.js";

import * as util from "../util.js";

const consumeUnsortable = (vs, unsortable, index) => {
    let last;
    while (unsortable.length && (last = _.last(unsortable)).i <= index) {
        unsortable.pop();
        vs.push(last.vs);
        index++;
    }
    return index;
};

const compareWithBias = bias => (entryV, entryW) => {
    if (entryV.barycenter < entryW.barycenter) {
        return -1;
    } else if (entryV.barycenter > entryW.barycenter) {
        return 1;
    }

    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
};


export default (entries, biasRight) => {
    const parts = util.partition(entries, entry => _.has(entry, "barycenter"));
    let sortable = parts.lhs,
        unsortable = _.sortBy(parts.rhs, entry => -entry.i),
        vs = [],
        sum = 0,
        weight = 0,
        vsIndex = 0;

    sortable.sort(compareWithBias(!!biasRight));

    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

    _.forEach(sortable, entry => {
        vsIndex += entry.vs.length;
        vs.push(entry.vs);
        sum += entry.barycenter * entry.weight;
        weight += entry.weight;
        vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
    });

    const result = { vs: _.flatten(vs, true) };
    if (weight) {
        result.barycenter = sum / weight;
        result.weight = weight;
    }
    return result;
}
