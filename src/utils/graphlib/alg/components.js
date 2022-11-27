import _ from "../lodash.js";

export default g => {
    const visited = {};
    const cmpts = [];
    let cmpt;

    const dfs = v => {
        if (_.has(visited, v)) return;
        visited[v] = true;
        cmpt.push(v);
        _.each(g.successors(v), dfs);
        _.each(g.predecessors(v), dfs);
    };

    _.each(g.nodes(), v => {
        cmpt = [];
        dfs(v);
        if (cmpt.length) {
            cmpts.push(cmpt);
        }
    });

    return cmpts;
}
