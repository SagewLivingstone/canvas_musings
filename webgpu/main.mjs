
const GRID_SIZE  = 4;

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

        @vertex
        fn vertexMain(@location(0) pos: vec2f)
            -> @builtin(position) vec4f
        {
            return vec4f(pos / grid, 0.0, 1.0);
        }

        
        @fragment
        fn fragmentMain() -> @location(0) vec4f
        {
            return vec4f(1, 0, 0, 1);
        }
    `
});

// Build render pipeline
const cellPipeline = device.createRenderPipeline({
    label: "Cell Pipeline",
    layout: "auto",
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

// Create bind group for grid
const bindGroup = device.createBindGroup({
    label: "Cell renderer bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
    }]
});


// Build a command encoder, and give it some commands
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
    colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: [0, 0.35, 0.4, 1],
        storeOp: "store",
    }]
});

pass.setPipeline(cellPipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.setBindGroup(0, bindGroup);
pass.draw(vertices.length / 2);

pass.end();

// Submit the command buffer to the device's queue for processing
device.queue.submit([encoder.finish()]);