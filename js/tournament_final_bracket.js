let fileHandle;
let jsonData = {};
let participants = [];
let availableParticipants = [];
let bracketState = {}; // { slotName: participantName }
let allSlots = [];
let availableSlots = [];
let isProcessing = false;
let isKeyDown = false;

// --- Animation & Sound ---
let animationIntervalId = null;
let animationTimeoutId = null;
const sound_drumroll = new Howl({
    src: './assets/sounds/drumroll.mp3',
    loop: true,
});
const sound_symbal = new Howl({
    src: './assets/sounds/symbal.mp3',
});


// --- DOM Elements ---
let participantSelector, startButton, resetButton, loadButton, drawnNumberDisplay;

window.onload = () => {
    participantSelector = document.getElementById('participant-selector');
    startButton = document.getElementById('start');
    resetButton = document.getElementById('Reset');
    loadButton = document.getElementById('load');
    drawnNumberDisplay = document.getElementById('drawn-number-display');
    
    initialize();
    addEventListeners();
};

function initialize() {
    allSlots = [];
    const participantDivs = document.querySelectorAll('.participant');
    participantDivs.forEach(div => {
        const slotName = div.querySelector('span:first-child').textContent;
        if (slotName) {
            allSlots.push(slotName);
            div.dataset.slotId = slotName; // Add data-slot-id for easy selection later
        }
    });

    participantSelector.innerHTML = '';
    drawnNumberDisplay.textContent = '?';
    startButton.disabled = true;
    resetButton.disabled = true;
}

function addEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'b' && !isKeyDown && isProcessing) {
            isKeyDown = true;
            stopDraw();
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'b') {
            isKeyDown = false;
        }
    });
}

async function loadClick() {
    try {
        const [handle] = await window.showOpenFilePicker({ types: [{ accept: { 'application/json': ['.json'] } }] });
        fileHandle = handle;
        await readFile();
    } catch (err) {
        console.error('File selection cancelled or failed:', err);
    }
}

async function readFile() {
    if (!fileHandle) return;
    try {
        const file = await fileHandle.getFile();
        const contents = await file.text();
        jsonData = JSON.parse(contents);

        if (!jsonData.participants || !Array.isArray(jsonData.participants)) {
            alert('無効なファイル形式です。participants配列が含まれている必要があります。');
            return;
        }

        participants = jsonData.participants;
        bracketState = jsonData.history || {};
        
        initializeUI();
    } catch (err) {
        console.error('Error reading file:', err);
        alert('ファイルの読み込みに失敗しました。');
    }
}

function initializeUI() {
    const assignedSlots = Object.keys(bracketState);
    availableSlots = allSlots.filter(slot => !assignedSlots.includes(slot));
    
    const assignedParticipants = Object.values(bracketState);
    availableParticipants = participants.filter(p => !assignedParticipants.includes(p));

    allSlots.forEach(slotName => {
        const participantDiv = document.querySelector(`.participant[data-slot-id='${slotName}']`);
        if (participantDiv) {
            const participantName = bracketState[slotName];
            if (participantName) {
                participantDiv.querySelector('span:first-child').textContent = participantName;
                participantDiv.classList.add('active');
            } else {
                participantDiv.querySelector('span:first-child').textContent = slotName;
                participantDiv.classList.remove('active');
            }
        }
    });

    participantSelector.innerHTML = '<option value="">-- 参加者を選択 --</option>';
    availableParticipants.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        participantSelector.appendChild(option);
    });

    startButton.disabled = false;
    resetButton.disabled = false;
    if (availableParticipants.length === 0 || allSlots.length === assignedSlots.length) {
        startButton.disabled = true;
    }
}

function startClick() {
    if (isProcessing) return;

    const selectedParticipant = participantSelector.value;
    if (!selectedParticipant) {
        alert('参加者を選択してください。');
        return;
    }

    if (availableSlots.length === 0) {
        alert('空いているブラケットがありません。');
        return;
    }

    isProcessing = true;
    startButton.disabled = true;
    resetButton.disabled = true;
    
    startDraw();
}

function startDraw() {
    sound_drumroll.play();
    animationIntervalId = setInterval(() => {
        const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        drawnNumberDisplay.textContent = randomSlot;
    }, 100);

    animationTimeoutId = setTimeout(stopDraw, 3000); // Auto-stop after 3 seconds
}

function stopDraw() {
    if (!isProcessing) return;

    clearTimeout(animationTimeoutId);
    clearInterval(animationIntervalId);
    animationTimeoutId = null;
    animationIntervalId = null;

    sound_drumroll.stop();
    sound_symbal.play();

    const finalSlot = drawRandomSlot();
    drawnNumberDisplay.textContent = finalSlot;
    
    const selectedParticipant = participantSelector.value;

    bracketState[finalSlot] = selectedParticipant;
    updateUI(finalSlot, selectedParticipant);
    saveState();

    isProcessing = false;
    resetButton.disabled = false;
    if (availableParticipants.length > 0) {
        startButton.disabled = false;
    }
}

function drawRandomSlot() {
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    return availableSlots[randomIndex];
}

function updateUI(drawnSlot, participantName) {
    const slotDiv = document.querySelector(`.participant[data-slot-id='${drawnSlot}']`);
    if (slotDiv) {
        slotDiv.querySelector('span:first-child').textContent = participantName;
        slotDiv.classList.add('active');
    }

    availableSlots = availableSlots.filter(s => s !== drawnSlot);
    availableParticipants = availableParticipants.filter(p => p !== participantName);

    participantSelector.innerHTML = '<option value="">-- 参加者を選択 --</option>';
    availableParticipants.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        participantSelector.appendChild(option);
    });

    if (availableParticipants.length === 0) {
        startButton.disabled = true;
    }
}

async function saveState() {
    if (!fileHandle) return;
    jsonData.history = bracketState;
    const updatedContents = JSON.stringify(jsonData, null, 4);

    try {
        const writable = await fileHandle.createWritable();
        await writable.write(updatedContents);
        await writable.close();
    } catch (err) {
        console.error('Failed to save file:', err);
        alert('ファイルの保存に失敗しました。');
    }
}

async function resetClick() {
    if (animationIntervalId) {
        clearTimeout(animationTimeoutId);
        clearInterval(animationIntervalId);
        sound_drumroll.stop();
        isProcessing = false;
    }
    if (confirm('本当にリセットしますか？全ての抽選履歴が消去されます。')) {
        bracketState = {};
        await saveState();
        if (fileHandle) {
            await readFile(); 
        } else {
            initializeUI();
        }
        drawnNumberDisplay.textContent = '?';
    }
}
