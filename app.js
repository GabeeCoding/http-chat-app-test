const express = require("express")

const app = express();

app.use(express.json());
app.use(express.static("public"));

let PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})