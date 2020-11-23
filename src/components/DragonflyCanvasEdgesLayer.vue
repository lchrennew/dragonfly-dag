<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <template
            v-for="edge in edges"
            :key="edge.id">
            <slot
                :source="positions[edge.source]"
                :target="positions[edge.target]"
                :sourceOffset="endpointPositions[edge.sourceEndpoint]"
                :targetOffset="endpointPositions[edge.targetEndpoint]"
            />
        </template>
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

export default {
    name: "DragonflyCanvasEdgesLayer",
    components: {StraightLine},
    props: ['positions', 'endpointPositions', 'linking', 'linkingSource', 'linkingTarget', 'edges'],
}
</script>

<style scoped lang="less">
.dragonfly-edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    z-index: 2;
}
</style>
