let KH = {
    clientTabs: [],
    hostTab: null,
    pin: null
}

let msgListener = {
    router: null,
    popupListener: {
        router: null,
        cmdListener: null,
        initListener: null
    },
    hostListener: {
        router: null,
        inputListener: null
    }
}

let msgSender = {
    client: {
        inputSender: null
    }
}
// GENERAL ROUTER

msgListener.router = function(req, sender, res) {
    switch (req.sender) {
        case "popup":
            this.popupListener.router(req)
            break;
        case "host":
            this.hostListener.router(req)
            break;
    }
}

// POP UP

msgListener.popupListener.router = function(req) {
    switch (req.type) {
        case "cmd":
            this.cmdListener(req)
            break;
        case "init":
            this.initListener(req)
            break;
    }
}

msgListener.popupListener.initListener = function(req) {
    if (req.content === "reset") {
        KH.clientTabs = []
        KH.hostTab = null
        KH.pin = null
    } else if (req.content.match(/^pin=/)) {
        KH.pin = req.content.match(/^pin=(\d+)/)[1]
    }
}

msgListener.popupListener.cmdListener = function(req) {
    if (req.content === "create_host") {
        
    } else if (req.content === "create_client") {

    }
}


// HOST

msgListener.hostListener.router = function(req) {
    switch (req.type) {
        case "input":
            this.inputListener(req)
    }
}


// Send to all tabs
msgSender.client.inputSender = function(input) {

}

chrome.runtime.onMessage.addListener(msgListener)