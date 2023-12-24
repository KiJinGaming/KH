(function() {
const ROLE = "client"
let ACTIVE = true
let INIT = false

let msgListener = {
    cmdListener: function(req) {
        if (req.cmd === "set_role" && !INIT) {
            INIT = true
            if (req.content != ROLE) {
                ACTIVE = false
            }
        }
    },
    inputListener: function(req) {
        if (req.input === "choose_answer") {
            let btn = document.querySelector(`[data-functional-selector="answer-${req.content}"]`)
            if (!btn) return
            btn.click()
        }
    },
    router: function (req, sender, sendRes) {
        if (!ACTIVE) return
        switch (req.type) {
            case "cmd":
                return this.cmdListener(req)
            case "input":
                return this.inputListener(req)
        }
    }
}


chrome.runtime.onMessage.addListener(msgListener.router.bind(msgListener))
})()