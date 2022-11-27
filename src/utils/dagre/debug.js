import _ from "./lodash.js";
import * as util from "./util.js";
import { Graph } from "../graphlib/index.js";

/* istanbul ignore next */
export const debugOrdering = g => {
    const layerMatrix = util.buildLayerMatrix(g);

    const h = new Graph({ compound: true, multigraph: true }).setGraph({});

    _.forEach(g.nodes(), v => {
        h.setNode(v, { label: v });
        h.setParent(v, "layer" + g.node(v).rank);
    });

    _.forEach(g.edges(), e => h.setEdge(e.v, e.w, {}, e.name));

    _.forEach(layerMatrix, (layer, i) => {
        const layerV = "layer" + i;
        h.setNode(layerV, { rank: "same" });
        _.reduce(layer, (u, v) => {
            h.setEdge(u, v, { style: "invis" });
            return v;
        });
    });

    return h;
};
