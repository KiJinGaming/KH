// let KH = {
//     clientTabs: [],
//     hostTab: null,
//     pin: null,
// }

const DELAY = 100 // ms

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

const KH_DB = {
    DB_Init: false,
    sessionStorage: chrome.storage.session,

    // SET

    setPin(pin) {
        return this.sessionStorage.set({ pin: pin })
    },

    setHost(hostTabId) {
        return this.sessionStorage.set({ host_tab_id: hostTabId })
    },

    setClients(clientIdsArr) {
        return this.sessionStorage.set({ client_tab_ids: clientIdsArr })
    },

    reset() {
        return Promise.all([
            this.setPin(""),
            this.setHost(""),
            this.clearClients(),
            this.sessionStorage.set({ init: true})
        ])
    },

    // GET
    async storageGet(key) {
        if (!this.DB_Init && !(await this.sessionStorage.get("init")).init) {
            await this.reset()
            this.DB_Init = true
        }
        return this.sessionStorage.get(key)
    },

    async getPin() {
        return (await this.storageGet("pin")).pin
    },

    async getHostId() {
        return (await this.storageGet("host_tab_id")).host_tab_id
    },

    async getClientIds() {
        return (await this.storageGet("client_tab_ids")).client_tab_ids
    },

    async addClient(clientId) {
        let clientIds = await this.getClientIds()
        clientIds.push(clientId)

        return await this.setClients(clientIds)
    },

    async rmClient(clientId) {
        let clientIds = await this.getClientIds()
        
        let removed = clientIds.filter(id => id !== clientId)

        return this.setClients(removed)
        
    },

    clearClients() {
        return this.setClients([])
    },
}

const KH = Object.assign({
    getHost: () => {},
    getClients: () => {}
}, KH_DB)

KH.addClSync = {
    queue: Promise.resolve(),
    add(tabId) {
        this.queue = this.queue.then(() => {
            return new Promise(async (resolve) => {
                await KH_DB.addClient(tabId)
                resolve()
            })
        })
    }
}

KH.addClient = function(tabId) {
    return this.addClSync.add(tabId)
}

KH.getHost = async function () {
    let hostId = await KH_DB.getHostId()
    let hostTab = {}
    try{
        hostTab = await chrome.tabs.get(hostId)
    } catch(_) {
        hostTab = {}
    }
    return hostTab
}

KH.getClients = async function() {
    let clientIds = (await KH_DB.getClientIds()) || []

    let clientTabs = []
    for (const id of clientIds) {
        try {
            clientTabs.push(await chrome.tabs.get(id))
        } catch (error) {
            
        }
    }

    return clientTabs
}

// GENERAL FUNC

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
}

async function createKHTab(pin) {
    return await chrome.tabs.create({
        url: `https://kahoot.it/?pin=${pin}`,
        active: false
    })
}

async function matchClientTabIds(id) {
    for (const tabId of (await KH_DB.getClientIds())) {
        if (tabId == id) {
            return tabId
        }
    }
    return null
}

// GENERAL ROUTER

msgListener.router = function(req, sender, res) {
    switch (req.sender) {
        case "popup":
            msgListener.popupListener.router(req)
            break;
        case "host":
            msgListener.hostListener.router(req)
            break;
    }
}

// POP UP

msgListener.popupListener.router = function(req) {
    switch (req.type) {
        case "cmd":
            msgListener.popupListener.cmdListener(req)
            break;
        case "init":
            msgListener.popupListener.initListener(req)
            break;
    }
}

msgListener.popupListener.cmdListener = async function(req) {
    switch (req.cmd) {
        case "reset":
            KH.reset()
            break

        case "set_pin":
            KH.setPin(req.content)
            break

        case "create_host":
            createKHTab(await KH.getPin()).then((tab) => {
                KH.setHost(tab.id)
                chrome.tabs.update(tab.id, {autoDiscardable: false})
            })
            break

        case "create_client":
            createKHTab(await KH.getPin()).then((tab) => {
                KH.addClient(tab.id)
                chrome.tabs.update(tab.id, {autoDiscardable: false})
            })
            break
    }
}


// HOST

msgListener.hostListener.router = function(req) {
    switch (req.type) {
        case "input":
            msgListener.hostListener.inputListener(req)
    }
}

msgListener.hostListener.inputListener = function(req) {
    msgSender.client.inputSender(req).then(async () => {
        chrome.tabs.update(await KH.getHostId(), { active: true })
    })
}


//MSG SENDER

msgSender.client.sendToAllClients = function(msg, hook) {
    return KH.getClients().then(async (clients) => {
        for (const tab of clients) {
            if (hook) {
                await hook(tab)
            }
            chrome.tabs.sendMessage(tab.id, msg)
        }
    })
}

msgSender.client.cmdSender = function(cmd) {
    msgSender.client.sendToAllClients({
        sender: "sw",
        type: "cmd",
        cmd: cmd.cmd,
        content: cmd.content
    })
}

msgSender.host.cmdSender = async function(cmd) {
    chrome.tabs.sendMessage(await KH.getHostId(), {
        sender: "sw",
        type: "cmd",
        cmd: cmd.cmd,
        content: cmd.content
    })
}

// Send input to all tabs
msgSender.client.inputSender = function(input) {
    return msgSender.client.sendToAllClients({
        sender: "sw",
        type: "input",
        input: input.input,
        content: input.content
    }, async function(tab) {
        return Promise.all([
            sleep(DELAY),
            chrome.tabs.update(tab.id, { active: true })
        ])
    })
}


chrome.runtime.onMessage.addListener(msgListener.router)

//Enable, disable content script

chrome.tabs.onUpdated.addListener(async function(tabId, info) {
    if (info.status !== "complete") return
    let hostTabId = await KH.getHostId()
    if (tabId == hostTabId) {
        msgSender.host.cmdSender({
            cmd: "set_role",
            content: "host"
        })
    } else if (await matchClientTabIds(tabId)) {
        msgSender.client.cmdSender({
            cmd: "set_role",
            content: "client"
        })
    }
})


// Listen for tab close
chrome.tabs.onRemoved.addListener(async function(tabId) {
    if (tabId == await KH.getHostId()) {
        KH.setHost("")
    } else if (await matchClientTabIds(tabId)) {
        KH.rmClient(tabId)
    }
})