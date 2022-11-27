import _ from "../lodash.js";

const doDfs = (g, v, postorder, visited, navigation, acc) => {
    if (!_.has(visited, v)) {
        visited[v] = true;

        if (!postorder) {
            acc.push(v);
        }
        _.each(navigation(v), w => doDfs(g, w, postorder, visited, navigation, acc));
        if (postorder) {
            acc.push(v);
        }
    }
};

/*
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * Order must be one of "pre" or "post".
 */
export default (g, vs, order) => {
    if (!_.isArray(vs)) {
        vs = [ vs ];
    }

    const navigation = (g.isDirected() ? g.successors : g.neighbors).bind(g);

    const acc = [];
    const visited = {};
    _.each(vs, v => {
        if (!g.hasNode(v)) {
            throw new Error("Graph does not have node: " + v);
        }

        doDfs(g, v, order === "post", visited, navigation, acc);
    });
    return acc;
}