
class Camera {
  constructor(x, y, z) {
    console.log("sketch loaded");
    this.pos = createVector(x, y, z); // Use p5.Vector
    this.aspect = width / height;
    this.updateCamera();
  }

  updateCamera() {
    let target = createVector(0, 0, 0);
    let worldUp = createVector(0, 1, 0);

    // Use this.pos directly
    this.forward = p5.Vector.sub(target, this.pos).normalize();
    if(!this.forward.equals(worldUp)){
      this.right = worldUp.copy().cross(this.forward).normalize();
    }
    else{
      this.right = worldUp.copy().cross(createVector(1,0,0)).normalize();
    }
    
    this.up = this.forward.copy().cross(this.right).normalize();
  }
  
  update(){
    let worldUp = createVector(0, 1, 0);
    if (abs(this.forward.y) > 0.99) {
      worldUp = createVector(0, 0, 1);
    }

    this.right = worldUp.copy().cross(this.forward).normalize();
    this.up = this.forward.copy().cross(this.right).normalize();
  }
  
  twistUp(){
    this.forward.add(p5.Vector.mult(this.up, 0.02)).normalize();
    this.update();
    
  }
  twistDown(){
    this.forward.sub(p5.Vector.mult(this.up, 0.02)).normalize();
    this.update();
    
  }
  
  twistRight(){
    this.forward.add(p5.Vector.mult(this.right, 0.02)).normalize();
    this.update();
  }
  twistLeft(){
    this.forward.sub(p5.Vector.mult(this.right, 0.02)).normalize();
    this.update();
  }
  moveForward(){
    this.pos.add(p5.Vector.mult(this.forward,2));
  }
  moveBackwards(){
    this.pos.add(p5.Vector.mult(this.forward,-1));
  }
  moveRight(){
    this.pos.add(p5.Vector.mult(this.right,-2));
  }
  moveLeft(){
    this.pos.add(p5.Vector.mult(this.right,2));
  }
  moveUp(){
    let worldUp = createVector(0, 1, 0);
    this.pos.add(p5.Vector.mult(worldUp,2));
  }
  moveDown(){
    let worldUp = createVector(0, -1, 0);
    this.pos.add(p5.Vector.mult(worldUp,2));
  }
  
}
