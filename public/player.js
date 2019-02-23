class Player {
  constructor(canvas) {
    this.PIECE_POOL = 'OISZLJT';
    this.COLORS = [
      {color1: "#3cbcfc", color2: "#0058f8"}, // 0
      {color1: "#b8f818", color2: "#00a800"}, // 1
      {color1: "#f878f8", color2: "#d800cc"}, // 2
      {color1: "#58d854", color2: "#0058f8"}, // 3
      {color1: "#58f898", color2: "#e40058"}, // 4
      {color1: "#6888fc", color2: "#58f898"}, // 5
      {color1: "#7c7c7c", color2: "#f83800"}, // 6
      {color1: "#a80020", color2: "#6844fc"}, // 7
      {color1: "#f83800", color2: "#0058f8"}, // 8
      {color1: "#fca044", color2: "#f83800"}, // 9
    ];
    this.SIZE = 40;

    this.canvas = canvas;
    if(this.canvas.id) {
      this.context = this.canvas.getContext("2d");
    }

    this.position = new Vec2(canvas.width / 2 - this.SIZE, 0);
    const index = Math.random() * this.PIECE_POOL.length | 0;
    this.piece = new Piece(this.PIECE_POOL.charAt(index));
    this.timer = 0;
    this.interval = 1000;
    this.grid = new Grid(canvas.width / this.SIZE, canvas.height / this.SIZE);
  }

  updateTimer(deltaTime, callback) {
    this.timer += deltaTime;
    if (this.timer > this.interval) {
      this.moveDown(callback);
    }
  }

  resetTimer() {
    this.timer = 0;
  }

  move(x, y) {
    var success = true;
    this.position.x += x * this.SIZE;
    if (this.collide()) {
      this.position.x -= x * this.SIZE;
      success = false;
    }

    this.position.y += y * this.SIZE;
    return success;
    //if (this.collide()) {
    //  this.position.y -= y * this.SIZE;
    //}
  }

  moveDown(callback) {
    let colliding = false;

    var endMove = false;

    this.resetTimer();
    this.move(0, 1);
    //if the piece collides with something, move it 
    if (this.collide()) {
      endMove = true;
      this.move(0, -1);
      this.putInGrid();
      this.resetToTop();

      const index = Math.random() * this.PIECE_POOL.length | 0;
      this.piece = new Piece(this.PIECE_POOL.charAt(index));
      
      //this is game over
      if (this.collide()) {
        colliding = true;
        this.grid = new Grid(this.canvas.width / this.SIZE, this.canvas.height / this.SIZE);
      }
    }
    this.grid.sweep(callback, colliding);
    return endMove;
  }

  putInGrid() {
    this.piece.representation.forEach((arr, y) => {
      arr.forEach((val, x) => {
        if (val !== 0) {
          this.grid.setPosition(x + this.posInGridPositions.x, y + this.posInGridPositions.y, val);
        }
      });
    });
  }

  rotateGrid(grid, dir = -1) {
    grid.forEach((arr, y) => {
      for (let x = 0; x < y; x++) {
        [grid[x][y], grid[y][x]] = [grid[y][x], grid[x][y]];
      }
    });
    
    if (dir === -1) {
      grid.forEach(arr => arr.reverse());
    } else if (dir === 1) {
      grid.reverse();
    }
  }

  rotate(dir = -1) {
    const position = this.position.x;
    let offset = 1;

    this.rotateGrid(this.piece.representation, dir);
    
    while (this.collide()) {
      this.position.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > this.piece.representation[0].length) {
        this.rotateGrid(this.piece.representation, -dir);
        this.position.x = position;
        return;
      }
    }
  }

  collide() {
    let collision = false;
    this.piece.representation.forEach((arr, y) => {
      arr.forEach((val, x) => {
        if (val !== 0 &&
            (this.grid.grid[y + this.posInGridPositions.y] &&
             this.grid.getPosition(x + this.posInGridPositions.x, y + this.posInGridPositions.y)) !== 0) {
          collision = true;
        }
      });
    });
    return collision;
  }

  resetToTop() {
    this.position = new Vec2(this.canvas.width / 2 - this.SIZE, 0);
  }

  get posInGridPositions() {
    return new Vec2(this.position.x / this.SIZE, this.position.y / this.SIZE);
  }

  set posInGridPositions(val) {
    this.position.x = val.x * this.SIZE;
    this.position.y = val.y * this.SIZE; 
  }

  drawSquare(x, y , width, height, val, color) {
    var context = this.context;
    var lineWidth = width / 8; 

    // fill to white initially
    context.fillStyle = "#fff";
    context.fillRect(x, y, width, height);
    
    context.fillStyle = color.color2;
    if (val == 1 || val == 2 || val == 7) {
      context.fillRect(x+lineWidth, y, width-lineWidth-lineWidth, lineWidth);
      context.fillRect(x+width-lineWidth-lineWidth, y, lineWidth, height-lineWidth);

      context.fillRect(x, y+height-lineWidth-lineWidth, width-lineWidth, lineWidth);
      context.fillRect(x, y+lineWidth, lineWidth, height-lineWidth-lineWidth);
    } else {

      if (val == 6 || val == 3) {
        context.fillStyle = color.color2;
      } else {
        context.fillStyle = color.color1;
      }
      context.fillRect(x, y, width, height);

      context.fillStyle = "#fff";
      context.fillRect(x, y, lineWidth, lineWidth);
      context.fillRect(x+lineWidth, y+lineWidth, lineWidth*2, lineWidth);
      context.fillRect(x+lineWidth, y+lineWidth, lineWidth, lineWidth*2);
    }
    
    // Do this for all
    this.context.fillStyle = "#000";
    context.fillRect(x, y+height-lineWidth, width-lineWidth, height-lineWidth);
    context.fillRect(x+width-lineWidth, y, lineWidth, height);
  }

  draw() {
    this.context.save();
    let gameScore = parseInt(score.innerHTML);
    var colorIndex = Math.floor((gameScore % 100) / 10);
    var color = this.COLORS[colorIndex];

    this.piece.representation.forEach((arr, y) => {
      arr.forEach((val, x) => {
        if (val != 0) {
          this.context.fillStyle = this.COLORS[val];
          const rectX = this.position.x + x*this.SIZE;
          const rectY = this.position.y + y*this.SIZE;
          //this.context.fillRect(rectX, rectY, this.SIZE, this.SIZE);
          this.drawSquare(rectX, rectY, this.SIZE, this.SIZE, val, color);
        } 
      });
    });

    this.grid.grid.forEach((arr, y) => {
      arr.forEach((val, x) => {
        if (val != 0) {
          this.context.fillStyle = this.COLORS[val];
          const rectX = x*this.SIZE;
          const rectY = y*this.SIZE;
          //this.context.fillRect(rectX, rectY, this.SIZE, this.SIZE);
          this.drawSquare(rectX, rectY, this.SIZE, this.SIZE, val, color);
        } 
      });
    });

    this.context.restore();
  }
}