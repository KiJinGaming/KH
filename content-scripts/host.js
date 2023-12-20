const ROLE = "host"
let ACTIVE = true

function msgListener(req, sender, sendRes) {
    if (ACTIVE && req.cmd && req.cmd === "init" && req.role !== ROLE) {
        ACTIVE = false
    }
    
    if (!ACTIVE) return
    console.log(req.msg)
}

chrome.runtime.onMessage.addListener(msgListener)