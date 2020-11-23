<template>
    <div
        class="dragonfly-node"
        :class="{selected, targeted}"
        :style="{left: `${x}px`, top:`${y}px`}"
    >
        <div class="dragonfly-node-inner"
             ref="inner"
             @mousedown.stop="onMouseDown"
             :draggable="draggable||linkable"
             @drop="onDrop"
             @dragstart="onDragStart"
             @drag.passive="onDrag"
             @dragend.prevent="onDragEnd"
             @dragenter.stop="onDragEnter"
             @dragleave.stop="onDragLeave"
        >
            <slot/>
        </div>
        <div class="dragonfly-endpoints left">
            <template v-if="leftEndpoints">
                <dragonfly-endpoint
                    v-for="endpoint in leftEndpoints"
                    :key="endpoint.key"
                    :id="endpoint.id"
                />
            </template>
            <slot v-else name="leftEndpoints"/>
        </div>
        <div class="dragonfly-endpoints right">
            <template v-if="rightEndpoints">
                <dragonfly-endpoint
                    v-for="endpoint in rightEndpoints"
                    :key="endpoint.key"
                    :id="endpoint.id"
                />
            </template>
            <slot v-else name="rightEndpoints"/>
        </div>
        <div class="dragonfly-endpoints top">
            <template v-if="topEndpoints">
                <dragonfly-endpoint
                    v-for="endpoint in topEndpoints"
                    :key="endpoint.key"
                    :id="endpoint.id"
                />
            </template>
            <slot v-else name="topEndpoints"/>
        </div>
        <div class="dragonfly-endpoints bottom">
            <template v-if="bottomEndpoints">
                <dragonfly-endpoint
                    v-for="endpoint in bottomEndpoints"
                    :key="endpoint.key"
                    :id="endpoint.id"
                />
            </template>
            <slot v-else name="bottomEndpoints"/>
        </div>
        <div class="dragonfly-endpoints left-top">
            <slot name="leftTopEndpoints"/>
        </div>
        <div class="dragonfly-endpoints left-bottom">
            <slot name="leftBottomEndpoints"/>
        </div>
        <div class="dragonfly-endpoints right-top">
            <slot name="rightTopEndpoints"/>
        </div>
        <div class="dragonfly-endpoints right-bottom">
            <slot name="rightBottomEndpoints"/>
        </div>
    </div>
</template>

<script>
import img from '../utils/emptyDragImage.js'
import DragonflyEndpoint from "./DragonflyEndpoint.vue";
import {computed} from 'vue'

const preventDefaultDrop = event => event.preventDefault()

export default {
    name: "DragonflyNode",
    components: {DragonflyEndpoint},
    props: ['node', 'selected'],
    data() {
        return {
            width: 0,
            height: 0,
            x: this.position?.x ?? 0,
            y: this.position?.y ?? 0,
            inDomOffset: {x: 0, y: 0},
            targeted: false,
            endPointRefs: [],
        }
    },
    inject: ['nodeResize', 'nodeMoving', 'nodeLinking', 'stopNodeLinking', 'positions', 'canvasDraggable', 'canvasLinkable'],
    provide() {
        return {
            node: computed(() => this.node)
        }
    },
    computed: {
        draggable() {
            return this.node.draggable ?? this.canvasDraggable.value
        },
        linkable() {
            return this.node.linkable ?? this.canvasLinkable.value
        },
        position() {
            return this.positions.value[this.node.id]
        },
        center() {
            return {x: this.x + this.width / 2, y: this.y + this.height / 2}
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
                    event.offsetY - this.inDomOffset.y
                )
            } else if (this.linkable) {
                this.nodeLinking(
                    this.center.x,
                    this.center.y,
                    event.offsetX + this.x,
                    event.offsetY + this.y,
                )
            }
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            event.dataTransfer.setData('text', this.node.id)
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
        onDrop(event) {
            this.targeted = false
            const target = this.node.id,
                source = event.dataTransfer.getData('text'),
                linkToSelf = target === source
            !linkToSelf && this.$emit('link:node', {target, source})
        },
    },
    mounted() {
        this.width = this.$el.clientWidth
        this.height = this.$el.clientHeight
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
    margin: -1px;
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

    .dragonfly-endpoints {
        position: absolute;
        overflow: visible;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        z-index: 2;

        &.left {
            left: 0;
            top: 0;
            height: 100%;
            width: 0;
            flex-direction: column;
        }

        &.right {
            right: 0;
            top: 0;
            height: 100%;
            width: 0;
            flex-direction: column;
        }

        &.top {
            top: 0;
            left: 0;
            width: 100%;
            height: 0;
            flex-direction: row;
        }

        &.bottom {
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0;
            flex-direction: row;
        }

        &.left-top {
            width: 0;
            height: 0;
            left: 0;
            top: 0;
        }

        &.left-bottom {
            width: 0;
            height: 0;
            left: 0;
            bottom: 0;
        }

        &.right-top {
            width: 0;
            height: 0;
            right: 0;
            top: 0;
        }

        &.right-bottom {
            width: 0;
            height: 0;
            right: 0;
            bottom: 0;
        }
    }
}
</style>
