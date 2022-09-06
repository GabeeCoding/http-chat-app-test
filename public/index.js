let connected = false
let cache = null
let usernameCached = null
let channelCached = null

const statusspan = document.getElementById("status")
const requestStatus = document.getElementById("requestStatus")
const msgList = document.getElementById("msgList")
const msgBox = document.getElementById("msgbox");
const ScreenElement = document.getElementById("screen")

const origin = `${window.location.origin}`

function setStatus(status){
    statusspan.innerHTML = status
}

function setConnectionStatus(status){
    requestStatus.innerHTML = status
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
            console.log(x.id, message.id)
            if(message.from === "System"){
                alreadyAdded = true
            }
            if(x.id == message.id){
                alreadyAdded = true;
            }
        }
        if(alreadyAdded === false){
            //not already added
            //its a new element
            //add element
            console.log(message)
            addMsgElement(message.from, message.content, message.timestamp, message.id)
        }
    });
    console.log("------------------------")
    //get the highest id
    //or most recent element
    let mostRecentElement = null
    for(x of Array.from(msgList.children)){
        mostRecentElement = x
    }
    ScreenElement.scrollTop = mostRecentElement.offsetTop
}

function connect(){
    if(connected){
        alert("To connect to a new channel, disconnect first")
        return
    }
    let channel = prompt("Enter channel name (not case sensitive):");
    if(channel === null || channel === ""){
        //connect();
        return
    }
    channelCached = channel
    channelCached = channelCached.toLowerCase()
    let username = prompt("Enter username:");
    if(username === null || username === ""){
        //connect();
        return
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
    if(content === ""){
        return
    }
    msgBox.value = ""
    let endpoint = `${origin}/sendMessage/${channelCached}?username=${usernameCached}`
    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({message: content}),
    })
}

msgBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("sendMessageButton").click();
    }
})

function disconnect(){
    //Cleans up everything
    if(connected === false){
        //if we are not connected
        //fail to disconnect
        alert("Not connected");
        return
    }
    let endpoint = `${origin}/leave/${channelCached}?username=${usernameCached}`
    fetch(endpoint, {method: "POST"}).then(resp => {
        if(resp.status !== 200){
            resp.json().then((json) => {
                alert("Failed to disconnect: " + json.message)
            });
        } else {
            //cleanup
            connected = false
            usernameCached = null
            channelCached = null
            cache = null
            setStatus("not connected");
            addMsgElement("System", "Successfully disconnected", Date.now(), -1);
        }
    }).catch(err => {
        alert("Failed to disconnect from server: " + err)
        console.log(err)
    })
}

setInterval(()=>{
    //get cache
    if(connected){
        let endpoint = `${origin}/cache/${channelCached}`
        fetch(endpoint, {
            method: "GET"
        }).then((resp) => {
            resp.json().then(json => {
                cache = json
                console.log("Updating cache")
                loadMessagesFromCache();
            })
        })
    }
}, 5000)