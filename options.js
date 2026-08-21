const listElement = document.getElementById('mounts-list');
const keyInput = document.getElementById('mount-key');
const targetInput = document.getElementById('mount-target');
const addBtn = document.getElementById('add-btn');
const errorMsg = document.getElementById('error-msg');

const primaryTLDs = ["com","net","org","jp","de","uk","fr","br","it","ru","es","me","gov","pl","ca","au","cn","co","in","nl","edu","info","eu","ch","id"];
const shortcuts = {"": "com", "n": "net", "o": "org"};

let editingOldKey = null;

// Validation Rule: Ensure the user typed a Top-Down target
function isTopDownFormat(target) {
    let domainPart = target.split('/')[0]; // Isolate domain from paths like /r/soccer
    let parts = domainPart.split('.');
    if (parts.length < 2) return false;
    
    let firstPart = parts[0].toLowerCase();
    let lastPart = parts[parts.length - 1].toLowerCase();

    if (shortcuts[firstPart] !== undefined) return true;
    if (primaryTLDs.includes(firstPart)) return true;
    
    // If it ends with a standard primary TLD (like reddit.com), it's backwards!
    if (primaryTLDs.includes(lastPart)) return false;
    
    return true; 
}

function loadMounts() {
    browser.storage.local.get({ customMounts: {} }).then(res => {
        listElement.innerHTML = '';
        const mounts = res.customMounts;
        
        if (Object.keys(mounts).length === 0) {
            listElement.innerHTML = '<p style="color:#777; font-style:italic;">No custom mounts added yet.</p>';
        }

        for (let key in mounts) {
            let row = document.createElement('div');
            row.className = 'mount-row';
            
            let info = document.createElement('div');
            info.className = 'mount-info';
            info.innerHTML = `<span class="key">${key}</span> &rarr; <span class="target">${mounts[key]}</span>`;
            
            let actions = document.createElement('div');
            actions.className = 'actions';

            let editBtn = document.createElement('button');
            editBtn.className = 'edit';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => {
                keyInput.value = key;
                targetInput.value = mounts[key];
                editingOldKey = key;
                addBtn.textContent = 'Save Changes';
                errorMsg.style.display = 'none';
                keyInput.focus();
            };

            let delBtn = document.createElement('button');
            delBtn.className = 'delete';
            delBtn.textContent = 'Remove';
            delBtn.onclick = () => {
                delete mounts[key];
                browser.storage.local.set({ customMounts: mounts }).then(loadMounts);
            };
            
            actions.appendChild(editBtn);
            actions.appendChild(delBtn);
            row.appendChild(info);
            row.appendChild(actions);
            listElement.appendChild(row);
        }
    });
}

addBtn.onclick = () => {
    let key = keyInput.value.trim().toLowerCase();
    let target = targetInput.value.trim().toLowerCase();
    errorMsg.style.display = 'none';
    
    if (!key || !target) return;
    
    // Clean up input
    target = target.replace(/^https?:\/\//, '');
    if (target.endsWith('/')) target = target.slice(0, -1);

    // Enforce top-down target rule
    if (!isTopDownFormat(target)) {
        errorMsg.style.display = 'block';
        return;
    }
    
    browser.storage.local.get({ customMounts: {} }).then(res => {
        let mounts = res.customMounts;
        
        // If editing a key and the key name changed, purge the old one
        if (editingOldKey && editingOldKey !== key) {
            delete mounts[editingOldKey];
        }
        
        mounts[key] = target;
        
        browser.storage.local.set({ customMounts: mounts }).then(() => {
            keyInput.value = '';
            targetInput.value = '';
            editingOldKey = null;
            addBtn.textContent = 'Add Mount';
            loadMounts();
        });
    });
};

document.addEventListener('DOMContentLoaded', loadMounts);