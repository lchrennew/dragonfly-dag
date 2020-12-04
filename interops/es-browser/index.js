let feed = 1
let nodes = []
const dag = dragonfly.createDag('#app',
    {
        nodes,
        onUpdateNodes(newNodes) {
            nodes = newNodes
        },
        nodeRenderer(node) {
            const {h} = dragonfly
            return h('div', {class: 'node'}, `Hi, ${node.id}`)
        }
    })


const addNode = () => {
    nodes.push({id: feed++})
    dag.setNodes([...nodes])
}

