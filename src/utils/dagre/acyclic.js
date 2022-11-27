import _ from "./lodash.js";
import greedyFAS from "./greedy-fas.js";

const dfsFAS = g => {
    const fas = [];
    const stack = {};
    const visited = {};

    const dfs = v => {
        if (_.has(visited, v)) {
            return;
        }
        visited[v] = true;
        stack[v] = true;
        _.forEach(g.outEdges(v), e => {
            if (_.has(stack, e.w)) {
                fas.push(e);
            } else {
                dfs(e.w);
            }
        });
        delete stack[v];
    };

    _.forEach(g.nodes(), dfs);
    return fas;
};

const run = g => {
    const weightFn = g => e => g.edge(e).weight;

    const fas = (g.graph().acyclicer === "greedy"
        ? greedyFAS(g, weightFn(g))
        : dfsFAS(g));

    _.forEach(fas, e => {
        const label = g.edge(e);
        g.removeEdge(e);
        label.forwardName = e.name;
        label.reversed = true;
        g.setEdge(e.w, e.v, label, _.uniqueId("rev"));
    });


};

const undo = g => {
    _.forEach(g.edges(), e => {
        const label = g.edge(e);
        if (label.reversed) {
            g.removeEdge(e);

            const forwardName = label.forwardName;
            delete label.reversed;
            delete label.forwardName;
            g.setEdge(e.w, e.v, label, forwardName);
        }
    });
};

export default {
    run,
    undo
};
