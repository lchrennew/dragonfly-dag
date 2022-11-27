<template>
    <div
        :class="{targeted,[endpoint.className]:endpoint.className}"
        :draggable="linkable"
        class="dragonfly-endpoint"
        @dragstart="onDragStart"
        @drop="onDrop"
        @mousedown.stop="onMouseDown"
        @drag.passive="onDrag"
        @dragend.prevent="onDragEnd"
        @dragenter.stop="onDragEnter"
        @dragleave.stop="onDragLeave"
    >
        <div v-if="endpoint.label || label"
             :class="{[endpoint.labelClassName]:endpoint.labelClassName, [labelClass]:labelClass}"
             class="label">
            {{ endpoint.label ?? label }}
        </div>
        <slot/>
    </div>
</template>

<script>
import img from "../utils/empty-drag-image.js";
import preventDefaultDrop from "../utils/prevent-default-drop.js";

export default {
    name: "DragonflyEndpoint",
    props: {
        endpoint: {
            type: Object,
            required: true,
        },
        group: {
            type: [ String, Object ],
        },
        label: {
            type: String
        },
        labelClass: {
            type: String
        }
    },
    inject: [
        'node',
        'endpointReposition',
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
        'endpointDraggingBehavior',
        'select',
        'readOnly',
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
            if (this.readOnly) return false
            switch (this.endpointDraggingBehavior) {
                case 'on':
                    return this.endpoint.linkable ?? true
                case 'node':
                    switch (this.nodeDraggingBehavior) {
                        case 'link':
                            return this.endpoint.linkable ?? true
                        default:
                            return false
                    }
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
                ?? this.endpointGroup(this.endpoint)
        },

        groupName() {
            if (typeof this.combinedGroup === 'string') {
                return this.combinedGroup
            } else {
                return this.combinedGroup?.name
            }
        },
        groupLinkIn() {
            let { linkIn } = this.combinedGroup ?? {}

            if (typeof this.combinedGroup === 'string') {
                return ({ sourceGroup }) => sourceGroup === this.combinedGroup
            } else if (linkIn === false) {
                return () => false
            } else if (linkIn === undefined) {
                return ({ sourceGroup }) => this.groupName === sourceGroup
            } else if (typeof linkIn === 'string') {
                return ({ sourceGroup }) => linkIn === sourceGroup
            } else if (linkIn instanceof Array) {
                return ({ sourceGroup }) => linkIn.includes(sourceGroup)
            } else if (linkIn instanceof Function) {
                return linkIn
            } else {
                return () => {
                    return true
                }
            }
        },
        groupLinkOut() {
            let { linkOut } = this.combinedGroup ?? {}
            if (linkOut === false) {
                return () => false
            } else if (linkOut instanceof Function) {
                return linkOut
            } else {
                return () => true
            }
        },
        position() {
            const x = this.x + (this.nodePosition?.x ?? 0)
            const y = this.y + (this.nodePosition?.y ?? 0)
            return {
                width: this.width,
                height: this.height,
                left: x,
                top: y,
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
                    source: this.node.id,
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
                (event.offsetX + this.position.x),
                (event.offsetY + this.position.y),
            )
        },
        onDragEnd() {
            document.removeEventListener('dragover', preventDefaultDrop)
            this.stopNodeLinking()
        },
        onDragEnter(event) {
            this.targeted =
                event.path.includes(event.toElement) &&
                this.groupLinkIn(this.linkSource)
        },
        onDragLeave(event) {
            if (!event.path.includes(this.fromElement))
                this.targeted = false
        },
        onDrop() {
            this.targeted = false
            const target = this.node.id,
                targetEndpoint = this.endpoint.id
            this.groupLinkIn(this.linkSource) && this.link(target, targetEndpoint)
        },
    },
    mounted() {
        this.width = this.$el.offsetWidth
        this.height = this.$el.offsetHeight
        const position = this.getPosition()
        // 锚点左上角相对节点左上角的偏移
        this.x = position.left + this.$el.offsetLeft
        this.y = position.top + this.$el.offsetTop
        this.endpointReposition(this.endpoint.id, this.x, this.y, this.width, this.height, this.orientation)
    }
}
</script>
