import dijkstra from "./dijkstra.js";
import _ from "../lodash.js";


export default (g, weightFunc, edgeFunc) => _.transform(g.nodes(), (acc, v) => {
    acc[v] = dijkstra(g, v, weightFunc, edgeFunc);
}, {})
