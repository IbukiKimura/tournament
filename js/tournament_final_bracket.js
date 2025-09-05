// This is a mock version. File operations are disabled.

let jsonData = {
    "participants": [
        "参加者A", "参加者B", "参加者C", "参加者D", "参加者E", "参加者F", "参加者G", "参加者H",
        "参加者I", "参加者J", "参加者K", "参加者L", "参加者M", "参加者N", "参加者O", "参加者P",
        "参加者Q", "参加者R", "参加者S", "参加者T", "参加者U", "参加者V", "参加者W", "参加者X",
        "参加者Y", "参加者Z", "参加者AA", "参加者BB", "参加者CC", "参加者DD", "参加者EE", "参加者FF"
    ],
    "history": {}
};
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

    // Load hardcoded data
    participants = jsonData.participants;
    bracketState = jsonData.history || {};
    initializeUI();
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

// File operations are not needed for the mock version.
function loadClick() {
    alert('Load functionality is disabled in this mock version.');
}

function readFile() {
    // This function is not used in the mock version.
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
    // In this mock version, state is not saved to a file.
    jsonData.history = bracketState;
    console.log("State updated (not saved):", JSON.stringify(jsonData, null, 4));
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
        jsonData.history = {}; // Also reset history in jsonData
        await saveState(); // Log to console
        
        // Re-initialize UI
        initializeUI();
        
        drawnNumberDisplay.textContent = '?';
    }
}