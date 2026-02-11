let cam, circles,controler;
let testShader;
let count = 81;

// --- SHADER SOURCE CODE (Bypasses Fetch Errors) ---
const vertSource = `
  precision mediump float;
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;
  varying vec2 vPos;

  void main() {
    vPos = aTexCoord;
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
  }
`;

const fragSource = `
  precision mediump float;
  #define MAX_CIRCLES 81
  #define MAX_HITS 1
  #define RAYS_PER_PIXEL 10

  varying vec2 vPos;
  uniform float count;
  uniform vec2 resolution;
  uniform vec3 uPos;
  uniform vec3 uUp;
  uniform vec3 uRight;
  uniform vec3 uForward;

  struct Circle {
    vec3 center;
    float radius;
    vec3 color;
  };

  uniform Circle circles[MAX_CIRCLES];

  struct Ray {
    vec3 direction;
    vec3 start;
    float distance_traveled;
    int hits;
  };

  struct Return_struct {
    float distance;
    vec3 color;
  };

  float circle_SDF(vec3 point, Circle c) {
    return length(point - c.center) - c.radius;
  }

  float smin(float a, float b, float k) {
    return min(a,b)-(pow(max(k-abs(a-b),0.),3.))/(6.*k*k);
  }

  Return_struct sdf(vec3 point) {
    Return_struct s;
    float dist;
    s.color = vec3(0.);
    s.distance = 1e6;
    for(int i=0; i<MAX_CIRCLES; i++) {
      if(float(i) >= count) { break; }
      dist = circle_SDF(point, circles[i]);
      if(dist < s.distance) {
        s.distance = smin(dist, s.distance, 0.4);
        s.color = circles[i].color;
      }
    }
    return s;
  }

  vec3 Normal(vec3 point) {
    const float eps = 0.001; 
    const vec2 h = vec2(eps,0);
    return normalize(vec3(
      sdf(point+h.xyy).distance - sdf(point-h.xyy).distance,
      sdf(point+h.yxy).distance - sdf(point-h.yxy).distance,
      sdf(point+h.yyx).distance - sdf(point-h.yyx).distance
    ));
  }

  Ray createRay(vec2 uv) {
    Ray ray;
    float uAspect = resolution.x / resolution.y; // Moved calculation here
    vec2 st = uv * 2.0 - 1.0;
    st.x *= uAspect;
    ray.direction = normalize(uForward + uRight * st.x + uUp * st.y);
    ray.start = uPos;
    ray.distance_traveled = 0.;
    ray.hits = 0;
    return ray;
  }

  vec3 rotateAxis(vec3 p, vec3 axis, float angle) {
    return mix(dot(axis, p) * axis, p, cos(angle)) + cross(axis, p) * sin(angle);
  }

  Ray Bounce(vec3 point, Ray ray) {
    ray.direction = ray.direction * -1.0;
    vec3 normal = Normal(point);
    float angle = acos(dot(normalize(ray.direction), normalize(normal)));
    ray.direction = rotateAxis(ray.direction, normal, angle);
    ray.start = point + normal * 0.01; // Offset to prevent self-intersection
    ray.hits += 1;
    return ray;
  }

  vec3 march(Ray ray) {
    vec3 col = vec3(1.); // Background color
    float t = 0.0;
    for (int i = 0; i < 60; i++) {
      vec3 point = ray.start + ray.direction * t;
      Return_struct s = sdf(point);
      float d = s.distance;

      if (d < 0.01) {
        return Normal(point) * 0.5 + 0.5; // map the normals from 0 to 1
      } 
      if (t > 1000.0) break;
      t += d;
    }
    return col;
  }

  float rand(float co) {
    return fract(sin(co * 91.3458) * 47453.5453) * 2.0 - 1.0; 
  }

  void main() {
    vec3 col = vec3(0.);
    vec3 hit = vec3(0.); // Declared here so it's accessible outside loop
    
    for(int i=0; i<RAYS_PER_PIXEL; i++) {
      // uv+
      vec2 jitter = vec2(rand(vPos.x + float(i)), rand(vPos.y + float(i))) / resolution;
      Ray ray = createRay(vPos + jitter);
      hit = march(ray);
      col += hit;
    } 
    col=col / float(RAYS_PER_PIXEL);
    gl_FragColor = vec4(col, 1.0);
  }
`;
   


// --- P5.JS SKETCH LOGIC ---

function setup() {
  createCanvas(400, 400, WEBGL);
  noStroke();
  
  // Create shader from the strings above
  testShader = createShader(vertSource, fragSource);
  
  circles = generateRandomCircles(3);
  cam = new Camera(300, 0, 0);
  controler = new Controler(circles,cam);
}

function generateRandomCircles(num) {
  let arr = [];
  for (let i = 0; i < num; i++) {
    // Shader expects vec4, so we pass an array of 4 numbers per circle
    
    arr.push([
      random(0,100),random(0,100),random(0,100),
      25,random(0,1),random(0,1),random(0,1)
    ]);
  }
  
  return arr;
}



function draw() {
  background(0);
  shader(testShader);
  
  

  // Handle Inputs
  if (keyIsDown(RIGHT_ARROW)) cam.twistRight(); // RIGHT_ARROW
  if (keyIsDown(LEFT_ARROW)) cam.twistLeft();  // LEFT_ARROW
  if (keyIsDown(87)) cam.moveForward();    // W
  if (keyIsDown(83)) cam.moveBackwards();  // S
  if (keyIsDown(UP_ARROW)) cam.twistUp();  // UP_ARROW
  if (keyIsDown(DOWN_ARROW)) cam.twistDown();  // DOWN_ARROW
  if (keyIsDown(32)) cam.moveUp();  // SPACE
  if (keyIsDown(CONTROL)) cam.moveDown();  // CTRL
  if (keyIsDown(65)) cam.moveRight();    // A
  if (keyIsDown(68)) cam.moveLeft();    // D
  
  

  // Update Uniforms
  testShader.setUniform('count', count);
  for (let i = 0; i < circles.length; i++) {
  let c = circles[i]; // [x, y, z, radius, r, g, b]
  testShader.setUniform(`circles[${i}].center`, [c[0], c[1], c[2]]);
  testShader.setUniform(`circles[${i}].radius`, c[3]);
  testShader.setUniform(`circles[${i}].color`,  [c[4], c[5], c[6]]);
}
  testShader.setUniform('uPos', [cam.pos.x, cam.pos.y, cam.pos.z]);
  testShader.setUniform('uForward', [cam.forward.x, cam.forward.y, cam.forward.z]);
  testShader.setUniform('uUp', [cam.up.x, cam.up.y, cam.up.z]);
  testShader.setUniform('uRight', [cam.right.x, cam.right.y, cam.right.z]);
  
  testShader.setUniform('resolution', [width * pixelDensity(), height * pixelDensity()]);
  

 //trigger the shader
  rect(-width / 2, -height / 2, width, height);
}

function mousePressed() {
  controler.press(mouseX,mouseY);
}

