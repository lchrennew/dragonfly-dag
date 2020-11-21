import dagre from 'dagre'

const dagreLayout = (nodes = [], nodeSizes = {}, edges = []) => {
    const g = new dagre.graphlib.Graph()
    g.setGraph({})
    g.setDefaultEdgeLabel(() => ({}))
    nodes.forEach(node => g.setNode(node.id, {
        label: node.id,
        width: nodeSizes[node.id]?.width,
        height: nodeSizes[node.id]?.height,
    }))
    edges.forEach(edge => g.setEdge(edge.source, edge.target, {label: edge.id}))
    dagre.layout(g)
    return g
}

export default dagreLayout
