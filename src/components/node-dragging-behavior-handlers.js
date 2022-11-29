import img from "../utils/empty-drag-image.js";
import preventDefaultDrop from "../utils/prevent-default-drop.js";

const getNodeDraggingHandlers = ({ data, props, computed, methods }) => ({
    move: {
        dragstart(event) {
            if (computed.draggable.value) {
                event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
                document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
                methods.startNodeMoving()
            }
        },
        drag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            if (computed.draggable.value) {
                methods.nodeMoving(    // hacking: 回调DragonflyCanvasCore, 修改所有选择节点输入的position信息（同时可以影响到edge）
                    Math.round(event.offsetX - data.inDomOffset.x),
                    Math.round(event.offsetY - data.inDomOffset.y),
                )
            }
        },
        dragend(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
            methods.stopNodeMoving()
        },
    },
    link: {
        dragstart(event) {
            if (computed.draggable.value) {
                event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
                computed.groupLinkOut.value(props.node) && methods.startNodeLinking({
                    source: props.node.id,
                    sourceGroup: computed.groupName.value,
                })
                document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
            }
        },
        drag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            if (computed.draggable.value) {
                methods.nodeLinking(
                    computed.position.value.x,
                    computed.position.value.y,
                    data.width,
                    data.height,
                    'right',
                    event.offsetX + computed.x.value,
                    event.offsetY + computed.y.value,
                )
            }
        },
        dragenter(event) {
            if (event.composedPath().includes(event.toElement))
                data.targeted = true
        },
        dragleave(event) {
            if (!event.composedPath().includes(event.fromElement))
                data.targeted = false
        },
        dragend(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
            methods.stopNodeLinking()
        },
    },
});

export default getNodeDraggingHandlers
