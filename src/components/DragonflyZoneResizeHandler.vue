<template>
    <div class="anchor"
         :class="orientation"
         draggable="true"
         @mousedown.stop="onMouseDown"
         @dragstart="onDragStart"
         @drag.passive="onDrag"
         @dragend.prevent="onDragEnd"
    ></div>
</template>

<script>
import img from "../utils/emptyDragImage";
import preventDefaultDrop from "../utils/preventDefaultDrop";

const vectors = { // fx, fy, fw, fh
    ne: [0, 1, 1, -1],
    se: [0, 0, 1, 1],
    nw: [1, 1, -1, -1],
    sw: [1, 0, -1, 1],
}
export default {
    name: "DragonflyZoneResizeHandler",
    props: ['orientation', 'left', 'top', 'width', 'height', 'zone'],
    inject: ['updateZone', 'minZoneWidth', 'minZoneHeight'],
    data() {
        return {
            inDomOffset: {x: 0, y: 0},
        }
    },
    methods: {
        onMouseDown(event) {
            this.inDomOffset.x = event.offsetX
            this.inDomOffset.y = event.offsetY
        },
        onDragStart(event) {
            event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
            document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
        },
        onDrag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            const [fx, fy, fw, fh] = vectors[this.orientation]
            let x = this.left + fx * (event.offsetX - this.inDomOffset.x),
                y = this.top + fy * (event.offsetY - this.inDomOffset.y),
                width = this.width + fw * (event.offsetX - this.inDomOffset.x),
                height = this.height + fh * (event.offsetY - this.inDomOffset.y)
            const minWidth = this.minZoneWidth.value, minHeight = this.minZoneHeight.value
            if (height < minHeight) {
                y -= fy * (minHeight - height)
                height = minHeight
            }
            if (width < minWidth) {
                x -= fx * (minWidth - width)
                width = minWidth
            }
            const zone = {...this.zone, x, y, width, height,}
            this.updateZone(zone)
        },
        onDragEnd(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
        }
    }
}
</script>

<style scoped>

</style>
