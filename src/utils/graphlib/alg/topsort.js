import _ from "../lodash.js";

const topsort = g => {
    const visited = {};
    const stack = {};
    const results = [];

    const visit = node => {
        if (_.has(stack, node)) {
            throw new CycleException();
        }

        if (!_.has(visited, node)) {
            stack[node] = true;
            visited[node] = true;
            _.each(g.predecessors(node), visit);
            delete stack[node];
            results.push(node);
        }
    };

    _.each(g.sinks(), visit);

    if (_.size(visited) !== g.nodeCount()) {
        throw new CycleException();
    }

    return results;
};

class CycleException extends Error {
    constructor() {
        super();
    }
}

topsort.CycleException = CycleException;

export default topsort
