let connected = false
let cache = null
let usernameCached = null
let channelCached = null

const statusspan = document.getElementById("status")
const requestStatus = document.getElementById("requestStatus")
const msgList = document.getElementById("msgList")
const msgBox = document.getElementById("msgbox");
const ScreenElement = document.getElementById("screen")

const origin = window.location.origin

const allowedElements = ["B", "I", "IMG", "STRONG", "EM", "P", "A", "VIDEO", "AUDIO"]

let reqCount = 0

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
	function checkForXSS(element){
		for(x of Array.from(element.children)){
			//for every child
			x.className = "nopadding"
			//check if the element is not allowed
			//find an element where the element matches something from the allowed list
			let allowed = allowedElements.find(element => element === x.tagName)
			if(allowed === undefined){
				//is not allowed
				//remove it
				element.removeChild(x);
			} else {
				checkForXSS(x);
			}
		}
	}
	checkForXSS(messageP);
	nameSpan.innerHTML = name
	let date = new Date(timestamp)
	dateSpan.innerHTML = date.toLocaleString()
	li.id = id.toString()
	msgList.appendChild(li);
	ScreenElement.scrollTop = li.offsetTop;
}

function sendSystemMessage(message){
	addMsgElement("System", message, Date.now(), -1)
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

function connect(cParam, uParam){
	if(connected){
		alert("To connect to a new channel, disconnect first")
		return
	}
	let channel, username
	if(cParam){
		channelCached = cParam.toLowerCase()
		channel = cParam.toLowerCase()
	} else {
		let result = prompt("Enter channel name (not case sensitive):");
		if(result === null || result === ""){
			//connect();
			return
		}
		channelCached = result
		channelCached = channelCached.toLowerCase()
		channel = result.toLowerCase()
	}
	if(uParam){
		usernameCached = uParam
		username = uParam
	} else {
		let result = prompt("Enter username:");
		if(result === null || result === ""){
			//connect();
			return
		}
		usernameCached = result
		username = result
	}
	let endpoint = `${origin}/join/${channel}?username=${username}`
	sendSystemMessage(`Opening connection to ${channel}...`)
	fetch(endpoint, {method: "POST"}).then((resp) => {
		reqCount += 1
		resp.json().then((json) => {
			//recieve the response
			//store in cache
			if(!resp.ok){
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
				sendSystemMessage(`Successfully joined channel ${cache.name} (${cache.users.length} connected)`);
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

const commands = [
	{
		name: "/join",
		aliases: ["connect", "newConnection"],
		description: "Join a channel",
		run: () => {
			connect();
		}
	},
	{
		name: "/leave",
		description: "Leave the current channel",
		aliases: ["disconnect", "close", "closeConnection", "bye"],
		run: () => {
			disconnect();
		}
	},
	{
		name: "/channels",
		description: "Show all channels",
		aliases: ["list"],
		run: () => {
			//send a request to the server
			let endpoint = `${origin}/channels`
			fetch(endpoint, {
				method: "GET"
			}).then(resp => {
				reqCount += 1
				resp.json().then(json => {
					//got the json
					let names = []
					for(x of json){
						//for every channel
						names.push(`${x.name} (${x.users.length} connected)`)
					}
					if(names.length === 0){
						names.push("No channels");
					}
					sendSystemMessage(`Channel list: ${names.join(", ")}`)
				})
			}).catch(err => {
				sendSystemMessage("Failed to get channel list")
				console.log(err)
			})
		}
	},
	{
		name: "/cmds",
		description: "Shows a list of all commands",
		aliases: ["commands", "help"],
		run: () => {
			let cmds = []
			commands.forEach((command) => {
				let aliasestbl = []
				for(x of command.aliases){
					aliasestbl.push(`/${x}`)
				}
				cmds.push(`${command.name} [${aliasestbl.join(", ")}]`)
			})
			sendSystemMessage(cmds.join(", "));
		}
	},
	{
		name: "/membercount",
		aliases: ["getmembercount", "count", "members", "getcount"],
		description: "Get users in the channel",
		run: () => {
			if(connected){
				let tbl = []
				cache.users.forEach(user => tbl.push(user.name))
				sendSystemMessage(`${cache.users.length} user(s) connected: ${tbl.join(", ")}`);
			} else {
				sendSystemMessage("Can't run this command when not connected")
				return
			}
		}
	},
]

function sendMessage(){
	//get content
	let content = msgBox.value
	if(content === ""){
		return
	}
	//check if its a command
	let command = null
	for(let x of commands){
		if(content === x.name){
			command = x
		} else {
			for(alias of x.aliases){
				if(content === `/${alias}`){
					command = x
				}
			}
		}
	}
	if(command !== null){
		//if such command exists
		//run it
		command.run();
		msgBox.value = ""
	} else {
		//check if connected
		if(connected === false){
			alert("Not connected");
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
		}).catch((err) => {
			sendSystemMessage("Failed to send message")
			console.log(err)
		}).then(() => {
			reqCount += 1;
		})
	}
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
		reqCount += 1;
		if(!resp.ok){
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
			sendSystemMessage("Successfully disconnected");
		}
	}).catch(err => {
		alert("Failed to disconnect from server: " + err)
		console.log(err)
	})
}

let cliConfig = {
	CACHE_REQ_INTERVAL: "2500"
};

(function loop() {
	setTimeout(() => {
	   // Your logic here
	   if(connected){
		if(document.hasFocus()){
			let endpoint = `${origin}/cache/${channelCached}?username=${usernameCached}`
			let now = new Date();
			fetch(endpoint, {
				method: "GET"
			}).then((resp) => {
				reqCount += 1;
				resp.json().then(json => {
					setConnectionStatus(`recieved cache (${new Date() - now}ms) (${reqCount} total requests)`);
					cache = json.cTable
					loadMessagesFromCache();
					//load config
					cliConfig = json.config
					//check if user is in cache table
					//if we are connected
					let users = cache.users
					//users is an array
					if(users.find(user => user.name === usernameCached) === undefined){
						//if the user no longer exists in the server table
						//clear all the client variables
						//first check if we are connected to avoid connecting as null
						console.log(connected, usernameCached, channelCached, cache)
						if(connected === false){
							//if we are no longer connected somehow
							return
						}
						let channel = channelCached
						let name = usernameCached
						connected = false
						usernameCached = null
						channelCached = null
						cache = null
						setStatus("reconnecting...")
						sendSystemMessage(`The server has restarted! Opening new connection as ${name}...`)
						for(x of Array.from(msgList.children)){
							x.id = "-1"
						}
						connect(channel, name)
					}
				})
			}).catch((err) => {
				sendSystemMessage("Lost connection to server")
				setConnectionStatus(`failed to get cache (lost connection!) [${new Date() - now}ms]`)
				console.log(err)
			})
		} else {
			setConnectionStatus("connected, focus lost");
		}
	}
		loop();
	}, cliConfig.CACHE_REQ_INTERVAL);
 })();
