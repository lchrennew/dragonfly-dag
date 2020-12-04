import dragonflyCanvas from "../src/components/DragonflyCanvas.vue";
import dragonflyEdge from "../src/components/DragonflyEdge.vue";
import dragonflyEndpoint from "../src/components/DragonflyEndpoint.vue";
import straightLine from "../src/components/edge/StraightLine.vue";
import zigZagLine from "../src/components/edge/ZigZagLine.vue";
import sCurveLine from "../src/components/edge/SCurveLine.vue";
import lineShapeBase from "../src/components/edge/LineShapeBase.vue";
import dotGrid from "../src/components/grid/DotGrid.vue";
import lineGrid from "../src/components/grid/LineGrid.vue";
import tileGrid from "../src/components/grid/TileGrid.vue";
import {createApp, h, shallowReactive} from "vue";

export const DragonflyCanvas = dragonflyCanvas
export const DragonflyEdge = dragonflyEdge
export const DragonflyEndpoint = dragonflyEndpoint
export const StraightLine = straightLine
export const ZigZagLine = zigZagLine
export const SCurveLine = sCurveLine
export const LineShapeBase = lineShapeBase
export const DotGrid = dotGrid
export const LineGrid = lineGrid
export const TileGrid = tileGrid
export {h} from 'vue'

export function createDag(root, options) {
    const props = shallowReactive({
        nodes: options.nodes ?? [],
        ['onUpdate:nodes'](nodes) {
            props.nodes = nodes
            options.onUpdateNodes?.(nodes)
        },
    })

    const app = createApp({
        render: () => h(DragonflyCanvas, props, {
            nodeRenderer: ({node}) => options.nodeRenderer?.(node) ?? node.id
        })
    })
    app.mount(root)

    return {
        setNodes(nodes) {
            props.nodes = nodes
        }
    }
}

export default {
    DragonflyCanvas,
    DragonflyEdge,
    DragonflyEndpoint,
    StraightLine,
    ZigZagLine,
    SCurveLine,
    LineShapeBase,
    DotGrid,
    LineGrid,
    TileGrid,
    createDag,
    h,
}
