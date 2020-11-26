const mouseupOutside = function (event) {
    if (this.dragging) {
        document.removeEventListener('mousemove', mousemoveOutsideHandler)
        document.removeEventListener('mouseup', mouseupOutsideHandler)
        mouseupOutsideHandler = null
        mousemoveOutsideHandler = null
        mouseup.call(this, event)
    }
}

let mouseupOutsideHandler
let mousemoveOutsideHandler

const mousedown = function (event) {
    if (!event.shiftKey) this.clearSelection()
    const fromCanvas = event.target === this.$refs.canvas
    const insideCanvas = !fromCanvas && event.path.includes(this.$refs.canvas)
    if (!insideCanvas) {
        event.preventDefault()

        this.dragging = true
        // hacking: 如果在canvas内开始选择，就不再需要去掉canvas相对于viewport的偏移
        this.draggingSource.x = this.draggingTarget.x = event.offsetX / (fromCanvas ? 1 : this.scale) - (fromCanvas ? 0 : this.offsetX / this.scale)
        this.draggingSource.y = this.draggingTarget.y = event.offsetY / (fromCanvas ? 1 : this.scale) - (fromCanvas ? 0 : this.offsetY / this.scale)
        this[`${this.canvasDraggingBehavior}DraggingStart`]?.(event)
    }
}

const mouseleave = function (event) {
    if (this.dragging) {
        mouseupOutsideHandler = mouseupOutside.bind(this)
        mousemoveOutsideHandler = mousemove.bind(this)
        document.addEventListener('mousemove', mousemoveOutsideHandler, false)
        document.addEventListener('mouseup', mouseupOutsideHandler, {once: true})
    }
}

const mouseenter = function (event) {
    if (this.dragging) {
        document.removeEventListener('mousemove', mousemoveOutsideHandler)
        document.removeEventListener('mouseup', mouseupOutsideHandler)
        mouseupOutsideHandler = null
        mousemoveOutsideHandler = null
    }
}

const mousemove = function (event) {
    if (this.dragging) {
        event.preventDefault()  // hacking: 避免移动时选择外部文本
        this[`${this.canvasDraggingBehavior}Dragging`]?.(event)
    }
}

const mouseup = function (event) {
    if (this.dragging) {
        this.dragging = false
        this[`${this.canvasDraggingBehavior}DraggingEnd`]?.(event)
    }
}

export default {
    mousedown,
    mouseleave,
    mouseenter,
    mousemove,
    mouseup,
}
