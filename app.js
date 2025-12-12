// Supabase Configuration
const SUPABASE_URL = 'https://intzwjmlypmopzauxeqt.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxNzkxMiwiZXhwIjoyMDcwMjkzOTEyfQ.Sx_VwOEHbLjVhc3rL96hlIGNkiZ44a4oD9T8DcBzwGI';

// WAHA Configuration
const WAHA_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
const WAHA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';

// Global Variables
let supabase = null;
let currentOutlet = '';
let currentKasir = '';
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing app...');
    
    try {
        // Initialize Supabase
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not found!');
            showStatus('Error: Supabase library tidak ditemukan. Periksa koneksi internet.', 'error');
            return;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);
        console.log('Supabase initialized:', supabase ? 'SUCCESS' : 'FAILED');
        
        // Load outlets
        await loadOutlets();
        setupEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showStatus('Gagal memuat aplikasi: ' + error.message, 'error');
    }
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('outletSelect').addEventListener('change', handleOutletChange);
    document.getElementById('kasirSelect').addEventListener('change', handleKasirChange);
    
    document.getElementById('btnOlsera').addEventListener('click', () => openModal('modalOlsera'));
    document.getElementById('btnDigital').addEventListener('click', () => openModal('modalDigital'));
    document.getElementById('btnMigrasi').addEventListener('click', () => openModal('modalMigrasi'));
    
    // Search events
    document.getElementById('searchOlsera').addEventListener('input', function() {
        loadOlseraData(this.value);
    });
    
    document.getElementById('searchDigital').addEventListener('input', function() {
        loadDigitalData(this.value);
    });
    
    // Pagination
    document.getElementById('prevOlsera').addEventListener('click', () => changeOlseraPage(-1));
    document.getElementById('nextOlsera').addEventListener('click', () => changeOlseraPage(1));
    document.getElementById('prevDigital').addEventListener('click', () => changeDigitalPage(-1));
    document.getElementById('nextDigital').addEventListener('click', () => changeDigitalPage(1));
    
    // Migrasi search
    document.getElementById('searchCustomerLama').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchCustomerLama();
    });
    
    document.getElementById('searchCustomerBaru').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchCustomerBaru();
    });
}

// Load outlets
async function loadOutlets() {
    try {
        const { data, error } = await supabase
            .from('outlet')
            .select('outlet')
            .order('outlet');
        
        if (error) throw error;
        
        outlets = data || [];
        const outletSelect = document.getElementById('outletSelect');
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

// Handle outlet change
async function handleOutletChange() {
    currentOutlet = document.getElementById('outletSelect').value;
    const kasirSelect = document.getElementById('kasirSelect');
    
    if (currentOutlet) {
        await loadKasirs();
        kasirSelect.disabled = false;
        updateButtonStates();
        showStatus(`Outlet dipilih: ${currentOutlet}`, 'success');
    } else {
        kasirSelect.disabled = true;
        kasirSelect.innerHTML = '<option value="">Pilih Kasir</option>';
        updateButtonStates();
    }
}

// Load kasirs
async function loadKasirs() {
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .select('nama_karyawan')
            .eq('outlet', currentOutlet)
            .eq('role', 'kasir')
            .order('nama_karyawan');
        
        if (error) throw error;
        
        kasirs = data || [];
        const kasirSelect = document.getElementById('kasirSelect');
        kasirSelect.innerHTML = '<option value="">Pilih Kasir</option>';
        
        kasirs.forEach(kasir => {
            const option = document.createElement('option');
            option.value = kasir.nama_karyawan;
            option.textContent = kasir.nama_karyawan;
            kasirSelect.appendChild(option);
        });
        
        await loadKonversiPoint();
    } catch (error) {
        console.error('Error loading kasirs:', error);
        showStatus('Gagal memuat data kasir', 'error');
    }
}

// Load konversi point
async function loadKonversiPoint() {
    try {
        const { data, error } = await supabase
            .from('outlet')
            .select('konversi_point')
            .eq('outlet', currentOutlet)
            .single();
        
        if (!error && data) {
            konversiPointValue = data.konversi_point || 0;
        }
    } catch (error) {
        konversiPointValue = 0;
    }
}

// Handle kasir change
function handleKasirChange() {
    currentKasir = document.getElementById('kasirSelect').value;
    
    if (currentKasir) {
        updateButtonStates();
        showStatus(`Kasir dipilih: ${currentKasir}`, 'success');
    } else {
        updateButtonStates();
    }
}

// Update button states
function updateButtonStates() {
    const hasOutlet = !!currentOutlet;
    const hasKasir = !!currentKasir;
    
    document.getElementById('btnOlsera').disabled = !hasOutlet || !hasKasir;
    document.getElementById('btnDigital').disabled = !hasOutlet || !hasKasir;
    document.getElementById('btnMigrasi').disabled = !hasOutlet || !hasKasir;
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
        let query = supabase.from('membercard_olsera').select('*');
        
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        olseraData = data || [];
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
    
    document.getElementById('olseraPageInfo').textContent = `Page ${currentOlseraPage} of ${totalPages}`;
    document.getElementById('prevOlsera').disabled = currentOlseraPage === 1;
    document.getElementById('nextOlsera').disabled = currentOlseraPage === totalPages;
}

// Load Digital data
async function loadDigitalData(searchTerm = '') {
    showLoading(true);
    
    try {
        let query = supabase.from('membercard').select('*');
        
        if (searchTerm) {
            query = query.or(`nama.ilike.%${searchTerm}%,nomorWA.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        digitalData = data || [];
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
    
    document.getElementById('digitalPageInfo').textContent = `Page ${currentDigitalPage} of ${totalPages}`;
    document.getElementById('prevDigital').disabled = currentDigitalPage === 1;
    document.getElementById('nextDigital').disabled = currentDigitalPage === totalPages;
}

// Setup Migrasi modal
function setupMigrasiModal() {
    document.getElementById('migrasiOutlet').textContent = currentOutlet;
    document.getElementById('migrasiKasir').textContent = currentKasir;
    
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
        const { data, error } = await supabase
            .from('membercard_olsera')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
            .neq('status_migrasi', 'Sudah migrasi');
        
        if (error) throw error;
        
        const results = data || [];
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
    
    if (customer.phone) {
        findMatchingCustomerBaru(customer.phone);
    }
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

// Find matching customer baru
async function findMatchingCustomerBaru(phone) {
    if (!phone) return;
    
    const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^0+/, '');
    
    try {
        const { data, error } = await supabase
            .from('membercard')
            .select('*')
            .eq('nomorWA', cleanPhone);
        
        if (!error && data && data.length > 0) {
            selectCustomerBaru(data[0]);
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
        const { data, error } = await supabase
            .from('membercard')
            .select('*')
            .or(`nama.ilike.%${searchTerm}%,nomorWA.ilike.%${searchTerm}%`);
        
        if (error) throw error;
        
        const results = data || [];
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
    document.getElementById('namaLama').textContent = selectedCustomerLama.name || '-';
    document.getElementById('namaBaru').textContent = selectedCustomerBaru.nama || '-';
    document.getElementById('waLama').textContent = selectedCustomerLama.phone || '-';
    document.getElementById('waBaru').textContent = selectedCustomerBaru.nomorWA || '-';
    document.getElementById('alamatLama').textContent = selectedCustomerLama.address || '-';
    document.getElementById('alamatBaru').textContent = selectedCustomerBaru.alamat || '-';
    document.getElementById('idLama').textContent = selectedCustomerLama.code || '-';
    document.getElementById('idBaru').textContent = selectedCustomerBaru.id_member || '-';
    
    const pointLama = parseFloat(selectedCustomerLama.loyalty_points || 0);
    const konversiPoint = konversiPointValue || 1;
    const pointBaru = Math.ceil(pointLama / konversiPoint);
    
    document.getElementById('pointLama').textContent = formatNumber(pointLama);
    document.getElementById('konversiPoint').textContent = formatNumber(konversiPoint);
    document.getElementById('pointBaru').textContent = pointBaru;
    document.getElementById('calculationFormula').textContent = `⌈${formatNumber(pointLama)} ÷ ${formatNumber(konversiPoint)}⌉ = ${pointBaru}`;
    
    document.getElementById('dataComparison').classList.remove('hidden');
    document.getElementById('pointCalculation').classList.remove('hidden');
    document.getElementById('submitMigrasi').disabled = false;
}

// Submit migrasi
async function submitMigrasi() {
    if (!selectedCustomerLama || !selectedCustomerBaru) {
        showWarning('Pilih customer lama dan baru terlebih dahulu');
        return;
    }
    
    if (selectedCustomerLama.status_migrasi === 'Sudah migrasi') {
        showWarning('Customer lama sudah dimigrasi sebelumnya');
        return;
    }
    
    showLoading(true);
    
    try {
        const pointLama = parseFloat(selectedCustomerLama.loyalty_points || 0);
        const konversiPoint = konversiPointValue || 1;
        const pointBaru = Math.ceil(pointLama / konversiPoint);
        const newPoint = (selectedCustomerBaru.point || 0) + pointBaru;
        
        // Update membercard
        const { error: updateError } = await supabase
            .from('membercard')
            .update({
                point: newPoint,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedCustomerBaru.id);
        
        if (updateError) throw new Error('Gagal update membercard: ' + updateError.message);
        
        // Update membercard_olsera
        const { error: olseraError } = await supabase
            .from('membercard_olsera')
            .update({
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
            .eq('id', selectedCustomerLama.id);
        
        if (olseraError) throw new Error('Gagal update data Olsera: ' + olseraError.message);
        
        // Send WhatsApp
        await sendWhatsAppNotification(selectedCustomerBaru.nomorWA, pointBaru, newPoint);
        
        // Show success
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
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '').replace(/^0+/, '');
        const chatId = `62${cleanPhone}@c.us`;
        
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
            console.warn('WA notification failed, but migration succeeded');
        }
    } catch (error) {
        console.warn('Error sending WA:', error);
    }
}

// Helper functions
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function showStatus(message, type = 'info') {
    const statusInfo = document.getElementById('statusInfo');
    const statusText = document.getElementById('statusText');
    
    if (!statusText) return;
    
    statusText.textContent = message;
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

function showWarning(message) {
    document.getElementById('warningText').textContent = message;
    document.getElementById('warningInfo').classList.remove('hidden');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
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

// Close modals when clicking outside
window.onclick = function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}
