const getCanvasDraggingHandlers = ({ methods, data, props, computed }) => {
    const mouseupOutside = event => {
        if (data.dragging) {
            document.removeEventListener('mousemove', mousemoveOutsideHandler)
            document.removeEventListener('mouseup', mouseupOutsideHandler)
            mouseupOutsideHandler = null
            mousemoveOutsideHandler = null
            mouseup(event)
        }
    }

    let mouseupOutsideHandler
    let mousemoveOutsideHandler

    const mousedown = event => {
        if (!event.shiftKey) methods.clearSelection()
        const canvas = methods.getCanvas()
        const fromCanvas = event.target === canvas
        fromCanvas && canvas.focus({ preventScroll: true }) // hacking: 用这个方式来获取keydown事件，必须结合canvas的tabindex属性，并防止获得焦点时滚动屏幕
        const insideCanvas = !fromCanvas && event.composedPath().includes(canvas)
        if (!insideCanvas) {
            event.preventDefault()

            data.dragging = true
            // hacking: 如果在canvas内开始选择，就不再需要去掉canvas相对于viewport的偏移
            data.draggingSource.x = data.draggingTarget.x = event.offsetX / (fromCanvas ? 1 : computed.zoomScale) - (fromCanvas ? 0 : data.offsetX / data.scale)
            data.draggingSource.y = data.draggingTarget.y = event.offsetY / (fromCanvas ? 1 : computed.zoomScale) - (fromCanvas ? 0 : data.offsetY / data.scale)
            methods[`${props.canvasDragging}DraggingStart`]?.(event)
        }
    }

    const mouseleave = event => {
        if (data.dragging) {
            mouseupOutsideHandler = mouseupOutside
            mousemoveOutsideHandler = mousemove
            document.addEventListener('mousemove', mousemoveOutsideHandler, false)
            document.addEventListener('mouseup', mouseupOutsideHandler, { once: true })
        }
    }

    const mouseenter = event => {
        if (data.dragging) {
            document.removeEventListener('mousemove', mousemoveOutsideHandler)
            document.removeEventListener('mouseup', mouseupOutsideHandler)
            mouseupOutsideHandler = null
            mousemoveOutsideHandler = null
        }
    }

    const mousemove = event => {
        if (data.dragging) {
            event.preventDefault()  // hacking: 避免移动时选择外部文本
            methods[`${props.canvasDragging}Dragging`]?.(event)
        }
    }

    const mouseup = event => {
        if (data.dragging) {
            data.dragging = false
            methods[`${props.canvasDragging}DraggingEnd`]?.(event)
        }
    }
    return { mouseup, mousedown, mousemove, mouseleave, mouseenter };
};


export default getCanvasDraggingHandlers
