<template>
    <div
        class="dragonfly-endpoint"
        :class="{targeted}"
        @mousedown.stop="onMouseDown"
        :draggable="linkable"
        @dragstart="onDragStart"
        @drag.passive="onDrag"
        @dragend.prevent="onDragEnd"
        @dragenter.stop="onDragEnter"
        @dragleave.stop="onDragLeave"
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
        endpoint: {
            type: Object,
            required: true,
        },
        group: {
            type: [String, Object],
        }
    },
    inject: [
        'node',
        'endpointReposition',
        'canvasLinkable',
        'nodePosition',
        'getPosition',
        'startNodeLinking',
        'nodeLinking',
        'stopNodeLinking',
        'link',
        'orientation',
        'linkSource',
        'endpointGroup',
        'nodeDraggingBehavior',
        'select',
    ],
    data() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            targeted: false,
        }
    },
    computed: {
        linkable() {
            switch (this.nodeDraggingBehavior.value) {
                case 'link':
                    return this.endpoint.linkable ?? this.canvasLinkable.value ?? true
                default:
                    return false
            }
        },
        linkableOut() {
            return this.linkable && this.groupLinkOut(this.node, this.endpoint)
        },
        combinedGroup() {
            return this.endpoint.group
                ?? this.group
                ?? this.endpointGroup.value(this.endpoint)
        },

        groupName() {
            if (typeof this.combinedGroup === 'string') {
                return this.combinedGroup
            } else {
                return this.combinedGroup?.name
            }
        },
        groupLinkIn() {
            let {linkIn} = this.combinedGroup ?? {}

            if (typeof this.combinedGroup === 'string') {
                return ({sourceGroup}) => sourceGroup === this.combinedGroup
            } else if (linkIn === false) {
                return () => false
            } else if (linkIn === undefined) {
                return ({sourceGroup}) => this.groupName === sourceGroup
            } else if (typeof linkIn === 'string') {
                return ({sourceGroup}) => linkIn === sourceGroup
            } else if (linkIn instanceof Array) {
                return ({sourceGroup}) => linkIn.includes(sourceGroup)
            } else if (linkIn instanceof Function) {
                return linkIn
            } else {
                return () => {
                    return true
                }
            }
        },
        groupLinkOut() {
            let {linkOut} = this.combinedGroup ?? {}
            if (linkOut === false) {
                return () => false
            } else if (linkOut instanceof Function) {
                return linkOut
            } else {
                return () => true
            }
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
            this.select()
        },
        onDragStart(event) {
            if (this.linkableOut) {
                event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
                this.startNodeLinking({
                    source: this.node.value.id,
                    sourceEndpoint: this.endpoint.id,
                    sourceGroup: this.groupName
                })
                document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
            } else {
                event.stopPropagation()
                event.preventDefault()
            }
        },
        onDrag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            this.nodeLinking(
                this.position.x,
                this.position.y,
                this.width,
                this.height,
                this.orientation,
                event.offsetX + this.position.left,
                event.offsetY + this.position.top,
            )
        },
        onDragEnd() {
            document.removeEventListener('dragover', preventDefaultDrop)
            this.stopNodeLinking()
        },
        onDragEnter(event) {
            this.targeted =
                event.path.includes(event.toElement) &&
                this.groupLinkIn(this.linkSource.value)
        },
        onDragLeave(event) {
            if (!event.path.includes(this.fromElement))
                this.targeted = false
        },
        onDrop() {
            this.targeted = false
            const target = this.node.value.id,
                targetEndpoint = this.endpoint.id
            this.groupLinkIn(this.linkSource.value) && this.link(target, targetEndpoint)
        },
    },
    mounted() {
        this.width = this.$el.offsetWidth
        this.height = this.$el.offsetHeight
        const position = this.getPosition()
        // offset to node's center
        this.x = position.left + this.$el.offsetLeft + this.width / 2
        this.y = position.top + this.$el.offsetTop + this.height / 2
        this.endpointReposition(this.endpoint.id, this.x, this.y, this.width, this.height, this.orientation)
    }
}
</script>

<style scoped lang="less">
.dragonfly-endpoint {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 10px;
    border: solid 2px #777777;
    background-color: #fff;
    position: relative;

    &.targeted {
        border-color: #f00;
    }
}
</style>
