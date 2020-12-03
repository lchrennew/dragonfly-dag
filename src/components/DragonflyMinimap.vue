<template>
    <div class="dragonfly-minimap">
        <div class="dragonfly-minimap-inner" ref="inner">
            <div class="map" :style="miniFullStyle" @mousedown.stop="onMapClick">
                <div class="viewport"
                     :style="miniViewportStyle"
                     ref="viewport"
                     @mousedown.stop="onMouseDown"
                     @dragstart="onDragStart"
                     @mousemove="onMouseMove"
                     @mouseup="onMouseUp"
                     @mouseleave="onMouseLeave"
                     @mouseenter="onMouseEnter"/>
                <div class="canvas" :style="miniCanvasStyle"></div>
                <div class="thumbnail">
                    <svg xmlns="http://www.w3.org/2000/svg"
                         x="0"
                         :y="0"
                         :viewBox="`${mostLeft} ${mostTop} ${fullWidth} ${fullHeight}`">
                        <rect
                            v-for="(value, id) in positions"
                            :key="id"
                            :height="value.height"
                            :width="value.width"
                            :x="value.x"
                            :y="value.y"
                            fill="#000"
                        />
                    </svg>
                </div>
            </div>
        </div>
    </div>

</template>

<script>
import img from "../utils/emptyDragImage";
import preventDefaultDrop from "../utils/preventDefaultDrop";
import domtoimage from '@intactile/dom-to-image-next'

console.log(domtoimage)

export default {
    name: "DragonflyMinimap",
    props: ['width', 'height', 'offsetX', 'offsetY', 'scale', 'positions', 'history'],
    data() {
        return {
            minimapWidth: 0,
            minimapHeight: 0,
            dragging: false,
            inDomOffset: {x: 0, y: 0},
            draggingSnapshot: {left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity},
            debtX: 0,
            debtY: 0,
            image: null,
            isMounted: false,
        }
    },
    computed: {
        positionArray() {
            return Object.keys(this.positions).map(id => {
                const {x, y, width, height} = this.positions[id]
                return {
                    left: x,
                    top: y,
                    right: x + width,
                    bottom: y + height,
                }
            })
        },
        mostLeft() {
            return Math.min(0, -this.offsetX, this.draggingSnapshot.left, ...this.positionArray.map(p => p.left))
        },
        mostRight() {
            return Math.max(this.width, this.width / this.scale - this.offsetX, this.draggingSnapshot.right, ...this.positionArray.map(p => p.right))
        },
        mostTop() {
            return Math.min(0, -this.offsetY, this.draggingSnapshot.top, ...this.positionArray.map(p => p.top))
        },
        mostBottom() {
            return Math.max(this.height, this.height / this.scale - this.offsetY, this.draggingSnapshot.bottom, ...this.positionArray.map(p => p.bottom))
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
        },
        offsetRange() {
            return {
                maxOffsetX: -this.mostLeft,
                maxOffsetY: -this.mostTop,
                minOffsetX: -this.mostRight + this.width / this.scale,
                minOffsetY: -this.mostBottom + this.height / this.scale,
            }
        },
    },
    methods: {
        startDragging(inDomOffset) {
            this.dragging = true
            this.inDomOffset = inDomOffset
            this.draggingSnapshot = {
                left: this.mostLeft,
                right: this.mostRight,
                top: this.mostTop,
                bottom: this.mostBottom,
            }
        },
        onMouseDown(event) {
            this.startDragging({x: event.offsetX, y: event.offsetY})
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0},
        },
        updateOffsetOnMove(event, axis) {
            let axisName = axis.toUpperCase()
            let debtName = `debt${axisName}`
            let movement = event[`movement${axisName}`]
            let debt = this[debtName]
            let offset = this[`offset${axisName}`] - movement / this.miniRate

            const {[`maxOffset${axisName}`]: maxOffset, [`minOffset${axisName}`]: minOffset,} = this.offsetRange

            if (offset > maxOffset) {
                this[debtName] += Math.round((offset - maxOffset) * this.miniRate)
                offset = maxOffset
            } else if (offset < minOffset) {
                this[debtName] += Math.round((offset - minOffset) * this.miniRate)
                offset = minOffset
            } else if (debt) {
                debt -= movement
                if (debt * this[debtName] < 0)
                    debt = 0
                this[debtName] = debt
                return
            }
            this.$emit(`update:offset${axisName}`, offset)
        },
        onMouseMove(event) {
            if (this.dragging) {
                event.preventDefault()
                if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
                [...'xy'].forEach(axis => this.updateOffsetOnMove(event, axis))
            }
        },
        onMouseUp(event) {
            this.dragging = false
            this.draggingSnapshot = {
                left: Infinity,
                right: -Infinity,
                top: Infinity,
                bottom: -Infinity,
            }
            this.debtX = 0
            this.debtY = 0
        },
        onMouseLeave(event) {
            if (this.dragging) {
                document.addEventListener('mousemove', this.onMouseMove, false)
                document.addEventListener('mouseup', this.onMouseUpOutside, {once: true})
            }
        },
        onMouseEnter(event) {
            if (this.dragging) {
                document.removeEventListener('mousemove', this.onMouseMove)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
            }
        },
        onMouseUpOutside(event) {
            if (this.dragging) {
                document.removeEventListener('mousemove', this.onMouseMove)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
                this.onMouseUp(event)
            }
        },
        onMapClick(event) {
            let {offsetX, offsetY} = event
            this.$emit('update:offsetX', -this.mostLeft - offsetX / this.miniRate + this.width / 2 / this.scale)
            this.$emit('update:offsetY', -this.mostTop - offsetY / this.miniRate + this.height / 2 / this.scale)
            this.startDragging({x: this.miniViewportWidth / 2, y: this.miniViewportHeight / 2})
        },
    },
    mounted() {
        this.isMounted = true
        this.minimapWidth = this.$refs.inner.offsetWidth
        this.minimapHeight = this.$refs.inner.offsetHeight
    },
}
</script>

<style scoped>

</style>
