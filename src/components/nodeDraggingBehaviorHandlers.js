import img from "../utils/emptyDragImage";
import preventDefaultDrop from "../utils/preventDefaultDrop";

const nodeDraggingBehaviorHandlers = {
    move: {
        dragstart(event) {
            if (this.draggable) {
                event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
                document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
            }
        },
        drag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            if (this.draggable) {
                this.nodeMoving(    // hacking: 回调DragonflyCanvasCore, 修改所有选择节点输入的position信息（同时可以影响到edge）
                    event.offsetX - this.inDomOffset.x,
                    event.offsetY - this.inDomOffset.y,
                )
            }
        },
        dragend(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
        },
    },
    link: {
        dragstart(event) {
            if (this.draggable) {
                console.log('dragstart')
                event.dataTransfer.setDragImage(img, 0, 0)  // hacking: 用空svg图片隐藏DragImage
                this.groupLinkOut(this.node) && this.startNodeLinking({
                    source: this.node.id,
                    sourceGroup: this.groupName
                })
                document.addEventListener("dragover", preventDefaultDrop, false)    // hacking: 避免最后一次事件的坐标回到0,0
            }
        },
        drag(event) {
            if (!event.screenX && !event.screenY) return    // hacking: 防止拖出窗口位置被置为(0,0)
            if (this.draggable) {
                this.nodeLinking(
                    this.position.x,
                    this.position.y,
                    this.width,
                    this.height,
                    'right',
                    event.offsetX + this.x,
                    event.offsetY + this.y,
                )
            }
        },
        dragenter(event) {
            if (event.path.includes(event.toElement))
                this.targeted = true
        },
        dragleave(event) {
            if (!event.path.includes(this.fromElement))
                this.targeted = false
        },
        dragend(event) {
            document.removeEventListener('dragover', preventDefaultDrop)
            this.stopNodeLinking()
        },
        drop(event) {
            this.targeted = false
            const target = this.node.id
            console.log(this.linkableIn)
            if (this.linkableIn) {
                this.link(target)
            }
        },
    },
}
export default nodeDraggingBehaviorHandlers
