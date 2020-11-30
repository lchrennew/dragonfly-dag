import dragonflyCanvas from "./src/components/DragonflyCanvas.vue";
import dragonflyEdge from "./src/components/DragonflyEdge.vue";
import dragonflyEndpoint from "./src/components/DragonflyEndpoint.vue";
import straightLine from "./src/components/edge/StraightLine.vue";
import zigZagLine from "./src/components/edge/ZigZagLine.vue";
import sCurveLine from "./src/components/edge/SCurveLine.vue";
import lineShapeBase from "./src/components/edge/LineShapeBase.vue";

export const DragonflyCanvas = dragonflyCanvas
export const DragonflyEdge = dragonflyEdge
export const DragonflyEndpoint = dragonflyEndpoint
export const StraightLine = straightLine
export const ZigZagLine = zigZagLine
export const SCurveLine = sCurveLine
export const LineShapeBase = lineShapeBase

export default {
    DragonflyCanvas,
    DragonflyEdge,
    DragonflyEndpoint,
    StraightLine,
    ZigZagLine,
    SCurveLine,
    LineShapeBase,
}
