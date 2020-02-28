const WebSocket = require('ws');
const PORT = 1337

const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Wss starting on ${PORT}`)
});


let browser, players = [];

wss.on('connection', (ws, req) => {
    ws.on('message', (message) => {
        if (!browser || players.length < 2) {
            const msg = JSON.parse(message);

            if (msg.device == "browser") {
                browser = ws;
                players = [];
                console.log("Browser connected");
                ws.onclose = () => {
                    players.forEach( p =>{
                        if(p) p.terminate();
                    })
                    p = [];
                }
            }
            if (msg.device == "phone" && msg.type == "open" && players.length < 2) {
                ws.onclose = () => {
                    players.forEach(p => {
                        if (p) p.terminate()
                    })
                    players = [];

                }
                players.push(ws);
                ws.send(JSON.stringify({ type: "open", color: players.length > 1 ? "green" : "red" }))
                console.log("Player " + players.length + " connected");
                if (browser) {
                    browser.send(JSON.stringify({ type: "ready", player: players.length }));
                }
            }
        } else {
            try {
                browser.send(message);
            }
            catch (er) {
				console.log(er);
            }
        }
    });
});