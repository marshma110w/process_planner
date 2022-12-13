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
        this.current_process.setProcessing = false;
        this.current_process.setGone = true;
        this.current_process = null;
      }
    }
  }
}

class ProcessPlannerShortestFirst {
  constructor(grid) {
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
        this.current_process.setProcessing = false;
        this.current_process.setGone = true;
        this.current_process = null;
      }
    }
    if (this.waiting.length>0) {
      this.grid.drawNumbersShortestFirst();
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
    this.planner = new ProcessPlannerShortestFirst(this);

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

  drawNumbersFifo() {
    for(let i=0; i<this.processes_count; i++) {
      let p = this.processes[i];
      if (p.isWaiting()) {
        let num = this.planner.waiting.indexOf(p) + 1;
        fill(0);
        textSize(32);
        text(num, p.x+20, p.y + 20);
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
        fill(0);
        textSize(32);
        text(num, ps[i].x+20, ps[i].y+20);
        num++;
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
