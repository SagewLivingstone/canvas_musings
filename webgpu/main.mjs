
const GRID_SIZE  = 256;
const UPDATE_INTERVAL_MS = 20;

const canvas = document.querySelector('canvas');

// Check if webgpu is supported
if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
}

// Check if we have a compatible device to grab
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPU adapter found");
}

// Configure canvas to use device
const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device: device,
    format: canvasFormat, // Use the texture format recommended
});

const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
    label: "Grid Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
const cellStateBuffer = [
    device.createBuffer({
        label: "Cell State A",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
        label: "Cell State B",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
];
for (let i = 0; i < cellStateArray.length; i++) {
    cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
}
device.queue.writeBuffer(cellStateBuffer[0], 0, cellStateArray);

const vertices = new Float32Array([
//   X,    Y,
  -0.8, -0.8, // Triangle 1 
   0.8, -0.8,
   0.8,  0.8,

  -0.8, -0.8, // Triangle 2 
   0.8,  0.8,
  -0.8,  0.8,
]);
// Create a buffer to hold the vertex data
const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Vertex shader location
    }]
}

const cellShaderModule = device.createShaderModule({
    label: "Cell Shader",
    code: `
        @group(0) @binding(0) var<uniform> grid: vec2f;
        @group(0) @binding(1) var<storage> cellState: array<u32>;

        struct VertexInput {
            @location(0) pos: vec2f,
            @builtin(instance_index) index: u32,
        };

        struct VertexOutput {
            @builtin(position) pos: vec4f,
            @location(0) cell: vec2f,
        }

        @vertex
        fn vertexMain(input: VertexInput) -> VertexOutput
        {
            let i = f32(input.index);
            let cell = vec2f(floor(i / grid.x), i % grid.x);
            let state = f32(cellState[input.index]);

            let celloffset = cell / grid * 2;
            let gridpos = (input.pos * state + 1)/grid - 1 + celloffset;

            var output: VertexOutput;
            output.pos = vec4f(gridpos, 0, 1);
            output.cell = cell;
            return output;
        }

        struct FragmentInput {
            @location(0) cell: vec2f,
        };
        
        @fragment
        fn fragmentMain(input: FragmentInput) -> @location(0) vec4f
        {
            let c = input.cell / grid;
            return vec4f(c, 0.7-c.y, 1);
        }
    `
});

const WORKGROUP_SIZE = 8;

const simulationShaderModule = device.createShaderModule({
    label: "Game of Life Shader",
    code: `
        @group(0) @binding(0) var<uniform> grid: vec2f;

        @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
        @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

        fn cellIndex(cell: vec2u) -> u32 {
            return (cell.y % u32(grid.y)) * u32(grid.x)
                 + (cell.x % u32(grid.x));
        }

        fn cellActive(x: u32, y: u32) -> u32 {
            return cellStateIn[cellIndex(vec2u(x, y))];
        }

        @compute
        @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
        fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
            let index = cellIndex(global_id.xy);
            let activeNeighbors = cellActive(global_id.x+1, global_id.y+1) +
                        cellActive(global_id.x+1, global_id.y) +
                        cellActive(global_id.x+1, global_id.y-1) +
                        cellActive(global_id.x, global_id.y-1) +
                        cellActive(global_id.x-1, global_id.y-1) +
                        cellActive(global_id.x-1, global_id.y) +
                        cellActive(global_id.x-1, global_id.y+1) +
                        cellActive(global_id.x, global_id.y+1);

            switch (activeNeighbors) {
                case 2: {
                    cellStateOut[index] = cellStateIn[index];
                }
                case 3: {
                    cellStateOut[index] = 1;
                }
                default: {
                    cellStateOut[index] = 0;
                }
            }
        }
    `
});


const bindGroupLayout = device.createBindGroupLayout({
    label: "Cell renderer bind group layout",
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {}
        },
        {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }
    ]
})

// Create bind group for grid
const bindGroups = [
    device.createBindGroup({
        label: "Cell renderer bind group A",
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        },
        {
            binding: 1,
            resource: { buffer: cellStateBuffer[0] }
        },
        {
            binding: 2,
            resource: { buffer: cellStateBuffer[1] }
        }]
    }),
    device.createBindGroup({
        label: "Cell renderer bind group B",
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        },
        {
            binding: 1,
            resource: { buffer: cellStateBuffer[1] }
        },
        {
            binding: 2,
            resource: { buffer: cellStateBuffer[0] }
        }]
    })
];

const pipelineLayout = device.createPipelineLayout({
    label: "Cell pipeline layout",
    bindGroupLayouts: [ bindGroupLayout ],
});

// Build render pipeline
const cellPipeline = device.createRenderPipeline({
    label: "Cell Pipeline",
    layout: pipelineLayout,
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: canvasFormat,
        }],
    }
});

const computePipeline = device.createComputePipeline({
    label: "Compute Pipeline",
    layout: pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    }
});

let step = 0;

function render() {
    const encoder = device.createCommandEncoder();

    // Compute pass

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);
    
    const workgroup_count = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroup_count, workgroup_count);

    computePass.end();

    step++;
    
    // Render pass

    const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: [0, 0.35, 0.4, 1],
            storeOp: "store",
        }]
    });

    // Draw the grid
    renderPass.setPipeline(cellPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, bindGroups[step % 2]);
    renderPass.draw(vertices.length / 2, GRID_SIZE*GRID_SIZE);

    // End and submit
    renderPass.end();
    // Submit the command buffer to the device's queue for processing
    device.queue.submit([encoder.finish()]);
}

setInterval(render, UPDATE_INTERVAL_MS);
