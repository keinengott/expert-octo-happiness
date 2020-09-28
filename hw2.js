// hw2.js
// Robert Kaufman
// 27 Sept 2020
// CS4410
// Purpose: To generate random polygons that rotate and scale in place 

var VSHADER_SOURCE =`#version 300 es
   in vec4 a_Position;
   uniform mat4 u_ModelMatrix;
   void main() {     
     gl_Position = u_ModelMatrix * a_Position;
}`;

var FSHADER_SOURCE =`#version 300 es
   precision mediump float;
   uniform vec4 u_Color;
   out vec4 cg_FragColor;
   void main() {
     cg_FragColor = u_Color;     
}`;

function ngonObject() {   
  this.color = [0, 0, 0]; // color of this ngon
  this.center = [0, 0]; // center (x, y) of this ngon
  this.offset = 0; // how many vertices before this ngon
  this.numVertices = 0; // the 'n' in 'n-gon' + 2 for the TRIANGLE_FAN
  this.scale = 1.0; // To make all of the scales different, like in the video
  this.s_direction = 1.0; // direction of scaling
}

let ngons = []; // hold all of the shapes
let curAngle = 0.0;

function main() {
   var canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  var gl = canvas.getContext('webgl2');
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  initVertexBuffers(gl);        
  
  var modelMatrix = new Matrix4();  
  
  // Pass the model matrix to the vertex shader
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');  
  
  // Animate
  (function update() {
    curAngle = updateAngle(curAngle);  // Update rotation angle
    updateScales(); // update scale 
    drawNgons(gl, curAngle, modelMatrix, u_ModelMatrix);   
    requestAnimationFrame(update); // Request that browser call update
  })();    
}

function drawNgons(gl, curAngle, modelMatrix, u_ModelMatrix) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);    
  
  for (let i = 0; i < ngons.length; i++) { // draw all ngons    
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 
                            FSIZE*2*ngons[i].offset);
    gl.enableVertexAttribArray(a_Position);

    let cx = ngons[i].center[0]; 
    let cy = ngons[i].center[1];
    
    modelMatrix.setIdentity();  // Set identity matrix

    modelMatrix.translate(cx, cy, 0); // Move  center back to original spot    
    modelMatrix.rotate(curAngle, 0, 0, 1);  // Set rotation matrix
    modelMatrix.scale(ngons[i].scale, ngons[i].scale, 1); // scale the object in question
    modelMatrix.translate(0, 0, 0); // Move rotation center to ngon     
     
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    let c = ngons[i].color;
    gl.uniform4f(u_Color, c[0], c[1], c[2], 1.0);
      
    gl.drawArrays(gl.TRIANGLE_FAN, 0, ngons[i].numVertices);
  }
}

// Last time that this function was called
var a_last = Date.now();
function updateAngle(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - a_last;
  a_last = now;
  // Update current rotation angle 
  const ANGLE_STEP = 45;
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

var s_last = Date.now();
function updateScales() {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - s_last;
  s_last = now;
  // Update current scale for each ngon
  const SCALE_STEP = .01;
  for (i = 0; i < ngons.length; i++) {
    ngons[i].scale = ngons[i].scale + SCALE_STEP*ngons[i].s_direction;
    if (ngons[i].scale >= 1 || ngons[i].scale <= 0){
      ngons[i].s_direction *= -1;
    }
  }
}

function initVertexBuffers(gl) {
  let g_points = [];
  
  let m = 20; // total number of ngons 
  var currOffset = 0; // to keep track of number of vertices

  for (let k = 0; k < m; k++) {
    let n = Math.floor(Math.random()*7) + 3; // num vertices between 3 and 9

    let angle = 360.0 / n;
    angle = (Math.PI * angle) / 180.0; // radian
    let st_angle = Math.PI / 2.0; // 90 degree

    let cx = Math.random() * 2 - 1.0; // center x in [-1, 1]
    let cy = Math.random() * 2 - 1.0; // center y in [-1, 1]
    let d = 0.15; // radius of ngons

    g_points.push(0); g_points.push(0); // to fan, we need center of object
    
    for (let i = 0; i < n; i++) {    
      let x = Math.cos(st_angle + angle * i) * d;
      let y = Math.sin(st_angle + angle * i) * d;
      g_points.push(x); 
      g_points.push(y);    
    } 
    g_points.push(0); g_points.push(d);

    ngons.push(new ngonObject());      
    let r = Math.random();
    let g = Math.random();
    let b = Math.random();
    ngons[k].color = [r, g, b];
    ngons[k].center = [cx, cy];
    ngons[k].offset = currOffset;
    currOffset += (n+2);
    // n+2 to include origin and final point    
    ngons[k].numVertices = n + 2;
    // the below introduces randomness in the scaling
    ngons[k].scale = Math.random(); 
    if (Math.random() > .5)
    {
      ngons[k].s_direction = 1.0;
    } else {
      ngons[k].s_direction = -1.0;
    }
  }

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

