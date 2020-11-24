<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <defs v-if="showArrow">
            <marker id="arrow"
                    markerwidth="6"
                    markerHeight="6"
                    refX="6"
                    refY="3"
                    orient="auto"
                    overflow="visible"
                    :viewBox="`0 0 ${6/arrowZoomRatio} ${6/arrowZoomRatio}`"
            >
                <polygon points="0 0, 0 6, 6 3" class="arrow"/>
            </marker>

        </defs>
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
        <dragonfly-linking-edge v-if="linking">
            <slot
                name="linking"
                :source="linkingSource"
                :target="linkingTarget"
            />
        </dragonfly-linking-edge>
    </svg>
</template>

<script>
import DragonflyEdge from "./DragonflyEdge.vue";
import DragonflyLinkingEdge from "./DragonflyLinkingEdge.vue";

export default {
    name: "DragonflyCanvasEdgesLayer",
    components: {DragonflyLinkingEdge, DragonflyEdge},
    props: ['positions', 'endpointPositions', 'linking', 'linkingSource', 'linkingTarget', 'edges', 'showArrow', 'arrowZoomRatio'],
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
    color: #777;

    * {
        stroke-width: 2;
        stroke: currentColor;
        pointer-events: none;
        fill: transparent;
        stroke-linecap: round;
        stroke-linejoin: round;

        &.linking {
            stroke-dasharray: 2 5;
            stroke-dashoffset: -10;
        }
    }

    .arrow {
        stroke-width: 0;
        fill: currentColor;
    }
}
</style>
