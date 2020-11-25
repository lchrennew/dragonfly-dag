<template>
    <div
        class="dragonfly-node"
        :class="{selected, targeted}"
        :style="{left: `${x}px`, top:`${y}px`}"
    >
        <div class="dragonfly-node-inner"
             ref="inner"
             @mousedown.stop="onMouseDown"
             :draggable="draggable||linkableOut"
             @drop="onDrop"
             @dragstart="onDragStart"
             @drag.passive="onDrag"
             @dragend.prevent="onDragEnd"
             @dragenter.stop="onDragEnter"
             @dragleave.stop="onDragLeave"
        >
            <slot/>
        </div>
        <dragonfly-endpoints
            orientation="left"
            :endpoints="leftEndpoints"
        >
            <slot name="leftEndpoints"/>
        </dragonfly-endpoints>
        <dragonfly-endpoints
            orientation="right"
            :endpoints="rightEndpoints"
        >
            <slot name="rightEndpoints"/>
        </dragonfly-endpoints>
        <dragonfly-endpoints
            orientation="top"
            :endpoints="topEndpoints"
        >
            <slot name="topEndpoints"/>
        </dragonfly-endpoints>
        <dragonfly-endpoints
            orientation="bottom"
            :endpoints="bottomEndpoints"
        >
            <slot name="bottomEndpoints"/>
        </dragonfly-endpoints>
    </div>
</template>

<script>
import img from '../utils/emptyDragImage.js'
import DragonflyEndpoint from "./DragonflyEndpoint.vue";
import {computed} from 'vue'
import preventDefaultDrop from '../utils/preventDefaultDrop'
import DragonflyEndpoints from "./DragonflyEndpoints.vue";

export default {
    name: "DragonflyNode",
    components: {DragonflyEndpoints, DragonflyEndpoint},
    props: ['node', 'selected', 'group'],
    data() {
        return {
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            inDomOffset: {x: 0, y: 0},
            targeted: false,
            endPointRefs: [],
        }
    },
    inject: [
        'nodeResize',
        'nodeMoving',
        'startNodeLinking',
        'nodeLinking',
        'stopNodeLinking',
        'positions',
        'canvasDraggable',
        'canvasLinkable',
        'link',
        'linkSource'],
    provide() {
        return {
            node: computed(() => this.node),
            nodePosition: computed(() => this.position),
        }
    },
    computed: {
        groupName() {
            if (typeof this.group === 'string') {
                return this.group
            } else {
                return this.group?.name
            }
        },
        groupLinkIn() {
            let {linkIn} = this.group ?? {}

            if (typeof this.group === 'string') {
                return ({sourceGroup}) => sourceGroup === this.group
            } else if (linkIn === false) {
                return () => false
            } else if (linkIn === undefined) {
                return ({sourceGroup}) => name === sourceGroup
            } else if (typeof linkIn === 'string') {
                return ({sourceGroup}) => linkIn === sourceGroup
            } else if (linkIn instanceof Array) {
                return ({sourceGroup}) => linkIn.includes(sourceGroup)
            } else if (linkIn instanceof Function) {
                return linkIn
            } else {
                return () => true
            }
        },
        groupLinkOut() {
            let {linkOut} = this.group ?? {}
            if (linkOut === false) {
                return () => false
            } else if (linkOut instanceof Function) {
                return linkOut
            } else {
                return () => true
            }
        },

        draggable() {
            return this.node.draggable ?? this.canvasDraggable.value
        },
        linkable() {
            return this.node.linkable ?? this.canvasLinkable.value
        },
        linkableOut() {
            return this.linkable && this.groupLinkOut(this.node)
        },
        linkableIn() {
            return this.linkable && this.groupLinkIn(this.linkSource.value)
        },
        position() {
            return this.positions.value[this.node.id]
        },
        leftEndpoints() {
            return this.node.endpoints ? this.node.endpoints.filter(endpoint => !endpoint.position || (endpoint.position === 'left')) : undefined
        },
        rightEndpoints() {
            return this.node.endpoints ? this.node.endpoints.filter(endpoint => endpoint.position === 'right') : undefined
        },
        topEndpoints() {
            return this.node.endpoints ? this.node.endpoints.filter(endpoint => endpoint.position === 'top') : undefined
        },
        bottomEndpoints() {
            return this.node.endpoints ? this.node.endpoints.filter(endpoint => endpoint.position === 'bottom') : undefined
        },
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
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)

            if (this.draggable) {
                this.nodeMoving(    // hacking: 回调DragonflyCanvasCore, 修改所有选择节点输入的position信息（同时可以影响到edge）
                    event.offsetX - this.inDomOffset.x,
                    event.offsetY - this.inDomOffset.y,
                )
            } else if (this.linkableOut) {
                this.nodeLinking(
                    this.position.x,
                    this.position.y,
                    this.width,
                    this.height,
                    'right',
                    event.offsetX + this.x,
                    event.offsetY + this.y,
                )
            }
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            if (this.draggable) {
                // TODO: start moving
            } else if (this.linkableOut) {
                this.groupLinkOut(this.node) && this.startNodeLinking({
                    source: this.node.id,
                    sourceGroup: this.groupName
                })
            }
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
        },
        onDragEnter(event) {
            if (event.path.includes(event.toElement))
                this.targeted = true
        },
        onDragLeave(event) {
            if (!event.path.includes(this.fromElement))
                this.targeted = false
        },
        onDragEnd() {
            document.removeEventListener('dragover', preventDefaultDrop)
            this.stopNodeLinking()
        },
        onDrop() {
            this.targeted = false
            const target = this.node.id
            if (this.draggable) {
                // TODO: moving stopped
            } else if (this.linkableIn) {
                this.link(target)
            }
        },
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
        this.x = this.position?.x ?? 0 - this.width / 2
        this.y = this.position?.y ?? 0 - this.height / 2
        this.nodeResize(this.node.id, this.width, this.height)  // hacking: 回调DragonflyCanvasCore，提供尺寸信息
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
    z-index: 3;
    border: solid 1px transparent;
    box-sizing: border-box;

    &.selected {
        border: dashed 1px #777;
        z-index: 4;
    }

    &:not(.selected).targeted {
        border: solid 1px #f00;
    }

    .dragonfly-node-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        z-index: 1;
    }


}
</style>
