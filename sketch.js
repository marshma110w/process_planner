class Process {
  constructor(sketch, beginTime, length, y, grid) {
    this.sketch = sketch;
    this.beginTime = beginTime;
    this.length = length;
    this.grid = grid;
    this.speed = 5;
    this.delta = 0;
    this.y = y - sketch.height/10;
    this.h = sketch.height/10;
    this.x = sketch.width;
    this.coming = false;
    this.processing = false;
    this.waiting = false;
    this.far = true;
    this.gone = false;
    this.done = 0;
  };

  update() {
    if (this.isFar() && this.beginTime < this.sketch.millis()) {
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
      this.sketch.fill(120, 30, 0);
    } else if (this.isComing()) {
      this.sketch.fill(255);
    } else if (this.isWaiting()) {
      this.sketch.fill(149, 149, 149);
    }
    else {
      this.sketch.noFill();
    }
    this.sketch.rect(x, y, w, h);
    
    if (this.process_start && (this.isProcessing() || this.isWaiting())) {
      this.sketch.fill(0);
      this.sketch.textSize(32);
      this.sketch.text(((this.sketch.millis() - this.process_start) / 1000).toFixed(2), this.sketch.width * 0.9, this.y + 20);
    }
    
    if (this.isGone()) {
      if (this.process_start) {
        this.sketch.fill('green');
        this.sketch.textSize(32);
        this.sketch.text(this.elapsed, this.sketch.width * 0.9, this.y + 20);
      }
    }
    
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
      if (!this.process_start) this.process_start = this.sketch.millis();
      this.delta = 0;
      this.grid.planner.addWaiting(this);
    }
  }

  setGone(gone) {
    this.gone = gone;
    if (gone) {
      this.elapsed = ((this.sketch.millis() - this.process_start) / 1000).toFixed(2);
      this.grid.planner.elapsed_sum += parseFloat(this.elapsed);
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

  indexOf(item) {
    for(let i=0; i<this.length; i++){
      if (item == this.queue[i]) {
        return i;
      }
    }
    return 0;
  }
}

class List {
  constructor() {
    this.end = { nm: null, nxt: null};
    this.beg = { nm: null, nxt: this.end };
    this.length = 0;
  }

  toString() {
    var n = this.beg.nxt;                          // сразу за beg стоит первый узел
    var st = "(";
    while(n !== this.end){                         // пока нет  фиктивного последнего
      st += n.nm + (n.nxt!== this.end ? "," : "");// выводим через запятую имена узлов
      n = n.nxt;                                  // переходим к следующему узлу
    }
    return st+")";
  }

  unshift(nm) {
    this.length++;
    this.beg.nxt = { nm: nm, nxt: this.beg.nxt };
  }

  shift() {
    if(this.length===0)
      return;                                     // список пуст - вернём undefined

    this.length--;                                 // уменьшаем число узлов
    this.beg  = this.beg.nxt;                      // фиктивный beg ссылается на второй элемент
    return this.beg.nm;
  }

  pop() {
    if(this.length === 0)
      return;
                                                   // список пуст - вернём undefined
    this.length--;                                 // уменьшаем число узлов
    var n = this.beg.nxt;                          // начиная с первого реального узла,
    while(n.nxt !== this.end)                      // ищем реальный последний узел
      n = n.nxt;                                  // переходя каждый раз к следующему

    this.end = n;                                  // фиктивный сдвигаем влево на один
    return n.nm;
  }

  node(pos) {
    var n = this.beg.nxt;                               // бежим от начала
    while(n !== this.end && pos-- > 0)
      n = n.nxt;                                 // переходим к следующему узлу
    return n;
  }

  at(pos) {
    return this.node(pos).nm
  }

  remove(pos) {
    if(pos <= 0)                                   // удаляем из начала
      return this.shift();
    if(pos+1 >= this.length)                       // удаляем из конца
      return this.pop();

    this.length--;                                 // уменьшаем число узлов
    var n = this.node(pos-1);                      // перед удаляемым узлом
    var nm = n.nxt.nm;
    n.nxt = n.nxt.nxt;
    return nm;
  }

  indexOf(elem) {
    var n = 0;
    var node = this.node(0);
    while(n < this.length && node.nm != elem) {
      n++;
      node = this.node(n);
    }
    if (n == this.length) return -1;
    else return n;
  }
}

class ProcessPlannerFifo {
  constructor(grid) {
    this.elapsed_sum = 0;
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
      this.grid.drawNumbersFifo();
      if (this.current_process) {
        this.grid.drawArrow(this.current_process)
      }
      if (this.current_process && this.current_process.done >= this.current_process.length) {
        this.current_process.setProcessing(false);
        this.current_process.setGone(true);
        this.current_process = null;
      }
    }
  }
}

class ProcessPlannerShortestFirst {
  constructor(grid) {
    this.elapsed_sum = 0;
    this.grid = grid;
    this.waiting = new List();
    this.current_process = null;
  }

  addWaiting(process){
    this.waiting.unshift(process);
  }

  update() {
    if ((!this.current_process) && (this.waiting.length>0)) {
      var min_process = this.waiting.at(0);
      for (var i=0; i< this.waiting.length; i++) {
        if (this.waiting.at(i).length < min_process.length) min_process = this.waiting.at(i);
      }
      this.current_process = min_process;
      this.waiting.remove(this.waiting.indexOf(min_process));
      this.current_process.setWaiting(false);
      this.current_process.setProcessing(true);
    } else {
      if (this.current_process) {
        this.grid.drawArrow(this.current_process)
      }
      if (this.current_process && this.current_process.done >= this.current_process.length) {
        this.current_process.setProcessing (false);
        this.current_process.setGone(true);
        this.current_process = null;
      }
    }
    if (this.waiting.length>0) {
      this.grid.drawNumbersShortestFirst();
    }
  }
}

class Grid {
  constructor(sketch, plannerClass, borderX) {
    this.sketch = sketch;
    this.width = sketch.width;
    this.height = sketch.height;
    this.borderX = borderX;
    this.tracks_count = 4;
    this.tracks = [];
    this.processes = [];
    this.processes_count = 0;
    this.processes_total = 0;
    this.planner = new plannerClass(this);

    let step = this.height * 8 / 10 / this.tracks_count;
    for(let i=0; i<this.tracks_count; i++){
      let y = this.height * 0.9 - step/3 - step * i;
      this.tracks[i] = y;
    }
  }

  drawArrow(process) {
    let y = process.y + this.height/20;
    let x = this.width/15;
    let dx = this.width/60;
    let dy = this.height/100;
    this.sketch.line(this.width/50, y, x, y);
    this.sketch.line(x, y, x - dx, y + dy);
    this.sketch.line(x, y, x - dx, y - dy);
  }

  drawSum() {
    this.sketch.textSize(16);
    this.sketch.text("∑ =   " + this.planner.elapsed_sum.toFixed(2) + "\navg = " + (this.planner.elapsed_sum / this.processes_total).toFixed(2), this.sketch.width * 0.92, this.sketch.height * 0.9);
  }

  drawNumbersFifo() {
    for(let i=0; i<this.processes_count; i++) {
      let p = this.processes[i];
      if (p.isWaiting()) {
        let num = this.planner.waiting.indexOf(p) + 1;
        this.sketch.fill(0);
        this.sketch.textSize(32);
        this.sketch.text(num, p.x+20, p.y + 20);
      }
    }
  }

  drawNumbersShortestFirst() {
    let ps = [];
    for(let i=0; i< this.planner.waiting.length; i++) {
      ps.push(this.planner.waiting.at(i));
    }

    let num = 1;
    ps.sort((a, b) => (a.length > b.length)? 1 : -1)
    for (let i=0; i<ps.length; i++) {
      
      if (ps[i].isWaiting()) {
        this.sketch.fill(0);
        this.sketch.textSize(32);
        this.sketch.text(num, ps[i].x+20, ps[i].y+20);
        num++;
      }
    }
  }

  draw() {
    this.sketch.strokeWeight(4);
    this.sketch.stroke(255);
    this.sketch.line(this.borderX, this.height / 10, this.borderX, this.height * 0.9);
    this.sketch.strokeWeight(2);

    for(let i=0; i<this.tracks_count; i++) {
      this.sketch.line(this.borderX, this.tracks[i], this.width * 0.9, this.tracks[i]);
    } 
    for(let i=0; i<this.processes_count; i++) {
      this.processes[i].draw();
    }
    
    if (this.planner.waiting.length == 0 && !this.planner.current_process && this.planner.elapsed_sum) {
      this.drawSum();
    }

    this.planner.update();
  }

  addProcess(beginTime, length, track_index) {
    this.processes_total++;
    let p = new Process(this.sketch, beginTime, length, this.tracks[track_index], this)
    this.processes[this.processes_count++] = p;
  }
}


var f1 = function(sketch) {   
  sketch.setup = function() {
    sketch.createCanvas(1800, 450);
    sketch.background(0, 255, 0, 0.25);
    sketch.fill(255);
    sketch.frameRate(60);
    sketch.g = new Grid(sketch, ProcessPlannerFifo, sketch.width / 10);

    sketch.g.addProcess(600, 500, 1);
    sketch.g.addProcess(100, 750, 0);
    sketch.g.addProcess(1200, 240, 2);
    sketch.g.addProcess(1200, 900, 3);    
  }

  sketch.draw = function() {
    sketch.background(50);
    sketch.g.draw();
  }

}
new p5(f1)

var f2 = function(sketch) {
  sketch.setup = function() {
    let canvas2 = sketch.createCanvas(1800, 450);
    canvas2.position(0, 460);
    sketch.background(0, 255, 0, 0.25);
    sketch.fill(255);
    sketch.frameRate(60);
    sketch.g = new Grid(sketch, ProcessPlannerShortestFirst, sketch.width / 10);
    sketch.g.addProcess(600, 500, 1);
    sketch.g.addProcess(100, 750, 0);
    sketch.g.addProcess(1200, 240, 2);
    sketch.g.addProcess(1200, 900, 3);
  }

  sketch.draw = function() {
    sketch.background(50);
    sketch.g.draw();
  }
}

new p5(f2)
