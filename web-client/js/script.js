window.addEventListener("load", () => {
    const canv = document.getElementById("screen");
    const ctx = canv.getContext("2d");
    const {
        width,
        height
    } = canv;

    class Player {
        constructor(x, y, color) {
            this.width = 100
            this.height = 16;
            this.x = x - this.width / 2;
            this.y = y;
            this.color = color;
            this.speed = 0;
            this.connected = false;
        }
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update(ballX = false, ballY) {
            if (!ballX) {
                this.x += this.speed;
                if (this.x < 0) {
                    this.x = 0;
                } else if (this.x > width - this.width) {
                    this.x = width - this.width;
                }
                return;
            }

            if (ballY > height / 2) {
                ballX = width / 2;
            }
            let d = -((this.x + this.width / 2) - ballX);

            if (d > 7) d = 7;
            if (d < -7) d = -7;
            this.speed = d;
            this.x += this.speed;
            if (this.x < 0) {
                this.x = 0;
            } else if (this.x > width - this.width) {
                this.x = width - this.width;
            }


        }
    }
    class Ball {
        constructor(x, y, r) {
            this.r = r;
            this.x = x;
            this.y = y;
            this.xSpeed = 0;
            this.ySpeed = 0;
        }
        draw(ctx) {
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 2 * Math.PI, false)
            ctx.fill();
        }
        update(score, comp, player) {
            this.x += this.xSpeed;
            this.y += this.ySpeed;
            if (this.x < this.r || this.x > width - this.r)
                if (this.x < this.r) {
                    this.xSpeed *= -1;
                    this.x = this.r + 1;
                }
            if (this.x > width - this.r) {
                this.xSpeed *= -1;
                this.x = width - this.r - 1;
            }
            if (this.y < this.r) {
                score.green++;
                this.reset(1)
            }
            if (this.y > height - this.r) {
                score.red++;
                this.reset(-1)
            }
            if (this.y - this.r < comp.y + comp.height && this.y + this.r > comp.y) {
                if (this.x + this.r > comp.x && this.x - this.r < comp.x + comp.width) {
                    this.xSpeed = Math.random() * 16 - 8
                    this.ySpeed = -(this.ySpeed) + 3;
                    this.y += this.ySpeed;
                }
            }
            if (this.y + this.r > player.y && this.y - this.r < player.y + player.height) {
                if (this.x + this.r > player.x && this.x - this.r < player.x + player.width) {
                    this.xSpeed = Math.random() * 16 - 8;
                    this.ySpeed = -(this.ySpeed + 3);
                    this.y += this.ySpeed;
                }
            }
        }

        reset(a) {
            this.x = width / 2;
            this.y = height / 2;
            this.xSpeed = 0;
            this.ySpeed = 0;
            setTimeout(() => {
                this.xSpeed = Math.random() * 16 - 8;
                this.ySpeed = 3 * a;
            }, 1000);

        }
    }

    let serverConnected = false;
    let start = false;
    const red = new Player(width / 2, 32, "#ff0000");
    const green = new Player(width / 2, height - 32, "#00ff00");
    const ball = new Ball(width / 2, height / 2, 6);

    const ws = new WebSocket("ws://localhost:1337")
    ws.onopen = () => {
        serverConnected = true;
        start = red.connected
        ws.send(JSON.stringify({
            type: "open",
            device: "browser"
        }));
    }
    ws.onerror = () => {
        serverConnected = false;
    }
    ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.type == "ready") {
            if (msg.player == 1) {
                red.connected = true;
                red.draw(ctx);
                checkStart();
            }
            if (msg.player == 2) {
                green.connected = true;
                green.draw(ctx);
                checkStart();
            }
        } else {
            if (msg.color == "red") red.speed = msg.y * 10;
            if (msg.color == "green") green.speed = msg.y * 10;
        }
    }
    const score = {
        green: 0,
        red: 0
    }

    function checkStart() {
        if (serverConnected && red.connected && green.connected) {
            start = true;
            let i = 5;
            let interval = setInterval(() => {
                //countdown before starting the game
                score.red = i;
                score.green = i;
                if (i <= 0) {
                    ball.xSpeed = Math.random() * 4 - 8;
                    ball.ySpeed = 7;
                    clearInterval(interval);
                }
                i--;
            }, 1000);
        }
    }

    function drawMidLine(ctx) {
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.setLineDash([12, 16]);
        ctx.strokeStyle = "#FFFF00";
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2)
        ctx.stroke();
        ctx.fill();
    }


    function drawScore(ctx, score) {
        ctx.font = "24px Arial";
        ctx.textAling = "center"
        ctx.fillStyle = "#fff";
        ctx.fillText(score.red, width / 2, height / 4);
        ctx.fillText(score.green, width / 2, height / 4 * 3);

    }

    drawMidLine(ctx);

    function render() {
        if (start) {
            ball.update(score, red, green);
            green.update();
            red.update();
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, width, height)
            drawScore(ctx, score);
            drawMidLine(ctx);
            ball.draw(ctx);
            red.draw(ctx);
            green.draw(ctx);
        }
        window.requestAnimationFrame(render);
    }
    render()
})