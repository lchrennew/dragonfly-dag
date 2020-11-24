<template>
    <div
        class="dragonfly-endpoint"
        @mousedown.stop="onMouseDown"
        draggable="true"
        @dragstart="onDragStart"
        @drag.passive="onDrag"
        @dragend.prevent="onDragEnd"
        @drop="onDrop"
    >
        <slot/>
    </div>
</template>

<script>
import img from "../utils/emptyDragImage";
import preventDefaultDrop from "../utils/preventDefaultDrop";

export default {
    name: "DragonflyEndpoint",
    props: {
        id: {
            type: String,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
    },
    inject: ['node', 'endpointReposition', 'nodeLinkable', 'nodePosition', 'getPosition', 'nodeLinking', 'stopNodeLinking', 'link', 'orientation'],
    data() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
    },
    computed: {
        linkable() {
            return this.nodeLinkable.value && this.enabled
        },
        position() {
            const x = this.x + (this.nodePosition.value?.x ?? 0)
            const y = this.y + (this.nodePosition.value?.y ?? 0)
            return {
                width: this.width,
                height: this.height,
                left: x - this.width / 2,
                top: y - this.height / 2,
                orientation: this.orientation,
                x,
                y,
            }
        },
    },
    methods: {
        onMouseDown() {
            console.log('mouse down')
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            event.dataTransfer.setData('text', JSON.stringify({
                source: this.node.value.id,
                sourceEndpoint: this.id,
            }))
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
        },
        onDrag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)

            if (this.linkable) {
                this.nodeLinking(
                    this.position.x,
                    this.position.y,
                    this.width,
                    this.height,
                    this.orientation,
                    event.offsetX + this.position.left,
                    event.offsetY + this.position.top,
                )
            }
        },
        onDragEnd() {
            document.removeEventListener('dragover', preventDefaultDrop)
            this.stopNodeLinking()
        },
        onDrop(event) {
            const target = this.node.value.id,
                targetEndpoint = this.id,
                {source, sourceEndpoint} = JSON.parse(event.dataTransfer.getData('text')),
                linkToSelf = target === source
            !linkToSelf && this.link(target, source, sourceEndpoint, targetEndpoint)
        },
    },
    mounted() {
        this.width = this.$el.offsetWidth
        this.height = this.$el.offsetHeight
        const position = this.getPosition()
        // offset to node's center
        this.x = position.left + this.$el.offsetLeft + this.width / 2
        this.y = position.top + this.$el.offsetTop + this.height / 2
        this.endpointReposition(this.id, this.x, this.y, this.width, this.height, this.orientation)
    }
}
</script>

<style scoped lang="less">
.dragonfly-endpoint {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 10px;
    border: solid 2px #ff7700;
    background-color: #fff;
    position: relative;
}
</style>
