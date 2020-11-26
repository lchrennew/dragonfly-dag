const canvasWheelingBehaviorHandlers = {
    zoom: {
        wheel(event) {
            if ((event.deltaY < 0 && this.scale <= this.minZoomScale) || (event.deltaY > 0 && this.scale >= this.maxZoomScale))
                return

            let scale = this.scale + this.zoomSensitivity * event.deltaY
            if (scale > this.maxZoomScale) scale = this.maxZoomScale
            else if (scale < this.minZoomScale) scale = this.minZoomScale

            const delta = scale - this.scale
            const rect = this.$el.getBoundingClientRect()
            this.offsetX += (this.offsetX + rect.left - event.clientX) * delta / this.scale
            this.offsetY += (this.offsetY + rect.top - event.clientY) * delta / this.scale
            this.scale = scale
            this.$emit('updated:zoomScale', scale)
        }
    },
    scroll: {},
    off:{},
}
export default canvasWheelingBehaviorHandlers
