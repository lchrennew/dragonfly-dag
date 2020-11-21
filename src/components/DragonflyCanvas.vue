<template>
    <div class="dragonfly-viewport"
         @mousedown.prevent="dragging=true"
         @mousemove="onMove"
         @mouseup="dragging=false"
         @wheel.prevent="onZoom">
        <dragonfly-canvas-core
            :offset-x="offsetX"
            :offset-y="offsetY"
            :scale="scale"
        >
            <template #node="{node}">
                <slot name="nodeRenderer" :node="node"/>
            </template>
        </dragonfly-canvas-core>
    </div>
</template>

<script>
import DragonflyNode from "./DragonflyNode.vue";
import DragonflyCanvasCore from "./DragonflyCanvasCore.vue";

export default {
    name: "DragonflyCanvas",
    components: {DragonflyCanvasCore, DragonflyNode},
    data() {
        return {
            dragging: false,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            width: 0,
            height: 0,
        }
    },
    props: {
        nodes: {
            type: Array,
            default: [],
        },
        edges: {
            type: Array,
            default: [],
        },
        zoomSensitivity: {
            type: Number,
            default: 0.001,
        },
        defaultScale: {
            type: Number,
            default: 1,
        },
        maxScale: {
            type: Number,
            default: 5,
        },
        minScale: {
            type: Number,
            default: 0.5,
        },
    },
    methods: {
        onZoom(event) {
            if ((event.deltaY < 0 && this.scale <= this.minScale) || (event.deltaY > 0 && this.scale >= this.maxScale))
                return

            let scale = this.scale + this.zoomSensitivity * event.deltaY / this.scale
            if (scale > this.maxScale) scale = this.maxScale
            else if (scale < this.minScale) scale = this.minScale

            const delta = scale - this.scale
            this.offsetX += (this.width / 2 - event.clientX + this.offsetX) * delta / this.scale
            this.offsetY += (this.height / 2 - event.clientY + this.offsetY) * delta / this.scale
            this.scale = scale
        },
        onMove(event) {
            if (this.dragging) {
                this.offsetX += event.movementX
                this.offsetY += event.movementY
            }
        },
    },
    provide() {
        return {
            nodes: this.nodes,
            edges: this.edges,
        }
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
    }
}
</script>

<style scoped lang="less">
.dragonfly-viewport {
    overflow: hidden;
    width: 100%;
    height: 100%;
}
</style>
