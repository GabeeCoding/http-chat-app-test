![javascript](https://badges.aleen42.com/src/javascript.svg)
![Nodejs](https://img.shields.io/badge/-Node.js-58595a?style=flat&logo=Node.js)
![Unlicensed](https://img.shields.io/github/license/GabeeCoding/http-chat-app-test)
![GitHub repo size](https://img.shields.io/github/repo-size/GabeeCoding/http-chat-app-test)
![GitHub last commit](https://img.shields.io/github/last-commit/GabeeCoding/http-chat-app-test)
![GitHub issues](https://img.shields.io/github/issues/GabeeCoding/http-chat-app-test)
![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/GabeeCoding/http-chat-app-test)

# Web Chat

Hello GitHub user! This is a chat app inspired by IRC which took me 4 days to make.

If you want to contribute to this repo, send a PR and I will review it. The repo is Unlicensed, so feel free to take some code for any purposes.

# How it works

The client sends a request to the server every few seconds to get the latest channel info and messages.
There are numerous endpoints on the server which work together to modify the channel object which gets sent back to the client every few seconds.

If the server restarts the client can recognise that and reconnect for the user as soon as a connection is reestablished.

# Start-up guide

Requires: node, npm

1. Update dependencies


    npm i
   

2. Run the server script (defaults to port 3000)

    
    node app
    
    
To change the port that the server listens on, change the PORT environment variable.
to do that, create a .env file

    PORT=YOUR_PORT_HERE
    
Replace the text after the equals with your desired port number.

Enjoy :)
