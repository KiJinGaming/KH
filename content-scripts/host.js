(function() {
const ROLE = "host"
let ACTIVE = true
let INIT = false

function sendInputToSW(inputContent) {
    req = {
        sender: "host",
        type: "input",
        input: "choose_answer",
        content: inputContent
    }
    return chrome.runtime.sendMessage(req)
}

// answer: button custom prop
// data-functional-selector="answer-0"
function getInputListener(answer) {
    return function() {
        sendInputToSW(answer)
    }
}

// todo: rework addInputListener
// MutationObserve
let inputAdded = false
function addInputListener() {
    if (inputAdded) return
    inputAdded = true
    
    let observer = new MutationObserver(function(mutationsList, observer) {
        for(let mutation of mutationsList) {
            if (mutation.type !== 'childList') continue
            for (const node of mutation.addedNodes) {
                if (!(node.nodeName.toLowerCase() === 'main' && node.className.match(/^question__PageWrapper/))) continue

                for (let alpha = 0; alpha < 4; alpha++) {
                    let btn = node.querySelector(`[data-functional-selector="answer-${alpha}"]`)
                    if (!btn) continue
                    btn.addEventListener("click", getInputListener(alpha))
                }
            }
        }
    })

    observer.observe(document.body, { childList: true, subtree: true })

}

function msgListener(req, sender, sendRes) {
    if (!ACTIVE) return
    if (req.type === "cmd" && req.cmd === "set_role" && !INIT) {
        INIT = true
        if (req.content == ROLE) {
            addInputListener()
        } else {
            ACTIVE = false
        }
    }
    
}

chrome.runtime.onMessage.addListener(msgListener)
})()