class RenderTarget {
    constructor(gl, width, height) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.level = 0;
        this.internalFormat = gl.RGBA32F;
        this.border = 0;
        this.format = gl.RGBA;
        this.type = gl.FLOAT;
        this.data = null;

        gl.texImage2D(gl.TEXTURE_2D, this.level, this.internalFormat, width, height, this.border, this.format, this.type, this.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    }

    resize(gl, width, height) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.deleteTexture(this.texture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, this.level, this.internalFormat, width, height, this.border, this.format, this.type, this.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.copyTexSubImage2D(
            gl.TEXTURE_2D,
            this.level,
            0,
            0,
            0,
            0,
            width,
            height
        );

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    }

}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = String(gl.getShaderInfoLog(shader));
    console.log(info, source);
    gl.deleteShader(shader);
    return info;
  }
  return shader;
}

function initProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
}

function initQuad(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return positionBuffer;
}

const vs = `#version 300 es
in vec2 aVertexPosition;
out vec2 uv;
void main() {
  uv = aVertexPosition;
  gl_Position =  vec4(aVertexPosition, 0., 1.0);
}`

const gl_pre_screen = `#version 300 es
precision highp float;`

const gl_pre_buf = `#version 300 es
#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif`

const gl_pre_common = `
uniform vec3 iChannelResolution[4];
uniform float iTime;
uniform float iTimeDelta;
uniform float timeDelta;
uniform vec2 iResolution; 
uniform vec4 iMouse;
uniform int iFrame;
in vec2 uv;
out vec4 fColor;
uniform sampler2D iChannel0;
`

const gl_main_buf = `
void main() {
    mainImage(fColor, gl_FragCoord.xy);
}`

const gl_main_screen = `
void main() {
    mainImage(fColor, gl_FragCoord.xy);
    fColor.a = 1.;
}`

class UniformPositions {
    constructor(gl, prog) {
        this.prog = prog
        this.iTime = gl.getUniformLocation(prog, "iTime");
        this.iTimeDelta = gl.getUniformLocation(prog, "iTimeDelta");
        this.iFrame = gl.getUniformLocation(prog, "iFrame");
        this.iMouse = gl.getUniformLocation(prog, "iMouse");
        this.iResolution = gl.getUniformLocation(prog, "iResolution");
        this.iChannelResolution = gl.getUniformLocation(prog, "iChannelResolution");
        gl.uniform2f(this.iResolution, width, height);
        const resos = [width, height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        gl.uniform3fv(this.iChannelResolution, new Float32Array(resos));
        window.addEventListener('resize', e => {
            this.onResize(gl)
            // cancelAnimationFrame(handle)
            // handle = requestAnimationFrame(() => this.onResize(gl))
        }
        )
    }

    bindUniforms(gl, time, lastTime, frame) {
        gl.uniform1f(this.iTime, time);
        gl.uniform1i(this.iFrame, frame);
        gl.uniform1f(this.iTimeDelta, time - lastTime);
        gl.uniform4f(this.iMouse, mouseX, mouseY, mouseZ, mouseZ);
    }

    onResize(gl) {
        gl.useProgram(this.prog)

        rescale(scale)

        rt1.resize(gl, width, 1)
        rt2.resize(gl, width, 1)
        rt3.resize(gl, width, 1)

        gl.uniform2f(this.iResolution, width, height);
        const resos = [width, height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        gl.uniform3fv(this.iChannelResolution, new Float32Array(resos));
        
        gl.viewport(0, 0, width, height);
        
        // handle = requestAnimationFrame(animate)
    }
}

var mouseX = 0, mouseY = 0, mouseZ = 0.
const canvas = document.createElement("canvas")

function setMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * scale;
    mouseY = (rect.height - (e.clientY - rect.top) - 1) * scale;  // bottom is 0 in WebGL
}

function setupCanvas(width, height) {
    canvas.addEventListener('mousemove', setMousePosition)
    canvas.addEventListener('mousedown', e => {
        e.preventDefault()
        setMousePosition(e)
        mouseZ = 1. })
    canvas.addEventListener('mouseup', e => {
        e.preventDefault()
        mouseZ = 0. })
    canvas.addEventListener('touchstart', e => {
        e.preventDefault()
        setMousePosition(e.touches[0]);
        mouseZ = 1.
    }, { passive: false })
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        setMousePosition(e.touches[0]);
    }, { passive: false })
    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        mouseZ = 0.
    }, { passive: false })

    const gl = canvas.getContext("webgl2");
    document.body.appendChild(canvas);
    return gl
}

var width, height
function rescale(set_scale) {
    width = document.body.clientWidth 
    height = document.body.clientHeight
    let min = Math.min(document.body.clientWidth, document.body.clientHeight)
    var ratio = width/height;

   if (ratio < 1. && width > min) {
        height = (1./ratio) * min
        width = min
   } else if (ratio > 1. && height > min) {
        width = ratio * min
        height = min
   }
   width *= set_scale;
   height *= set_scale;
   canvas.width = width;
   canvas.height = height;
   canvas.style.scale = 1/set_scale;
   scale = set_scale
   canvas.style.translate = `${Math.ceil(document.body.clientWidth/2. - width/2.)}px ${Math.ceil(document.body.clientHeight/2. - height/2.)}px`
}

const commonSource = document.getElementById("shader-common-fs").text;
const AbufFsSource = document.getElementById("shader-abuf-fs").text;
const BbufFsSource = document.getElementById("shader-bbuf-fs").text;
const screenFsSource = document.getElementById("shader-screen-fs").text;

var rt1, rt2, rt3

var scale = 1.
function init() {
  // Set up canvas and webgl2 context
  rescale(1.)

  gl = setupCanvas(width, height)
  
  const ext = gl.getExtension('EXT_color_buffer_float');
  if (!ext) {
    return alert('need EXT_color_buffer_float');
  }

  // Compile shaders and set up two render targets
  AbufProg = initProgram(gl, vs, gl_pre_buf + gl_pre_common + commonSource + AbufFsSource + gl_main_buf);
  BbufProg = initProgram(gl, vs, gl_pre_buf + gl_pre_common + commonSource + BbufFsSource + gl_main_buf);
  ScreenProg = initProgram(gl, vs, gl_pre_screen + gl_pre_common + commonSource + screenFsSource + gl_main_screen);

  rt1 = new RenderTarget(gl, width, 1);
  rt2 = new RenderTarget(gl, width, 1);
  rt3 = new RenderTarget(gl, width, 1);
  
  rts = [rt1, rt2, rt3];

  // Bind vertex quad
  gl.useProgram(AbufProg);
  const quadPos = gl.getAttribLocation(AbufProg, 'aVertexPosition');
  const quad = initQuad(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.vertexAttribPointer(quadPos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(quadPos);
  gl.viewport(0, 0, width, height);

  // Set up needed uniforms
  AbufPos = new UniformPositions(gl, AbufProg)
  gl.useProgram(BbufProg);
  BbufPos = new UniformPositions(gl, BbufProg)
  gl.useProgram(ScreenProg);
  ScreenPos = new UniformPositions(gl, ScreenProg)

  frame = 0;
  time = 0;
  lastTime = performance.now();
  animate();
}

var gl
var AbufPos, BbufPos, ScreenPos
var rts, frame, time, lastTime
var AbufProg, BbufProg, ScreenProg

var last_fps = []
var time_count = 0.

function animate() {
    time = performance.now() / 1000;
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (time - lastTime > 0) {
        let delta = time - lastTime
        let fps = 1./delta
        time_count += delta 
        if (time_count > 1.) {
            time_count -= 1.
            let avg_fps = last_fps.reduce((a,b) => a+b, 0.) / last_fps.length
            last_fps = []
            if (avg_fps < 28 && scale > 0.2) {
                rescale(scale * 0.8)
                AbufPos.onResize(gl)
                BbufPos.onResize(gl)
                ScreenPos.onResize(gl)
            } else if (avg_fps > 90 && scale * 1.2 <= 1) {
                rescale(scale * 1.2)
                AbufPos.onResize(gl)
                BbufPos.onResize(gl)
                ScreenPos.onResize(gl)
            } 
        } else {
            last_fps.push(fps)
    }}

    // FIRST RENDER PASS
    gl.useProgram(AbufProg);
    AbufPos.bindUniforms(gl, time, lastTime, frame);

    gl.bindTexture(gl.TEXTURE_2D, rts[1].texture); // read
    gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fbo); // write

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //SECOND RENDER PASS
    gl.useProgram(BbufProg);
    BbufPos.bindUniforms(gl, time, lastTime, frame);

    gl.bindTexture(gl.TEXTURE_2D, rts[0].texture); // read
    gl.bindFramebuffer(gl.FRAMEBUFFER, rts[1].fbo); // write

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //THIRD RENDER PASS
    gl.useProgram(BbufProg);
    BbufPos.bindUniforms(gl, time, lastTime, frame);

    gl.bindTexture(gl.TEXTURE_2D, rts[1].texture); // read
    gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fbo); // write

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //FOURTH RENDER PASS
    gl.useProgram(BbufProg);
    BbufPos.bindUniforms(gl, time, lastTime, frame);

    gl.bindTexture(gl.TEXTURE_2D, rts[0].texture); // read
    gl.bindFramebuffer(gl.FRAMEBUFFER, rts[1].fbo); // write

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    //FINAL RENDER PASS
    gl.useProgram(ScreenProg);
    ScreenPos.bindUniforms(gl, time, lastTime, frame);

    gl.bindTexture(gl.TEXTURE_2D, rts[0].texture); // read
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // write (canvas)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    lastTime = time;
    frame++;

    handle = requestAnimationFrame(animate);
    
  }
