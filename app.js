const express = require("express")

const app = express();

app.use(express.json());
app.use(express.static("public"));

let channels = []
let users = []

/*
    keep a log of channels, users, and messages within channels
    channel: {
        name: string;
        users: user[];
        messages: message[]
    }
    user: {
        name: string;
    }
    message: {
        timestamp: int;
        content: string
    }
*/

function getChannel(name){
    let channel = channels[name]
    if(!channel){
        //create it
        channels.push({
            name: name,
            users: {},
            messages: [{content: `Welcome to the ${name} channel!`, timestamp: 0}]
        });
        return channels.find((c) => c.name === name);
    } else {
        return channel
    }
}

function getUser(name){
    let user = users[name]
    if(!user){
        users.push({
            name: name,
            // Channel connected??????
        })
    } else {
        return user
    }
}

function sendMessage(channel, content){
    channel.messages.push({
        content: content,
        timestamp: Date.now(),
    })
}

app.get("/join/:channel", (req,resp) => {
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
    //get the channel
    let cTable = getChannel(channel);
    //add a messages
    //add random join messages sometimes
    sendMessage(cTable, `${username} joined the channel`);
    resp.set("Content-Type", "application/json");
    
})

let PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})