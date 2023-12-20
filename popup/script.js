async function createKHTab(pin) {
    return await chrome.tabs.create({
        url: `https://kahoot.it/?pin=${pin}`,
        active: false
    })
}

async function sendInitRole(tabId, role) {
    chrome.tabs.sendMessage(
        tabId,
        { role: role, cmd: "init" }
    )
}

const pinElement = document.getElementById("pin")
document.getElementById("create-tab").onclick = async function() {
    let pin = pinElement.value
    let newtab = await createKHTab(pin)

    KH.onlineTabs.push(newtab)
    sendInitRole(newtab.id, "client")
}

const createHostElement = document.getElementById("create-host-tab")
createHostElement.onclick = async function() {
    if (KH.hostTab) return

    let pin = pinElement.value
    KH.hostTab = await createKHTab(pin)

    sendInitRole(KH.hostTab.id, "host")
    createHostElement.disabled = true
    

}

chrome.tabs.onUpdated.addListener(async function (tabId , info) {
    if ( info.status === 'complete' && tabId === KH.hostTab.id) {
        while (true){
            await new Promise(res => {
                setTimeout(res, 500)
            })
            chrome.tabs.sendMessage(KH.hostTab.id, {msg:"damn"})
        }
    }
  })