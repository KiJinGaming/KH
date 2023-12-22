function sendCommand(cmd) {
    chrome.runtime.sendMessage({
        sender: "popup",
        type: "cmd",
        cmd: cmd.cmd,
        content: cmd.content
    })
}


const pinElement = document.getElementById("pin")
document.getElementById("set-pin").onclick = function() {
    let pin = pinElement.value
    sendCommand({
        cmd: "set_pin",
        content: pin
    })
}

document.getElementById("create-tab").onclick = async function() {
    sendCommand({
        cmd: "create_client"
    })
}

const createHostElement = document.getElementById("create-host-tab")
createHostElement.onclick = async function() {
    sendCommand({
        cmd: "create_host"
    })
}

document.getElementById("reset").onclick = function() {
    sendCommand({
        cmd: "reset"
    })
}