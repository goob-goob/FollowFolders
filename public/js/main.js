const applyButton = document.getElementById('apply-all-button')

let currentFolder = document.getElementsByClassName('folder-current')
currentFolder = currentFolder[0].innerText.split('Folder: ')[1]

// console.log(folderTwitchName)
console.log(currentFolder)

const massApplyChanges = async () => {

    // note: each index in these arrays is information for the same 'follow'
    // ie. folderSelect[3] will be correctly matched with folderNotes[3] and folderTwitchName[3]
    // all of the above are for the same 'follow' 
    const folderSelect = document.getElementsByClassName('folder-form-select')
    const folderNotes = document.getElementsByClassName('folder-form-note')
    const folderTwitchName = document.getElementsByClassName('folder-form-twitchname')

    // declaring for clarity
    // folderSelect, folderNotes and folderTwitchName should all have the same length
    const length = folderSelect.length

    const data = []

    for (let i = 0; i < length; i++) {
        const selectedIndex = folderSelect[i].options.selectedIndex
        const selected = folderSelect[i].options[selectedIndex].value
        const newNote = folderNotes[i].value
        const oldNote = folderNotes[i].defaultValue
        const twitchName = folderTwitchName[i].attributes.value.value

        if (selected !== currentFolder || newNote !== oldNote) {
            data.push({
                name: twitchName,
                note: newNote,
                folder: selected
            })
        }

    }

    // we need to pass the current folder, so I set it as a query parameter because
    // I haven't been able to figure out a better way to do it
    const response = await fetch(`/follows/updatemany?current=${currentFolder}`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data),
    })    

    location.reload()
}

applyButton.addEventListener('click', massApplyChanges)