<template>
    <div :class="{ minimized }" class="dragonfly-minimap">
        <div ref="inner" class="dragonfly-minimap-inner">
            <div
                :style="miniFullStyle"
                class="map"
                @mousedown.stop="onMapClick"
            >
                <div class="thumbnail">
                    <svg
                        :viewBox="`${mostLeft} ${mostTop} ${fullWidth} ${fullHeight}`"
                        :y="0"
                        x="0"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            :height="height"
                            :stroke-width="4 / scale"
                            :width="width"
                            fill="#fff"
                            opacity="0.8"
                            stroke="#000"
                            stroke-opacity="0.5"
                            x="0"
                            y="0"
                        />
                        <rect
                            v-for="(value, id) in positions"
                            :key="id"
                            :height="value.height"
                            :width="value.width"
                            :x="value.x"
                            :y="value.y"
                            fill="#000"
                        />
                        <rect
                            :height="height / scale"
                            :width="width / scale"
                            :x="-offsetX / scale"
                            :y="-offsetY / scale"
                            cursor="move"
                            fill="#000"
                            opacity="0.2"
                            @dragstart="onDragStart"
                            @mouseenter="onMouseEnter"
                            @mouseleave="onMouseLeave"
                            @mousemove="onMouseMove"
                            @mouseup="onMouseUp"
                            @mousedown.stop="onMouseDown"
                        />
                    </svg>
                </div>
            </div>
        </div>
        <div class="switch" @click="minimized = !minimized">
            <svg
                height="100%"
                viewBox="0 0 24 24"
                width="100%"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    v-if="minimized"
                    d="M20,20 L4,4 M20,4 L4,4 M4,20 L4,4"
                    fill="none"
                    stroke="#000"
                    stroke-width="1"
                />
                <path
                    v-else
                    d="M4,4 L20,20 M4,20 L20,20 M20,4 L20,20"
                    fill="none"
                    stroke="#000"
                    stroke-width="1"
                />
            </svg>
        </div>
    </div>
</template>

<script>
import img from "../utils/empty-drag-image.js";
import preventDefaultDrop from "../utils/prevent-default-drop.js";

export default {
    name: "DragonflyMinimap",
    props: [ 'width', 'height', 'offsetX', 'offsetY', 'positions' ],
    inject: [ 'scale' ],
    data() {
        return {
            minimized: false,
            minimapWidth: 0,
            minimapHeight: 0,
            dragging: false,
            inDomOffset: { x: 0, y: 0 },
            draggingSnapshot: { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
            debtX: 0,
            debtY: 0,
            image: null,
            isMounted: false,
        }
    },
    computed: {
        positionArray() {
            return Object.keys(this.positions).map(id => {
                const { x, y, width = 0, height = 0 } = this.positions[id]
                return {
                    left: x,
                    top: y,
                    right: x + width,
                    bottom: y + height,
                }
            })
        },
        mostLeft() {
            return Math.min(0, -this.offsetX / this.scale, this.draggingSnapshot.left, ...this.positionArray.map(p => p.left))
        },
        mostRight() {
            return Math.max(this.width, (this.width - this.offsetX) / this.scale, this.draggingSnapshot.right, ...this.positionArray.map(p => p.right))
        },
        mostTop() {
            return Math.min(0, -this.offsetY / this.scale, this.draggingSnapshot.top, ...this.positionArray.map(p => p.top))
        },
        mostBottom() {
            return Math.max(this.height, (this.height - this.offsetY) / this.scale, this.draggingSnapshot.bottom, ...this.positionArray.map(p => p.bottom))
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
        miniViewportWidth() {
            return this.width / this.scale * this.miniRate
        },
        miniViewportHeight() {
            return this.height / this.scale * this.miniRate
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
            this.startDragging({ x: event.offsetX, y: event.offsetY })
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0},
        },
        updateOffsetOnMove(event, axis) {
            let debtName = `debt${axis}`
            let movement = event[`movement${axis}`]
            let debt = this[debtName]
            let offset = this[`offset${axis}`] / this.scale - movement / this.miniRate

            const { [`maxOffset${axis}`]: maxOffset, [`minOffset${axis}`]: minOffset, } = this.offsetRange

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
            this.$emit(`update:offset${axis}`, offset * this.scale)
        },
        onMouseMove(event) {
            if (this.dragging) {
                event.preventDefault()
                if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
                [ ...'XY' ].forEach(axis => this.updateOffsetOnMove(event, axis))
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
                document.addEventListener('mouseup', this.onMouseUpOutside, { once: true })
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
            let { offsetX, offsetY } = event
            this.$emit('update:offsetX', -this.mostLeft - offsetX / this.miniRate * this.scale + this.width / 2)
            this.$emit('update:offsetY', -this.mostTop - offsetY / this.miniRate * this.scale + this.height / 2)
            this.startDragging({ x: this.miniViewportWidth / 2, y: this.miniViewportHeight / 2 })
        },
    },
    mounted() {
        this.isMounted = true
        this.minimapWidth = this.$refs.inner.offsetWidth
        this.minimapHeight = this.$refs.inner.offsetHeight
    },
}
</script>
