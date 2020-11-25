const canvasDraggingBehaviorHandlers = {
    scroll: {
        mousedown(event) {
            if (this.movable) {
                this.draggingCanvas = true
                this.clearSelection()
            }
        },
        mouseleave(event) {
            if (this.draggingCanvas) {
                document.addEventListener('mousemove', this.onMove, false)
                document.addEventListener('mouseup', this.onMouseUpOutside, {once: true})
            }
        },
        mouseenter(event) {
            if (this.draggingCanvas) {
                document.removeEventListener('mousemove', this.onMove)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
            }
        },
        mousemove(event) {
            this.onMove(event)
        },
        mouseup(event) {
            this.draggingCanvas = false
        },
        mouseupOutside() {
            if (this.draggingCanvas) {
                document.removeEventListener('mousemove', this.onMove)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
                this.draggingCanvas = false
            }
        }
    },
    select: {
        mousedown(event) {
            const fromCanvas = event.target === this.$refs.canvas
            const insideCanvas = !fromCanvas && event.path.includes(this.$refs.canvas)
            if (!insideCanvas) {
                event.preventDefault()
                if (!event.shiftKey) this.clearSelection()
                this.draggingCanvas = true
                // hacking: 如果在canvas内开始选择，就不再需要去掉canvas相对于viewport的偏移
                this.selectingSource.x = this.selectingTarget.x = event.offsetX / (fromCanvas ? 1 : this.scale) - (fromCanvas ? 0 : this.offsetX / this.scale)
                this.selectingSource.y = this.selectingTarget.y = event.offsetY / (fromCanvas ? 1 : this.scale) - (fromCanvas ? 0 : this.offsetY / this.scale)
            }
        },
        mouseleave(event) {
            if (this.draggingCanvas) {
                document.addEventListener('mousemove', this.onSelecting, false)
                document.addEventListener('mouseup', this.onMouseUpOutside, {once: true})
            }
        },
        mouseenter(event) {
            if (this.draggingCanvas) {
                document.removeEventListener('mousemove', this.onSelecting)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
            }
        },
        mousemove(event) {
            this.onSelecting(event)
        },
        mouseup(event) {
            if (this.draggingCanvas) {
                this.syncSelectedFromSelectingSelected()
            }
        },
        mouseupOutside() {
            if (this.draggingCanvas) {
                document.removeEventListener('mousemove', this.onSelecting)
                document.removeEventListener('mouseup', this.onMouseUpOutside)
                this.syncSelectedFromSelectingSelected()
            }
        },
    },
    default: {
        mousedown(event) {
            this.clearSelection()
        },
    }
}

export default canvasDraggingBehaviorHandlers
