let connected = false
let cache = null
let usernameCached = null
let channelCached = null

const statusspan = document.getElementById("status")
const msgList = document.getElementById("msgList")
const msgBox = document.getElementById("msgbox");

const origin = `${window.location.origin}`

function setStatus(status){
    statusspan.innerHTML = status
}

function addMsgElement(name, content, timestamp, id){
    let li = document.createElement("li")
    let infoP = document.createElement("p")
        let nameSpan = document.createElement("span")
            nameSpan.className = "bold username"
        let dateSpan = document.createElement("span")
        infoP.appendChild(nameSpan)
        infoP.appendChild(dateSpan)
    let messageP = document.createElement("p")
        messageP.className = "messagecontent"
    li.appendChild(infoP)
    li.appendChild(messageP)

    messageP.innerHTML = content
    nameSpan.innerHTML = name
    let date = new Date(timestamp)
    dateSpan.innerHTML = date.toLocaleString()
    li.id = id.toString()
    msgList.appendChild(li);
}

function loadMessagesFromCache(){
    //loop over cache messages
    console.log(cache)
    cache.messages.forEach((message) => {
        //check if message id is already in the page
        let alreadyAdded = false
        for(x of Array.from(msgList.children)){
            if(x.id === message.id){
                alreadyAdded = true;
            }
        }
        if(alreadyAdded === false){
            //not already added
            //add element
            console.log(message)
            addMsgElement(message.from, message.content, message.timestamp, message.id)
        }
    })
}

function connect(){
    let channel = prompt("Enter channel name:");
    if(channel === null || channel === ""){
        connect();
    }
    channelCached = channel
    let username = prompt("Enter username:");
    if(username === null || username === ""){
        connect();
    }
    usernameCached = username
    let endpoint = `${origin}/join/${channel}?username=${username}`
    fetch(endpoint, {method: "POST"}).then((resp) => {
        resp.json().then((json) => {
            //recieve the response
            //store in cache
            if(resp.status !== 200){
                //something went wrong, check message in json
                if(json.message){
                    //there is a message
                    alert("An error occured while trying to join: " + json.message)
                } else {
                    alert("An unexpected error occured: No message available")
                }
            } else {
                //it is ok
                //store channel in cache
                connected = true
                cache = json
                setStatus("connected")
                addMsgElement("System", "Successfully joined channel " + cache.name, Date.now(), -1)
                //load messages from cache
                loadMessagesFromCache()
            }
        }).catch((err) => {
            alert("Failed to parse response from server: " + err)
            console.log(err)
        })
    }).catch((err) => {
        console.log(err)
        alert("Couldn't connect to server: " + err)
    })
    //make the bot send a message instead of an alert?
}

function sendMessage(){
    //check if connected
    if(connected === false){
        alert("Not connected");
        return
    }
    //get content
    let content = msgBox.value
    console.log(content)
    let endpoint = `${origin}/sendMessage/${channelCached}?username=${usernameCached}`
    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({message: content}),
    })
}

function disconnect(){
    //Cleans up everything
    let endpoint = `${origin}/leave/${channelCached}?username=${usernameCached}`
    fetch(endpoint, {method: "POST"}).then(resp => {
        
    }).catch(err => {
        alert("Failed to disconnect from server: " + err)
        console.log(err)
    })
}