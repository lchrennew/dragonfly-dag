<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="dragonfly-edges-layer">
        <template
            v-for="edge in edges"
            :key="edge.id">
            <slot
                :source="getPosition(edge.source)"
                :target="getPosition(edge.target)"
            />
        </template>
    </svg>
</template>

<script>
import StraightLine from "./edge/StraightLine.vue";

export default {
    name: "DragonflyCanvasEdgesLayer",
    components: {StraightLine},
    props: ['positions'],
    inject: ['edges'],
    methods: {
        getPosition(nodeId) {
            return this.positions[nodeId]
        }
    }
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
