const mListElement = document.getElementById('mounts-list');
const mKeyInput = document.getElementById('mount-key');
const mTargetInput = document.getElementById('mount-target');
const mAddBtn = document.getElementById('add-mount-btn');
const errorMsg = document.getElementById('error-msg');

const scListElement = document.getElementById('custome-tlds-list');
const scKeyInput = document.getElementById('shortcut-key');
const scTargetInput = document.getElementById('shortcut-target');
const scAddBtn = document.getElementById('add-shortcut-btn');

let activeCustomTLDs = {};
let editingOldMountKey = null;
let editingOldShortcutKey = null;

function loadData() {
    browser.storage.local.get({ customMounts: {}, customTLDs: null }).then(res => {
        if (!res.customTLDs) {
            activeCustomTLDs = { ...defaultCustomTLDs }; // From shared.js
            browser.storage.local.set({ customTLDs: activeCustomTLDs });
        } else {
            activeCustomTLDs = res.customTLDs;
        }

        renderCustomTLDs(activeCustomTLDs);
        renderMounts(res.customMounts);
    });
}

function renderCustomTLDs(customTLDs) {
    scListElement.innerHTML = '';
    if (Object.keys(customTLDs).length === 0) {
        scListElement.innerHTML = '<p style="color:#777; font-style:italic;">No custom shortcuts added.</p>';
    }

    for (let key in customTLDs) {
        let row = document.createElement('div');
        row.className = 'row';

        let info = document.createElement('div');
        info.className = 'info';
        let displayKey = key === "" ? "<span class='empty-key'>[Empty Key]</span>" : key;
        info.innerHTML = `<span class="key">${displayKey}</span> &rarr; <span class="target">${customTLDs[key]}</span>`;

        let actions = document.createElement('div');
        actions.className = 'actions';

        let editBtn = document.createElement('button');
        editBtn.className = 'edit';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => {
            scKeyInput.value = key;
            scTargetInput.value = customTLDs[key];
            editingOldShortcutKey = key;
            scAddBtn.textContent = 'Save Changes';
            scKeyInput.focus();
        };

        let delBtn = document.createElement('button');
        delBtn.className = 'delete';
        delBtn.textContent = 'Remove';
        delBtn.onclick = () => {
            delete customTLDs[key];
            browser.storage.local.set({ customTLDs: customTLDs }).then(loadData);
        };

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        row.appendChild(info);
        row.appendChild(actions);
        scListElement.appendChild(row);
    }
}

function renderMounts(mounts) {
    mListElement.innerHTML = '';
    if (Object.keys(mounts).length === 0) {
        mListElement.innerHTML = '<p style="color:#777; font-style:italic;">No custom mounts added yet.</p>';
    }

    for (let key in mounts) {
        let row = document.createElement('div');
        row.className = 'row';

        let info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `<span class="key">${key}</span> &rarr; <span class="target">${mounts[key]}</span>`;

        let actions = document.createElement('div');
        actions.className = 'actions';

        let editBtn = document.createElement('button');
        editBtn.className = 'edit';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => {
            mKeyInput.value = key;
            mTargetInput.value = mounts[key];
            editingOldMountKey = key;
            mAddBtn.textContent = 'Save Changes';
            errorMsg.style.display = 'none';
            mKeyInput.focus();
        };

        let delBtn = document.createElement('button');
        delBtn.className = 'delete';
        delBtn.textContent = 'Remove';
        delBtn.onclick = () => {
            delete mounts[key];
            browser.storage.local.set({ customMounts: mounts }).then(loadData);
        };

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        row.appendChild(info);
        row.appendChild(actions);
        mListElement.appendChild(row);
    }
}

scAddBtn.onclick = () => {
    let key = scKeyInput.value.trim().toLowerCase();
    let target = scTargetInput.value.trim().toLowerCase();
    if (!target) return;

    browser.storage.local.get({ customTLDs: null }).then(res => {
        let sc = res.customTLDs || { ...defaultCustomTLDs };

        if (editingOldShortcutKey !== null && editingOldShortcutKey !== key) {
            delete sc[editingOldShortcutKey];
        }

        sc[key] = target;

        browser.storage.local.set({ customTLDs: sc }).then(() => {
            scKeyInput.value = '';
            scTargetInput.value = '';
            editingOldShortcutKey = null;
            scAddBtn.textContent = 'Add Shortcut';
            loadData();
        });
    });
};

mAddBtn.onclick = () => {
    let key = mKeyInput.value.trim().toLowerCase();
    let target = mTargetInput.value.trim().toLowerCase();
    errorMsg.style.display = 'none';

    if (!key || !target) return;

    target = target.replace(/^https?:\/\//, '');
    if (key.endsWith("/")) key = key.substring(0, key.length - 1);
    if (target.endsWith("/")) target = target.substring(0, target.length - 1);

    browser.storage.local.get({ customMounts: {} }).then(res => {
        let mounts = res.customMounts;
        if (!isTopDown(target, mounts, activeCustomTLDs)) {
            errorMsg.style.display = 'block';
            return;
        }

        if (editingOldMountKey && editingOldMountKey !== key) {
            delete mounts[editingOldMountKey];
        }

        mounts[key] = target;

        browser.storage.local.set({ customMounts: mounts }).then(() => {
            mKeyInput.value = '';
            mTargetInput.value = '';
            editingOldMountKey = null;
            mAddBtn.textContent = 'Add Mount';
            loadData();
        });
    });
};

document.addEventListener('DOMContentLoaded', loadData);