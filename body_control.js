class Ray{
  constructor(start, direction){//start and direction are both vec3
    this.start = start.copy();
    this.direction = direction.copy().normalize();
  }
}

class Controler{
  constructor(circles, camera){
    this.circles = circles;
    this.camera = camera;
    this.body=this.circles[0];
  }
  
  
  
  
  
  

  circle_sdf(i, point){
    let radius = this.circles[i][3];

    let center = createVector(
      this.circles[i][0],
      this.circles[i][1],
      this.circles[i][2]
    );

    return p5.Vector.sub(point, center).mag() - radius;
  }

  march(ray){
    let point = ray.start.copy();
    let t = 0;

    const MAX_DIST = 2000;
    const MAX_STEPS = 160;
    const BASE_EPS = 0.5;

    let lastDist = Infinity;

    for (let step = 0; step < MAX_STEPS && t < MAX_DIST; step++) {

      let minDist = Infinity;
      let hitIndex = -1;

      for (let i = 0; i < this.circles.length; i++) {
        let d = this.circle_sdf(i, point);
        if (d < minDist) {
          minDist = d;
          hitIndex = i;
        }
      }

      // adaptive epsilon (GPU-style)
      let eps = max(BASE_EPS, 0.01 * t);

      // hit or inside
      if (minDist < eps) {
        return hitIndex;
      }

      // overshoot guard (prevents oscillation)
      if (minDist > lastDist) {
        minDist = lastDist * 0.5;
      }

      minDist = max(minDist, eps);

      t += minDist;
      lastDist = minDist;

      point = p5.Vector.add(ray.start, p5.Vector.mult(ray.direction, t));
    }

    return -1;
  }

  create_ray(x, y){
    // screen → NDC
    let nx = (x / width) * 2 - 1;
    let ny = 1 - (y / height) * 2; // Y inverted for WEBGL

    nx *= this.camera.aspect;

    let direction = this.camera.forward.copy()
      .add(p5.Vector.mult(this.camera.right, nx))
      .add(p5.Vector.mult(this.camera.up, ny))
      .normalize();

    return new Ray(this.camera.pos, direction);
  }

  press(x, y){//finds which circle is at a 2d screen space coordinate(x,y will be mouse coordinates)
    this.body=this.circles[this.march(this.create_ray(x, y))];
    
  }
}
