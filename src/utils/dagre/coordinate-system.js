import _ from "./lodash.js";

const swapXYOne = attrs => {
    const x = attrs.x;
    attrs.x = attrs.y;
    attrs.y = x;
};

const reverseYOne = attrs => attrs.y = -attrs.y;

const swapWidthHeightOne = attrs => {
    const w = attrs.width;
    attrs.width = attrs.height;
    attrs.height = w;
};

const reverseY = g => {
    _.forEach(g.nodes(), v => reverseYOne(g.node(v)));

    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        _.forEach(edge.points, reverseYOne);
        if (_.has(edge, "y")) {
            reverseYOne(edge);
        }
    });
};


const swapXY = g => {
    _.forEach(g.nodes(), v => swapXYOne(g.node(v)));

    _.forEach(g.edges(), e => {
        const edge = g.edge(e);
        _.forEach(edge.points, swapXYOne);
        if (_.has(edge, "x")) {
            swapXYOne(edge);
        }
    });
};
const swapWidthHeight = g => {
    _.forEach(g.nodes(), v => swapWidthHeightOne(g.node(v)));
    _.forEach(g.edges(), e => swapWidthHeightOne(g.edge(e)));
};


const adjust = g => {
    const rankDir = g.graph().rankdir.toLowerCase();
    if (rankDir === "lr" || rankDir === "rl") {
        swapWidthHeight(g);
    }
};

const undo = g => {
    const rankDir = g.graph().rankdir.toLowerCase();
    if (rankDir === "bt" || rankDir === "rl") {
        reverseY(g);
    }

    if (rankDir === "lr" || rankDir === "rl") {
        swapXY(g);
        swapWidthHeight(g);
    }
};

export default {
    adjust,
    undo
};
