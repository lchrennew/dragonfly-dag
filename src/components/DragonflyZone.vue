<template>
    <div :class="{selected}"
         :style="style"
         class="dragonfly-zone"
    >
        <div class="dragonfly-zone-inner"
             draggable="true"
             @dragstart="onDragStart"
             @mousedown.stop="onMouseDown"
             @drag.passive="onDrag"
             @dragend.prevent="onDragEnd"
             @dragenter.stop="onDragEnter"
             @dragleave.stop="onDragLeave">
            <slot :zone="zone"/>
        </div>
        <template v-if="selected">
            <dragonfly-zone-resize-handler
                v-for="orientation in ['se', 'sw', 'ne', 'nw']"
                :key="orientation"
                :height="height"
                :left="left"
                :orientation="orientation"
                :top="top"
                :width="width"
                :id="id"
            />
        </template>
    </div>
</template>

<script>
import img from "../utils/emptyDragImage";
import preventDefaultDrop from "../utils/preventDefaultDrop";
import DragonflyZoneResizeHandler from "./DragonflyZoneResizeHandler.vue";

export default {
    name: "DragonflyZone",
    components: {DragonflyZoneResizeHandler},
    props: ['zone', 'selected', 'position'],
    inject: ['updatePosition', 'zoneMoving', 'minZoneWidth', 'minZoneHeight'],
    data() {
        return {
            inDomOffset: {x: 0, y: 0},
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
            return this.position?.width ?? this.minZoneWidth.value
        },
        height() {
            return this.position?.height ?? this.minZoneHeight.value
        },
        style() {
            return {
                width: `${this.width}px`,
                height: `${this.height}px`,
                left: `${this.left}px`,
                top: `${this.top}px`,
            }
        }
    },
    methods: {
        onMouseDown(event) {
            this.inDomOffset.x = event.offsetX
            this.inDomOffset.y = event.offsetY
            this.$emit('select', this.zone)
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
        },
        onDrag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            const deltaX = event.offsetX - this.inDomOffset.x
            const deltaY = event.offsetY - this.inDomOffset.y
            this.updatePosition({
                id: this.id,
                width: this.width,
                height: this.height,
                x: this.left + deltaX,
                y: this.top + deltaY,
            })
            this.zoneMoving(deltaX, deltaY)
        },
        onDragEnd(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
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
