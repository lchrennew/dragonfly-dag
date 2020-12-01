<template>
    <div class="dragonfly-minimap" @mousedown.stop.prevent>
        <div class="dragonfly-minimap-inner" ref="inner">
            <div class="map" :style="miniFullStyle">
                <div class="viewport" :style="miniViewportStyle"></div>
                <div class="canvas" :style="miniCanvasStyle"></div>
            </div>
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
        positionArray() {
            return Object.keys(this.positions).map(id => {
                const {x, y, width, height} = this.positions[id]
                return {left: x, top: y, right: x + width, bottom: y + height}
            })
        },
        mostLeft() {
            return Math.min(0, -this.offsetX, ...this.positionArray.map(p => p.left))
        },
        mostRight() {
            return Math.max(this.width, this.width / this.scale - this.offsetX, ...this.positionArray.map(p => p.right))
        },
        mostTop() {
            return Math.min(0, -this.offsetY, ...this.positionArray.map(p => p.top))
        },
        mostBottom() {
            return Math.max(this.height, this.height / this.scale - this.offsetY, ...this.positionArray.map(p => p.bottom))
        },
        fullWidth() {
            return this.mostRight - this.mostLeft
        },
        fullHeight() {
            return this.mostBottom - this.mostTop
        },
        fullRatio() {
            return this.fullWidth / this.fullHeight || 1
        },
        miniRatio() {
            return this.minimapWidth / this.minimapHeight || 1
        },
        miniFullWidth() {
            return this.fullRatio > this.miniRatio ? this.minimapWidth : this.minimapHeight * this.fullRatio
        },
        miniFullHeight() {
            return this.fullRatio < this.miniRatio ? this.minimapHeight : this.minimapWidth / this.fullRatio
        },
        miniFullStyle() {
            return {
                width: `${this.miniFullWidth}px`,
                height: `${this.miniFullHeight}px`
            }
        },
        miniRate() {
            return this.miniFullWidth / this.fullWidth || 1
        },
        miniCanvasLeft() {
            return -this.mostLeft * this.miniRate
        },
        miniCanvasWidth() {
            return this.width * this.miniRate
        },
        miniCanvasTop() {
            return -this.mostTop * this.miniRate
        },
        miniCanvasHeight() {
            return this.height * this.miniRate
        },
        miniCanvasStyle() {
            return {
                width: `${this.miniCanvasWidth}px`,
                height: `${this.miniCanvasHeight}px`,
                top: `${this.miniCanvasTop}px`,
                left: `${this.miniCanvasLeft}px`,
            }
        },
        miniViewportLeft() {
            return (-this.mostLeft - this.offsetX) * this.miniRate
        },
        miniViewportWidth() {
            return this.width / this.scale * this.miniRate
        },
        miniViewportTop() {
            return (-this.mostTop - this.offsetY) * this.miniRate
        },
        miniViewportHeight() {
            return this.height / this.scale * this.miniRate
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
        this.minimapWidth = this.$refs.inner.offsetWidth
        this.minimapHeight = this.$refs.inner.offsetHeight
    }
}
</script>

<style scoped>

</style>
