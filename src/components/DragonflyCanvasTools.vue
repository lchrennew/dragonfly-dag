<template>
    <div class="dragonfly-tools" @mousedown.stop>
        <button :class="{active: canvasDraggingBehavior==='off'}"
                @click="toggleCanvasDraggingBehavior('off')">锁定
        </button>
        <button :class="{active: canvasDraggingBehavior==='select'}"
                @click="toggleCanvasDraggingBehavior('select')">
            框选
        </button>
        <button :class="{active: canvasDraggingBehavior==='scroll'}"
                @click="toggleCanvasDraggingBehavior('scroll')">
            滚动
        </button>
        <button :class="{active: canvasDraggingBehavior==='zoom'}"
                @click="toggleCanvasDraggingBehavior('zoom')">缩放
        </button>
        <span>|</span>
        <button :class="{active: nodeDraggingBehavior==='off'}"
                @click="toggleNodeDraggingBehavior('off')">锁定
        </button>
        <button :class="{active: nodeDraggingBehavior==='move'}"
                @click="toggleNodeDraggingBehavior('move')">移动
        </button>
        <button :class="{active: nodeDraggingBehavior==='link'}"
                @click="toggleNodeDraggingBehavior('link')">连接
        </button>
        <span>|</span>
        <button :class="{active: canvasWheelingBehavior==='off'}"
                @click="toggleCanvasWheelingBehavior('off')">锁定
        </button>
        <button :class="{active: canvasWheelingBehavior==='zoom'}"
                @click="toggleCanvasWheelingBehavior('zoom')">缩放
        </button>
        <button :class="{active: canvasWheelingBehavior==='scroll'}"
                @click="toggleCanvasWheelingBehavior('scroll')">滚动
        </button>
    </div>
</template>

<script>
export default {
    name: "DragonflyCanvasTools",
    props: {
        nodeDraggingBehavior: {
            type: String,
            default: 'move',
            validate(value) {
                return [ 'off', 'move', 'link' ].includes(value)
            }
        },
        canvasDraggingBehavior: {
            type: String,
            default: 'select',
            validate(value) {
                return [ 'off', 'select', 'scroll', 'zoom' ].includes(value)
            }
        },
        canvasWheelingBehavior: {
            type: String,
            default: 'zoom',
            validate(value) {
                return [ 'off', 'scroll', 'zoom' ].includes(value)
            }
        },

    },
    methods: {
        toggleNodeDraggingBehavior(behavior) {
            this.$emit('update:nodeDraggingBehavior', this.nodeDraggingBehavior === behavior ? 'off' : behavior)
        },
        toggleCanvasDraggingBehavior(behavior) {
            this.$emit('update:canvasDraggingBehavior', this.canvasDraggingBehavior === behavior ? 'off' : behavior)
        },
        toggleCanvasWheelingBehavior(behavior) {
            this.$emit('update:canvasWheelingBehavior', this.canvasWheelingBehavior === behavior ? 'off' : behavior)
        }
    }
}
</script>
