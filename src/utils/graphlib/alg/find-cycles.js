import _ from "../lodash.js";

import tarjan from "./tarjan.js";

export default g => _.filter(tarjan(g), cmpt => cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0])));
