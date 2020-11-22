<template>
    <div
        class="dragonfly-node"
        :class="{selected}"
        :style="{left: `${x}px`, top:`${y}px`}"
        :draggable="draggable"
        @mousedown.stop="onMouseDown"
        @dragstart="onDragStart"
        @drag.prevent="onDrag"
        @dragend.prevent.stop="onDragEnd"
    >
        <slot/>
    </div>
</template>

<script>

const preventDefaultDrop = event => event.preventDefault()
const img = document.createElement("img")
img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'

export default {
    name: "DragonflyNode",
    props: ['node', 'selected'],
    data() {
        return {
            width: 0,
            height: 0,
            x: this.position?.x ?? 0,
            y: this.position?.y ?? 0,
            dragging: false,
            inDomOffset: {x: 0, y: 0},
        }
    },
    inject: ['resize', 'moving', 'positions', 'canvasDraggable'],
    computed: {
        draggable() {
            return this.node.draggable ?? this.canvasDraggable.value
        },
        position() {
            return this.positions.value[this.node.id]
        }
    },
    methods: {
        onMouseDown(event) {
            this.inDomOffset.x = event.offsetX
            this.inDomOffset.y = event.offsetY

            if (this.selected) {
                event.shiftKey && this.$emit('unselect', this.node.id)
            } else {
                this.$emit('select', {nodeId: this.node.id, multiple: event.shiftKey})
            }
        },
        onDrag(event) {
            this.moving(    // hacking: 回调DragonflyCanvasCore, 修改所有选择节点输入的position信息（同时可以影响到edge）
                event.offsetX - this.inDomOffset.x,
                event.offsetY - this.inDomOffset.y)
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
        },
        onDragEnd() {
            this.dragging = false
            document.removeEventListener('dragover', preventDefaultDrop)
        },
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
        this.resize(this.node.id, this.width, this.height)  // hacking: 回调DragonflyCanvasCore，提供尺寸信息
    },
    watch: {
        position(value) {
            this.x = value.x - this.width / 2
            this.y = value.y - this.height / 2
        }
    }
}
</script>

<style scoped lang="less">
.dragonfly-node {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    border: solid 1px transparent;
    box-sizing: border-box;

    &.selected {
        border: dashed 1px #777;
        user-select: none;
    }
}
</style>
