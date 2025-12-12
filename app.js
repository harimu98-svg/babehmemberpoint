// Supabase Configuration
const SUPABASE_URL = 'https://intzwjmlypmopzauxeqt.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxNzkxMiwiZXhwIjoyMDcwMjkzOTEyfQ.Sx_VwOEHbLjVhc3rL96hlIGNkiZ44a4oD9T8DcBzwGI';

// WAHA Configuration
const WAHA_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
const WAHA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';

// Global Variables
let currentOutlet = '';
let currentKasir = '';
let currentOutletId = '';
let outlets = [];
let kasirs = [];
let olseraData = [];
let digitalData = [];
let currentOlseraPage = 1;
let currentDigitalPage = 1;
let itemsPerPage = 10;
let selectedCustomerLama = null;
let selectedCustomerBaru = null;
let konversiPointValue = 0;

// DOM Elements
const outletSelect = document.getElementById('outletSelect');
const kasirSelect = document.getElementById('kasirSelect');
const btnOlsera = document.getElementById('btnOlsera');
const btnDigital = document.getElementById('btnDigital');
const btnMigrasi = document.getElementById('btnMigrasi');
const statusInfo = document.getElementById('statusInfo');
const statusText = document.getElementById('statusText');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadOutlets();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    outletSelect.addEventListener('change', handleOutletChange);
    kasirSelect.addEventListener('change', handleKasirChange);
    
    btnOlsera.addEventListener('click', () => openModal('modalOlsera'));
    btnDigital.addEventListener('click', () => openModal('modalDigital'));
    btnMigrasi.addEventListener('click', () => openModal('modalMigrasi'));
    
    // Olsera modal events
    document.getElementById('searchOlsera').addEventListener('input', searchOlsera);
    document.getElementById('prevOlsera').addEventListener('click', () => changeOlseraPage(-1));
    document.getElementById('nextOlsera').addEventListener('click', () => changeOlseraPage(1));
    
    // Digital modal events
    document.getElementById('searchDigital').addEventListener('input', searchDigital);
    document.getElementById('prevDigital').addEventListener('click', () => changeDigitalPage(-1));
    document.getElementById('nextDigital').addEventListener('click', () => changeDigitalPage(1));
    
    // Migrasi modal events
    document.getElementById('searchCustomerLama').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchCustomerLama();
    });
    
    document.getElementById('searchCustomerBaru').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchCustomerBaru();
    });
}

// Load outlets from Supabase
async function loadOutlets() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/outlet?select=outlet`, {
            headers: {
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load outlets');
        
        outlets = await response.json();
        
        // Populate outlet dropdown
        outletSelect.innerHTML = '<option value="">Pilih Outlet</option>';
        outlets.forEach(outlet => {
            const option = document.createElement('option');
            option.value = outlet.outlet;
            option.textContent = outlet.outlet;
            outletSelect.appendChild(option);
        });
        
        showStatus('Silakan pilih outlet terlebih dahulu', 'info');
    } catch (error) {
        console.error('Error loading outlets:', error);
        showStatus('Gagal memuat data outlet', 'error');
    }
}

// Handle outlet selection change
async function handleOutletChange() {
    currentOutlet = outletSelect.value;
    currentOutletId = currentOutlet;
    
    if (currentOutlet) {
        await loadKasirs();
        kasirSelect.disabled = false;
        updateButtonStates();
        showStatus(`Outlet dipilih: ${currentOutlet}`, 'success');
    } else {
        kasirSelect.disabled = true;
        kasirSelect.innerHTML = '<option value="">Pilih Kasir</option>';
        updateButtonStates();
        showStatus('Silakan pilih outlet terlebih dahulu', 'info');
    }
}

// Load kasirs based on selected outlet
async function loadKasirs() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/karyawan?select=nama_karyawan&outlet=eq.${encodeURIComponent(currentOutlet)}&role=eq.kasir`,
            {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );
        
        if (!response.ok) throw new Error('Failed to load kasirs');
        
        kasirs = await response.json();
        
        // Populate kasir dropdown
        kasirSelect.innerHTML = '<option value="">Pilih Kasir</option>';
        kasirs.forEach(kasir => {
            const option = document.createElement('option');
            option.value = kasir.nama_karyawan;
            option.textContent = kasir.nama_karyawan;
            kasirSelect.appendChild(option);
        });
        
        // Load konversi point for this outlet
        await loadKonversiPoint();
    } catch (error) {
        console.error('Error loading kasirs:', error);
        showStatus('Gagal memuat data kasir', 'error');
    }
}

// Load konversi point from outlet
async function loadKonversiPoint() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/outlet?select=konversi_point&outlet=eq.${encodeURIComponent(currentOutlet)}`,
            {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
                konversiPointValue = data[0].konversi_point || 0;
            }
        }
    } catch (error) {
        console.error('Error loading konversi point:', error);
        konversiPointValue = 0;
    }
}

// Handle kasir selection change
function handleKasirChange() {
    currentKasir = kasirSelect.value;
    
    if (currentKasir) {
        updateButtonStates();
        showStatus(`Kasir dipilih: ${currentKasir}`, 'success');
    } else {
        updateButtonStates();
        showStatus('Silakan pilih kasir', 'info');
    }
}

// Update button states based on selections
function updateButtonStates() {
    const hasOutlet = !!currentOutlet;
    const hasKasir = !!currentKasir;
    
    btnOlsera.disabled = !hasOutlet || !hasKasir;
    btnDigital.disabled = !hasOutlet || !hasKasir;
    btnMigrasi.disabled = !hasOutlet || !hasKasir;
}

// Show status message
function showStatus(message, type = 'info') {
    statusText.textContent = message;
    
    // Reset classes
    statusInfo.className = 'flex items-center p-4 rounded-xl mb-6';
    
    if (type === 'error') {
        statusInfo.classList.add('bg-red-50', 'border-l-4', 'border-red-500');
        statusText.classList.add('text-red-700');
    } else if (type === 'success') {
        statusInfo.classList.add('bg-green-50', 'border-l-4', 'border-green-500');
        statusText.classList.add('text-green-700');
    } else if (type === 'warning') {
        statusInfo.classList.add('bg-yellow-50', 'border-l-4', 'border-yellow-500');
        statusText.classList.add('text-yellow-700');
    } else {
        statusInfo.classList.add('bg-blue-50', 'border-l-4', 'border-blue-500');
        statusText.classList.add('text-blue-700');
    }
    
    statusInfo.classList.remove('hidden');
}

// Modal functions
function openModal(modalId) {
    if (modalId === 'modalOlsera') {
        loadOlseraData();
    } else if (modalId === 'modalDigital') {
        loadDigitalData();
    } else if (modalId === 'modalMigrasi') {
        setupMigrasiModal();
    }
    
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Load Olsera data
async function loadOlseraData(searchTerm = '') {
    showLoading(true);
    
    try {
        let url = `${SUPABASE_URL}/rest/v1/membercard_olsera?select=*`;
        
        if (searchTerm) {
            url += `&or=(name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%)`;
        }
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load Olsera data');
        
        olseraData = await response.json();
        currentOlseraPage = 1;
        renderOlseraTable();
    } catch (error) {
        console.error('Error loading Olsera data:', error);
        showStatus('Gagal memuat data Olsera', 'error');
    } finally {
        showLoading(false);
    }
}

// Render Olsera table
function renderOlseraTable() {
    const startIndex = (currentOlseraPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = olseraData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(olseraData.length / itemsPerPage);
    
    const tbody = document.getElementById('olseraTableBody');
    tbody.innerHTML = '';
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm">${item.code || '-'}</td>
            <td class="px-4 py-3 text-sm">${item.name || '-'}</td>
            <td class="px-4 py-3 text-sm">${item.phone || '-'}</td>
            <td class="px-4 py-3 text-sm font-bold">${formatNumber(item.loyalty_points || 0)}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs ${
                    item.status_migrasi === 'Sudah migrasi' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }">
                    ${item.status_migrasi || 'Belum migrasi'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination
    document.getElementById('olseraPageInfo').textContent = `Page ${currentOlseraPage} of ${totalPages}`;
    document.getElementById('prevOlsera').disabled = currentOlseraPage === 1;
    document.getElementById('nextOlsera').disabled = currentOlseraPage === totalPages;
}

// Load Digital data
async function loadDigitalData(searchTerm = '') {
    showLoading(true);
    
    try {
        let url = `${SUPABASE_URL}/rest/v1/membercard?select=*`;
        
        if (searchTerm) {
            url += `&or=(nama.ilike.%${searchTerm}%,nomorWA.ilike.%${searchTerm}%)`;
        }
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load digital data');
        
        digitalData = await response.json();
        currentDigitalPage = 1;
        renderDigitalTable();
    } catch (error) {
        console.error('Error loading digital data:', error);
        showStatus('Gagal memuat data digital', 'error');
    } finally {
        showLoading(false);
    }
}

// Render Digital table
function renderDigitalTable() {
    const startIndex = (currentDigitalPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = digitalData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(digitalData.length / itemsPerPage);
    
    const tbody = document.getElementById('digitalTableBody');
    tbody.innerHTML = '';
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm">${item.id_member || '-'}</td>
            <td class="px-4 py-3 text-sm">${item.nama || '-'}</td>
            <td class="px-4 py-3 text-sm">${item.nomorWA || '-'}</td>
            <td class="px-4 py-3 text-sm font-bold">${item.point || 0}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs ${
                    item.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }">
                    ${item.status || 'inactive'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination
    document.getElementById('digitalPageInfo').textContent = `Page ${currentDigitalPage} of ${totalPages}`;
    document.getElementById('prevDigital').disabled = currentDigitalPage === 1;
    document.getElementById('nextDigital').disabled = currentDigitalPage === totalPages;
}

// Setup Migrasi modal
function setupMigrasiModal() {
    document.getElementById('migrasiOutlet').textContent = currentOutlet;
    document.getElementById('migrasiKasir').textContent = currentKasir;
    
    // Reset selections
    selectedCustomerLama = null;
    selectedCustomerBaru = null;
    document.getElementById('searchCustomerLama').value = '';
    document.getElementById('searchCustomerBaru').value = '';
    document.getElementById('customerLamaResults').innerHTML = '';
    document.getElementById('customerBaruResults').innerHTML = '';
    document.getElementById('selectedCustomerLama').innerHTML = '';
    document.getElementById('selectedCustomerBaru').innerHTML = '';
    document.getElementById('customerLamaResults').classList.add('hidden');
    document.getElementById('customerBaruResults').classList.add('hidden');
    document.getElementById('selectedCustomerLama').classList.add('hidden');
    document.getElementById('selectedCustomerBaru').classList.add('hidden');
    document.getElementById('dataComparison').classList.add('hidden');
    document.getElementById('pointCalculation').classList.add('hidden');
    document.getElementById('warningInfo').classList.add('hidden');
    document.getElementById('submitMigrasi').disabled = true;
}

// Search customer lama
async function searchCustomerLama() {
    const searchTerm = document.getElementById('searchCustomerLama').value.trim();
    
    if (!searchTerm) {
        showWarning('Silakan masukkan nama atau nomor WA untuk pencarian');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/membercard_olsera?select=*&or=(name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%)&status_migrasi=neq.Sudah%20migrasi`,
            {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );
        
        if (!response.ok) throw new Error('Failed to search customer lama');
        
        const results = await response.json();
        
        const resultsDiv = document.getElementById('customerLamaResults');
        resultsDiv.innerHTML = '';
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="p-3 text-gray-500">Tidak ditemukan customer yang belum dimigrasi</p>';
        } else {
            results.forEach(customer => {
                const div = document.createElement('div');
                div.className = 'p-3 border-b border-gray-200 hover:bg-blue-50 cursor-pointer';
                div.innerHTML = `
                    <p class="font-medium">${customer.name}</p>
                    <p class="text-sm text-gray-600">${customer.phone} | ${customer.code}</p>
                    <p class="text-sm text-gray-600">Points: ${formatNumber(customer.loyalty_points || 0)}</p>
                `;
                div.onclick = () => selectCustomerLama(customer);
                resultsDiv.appendChild(div);
            });
        }
        
        resultsDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Error searching customer lama:', error);
        showWarning('Gagal mencari customer lama');
    } finally {
        showLoading(false);
    }
}

// Select customer lama
function selectCustomerLama(customer) {
    selectedCustomerLama = customer;
    
    const selectedDiv = document.getElementById('selectedCustomerLama');
    selectedDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <p class="font-bold">${customer.name}</p>
                <p class="text-sm text-gray-600">${customer.phone} | ${customer.code}</p>
                <p class="text-sm">Points: <span class="font-bold">${formatNumber(customer.loyalty_points || 0)}</span></p>
            </div>
            <button onclick="deselectCustomerLama()" class="text-red-500 hover:text-red-700">
                <span class="material-icons">close</span>
            </button>
        </div>
    `;
    
    selectedDiv.classList.remove('hidden');
    document.getElementById('customerLamaResults').classList.add('hidden');
    document.getElementById('searchCustomerLama').value = '';
    
    // Try to find matching customer baru
    findMatchingCustomerBaru(customer.phone);
}

// Deselect customer lama
function deselectCustomerLama() {
    selectedCustomerLama = null;
    selectedCustomerBaru = null;
    document.getElementById('selectedCustomerLama').innerHTML = '';
    document.getElementById('selectedCustomerLama').classList.add('hidden');
    document.getElementById('selectedCustomerBaru').innerHTML = '';
    document.getElementById('selectedCustomerBaru').classList.add('hidden');
    document.getElementById('dataComparison').classList.add('hidden');
    document.getElementById('pointCalculation').classList.add('hidden');
    document.getElementById('submitMigrasi').disabled = true;
}

// Find matching customer baru based on phone
async function findMatchingCustomerBaru(phone) {
    if (!phone) return;
    
    const cleanPhone = cleanPhoneNumber(phone);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/membercard?select=*&nomorWA=eq.${cleanPhone}`,
            {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );
        
        if (response.ok) {
            const results = await response.json();
            if (results.length > 0) {
                selectCustomerBaru(results[0]);
            }
        }
    } catch (error) {
        console.error('Error finding matching customer:', error);
    }
}

// Search customer baru
async function searchCustomerBaru() {
    const searchTerm = document.getElementById('searchCustomerBaru').value.trim();
    
    if (!searchTerm) {
        showWarning('Silakan masukkan nama atau nomor WA untuk pencarian');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/membercard?select=*&or=(nama.ilike.%${searchTerm}%,nomorWA.ilike.%${searchTerm}%)`,
            {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            }
        );
        
        if (!response.ok) throw new Error('Failed to search customer baru');
        
        const results = await response.json();
        
        const resultsDiv = document.getElementById('customerBaruResults');
        resultsDiv.innerHTML = '';
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="p-3 text-gray-500">Tidak ditemukan customer digital</p>';
        } else {
            results.forEach(customer => {
                const div = document.createElement('div');
                div.className = 'p-3 border-b border-gray-200 hover:bg-green-50 cursor-pointer';
                div.innerHTML = `
                    <p class="font-medium">${customer.nama}</p>
                    <p class="text-sm text-gray-600">${customer.nomorWA} | ${customer.id_member}</p>
                    <p class="text-sm text-gray-600">Point: ${customer.point || 0}</p>
                `;
                div.onclick = () => selectCustomerBaru(customer);
                resultsDiv.appendChild(div);
            });
        }
        
        resultsDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Error searching customer baru:', error);
        showWarning('Gagal mencari customer baru');
    } finally {
        showLoading(false);
    }
}

// Select customer baru
function selectCustomerBaru(customer) {
    selectedCustomerBaru = customer;
    
    const selectedDiv = document.getElementById('selectedCustomerBaru');
    selectedDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <p class="font-bold">${customer.nama}</p>
                <p class="text-sm text-gray-600">${customer.nomorWA} | ${customer.id_member}</p>
                <p class="text-sm">Point: <span class="font-bold">${customer.point || 0}</span></p>
            </div>
            <button onclick="deselectCustomerBaru()" class="text-red-500 hover:text-red-700">
                <span class="material-icons">close</span>
            </button>
        </div>
    `;
    
    selectedDiv.classList.remove('hidden');
    document.getElementById('customerBaruResults').classList.add('hidden');
    document.getElementById('searchCustomerBaru').value = '';
    
    // Show comparison if both customers are selected
    if (selectedCustomerLama && selectedCustomerBaru) {
        showDataComparison();
    }
}

// Deselect customer baru
function deselectCustomerBaru() {
    selectedCustomerBaru = null;
    document.getElementById('selectedCustomerBaru').innerHTML = '';
    document.getElementById('selectedCustomerBaru').classList.add('hidden');
    document.getElementById('dataComparison').classList.add('hidden');
    document.getElementById('pointCalculation').classList.add('hidden');
    document.getElementById('submitMigrasi').disabled = true;
}

// Show data comparison
function showDataComparison() {
    // Update comparison table
    document.getElementById('namaLama').textContent = selectedCustomerLama.name || '-';
    document.getElementById('namaBaru').textContent = selectedCustomerBaru.nama || '-';
    document.getElementById('waLama').textContent = selectedCustomerLama.phone || '-';
    document.getElementById('waBaru').textContent = selectedCustomerBaru.nomorWA || '-';
    document.getElementById('alamatLama').textContent = selectedCustomerLama.address || '-';
    document.getElementById('alamatBaru').textContent = selectedCustomerBaru.alamat || '-';
    document.getElementById('idLama').textContent = selectedCustomerLama.code || '-';
    document.getElementById('idBaru').textContent = selectedCustomerBaru.id_member || '-';
    
    // Calculate new points
    const pointLama = parseFloat(selectedCustomerLama.loyalty_points || 0);
    const konversiPoint = konversiPointValue || 1;
    const pointBaru = Math.ceil(pointLama / konversiPoint);
    
    // Update point calculation
    document.getElementById('pointLama').textContent = formatNumber(pointLama);
    document.getElementById('konversiPoint').textContent = formatNumber(konversiPoint);
    document.getElementById('pointBaru').textContent = pointBaru;
    document.getElementById('calculationFormula').textContent = `⌈${formatNumber(pointLama)} ÷ ${formatNumber(konversiPoint)}⌉ = ${pointBaru}`;
    
    // Show sections
    document.getElementById('dataComparison').classList.remove('hidden');
    document.getElementById('pointCalculation').classList.remove('hidden');
    
    // Enable submit button
    document.getElementById('submitMigrasi').disabled = false;
}

// Submit migrasi
async function submitMigrasi() {
    if (!selectedCustomerLama || !selectedCustomerBaru) {
        showWarning('Pilih customer lama dan baru terlebih dahulu');
        return;
    }
    
    // Validate data
    if (selectedCustomerLama.status_migrasi === 'Sudah migrasi') {
        showWarning('Customer lama sudah dimigrasi sebelumnya');
        return;
    }
    
    showLoading(true);
    
    try {
        // Calculate new points
        const pointLama = parseFloat(selectedCustomerLama.loyalty_points || 0);
        const konversiPoint = konversiPointValue || 1;
        const pointBaru = Math.ceil(pointLama / konversiPoint);
        
        // 1. Update point in membercard
        const newPoint = (selectedCustomerBaru.point || 0) + pointBaru;
        
        const updateMembercardResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/membercard?id=eq.${selectedCustomerBaru.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    point: newPoint,
                    updated_at: new Date().toISOString()
                })
            }
        );
        
        if (!updateMembercardResponse.ok) {
            throw new Error('Failed to update membercard');
        }
        
        // 2. Update membercard_olsera with migration data
        const updateOlseraResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/membercard_olsera?id=eq.${selectedCustomerLama.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    outlet: currentOutlet,
                    id_member: selectedCustomerBaru.id_member,
                    nama: selectedCustomerBaru.nama,
                    nomor_wa: selectedCustomerBaru.nomorWA,
                    kasir: currentKasir,
                    konversi_point: konversiPoint,
                    status_migrasi: 'Sudah migrasi',
                    tanggal_migrasi: new Date().toISOString(),
                    point_migrasi: pointBaru
                })
            }
        );
        
        if (!updateOlseraResponse.ok) {
            throw new Error('Failed to update Olsera data');
        }
        
        // 3. Send WhatsApp notification
        await sendWhatsAppNotification(selectedCustomerBaru.nomorWA, pointBaru, newPoint);
        
        // Show success message
        document.getElementById('successMessage').textContent = 
            `Migrasi berhasil! ${pointBaru} point telah ditambahkan ke membercard ${selectedCustomerBaru.nama}. Total point sekarang: ${newPoint}`;
        
        showLoading(false);
        closeModal('modalMigrasi');
        openModal('successModal');
        
        // Refresh data
        loadOlseraData();
        loadDigitalData();
        
    } catch (error) {
        console.error('Error during migration:', error);
        showLoading(false);
        showWarning('Gagal melakukan migrasi: ' + error.message);
    }
}

// Send WhatsApp notification
async function sendWhatsAppNotification(phoneNumber, pointAdded, totalPoints) {
    try {
        const chatId = formatPhoneForWhatsApp(phoneNumber);
        const message = `Selamat! Membercard Babeh Barbershop Anda telah berhasil dimigrasi.\n\n` +
                       `Point yang ditambahkan: ${pointAdded}\n` +
                       `Total point sekarang: ${totalPoints}\n\n` +
                       `Terima kasih telah menjadi member setia Babeh Barbershop!\n\n` +
                       `Head Office: Jl. Abdul Ghani, Rempoa, Ciputat\n` +
                       `Contact: 0822-1001-7083`;
        
        const response = await fetch(WAHA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WAHA_API_KEY
            },
            body: JSON.stringify({
                session: 'session3',
                chatId: chatId,
                text: message
            })
        });
        
        if (!response.ok) {
            console.warn('Failed to send WhatsApp notification, but migration succeeded');
        }
    } catch (error) {
        console.warn('Error sending WhatsApp notification:', error);
        // Don't fail the migration if WhatsApp fails
    }
}

// Helper functions
function formatPhoneNumber(phone) {
    return phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

function cleanPhoneNumber(phone) {
    // Remove non-numeric characters and leading zeros/plus
    return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
}

function formatPhoneForWhatsApp(phone) {
    const cleanPhone = cleanPhoneNumber(phone);
    return `62${cleanPhone}@c.us`;
}

function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function searchOlsera() {
    const searchTerm = document.getElementById('searchOlsera').value;
    loadOlseraData(searchTerm);
}

function searchDigital() {
    const searchTerm = document.getElementById('searchDigital').value;
    loadDigitalData(searchTerm);
}

function changeOlseraPage(direction) {
    const totalPages = Math.ceil(olseraData.length / itemsPerPage);
    const newPage = currentOlseraPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentOlseraPage = newPage;
        renderOlseraTable();
    }
}

function changeDigitalPage(direction) {
    const totalPages = Math.ceil(digitalData.length / itemsPerPage);
    const newPage = currentDigitalPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentDigitalPage = newPage;
        renderDigitalTable();
    }
}

function showWarning(message) {
    document.getElementById('warningText').textContent = message;
    document.getElementById('warningInfo').classList.remove('hidden');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registered: ', registration.scope);
        }).catch(error => {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}
