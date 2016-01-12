import * as hoof from '../../src/library.ts';
let React = hoof.React;

let graph = {
    "nodes": [
        {"x": 469, "y": 410},
        {"x": 493, "y": 364},
        {"x": 442, "y": 365},
        {"x": 467, "y": 314},
        {"x": 477, "y": 248},
        {"x": 425, "y": 207},
        {"x": 402, "y": 155},
        {"x": 369, "y": 196},
        {"x": 350, "y": 148},
        {"x": 539, "y": 222},
        {"x": 594, "y": 235},
        {"x": 582, "y": 185},
        {"x": 633, "y": 200}
    ],
    "links": [
        {"source":  0, "target":  1},
        {"source":  1, "target":  2},
        {"source":  2, "target":  0},
        {"source":  1, "target":  3},
        {"source":  3, "target":  2},
        {"source":  3, "target":  4},
        {"source":  4, "target":  5},
        {"source":  5, "target":  6},
        {"source":  5, "target":  7},
        {"source":  6, "target":  7},
        {"source":  6, "target":  8},
        {"source":  7, "target":  8},
        {"source":  9, "target":  4},
        {"source":  9, "target": 11},
        {"source":  9, "target": 10},
        {"source": 10, "target": 11},
        {"source": 11, "target": 12},
        {"source": 12, "target": 10}
    ]
};

let width = 960;
let height = 500;

let force = d3.layout.force()
    .size([width, height])
    .charge(-400)
    .linkDistance(40)
    .nodes(graph.nodes)
    .links(graph.links)
    .on("tick", tick);

let nodes = hoof.stored([]);
let links = hoof.stored([]);


function tick() {
    nodes.set(force.nodes());
    links.set(force.links());
}

let drag = force.drag();
drag.on('dragstart', (data) => {
    data.fixed = true;
});

let ctx = hoof.render(
    <svg width={width} height={height}>
        {hoof.dynamicList(links, (link) =>
            <line class="link"
                  x1={hoof.computed(() => link().source.x)}
                  y1={hoof.computed(() => link().source.y)}
                  x2={hoof.computed(() => link().target.x)}
                  y2={hoof.computed(() => link().target.y)} />)}
        {hoof.dynamicList(nodes, (node) =>
            <circle class="node"
                  r={12}
                  cx={hoof.computed(() => node().x)}
                  cy={hoof.computed(() => node().y)}
                  ondblclick={() => {node().fixed = false;}}
                  $bindings={(element) => [{
                      setup() {
                          d3.select(element).datum(node()).call(drag);
                      }
                  }]}
            />)}
    </svg>
);
document.body.appendChild(ctx.node);
ctx.setup();
force.start();