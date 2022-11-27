<template>
    <div :class="{selected}"
         :style="style"
         class="dragonfly-zone"
    >
        <div :draggable="draggable"
             class="dragonfly-zone-inner"
             @dragstart="onDragStart"
             @mousedown.left.stop="onMouseDown"
             @drag.passive="onDrag"
             @dragend.prevent="onDragEnd"
             @dragenter.stop="onDragEnter"
             @dragleave.stop="onDragLeave">
            <slot :zone="zone"/>
        </div>
        <template v-if="!readOnly && selected">
            <dragonfly-zone-resize-handler
                v-for="orientation in ['se', 'sw', 'ne', 'nw']"
                :id="id"
                :key="orientation"
                :height="height"
                :left="left"
                :orientation="orientation"
                :top="top"
                :width="width"
            />
        </template>
    </div>
</template>

<script>
import img from "../utils/empty-drag-image.js";
import preventDefaultDrop from "../utils/prevent-default-drop.js";
import DragonflyZoneResizeHandler from "./DragonflyZoneResizeHandler.vue";

export default {
    name: "DragonflyZone",
    components: { DragonflyZoneResizeHandler },
    props: [ 'zone', 'selected', 'position' ],
    inject: [ 'updatePosition', 'zoneMoving', 'minZoneWidth', 'minZoneHeight', 'startZoneMoving', 'stopZoneMoving', 'scale', 'readOnly' ],
    data() {
        return {
            inDomOffset: { x: 0, y: 0 },
        }
    },
    computed: {
        id() {
            return this.zone.id
        },
        left() {
            return this.position?.x ?? 0
        },
        top() {
            return this.position?.y ?? 0
        },
        width() {
            return this.position?.width ?? this.minZoneWidth
        },
        height() {
            return this.position?.height ?? this.minZoneHeight
        },
        style() {
            return {
                width: `${this.width}px`,
                height: `${this.height}px`,
                left: `${this.left}px`,
                top: `${this.top}px`,
            }
        },
        draggable() {
            return !this.readOnly
        }
    },
    methods: {
        onMouseDown(event) {
            const rect = this.$el.getBoundingClientRect()
            this.inDomOffset.x = (event.x - rect.x) / this.scale
            this.inDomOffset.y = (event.y - rect.y) / this.scale

            if (this.selected) {
                event.shiftKey && this.$emit('unselect', this.zone.id, 'zone')
            } else {
                this.$emit('select', { id: this.zone.id, multiple: event.shiftKey, type: 'zone' })
            }
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
            this.startZoneMoving()
        },
        onDrag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            const deltaX = event.offsetX - this.inDomOffset.x
            const deltaY = event.offsetY - this.inDomOffset.y
            this.zoneMoving(deltaX, deltaY)
        },
        onDragEnd(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
            this.stopZoneMoving()
        },
        onDragEnter(event) {
            if (event.path.includes(event.toElement))
                this.targeted = true
        },
        onDragLeave(event) {
            if (!event.path.includes(this.fromElement))
                this.targeted = false
        },
    },
    mounted() {
        this.updatePosition(
            {
                id: this.id,
                x: this.left,
                y: this.top,
                width: this.width,
                height: this.height,
            }
        )
    }
}
</script>
