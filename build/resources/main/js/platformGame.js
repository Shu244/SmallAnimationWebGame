// Credits to https://eloquentjavascript.net/ for starter code and inspiration.

let MAX_ENEMIES = 7;
let VIEW_WIDTH = 600;
let VIEW_HEIGHT = 400;
let PLAYER_X_SPEED = 100;
let GRAVITY = 428;
let JUMP_SPEED = 243;
let DEAD_TILE_SEQUENCE = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7];

// ------------------------------- Start of models of for characters and platform -----------------------------------
let State = class State {
    constructor(actors, deadActors, status) {
        this.actors = actors;
        this.deadActors = deadActors;
        this.status = status;
    }

    static start() {
        let num_enemies = Math.floor(Math.random() * MAX_ENEMIES + 1);
        let startActors = [Player.create()];
        for(let i = 0; i < num_enemies; i++)
            startActors.push(Enemy.create());
        return new State(startActors, [],"playing");
    }

    get player() {
        return this.actors[0];
    }
};

let Vec = class Vec {
    constructor(x, y) {
        this.x = x; this.y = y;
    }
    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }
    times(factor) {
        return new Vec(this.x * factor, this.y * factor);
    }
};
let ACTORS_SIZE = new Vec(24, 30);

let Player = class Player {
    constructor(pos, speed) {
        this.pos = pos;
        this.speed = speed;
        this.deadTile = 0;
    }

    get type() { return "player"; }

    static create() {
        // Player will be positioned on the center of the left half of the game view.
        let centerOfLeft = VIEW_WIDTH/4;
        // Player will start in the center of allotted vertical height.
        let centerHeight = VIEW_HEIGHT/2;
        let startPos = new Vec(centerOfLeft, centerHeight);
        return new Player(startPos, new Vec(0, 0));
    }
};
Player.prototype.size = new Vec(ACTORS_SIZE.x, ACTORS_SIZE.y); // in px

let Enemy = class Enemy {
    constructor(pos, speed) {
        this.pos = pos;
        this.speed = speed;
        this.deadTile = 0;
    }

    get type() { return "enemy"; }

    static create() {
        let halfPlayerSpeed = PLAYER_X_SPEED/2;
        let speed = Math.floor(halfPlayerSpeed*(Math.random() + 1));

        let centerWidth = VIEW_WIDTH/2;
        let xPos = Math.floor(Math.random() * centerWidth) + centerWidth - 100;
        let pos = new Vec(xPos, VIEW_HEIGHT - 33);
        return new Enemy(pos, new Vec(-speed, 0));
    }
};
Enemy.prototype.size = new Vec(ACTORS_SIZE.x, ACTORS_SIZE.y); // in px
// ------------------------------- End of models of for characters and platform -----------------------------------

// ------------------------------- Start of actor interactions and movements ------------------------------------
let touchesWall = function(pos, size) {
    let top = pos.y;
    let left = pos.x;
    let bottom = top + size.y;
    let right = left + size.x;

    return top < 0 || left < 0 ||
        bottom >= VIEW_HEIGHT || right >= VIEW_WIDTH;
};

Enemy.prototype.update = function(time) {
    let newPos = this.pos.plus(this.speed.times(time));
    if (!touchesWall(newPos, this.size)) {
        return new Enemy(newPos, this.speed);
    } else {
        return new Enemy(this.pos, this.speed.times(-1));
    }
};

Player.prototype.update = function(time, keys) {
    let xSpeed = 0;
    if (keys.ArrowLeft)
        xSpeed -= PLAYER_X_SPEED;
    if (keys.ArrowRight)
        xSpeed += PLAYER_X_SPEED;
    let pos = this.pos;
    let movedX = pos.plus(new Vec(xSpeed * time, 0));
    if (!touchesWall(movedX, this.size))
        pos = movedX;

    let ySpeed = this.speed.y + time * GRAVITY;
    let movedY = pos.plus(new Vec(0, ySpeed * time));
    if (!touchesWall(movedY, this.size)) {
        pos = movedY;
    } else if (keys.ArrowUp && ySpeed > 0) {
        ySpeed = -JUMP_SPEED;
    } else {
        ySpeed = 0;
    }
    return new Player(pos, new Vec(xSpeed, ySpeed));
};

function overlap(actor1, actor2) {
    // the sprites take up 32 x 32 pxs but their actual width is smaller.
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&
        actor1.pos.x < actor2.pos.x + actor2.size.x &&
        actor1.pos.y + actor1.size.y > actor2.pos.y &&
        actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Enemy.prototype.collide = function(state, player) {
    let status = "lost";
    let relocate = player;
    if(player.speed.y > 0) {
        // Enemy got killed by player.
        relocate = this;
        status = "playing";
        player.speed.y = -JUMP_SPEED/2;
    }
    state.actors = state.actors.filter(a => a !== relocate);
    state.deadActors.push(relocate);
    if(relocate !== player && !state.actors.some(a => a.type === 'enemy'))
        status = 'won';
    return new State(state.actors, state.deadActors, status);
};

State.prototype.update = function(time, keys) {
    // Move actors in to correct positions first.
    let actors = this.actors
        .map(actor => actor.update(time, keys));
    let newState = new State(actors, this.deadActors, this.status);

    if (newState.status !== "playing")
        return newState;

    // When actors are in new positions, handle interactions.
    let player = newState.player;
    for (let actor of actors) {
        if (actor !== player && overlap(actor, player)) {
            newState = actor.collide(newState, player);
            break;
        }
    }
    return newState;
};
// ------------------------------- End of actor interactions and movements ------------------------------------

// ----------------------------------- Start of animating on DOM ---------------------------------------------
let flipHorizontally = function(context, around) {
    context.translate(around, 0);
    context.scale(-1, 1);
    context.translate(-around, 0);
};

let CanvasDisplay = class CanvasDisplay {
    constructor(parent) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = VIEW_WIDTH;
        this.canvas.height = VIEW_HEIGHT;
        parent.appendChild(this.canvas);
        this.cx = this.canvas.getContext("2d");
    }

    clear() {
        this.canvas.remove();
    }
};

CanvasDisplay.prototype.clearDisplay = function(status) {
    if (status === "won") {
        this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (status === "lost") {
        this.cx.fillStyle = "rgb(44, 136, 214)";
    } else {
        this.cx.fillStyle = "rgb(52, 166, 251)";
    }
    this.cx.fillRect(0, 0,
        this.canvas.width, this.canvas.height);
};

// 6 tiles for walking
let owletWalking = document.createElement("img");
owletWalking.src = "/owlet/owlet_walk.png";
// 8 tiles for death
let owletDead = document.createElement("img");
owletDead.src = "/owlet/owlet_death.png";

// 6 tiles for walking
let playerWalk = document.createElement("img");
playerWalk.src = "/dude/dude_walk.png";
// 8 tiles for jumping but only care about tile 4.
let playerJump = document.createElement("img");
playerJump.src = "/dude/dude_jump.png";
// 8 tiles for death
let playerDead = document.createElement("img");
playerDead.src = "/dude/dude_death.png";

CanvasDisplay.prototype.drawPlayer = function(player, x, y, width, height, dead) {
    let imgElementToUse = playerWalk;
    let tile = 5; // Standing still tile.
    if (dead) {
        imgElementToUse = playerDead;
        tile = rotateDeadTile(player);
    } else if (player.speed.y !== 0) {
        // Player is jumping
        imgElementToUse = playerJump;
        tile = 3;
    } else if (player.speed.x !== 0) {
        // Player is walking
        tile = Math.floor(Date.now() / 60) % 6;
    }

    this.drawOnCanvas(player, x, y, width, height, tile, imgElementToUse);
};

CanvasDisplay.prototype.drawEnemy = function(enemy, x, y, width, height, dead) {
    let imgElementToUse = owletWalking;
    let tile = Math.floor(Date.now() / 60) % 6;
    if (dead) {
        imgElementToUse = owletDead;
        tile = rotateDeadTile(enemy);
    }

    this.drawOnCanvas(enemy, x, y, width, height, tile, imgElementToUse);
};

let previousTime = undefined;
let rotateDeadTile = function(actor) {
    let time = Date.now();
    if(!previousTime) {
        previousTime = time;
    } else if(time - previousTime >= 60) {
        // At least 60 ms have passed since last deadTile change.
        actor.deadTile = actor.deadTile + 1;
        previousTime = time;
    }
    return DEAD_TILE_SEQUENCE[actor.deadTile];
};

CanvasDisplay.prototype.drawOnCanvas = function(actor, x, y, width, height, tile, imgElementToUse) {
    this.cx.save();

    if (actor.speed.x !== 0)
        actor.flip = actor.speed.x < 0;
    if (actor.flip)
        flipHorizontally(this.cx, x + width / 2);
    let tileX = tile * width;
    this.cx.drawImage(imgElementToUse,
        tileX, 0, width, height,
        x,     y, width, height);

    this.cx.restore();
};

CanvasDisplay.prototype.drawActors = function(state) {
    let actorsToDraw = [state.actors, state.deadActors];
    let dead = false;
    for(let actors of actorsToDraw) {
        for (let actor of actors) {
            let width = 32;
            let height = 32;
            let x = actor.pos.x;
            let y = actor.pos.y;
            if (actor.type === "player") {
                this.drawPlayer(actor, x, y, width, height, dead);
            } else {
                this.drawEnemy(actor, x, y, width, height, dead)
            }
            if(dead) {
                actor.deadTile = actor.deadTile + 1;
                if(actor.deadTile >= DEAD_TILE_SEQUENCE.length)
                    state.deadActors = state.deadActors.filter(a => a !== actor);
            }
        }
        dead = true;
    }
};

CanvasDisplay.prototype.syncState = function(state) {
    this.clearDisplay(state.status);
    this.drawActors(state, state.status);
};

function trackKeys(keys) {
    let down = Object.create(null);
    function track(event) {
        if (keys.includes(event.key)) {
            down[event.key] = event.type === "keydown";
            event.preventDefault();
        }
    }
    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    return down;
}

let arrowKeys =
    trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

function runAnimation(frameFunc) {
    let lastTime = null;
    function frame(time) {
        if (lastTime != null) {
            let timeStep = Math.min(time - lastTime, 100) / 1000;
            if (frameFunc(timeStep) === false)
                return;
        }
        lastTime = time;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function runLevel(Display) {
    let display = new Display(document.body);
    let state = State.start();
    let ending = 1.5;
    return new Promise(resolve => {
        runAnimation(time => {
            state = state.update(time, arrowKeys);
            display.syncState(state);
            if (state.status === "playing") {
                return true;
            } else if (ending > 0) {
                ending -= time;
                return true;
            } else {
                display.clear();
                resolve(state.status);
                return false;
            }
        });
    });
}

async function runGame(Display, height, width) {
    if(height)
        VIEW_HEIGHT = height;
    if(width)
        VIEW_WIDTH = width;
    while(true) {
        let status = await runLevel(Display);
        if (status === "won")
            break;
    }
    console.log("You've won!");
}
// ----------------------------------- Start of animating on DOM ---------------------------------------------
