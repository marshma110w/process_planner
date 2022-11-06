class Process {
  constructor(beginTime, length, y, grid) {
    this.beginTime = beginTime;
    this.length = length;
    this.grid = grid;
    this.speed = 5;
    this.delta = 0;
    this.y = y - height/10;
    this.h = height/10;
    this.x = width;
    this.coming = false;
    this.processing = false;
    this.waiting = false;
    this.far = true;
    this.gone = false;
    this.done = 0;
  };

  update() {
    if (this.isFar() && this.beginTime < millis()) {
      this.setFar(false);
      this.setComing(true);
    }
    if (this.isComing() && this.x <= this.grid.borderX) {
      this.setComing(false);
      this.setWaiting(true);
    }
    if (this.isProcessing()) {
      this.done += this.delta;
    }
    this.x -= this.delta;
  }

  draw() {
    this.update();
    let x = this.x;
    let y = this.y;
    let w = this.length;
    let h = this.h;
    if (this.isProcessing()) {
      fill(120, 30, 0);
    } else if (this.isComing()) {
      fill(255);
    } else if (this.isWaiting()) {
      fill(149, 149, 149);
    }
    else {
      noFill();
    }
    rect(x, y, w, h); 
  }

  isFar() {
    return this.far;
  }

  isComing() {
    return this.coming;
  }

  isProcessing() {
    return this.processing;
  }

  isWaiting() {
    return this.waiting;
  }

  isGone() {
    return this.gone;
  }
  
  setFar(far) {
    this.far = far;
  }

  setComing(coming) {
    this.coming = coming;
    if (coming) {
      this.delta = this.speed;
    }
  }

  setProcessing(processing) {
    this.processing = processing;
    if (processing) {
      this.delta = this.speed;
    }
  }

  setWaiting(waiting) {
    this.waiting = waiting;
    if (waiting) {
      this.delta = 0;
      this.grid.planner.addWaiting(this);
    }
  }

  setGone(gone) {
    this.gone = gone;
    if (gone) {
      this.delta = 2 * this.speed;
    }
  }

}

class Queue {
  constructor() {
    this.length = 0;
    this.queue = [];
  }

  enqueue(item) {
    this.queue.push(item);
    return ++this.length;
  }

  dequeue() {
    if (this.length > 0) {
      this.length--;
      return this.queue.shift();
    } else {
      return false;
    }
  }

  getNumber(item) {
    for(let i=0; i<this.length; i++){
      if (item == this.queue[i]) {
        return i+1;
      }
    }
    return 0;
  }
}

class ProcessPlanner {
  constructor(grid) {
    this.grid = grid;
    this.waiting = new Queue();
    this.current_process = null;
  }

  addWaiting(process) {
    this.waiting.enqueue(process);
  }

  update() {
    if ((!this.current_process) && (this.waiting.length>0)) {
      this.current_process = this.waiting.dequeue();
      this.current_process.setWaiting(false);
      this.current_process.setProcessing(true);
    } else {
      this.grid.drawNumbers();
      if (this.current_process) {
        this.grid.drawArrow(this.current_process)
      }
      if (this.current_process && this.current_process.done >= this.current_process.length) {
        this.current_process.setProcessing = false;
        this.current_process.setGone = true;
        this.current_process = null;
      }
    }
  }
}

class Grid {
  constructor(borderX) {
    this.borderX = borderX;
    this.tracks_count = 4;
    this.tracks = [];
    this.processes = [];
    this.processes_count = 0;
    this.planner = new ProcessPlanner(this);

    let step = height * 8 / 10 / this.tracks_count;
    for(let i=0; i<this.tracks_count; i++){
      let y = height * 0.9 - step/3 - step * i;
      this.tracks[i] = y;
    }
  }

  drawArrow(process) {
    let y = process.y + height/20;
    let x = width/15;
    let dx = width/60;
    let dy = height/100;
    line(width/50, y, x, y);
    line(x, y, x - dx, y + dy);
    line(x, y, x - dx, y - dy);

  }

  drawNumbers() {
    for(let i=0; i<this.processes_count; i++) {
      let p = this.processes[i];
      if (p.isWaiting()) {
        let num = this.planner.waiting.getNumber(p);
        fill(0);
        textSize(32);
        text(num, p.x+20, p.y + 20);
      }
    }
  }

  draw() {
    strokeWeight(4);
    stroke(255);
    line(this.borderX, height / 10, this.borderX, height * 0.9);
    strokeWeight(2);

    for(let i=0; i<this.tracks_count; i++) {
      line(this.borderX, this.tracks[i], width * 0.9, this.tracks[i]);
    }
    for(let i=0; i<this.processes_count; i++) {
      this.processes[i].draw();
    }
    this.planner.update();
  }

  addProcess(beginTime, length, track_index) {
    let p = new Process(beginTime, length, this.tracks[track_index], this)
    this.processes[this.processes_count++] = p;
  }
}

function setup() {
  createCanvas(1100, 900);
  background(0, 255, 0, 0.25);
  fill(255);
  frameRate(60);
  g = new Grid(width / 10);
  g.addProcess(300, 500, 1);
  g.addProcess(100, 750, 0);
  g.addProcess(700, 240, 2);
}


function draw() {
  background(50);
  g.draw();
  // if (millis() >1000 && millis() < 1200) {
  //   g.processes[2].setProcessing(true);
  // }
}
