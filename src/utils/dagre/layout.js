import _ from "./lodash.js";
import acyclic from "./acyclic.js";
import normalize from "./normalize.js";
import rank from "./rank/index.js";
import { normalizeRanks, removeEmptyRanks } from "./util.js";
import parentDummyChains from "./parent-dummy-chains.js";
import nestingGraph from "./nesting-graph.js";
import addBorderSegments from "./add-border-segments.js";
import coordinateSystem from "./coordinate-system.js";
import order from "./order/index.js";
import position from "./position/index.js";
import * as util from "./util.js";
import { Graph } from "../graphlib/index.js";

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 */
const makeSpaceForEdgeLabels = g => {
    const graph = g.graph();
    graph.ranksep /= 2;
    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        edge.minlen *= 2;
        if (edge.labelpos.toLowerCase() !== "c") {
            if (graph.rankdir === "TB" || graph.rankdir === "BT") {
                edge.width += edge.labeloffset;
            } else {
                edge.height += edge.labeloffset;
            }
        }
    });
};


/*
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 */
const injectEdgeLabelProxies = g => {
    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        if (edge.width && edge.height) {
            const v = g.node(e.v);
            const w = g.node(e.w);
            const label = { rank: (w.rank - v.rank) / 2 + v.rank, e: e };
            util.addDummyNode(g, "edge-proxy", label, "_ep");
        }
    });
};

const assignRankMinMax = g => {
    let maxRank = 0;
    _.forEach(g.nodes(), v => {
        const node = g.node(v);
        if (node.borderTop) {
            node.minRank = g.node(node.borderTop).rank;
            node.maxRank = g.node(node.borderBottom).rank;
            maxRank = _.max(maxRank, node.maxRank);
        }
    });
    g.graph().maxRank = maxRank;
};

const removeEdgeLabelProxies = g => {
    _.forEach(g.nodes(), v => {
        const node = g.node(v);
        if (node.dummy === "edge-proxy") {
            g.edge(node.e).labelRank = node.rank;
            g.removeNode(v);
        }
    });
};

const translateGraph = g => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = 0;
    let maxY = 0;
    const graphLabel = g.graph();
    const marginX = graphLabel.marginx || 0;
    const marginY = graphLabel.marginy || 0;

    const getExtremes = ({ height: h, width: w, x, y }) => {
        minX = Math.min(minX, x - w / 2);
        maxX = Math.max(maxX, x + w / 2);
        minY = Math.min(minY, y - h / 2);
        maxY = Math.max(maxY, y + h / 2);
    };

    _.forEach(g.nodes(), v => getExtremes(g.node(v)));
    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        if (_.has(edge, "x")) {
            getExtremes(edge);
        }
    });

    minX -= marginX;
    minY -= marginY;

    _.forEach(g.nodes(), v => {
        const node = g.node(v);
        node.x -= minX;
        node.y -= minY;
    });

    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        _.forEach(edge.points, p => {
            p.x -= minX;
            p.y -= minY;
        });
        if (_.has(edge, "x")) {
            edge.x -= minX;
        }
        if (_.has(edge, "y")) {
            edge.y -= minY;
        }
    });

    graphLabel.width = maxX - minX + marginX;
    graphLabel.height = maxY - minY + marginY;
};

const assignNodeIntersects = g => {
    _.forEach(g.edges(), e => {
        let edge = g.edge(e);
        let nodeV = g.node(e.v);
        let nodeW = g.node(e.w);
        let p1;
        let p2;
        if (!edge.points) {
            edge.points = [];
            p1 = nodeW;
            p2 = nodeV;
        } else {
            p1 = edge.points[0];
            p2 = edge.points[edge.points.length - 1];
        }
        edge.points.unshift(util.intersectRect(nodeV, p1));
        edge.points.push(util.intersectRect(nodeW, p2));
    });
};

const fixupEdgeLabelCoords = g => {
    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        if (_.has(edge, "x")) {
            if (edge.labelpos === "l" || edge.labelpos === "r") {
                edge.width -= edge.labeloffset;
            }
            switch (edge.labelpos) {
                case "l":
                    edge.x -= edge.width / 2 + edge.labeloffset;
                    break;
                case "r":
                    edge.x += edge.width / 2 + edge.labeloffset;
                    break;
            }
        }
    });
};

const reversePointsForReversedEdges = g => {
    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        if (edge.reversed) {
            edge.points.reverse();
        }
    });
};

const removeBorderNodes = g => {
    _.forEach(g.nodes(), v => {
        if (g.children(v).length) {
            const node = g.node(v);
            const t = g.node(node.borderTop);
            const b = g.node(node.borderBottom);
            const l = g.node(_.last(node.borderLeft));
            const r = g.node(_.last(node.borderRight));

            node.width = Math.abs(r.x - l.x);
            node.height = Math.abs(b.y - t.y);
            node.x = l.x + node.width / 2;
            node.y = t.y + node.height / 2;
        }
    });

    _.forEach(g.nodes(), v => {
        if (g.node(v).dummy === "border") {
            g.removeNode(v);
        }
    });
};

const removeSelfEdges = g => {
    _.forEach(g.edges(), e => {
        if (e.v === e.w) {
            const node = g.node(e.v);
            if (!node.selfEdges) {
                node.selfEdges = [];
            }
            node.selfEdges.push({ e: e, label: g.edge(e) });
            g.removeEdge(e);
        }
    });
};

const insertSelfEdges = g => {
    const layers = util.buildLayerMatrix(g);
    _.forEach(layers, layer => {
        let orderShift = 0;
        _.forEach(layer, (v, i) => {
            const node = g.node(v);
            node.order = i + orderShift;
            _.forEach(node.selfEdges, selfEdge => {
                util.addDummyNode(g, "selfedge", {
                    width: selfEdge.label.width,
                    height: selfEdge.label.height,
                    rank: node.rank,
                    order: i + (++orderShift),
                    e: selfEdge.e,
                    label: selfEdge.label
                }, "_se");
            });
            delete node.selfEdges;
        });
    });
};

const positionSelfEdges = g => {
    _.forEach(g.nodes(), v => {
        const node = g.node(v);
        if (node.dummy === "selfedge") {
            const selfNode = g.node(node.e.v);
            const x = selfNode.x + selfNode.width / 2;
            const y = selfNode.y;
            const dx = node.x - x;
            const dy = selfNode.height / 2;
            g.setEdge(node.e, node.label);
            g.removeNode(v);
            node.label.points = [
                { x: x + 2 * dx / 3, y: y - dy },
                { x: x + 5 * dx / 6, y: y - dy },
                { x: x + dx, y: y },
                { x: x + 5 * dx / 6, y: y + dy },
                { x: x + 2 * dx / 3, y: y + dy }
            ];
            node.label.x = node.x;
            node.label.y = node.y;
        }
    });
};

const selectNumberAttrs = (obj, attrs) => _.mapValues(_.pick(obj, attrs), Number);

const canonicalize = attrs => {
    const newAttrs = {};
    _.forEach(attrs, (v, k) => newAttrs[k.toLowerCase()] = v);
    return newAttrs;
};


/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
const runLayout = (g, time) => {
    time("    makeSpaceForEdgeLabels", () => makeSpaceForEdgeLabels(g));
    time("    removeSelfEdges", () => removeSelfEdges(g));
    time("    acyclic", () => acyclic.run(g));
    time("    nestingGraph.run", () => nestingGraph.run(g));
    time("    rank", () => rank(util.asNonCompoundGraph(g)));
    time("    injectEdgeLabelProxies", () => injectEdgeLabelProxies(g));
    time("    removeEmptyRanks", () => removeEmptyRanks(g));
    time("    nestingGraph.cleanup", () => nestingGraph.cleanup(g));
    time("    normalizeRanks", () => normalizeRanks(g));
    time("    assignRankMinMax", () => assignRankMinMax(g));
    time("    removeEdgeLabelProxies", () => removeEdgeLabelProxies(g));
    time("    normalize.run", () => normalize.run(g));
    time("    parentDummyChains", () => parentDummyChains(g));
    time("    addBorderSegments", () => addBorderSegments(g));
    time("    order", () => order(g));
    time("    insertSelfEdges", () => insertSelfEdges(g));
    time("    adjustCoordinateSystem", () => coordinateSystem.adjust(g));
    time("    position", () => position(g));
    time("    positionSelfEdges", () => positionSelfEdges(g));
    time("    removeBorderNodes", () => removeBorderNodes(g));
    time("    normalize.undo", () => normalize.undo(g));
    time("    fixupEdgeLabelCoords", () => fixupEdgeLabelCoords(g));
    time("    undoCoordinateSystem", () => coordinateSystem.undo(g));
    time("    translateGraph", () => translateGraph(g));
    time("    assignNodeIntersects", () => assignNodeIntersects(g));
    time("    reversePoints", () => reversePointsForReversedEdges(g));
    time("    acyclic.undo", () => acyclic.undo(g));
};
const updateInputGraph = (inputGraph, layoutGraph) => {
    _.forEach(inputGraph.nodes(), v => {
        const inputLabel = inputGraph.node(v);
        const layoutLabel = layoutGraph.node(v);

        if (inputLabel) {
            inputLabel.x = layoutLabel.x;
            inputLabel.y = layoutLabel.y;

            if (layoutGraph.children(v).length) {
                inputLabel.width = layoutLabel.width;
                inputLabel.height = layoutLabel.height;
            }
        }
    });

    _.forEach(inputGraph.edges(), e => {
        const inputLabel = inputGraph.edge(e);
        const layoutLabel = layoutGraph.edge(e);

        inputLabel.points = layoutLabel.points;
        if (_.has(layoutLabel, "x")) {
            inputLabel.x = layoutLabel.x;
            inputLabel.y = layoutLabel.y;
        }
    });

    inputGraph.graph().width = layoutGraph.graph().width;
    inputGraph.graph().height = layoutGraph.graph().height;
};
const graphNumAttrs = [ "nodesep", "edgesep", "ranksep", "marginx", "marginy" ];
const graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "tb" };
const graphAttrs = [ "acyclicer", "ranker", "rankdir", "align" ];
const nodeNumAttrs = [ "width", "height" ];
const nodeDefaults = { width: 0, height: 0 };
const edgeNumAttrs = [ "minlen", "weight", "width", "height", "labeloffset" ];
const edgeDefaults = {
    minlen: 1, weight: 1, width: 0, height: 0,
    labeloffset: 10, labelpos: "r"
};
const edgeAttrs = [ "labelpos" ];


const buildLayoutGraph = inputGraph => {
    const g = new Graph({ multigraph: true, compound: true });
    const graph = canonicalize(inputGraph.graph());

    g.setGraph(_.merge({},
        graphDefaults,
        selectNumberAttrs(graph, graphNumAttrs),
        _.pick(graph, graphAttrs)));

    _.forEach(inputGraph.nodes(), v => {
        const node = canonicalize(inputGraph.node(v));
        g.setNode(v, _.defaults(selectNumberAttrs(node, nodeNumAttrs), nodeDefaults));
        g.setParent(v, inputGraph.parent(v));
    });

    _.forEach(inputGraph.edges(), e => {
        const edge = canonicalize(inputGraph.edge(e));
        g.setEdge(e, _.merge({},
            edgeDefaults,
            selectNumberAttrs(edge, edgeNumAttrs),
            _.pick(edge, edgeAttrs)));
    });

    return g;
};


export default (g, opts) => {
    const time = opts && opts.debugTiming ? util.time : util.notime;
    time("layout", () => {
        const layoutGraph =
            time("  buildLayoutGraph", () => buildLayoutGraph(g));
        time("  runLayout", () => runLayout(layoutGraph, time));
        time("  updateInputGraph", () => updateInputGraph(g, layoutGraph));
    });
}
