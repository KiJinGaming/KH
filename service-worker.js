let KH = {
    clientTabs: [],
    hostTab: null,
    pin: null,

    reset: function() {
        this.clientTabs = []
        this.hostTab = null
        this.pin = null
    }
}

let msgListener = {
    router: null,
    popupListener: {
        router: null,
        cmdListener: null
    },
    hostListener: {
        router: null,
        inputListener: null
    }
}

let msgSender = {
    client: {
        inputSender: null,
        cmdSender: null,
        sendToAllClients: null
    },
    host: {
        cmdSender: null
    }
}

// GENERAL FUNC

async function createKHTab(pin) {
    return await chrome.tabs.create({
        url: `https://kahoot.it/?pin=${pin}`,
        active: false
    })
}

function matchClientTabs(id) {
    for (const tab of KH.clientTabs) {
        if (tab.id === id) {
            return tab
        }
    }
    return null
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

msgListener.popupListener.cmdListener = function(req) {
    switch (req.cmd) {
        case "reset":
            KH.reset()
            break

        case "set_pin":
            KH.pin = req.content
            break

        case "create_host":
            createKHTab(KH.pin).then((tab) => {
                KH.hostTab = tab
            })
            break

        case "create_client":
            createKHTab(KH.pin).then((tab) => {
                KH.clientTabs.push(tab)
            })
            break
    }
}


// HOST

msgListener.hostListener.router = function(req) {
    switch (req.type) {
        case "input":
            this.inputListener(req)
    }
}

msgListener.hostListener.inputListener = function(req) {
    msgSender.client.inputSender(req)
}


//MSG SENDER

msgSender.client.sendToAllClients = function(req) {
    return KH.clientTabs.forEach(tab => {
        tab.sendMessage(req)
    })
}

msgSender.client.cmdSender = function(cmd) {
    this.sendToAllClients({
        sender: "sw",
        type: "cmd",
        cmd: cmd.cmd,
        content: cmd.content
    })
}

msgSender.host.cmdSender = function(cmd) {
    KH.hostTab.sendMessage({
        sender: "sw",
        type: "cmd",
        cmd: cmd.cmd,
        content: cmd.content
    })
}

// Send to all tabs
msgSender.client.inputSender = function(input) {
    this.sendToAllClients({
        sender: "sw",
        type: "input",
        input: input.input,
    })
}

chrome.runtime.onMessage.addListener(msgListener)

//Enable, disable content script

chrome.tabs.onUpdated.addListener(function(tabId, info) {
    if (info.status !== "complete") return
    if (KH.hostTab && tabId === KH.hostTab.id) {
        msgSender.host.cmdSender({
            cmd: "set_role",
            content: "host"
        })
    } else if (matchClientTabs(tabId)) {
        msgSender.client.cmdSender({
            cmd: "set_role",
            content: "client"
        })
    }
})