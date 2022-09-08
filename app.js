const express = require("express")

const app = express();

app.use(express.json());
app.use(express.static("public"));

let channels = []
let lastMsgId = 0;
/*
    keep a log of channels, users, and messages within channels
    channel: {
        name: string;
        users: user[];
        messages: message[]
    }
    message: {
        timestamp: int;
        content: string
    }
*/

function getChannel(name){
    let channel = channels.find(c => c.name === name)
    if(!channel){
        //create it
        channels.push({
            name: name,
            users: [],
            messages: [],
        });
        return channels.find((c) => c.name === name);
    } else {
        return channel
    }
}

function sendMessage(channel, content, from){
    channel.messages.push({
        content: content,
        timestamp: Date.now(),
        id: lastMsgId + 1,
        from: from,
    })
    lastMsgId += 1
}

app.post("/join/:channel", (req,resp) => {
    let channel = req.params.channel
    let username = req.query.username
    if(!channel){
        resp.status(400).json({message: "Missing channel paramater"});
        return
    }
    if(!username){
        resp.status(400).json({message: "Missing username query paramater"})
        return
    }
    if(username.toLowerCase() === "system"){
        resp.status(400).json({message: '"System" is a reserved username'}).end()
        return
    }
    //get the channel
    let cTable = getChannel(channel);
    //add a messages
    //add random join messages sometimes
    //first, check if that user is aleady connected
    if(cTable.users.find(u => u.name === username)){
        resp.status(400).json({message: "Username taken, please choose another"}).end()
        return
    }
    cTable.users.push({
        name: username
    })
    sendMessage(cTable, `${username} joined the channel`, "System");
    console.log(`${username} has joined the ${channel} channel`);
    resp.set("Content-Type", "application/json");
    //send back a table of the channel
    //give the user back a uuid so they can use that for authenticating actions????
    resp.status(200).json(cTable).end();
});

app.post("/leave/:channel", (req,resp) => {
    let channel = req.params.channel
    let username = req.query.username
    if(!channel){
        resp.status(400).json({message: "Missing channel paramater"});
        return
    }
    if(!username){
        resp.status(400).json({message: "Missing username query paramater"})
        return
    }
    let cTable = getChannel(channel);
    const index = cTable.users.indexOf(cTable.users.find((u) => u.name === username));
    
    if (index > -1) { // only splice array when item is found
        cTable.users.splice(index, 1); // 2nd parameter means remove one item only
        if(cTable.users.length === 0){
            //if there are no users
            let index = channels.indexOf(cTable)
            channels.splice(index, 1)
        }
    } else {
        resp.status(400).json({message: "Username does not exist"}).end()
        return
    }
    resp.status(200).end()
});

app.post("/sendMessage/:channel", (req,resp) => {
    let channel = req.params.channel
    let username = req.query.username
    if(req.headers["content-type"] !== "application/json"){
        resp.status(400).json({message: "Invalid content-type, expected application/json!"}).end();
        return
    }
    if(!channel){
        resp.status(400).json({message: "Missing channel paramater"});
        return
    }
    if(!username){
        resp.status(400).json({message: "Missing username query paramater"})
        return
    }
    //sending a message
    //add it to the cTable
    let cTable = getChannel(channel);
    sendMessage(cTable, req.body.message, username);
    resp.status(200).end()
});

app.get("/cache/:channel", (req, resp) => {
    let channel = req.params.channel
    if(!channel){
        resp.status(400).json({message: "Missing channel paramater"});
        return
    }
    let cTable = getChannel(channel);
    resp.json(cTable).end();
})

app.get("/channels", (req, resp) => {
    resp.json(channels).end();
})

let PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT} (http://localhost:${PORT})`)
})