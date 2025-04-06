const API_BASE_URL = 'http://localhost:3000/api'; // <-- updated from /api to match backend route

// State Management
const state = {
    currentUser: 'astronaut1',
    output: document.getElementById('output'),
    loading: document.getElementById('loading'),
    toastContainer: document.getElementById('toast'),
};

// Utility Functions
const showLoading = () => state.loading.classList.remove('hidden');
const hideLoading = () => state.loading.classList.add('hidden');

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-md shadow-md text-white animate-fade-in ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    state.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const displayOutput = (data, error = false) => {
    state.output.textContent = JSON.stringify(data, null, 2);
    state.output.classList.toggle('text-red-400', error);
    state.output.classList.toggle('text-green-400', !error);
};

const handleError = (error) => {
    console.error(error);
    displayOutput({ error: error.message }, true);
    showToast(`Error: ${error.message}`, 'error');
    hideLoading();
};

const apiCall = async (endpoint, method = 'GET', body = null) => {
    showLoading();
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();
        hideLoading();
        return data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Import Functions
const importFile = async (fileInputId, endpoint) => {
    const file = document.getElementById(fileInputId).files[0];
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const data = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        }).then(res => res.json());
        displayOutput(data);
        showToast('Import successful!');
    } catch (error) {
        handleError(error);
    }
};

const importItems = () => importFile('itemsFile', '/import/items');
const importContainers = () => importFile('containersFile', '/import/containers');

// Placement
const placeItems = async () => {
    const sampleItems = [
        { itemId: '001', name: 'Food Packet', width: 10, depth: 10, height: 20, priority: 80, expiryDate: '2025-05-20', usageLimit: 30, preferredZone: 'Crew Quarters' },
        { itemId: '002', name: 'Oxygen Cylinder', width: 15, depth: 15, height: 50, priority: 95, expiryDate: 'N/A', usageLimit: 100, preferredZone: 'Airlock' },
    ];
    const sampleContainers = [
        { containerId: 'contA', zone: 'Crew Quarters', width: 100, depth: 85, height: 200 },
        { containerId: 'contB', zone: 'Airlock', width: 50, depth: 85, height: 200 },
    ];

    try {
        const data = await apiCall('/placement', 'POST', { items: sampleItems, containers: sampleContainers });
        displayOutput(data);
        showToast('Items placed successfully!');
    } catch (error) {
        handleError(error);
    }
};

// Search & Retrieve
const showSearchModal = () => document.getElementById('searchModal').classList.remove('hidden');
const closeModal = () => document.getElementById('searchModal').classList.add('hidden');

const searchItem = async () => {
    const itemId = document.getElementById('searchItemId').value.trim();
    if (!itemId) {
        showToast('Please enter an item ID', 'error');
        return;
    }

    try {
        const data = await apiCall(`/search?itemId=${itemId}`);
        displayOutput(data);
        showToast('Item found!');
    } catch (error) {
        handleError(error);
    }
};

const retrieveItem = async () => {
    const itemId = document.getElementById('searchItemId').value.trim();
    if (!itemId) {
        showToast('Please enter an item ID', 'error');
        return;
    }

    try {
        const data = await apiCall('/retrieve', 'POST', {
            itemId,
            userId: state.currentUser,
            timestamp: new Date().toISOString(),
        });
        displayOutput(data);
        showToast('Item retrieved!');
        closeModal();
    } catch (error) {
        handleError(error);
    }
};

// Waste Management
const manageWaste = async () => {
    try {
        const wasteData = await apiCall('/waste/identify');
        displayOutput(wasteData);
        if (wasteData.wasteItems?.length > 0) {
            showToast('Waste identified, planning return...');
            const returnPlan = await apiCall('/waste/return-plan', 'POST', {
                undockingContainerId: 'contB',
                undockingDate: '2025-04-10',
                maxWeight: 100,
            });
            displayOutput(returnPlan);
            showToast('Waste return plan generated!');
        } else {
            showToast('No waste items found.');
        }
    } catch (error) {
        handleError(error);
    }
};

// Simulation
const simulateDays = async () => {
    const numDays = parseInt(document.getElementById('numDays').value);
    if (!numDays || numDays < 1) {
        showToast('Please enter a valid number of days', 'error');
        return;
    }

    try {
        const data = await apiCall('/simulate/day', 'POST', {
            numOfDays: numDays,
            itemsToBeUsedPerDay: [{ itemId: '001' }],
        });
        displayOutput(data);
        showToast(`Simulated ${numDays} days!`);
    } catch (error) {
        handleError(error);
    }
};

// Logs
const viewLogs = async () => {
    try {
        const data = await apiCall('/logs?startDate=2025-04-01&endDate=2025-04-04');
        displayOutput(data);
        showToast('Logs retrieved!');
    } catch (error) {
        handleError(error);
    }
};

// Modal Close on Outside Click
document.getElementById('searchModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});
