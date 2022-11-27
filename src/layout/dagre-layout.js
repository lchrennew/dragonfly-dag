import dagre from '../utils/dagre/index.js'

const dagreLayout = (nodes = [], positions = {}, edges = [], config = {}) => {
    const g = new dagre.graphlib.Graph({ multigraph: true })
    g.setGraph({ ...config })
    g.setDefaultEdgeLabel(() => ({}))
    nodes.forEach(node => g.setNode(node.id, {
        label: node.id,
        width: positions[node.id]?.width,
        height: positions[node.id]?.height,
    }))
    edges.forEach(edge => g.setEdge(edge.source, edge.target, { label: edge.id }))
    dagre.layout(g)
    return g
}

export default dagreLayout
