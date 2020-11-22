import dagre from 'dagre'


const dagreLayout = (nodes = [], nodeSizes = {}, edges = [], config = {}) => {
    console.log(config)
    const g = new dagre.graphlib.Graph({multigraph: true})
    g.setGraph({...config})
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
