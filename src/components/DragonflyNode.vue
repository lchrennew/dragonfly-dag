<template>
    <div
        class="dragonfly-node"
        :class="{selected, targeted}"
        :style="{left: `${x}px`, top:`${y}px`}"
    >
        <div class="dragonfly-node-inner"
             ref="inner"
             @mousedown.stop="onMouseDown"
             :draggable="draggable"
             @drop="onNodeDragging"
             @dragstart="onNodeDragging"
             @drag.passive="onNodeDragging"
             @dragend.prevent="onNodeDragging"
             @dragenter.stop="onNodeDragging"
             @dragleave.stop="onNodeDragging"
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
import DragonflyEndpoint from "./DragonflyEndpoint.vue";
import {computed} from 'vue'
import DragonflyEndpoints from "./DragonflyEndpoints.vue";
import nodeDraggingBehaviorHandlers from "./nodeDraggingBehaviorHandlers";

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
        'link',
        'linkSource',
        'nodeDraggingBehavior',
    ],
    provide() {
        return {
            node: computed(() => this.node),
            nodePosition: computed(() => this.position),
            select: () => this.$emit('select', {nodeId: this.node.id})
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
            switch (this.nodeDraggingBehavior.value) {
                case 'move':
                    return this.node.draggable ?? true
                case 'link':
                    return (this.node.linkable ?? true) && this.groupLinkOut(this.node)
                default:
                    return false
            }

        },
        linkableIn() {
            return (this.node.linkable ?? true) && this.groupLinkIn(this.linkSource.value)
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
        onNodeDragging(event) {
            nodeDraggingBehaviorHandlers[this.nodeDraggingBehavior.value]?.[event.type]?.call(this, event)
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
