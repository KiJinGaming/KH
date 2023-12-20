chrome.runtime.onMessage.addListener(function(req, sender, res) {
    console.log(req.msg)
    res({ mess: "messy" })
})