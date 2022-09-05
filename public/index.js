let connected = false

const statusspan = document.getElementById("status")

const url = `${window.location.origin}/`

function setStatus(status){
    statusspan.innerHTML = status
}

function connect(){
    let channel = prompt("Enter channel name:");
    if(channel === null || channel === ""){
        connect();
    }
    let username = prompt("Enter username:");
    if(username === null || username === ""){
        connect();
    }
}
//connect()