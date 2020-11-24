<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <dragonfly-edge
            v-for="edge in edges"
            :key="edge.id"
            :edge="edge"
            :source-node="positions[edge.source]"
            :target-node="positions[edge.target]"
            :source-endpoint="endpointPositions[edge.sourceEndpoint]"
            :target-endpoint="endpointPositions[edge.targetEndpoint]"
            #default="{source, target}"
        >
            <slot :source="source" :target="target"/>
        </dragonfly-edge>
        <template v-if="linking">
            <slot
                name="linking"
                :source="linkingSource"
                :target="linkingTarget"
            />
        </template>
    </svg>
</template>

<script>
import StraightLine from "./edge/StraightLine.vue";
import DragonflyEdge from "./DragonflyEdge.vue";

export default {
    name: "DragonflyCanvasEdgesLayer",
    components: {DragonflyEdge, StraightLine},
    props: ['positions', 'endpointPositions', 'linking', 'linkingSource', 'linkingTarget', 'edges'],
}
</script>

<style lang="less">
.dragonfly-edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    z-index: 2;
    overflow: visible !important;

    line, polyline, path {
        stroke-width: 2;
        stroke: #f00;
        pointer-events: none;
        fill: transparent;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
}
</style>
