import _ from "../lodash.js";

export default g => {
    let index = 0;
    const stack = [];
    const visited = {}; // node id -> { onStack, lowlink, index }
    const results = [];

    const dfs = v => {
        const entry = visited[v] = {
            onStack: true,
            lowlink: index,
            index: index++
        };
        stack.push(v);

        g.successors(v).forEach(w => {
            if (!_.has(visited, w)) {
                dfs(w);
                entry.lowlink = Math.min(entry.lowlink, visited[w].lowlink);
            } else if (visited[w].onStack) {
                entry.lowlink = Math.min(entry.lowlink, visited[w].index);
            }
        });

        if (entry.lowlink === entry.index) {
            const cmpt = [];
            let w;
            do {
                w = stack.pop();
                visited[w].onStack = false;
                cmpt.push(w);
            } while (v !== w);
            results.push(cmpt);
        }
    };

    g.nodes().forEach(v => {
        if (!_.has(visited, v)) {
            dfs(v);
        }
    });

    return results;
}
