<template>
    <div class="dragonfly-minimap">
        <div class="canvas" :style="miniCanvasStyle">
            <div class="viewport" :style="miniViewportStyle"></div>
        </div>
    </div>
</template>

<script>
export default {
    name: "DragonflyMinimap",
    props: ['width', 'height', 'offsetX', 'offsetY', 'scale', 'positions'],
    data() {
        return {
            minimapWidth: 0,
            minimapHeight: 0,
        }
    },
    computed: {
        fullWidth() {
            return Math.max(this.width, this.width + this.offsetX, -this.offsetX) // TODO: 考虑positions
        },
        fullHeight() {
            return Math.max(this.height, this.height + this.offsetY, -this.offsetY) // TODO: 考虑positions
        },
        fullRatio() {
            return this.fullWidth / this.fullHeight || 1
        },
        canvasRatio() {
            return this.width / this.height || 1
        },
        miniRatio() {
            return this.minimapWidth / this.minimapHeight || 1
        },
        miniCanvasWidth() {
            return this.miniRatio < this.fullRatio ? this.minimapWidth : this.minimapHeight * this.canvasRatio
        },
        miniCanvasHeight() {
            return this.miniRatio > this.fullRatio ? this.minimapHeight : this.minimapWidth / this.canvasRatio
        },
        miniScale() {
            return this.miniCanvasWidth / this.width || this.miniCanvasHeight / this.height || 1
        },
        miniCanvasStyle() {
            return {
                width: `${this.miniCanvasWidth}px`,
                height: `${this.miniCanvasHeight}px`,
            }
        },
        miniViewportWidth() {
            return this.miniCanvasWidth / this.scale
        },
        miniViewportHeight() {
            return this.miniCanvasHeight / this.scale
        },
        miniViewportLeft() {
            return -this.offsetX * this.miniScale
        },
        miniViewportTop() {
            return -this.offsetY * this.miniScale
        },
        miniViewportStyle() {
            return {
                width: `${this.miniViewportWidth}px`,
                height: `${this.miniViewportHeight}px`,
                left: `${this.miniViewportLeft}px`,
                top: `${this.miniViewportTop}px`
            }
        }
    },
    mounted() {
        this.minimapWidth = this.$el.offsetWidth
        this.minimapHeight = this.$el.offsetHeight
    }
}
</script>

<style scoped>

</style>
