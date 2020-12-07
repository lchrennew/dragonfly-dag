const historyTraveller = {
    'nodes:added': {
        forward(added) {
            this.nodes = [...this.nodes, ...added]
        },
        back(added) {
            const hash = Object.fromEntries(added.map(node => {
                delete this.positions[node.id]
                return [node.id, true];
            }))
            this.nodes = this.nodes.filter(node => !hash[node.id])
        }
    },
    'nodes:deleted': {
        forward({nodes, positions, edges}) {
            const hash = Object.fromEntries(nodes.map(node => [node.id, true]))
            const edgeHash = Object.fromEntries(edges.map(edge => [edge.id, true]))
            this.nodes = this.nodes.filter(node => !hash[node.id])
            Object.keys(positions).forEach(id => delete this.positions[id])
            this.edges = this.edges.filter(edge => !edgeHash[edge.id])
        },
        back({nodes, positions, edges}) {
            this.nodes = [...this.nodes, ...nodes]
            this.positions = {...this.positions, ...positions}
            this.edges = [...this.edges, ...edges]
        }
    },
    'nodes:moved': {
        forward({target}) {
            this.positions = {...this.positions, ...target}
        },
        back({source}) {
            this.positions = {...this.positions, ...source}
        }
    },
    'edges:deleted': {
        forward(deleted) {
            const hash = Object.fromEntries(deleted.map(edge => [edge.id, true]))
            this.edges = this.edges.filter(edge => !hash[edge.id])
        },
        back(deleted) {
            this.edges = [...this.edges, ...deleted]
        },
    },
    'edges:added': {
        forward({edge}) {
            this.edges = [...this.edges, edge]
        },
        back({edge}) {
            this.edges = this.edges.filter(({id}) => id !== edge.id)
        },
    },
    'zones:deleted': {
        forward(deleted) {
            const hash = Object.fromEntries(deleted.map(zone => [zone.id, true]))
            this.zones = this.zones.filter(zone => !hash[zone.id])
        },
        back(deleted) {
            this.zones = [...this.zones, ...deleted]
        },
    },
    'zones:added': {
        forward(added) {
            this.zones = [...this.zones, ...added]
        },
        back(added) {
            const hash = Object.fromEntries(added.map(zone => [zone.id, true]))
            this.zones = this.zones.filter(zone => !hash[zone.id])
        },
    },
    'zones:moved': {
        forward({target, source}) {
            this.positions = {...this.positions, ...target}
        },
        back({target,source}) {
            this.positions = {...this.positions, ...source}
        },
    }
}
export default historyTraveller
