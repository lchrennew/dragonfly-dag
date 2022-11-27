import _ from "../lodash.js";
import * as util from "../util.js";
import bk from "./bk.js";

const { positionX } = bk;

const positionY = g => {
  const layering = util.buildLayerMatrix(g);
  const rankSep = g.graph().ranksep;
  let prevY = 0;
  _.forEach(layering, layer => {
    const maxHeight = _.max(_.map(layer, v => g.node(v).height));
    _.forEach(layer, v => g.node(v).y = prevY + maxHeight / 2);
    prevY += maxHeight + rankSep;
  });
};


export default g => {
  g = util.asNonCompoundGraph(g);

  positionY(g);
  _.forEach(positionX(g), (x, v) => g.node(v).x = x);
}
