const getCanvasWheelingHandlers = ({ data, props, computed, emit, methods }) => ({
    zoom: {
        wheel(event) {
            event.preventDefault()
            if ((event.deltaY < 0 && computed.zoomScale <= props.minZoomScale) || (event.deltaY > 0 && computed.zoomScale >= props.maxZoomScale))
                return

            let scale = computed.zoomScale + props.zoomSensitivity * event.deltaY
            if (scale > props.maxZoomScale) scale = props.maxZoomScale
            else if (scale < props.minZoomScale) scale = props.minZoomScale

            const delta = scale - computed.zoomScale
            const rect = methods.getEl().getBoundingClientRect()
            data.offsetX += (data.offsetX + rect.left - event.clientX) * delta / computed.zoomScale
            data.offsetY += (data.offsetY + rect.top - event.clientY) * delta / computed.zoomScale
            computed.zoomScale = scale
            emit('update:zoomScale', scale)
        }
    },
    scroll: {
        wheel(event) {
            event.preventDefault()

            data.offsetX -= event.deltaX
            data.offsetY -= event.deltaY
        }
    },
    off: {},
});

export default getCanvasWheelingHandlers
