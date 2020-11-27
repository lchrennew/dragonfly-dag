<template>
    <div class="dragonfly-tools" @mousedown.stop>
        <button @click="toggleCanvasDraggingBehavior('off')"
                :class="{active: canvasDraggingBehavior==='off'}">锁定
        </button>
        <button @click="toggleCanvasDraggingBehavior('select')"
                :class="{active: canvasDraggingBehavior==='select'}">
            框选
        </button>
        <button @click="toggleCanvasDraggingBehavior('scroll')"
                :class="{active: canvasDraggingBehavior==='scroll'}">
            滚动
        </button>
        <button @click="toggleCanvasDraggingBehavior('zoom')"
                :class="{active: canvasDraggingBehavior==='zoom'}">缩放
        </button>
        <span>|</span>
        <button @click="toggleNodeDraggingBehavior('off')"
                :class="{active: nodeDraggingBehavior==='off'}">锁定
        </button>
        <button @click="toggleNodeDraggingBehavior('move')"
                :class="{active: nodeDraggingBehavior==='move'}">移动
        </button>
        <button @click="toggleNodeDraggingBehavior('link')"
                :class="{active: nodeDraggingBehavior==='link'}">连接
        </button>
        <span>|</span>
        <button @click="toggleCanvasWheelingBehavior('off')"
                :class="{active: canvasWheelingBehavior==='off'}">锁定
        </button>
        <button @click="toggleCanvasWheelingBehavior('zoom')"
                :class="{active: canvasWheelingBehavior==='zoom'}">缩放
        </button>
        <button @click="toggleCanvasWheelingBehavior('scroll')"
                :class="{active: canvasWheelingBehavior==='scroll'}">滚动
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
                return ['off', 'move', 'link'].includes(value)
            }
        },
        canvasDraggingBehavior: {
            type: String,
            default: 'select',
            validate(value) {
                return ['off', 'select', 'scroll', 'zoom'].includes(value)
            }
        },
        canvasWheelingBehavior: {
            type: String,
            default: 'zoom',
            validate(value) {
                return ['off', 'scroll', 'zoom'].includes(value)
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
