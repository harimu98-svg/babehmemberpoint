// Supabase Configuration
const SUPABASE_URL = 'https://intzwjmlypmopzauxeqt.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxNzkxMiwiZXhwIjoyMDcwMjkzOTEyfQ.Sx_VwOEHbLjVhc3rL96hlIGNkiZ44a4oD9T8DcBzwGI';

// WAHA Configuration
const WAHA_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
const WAHA_API_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';

// Global Variables - HAPUS deklarasi supabase di sini
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
let outletSelect, kasirSelect, btnOlsera, btnDigital, btnMigrasi, statusInfo, statusText;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM Elements
    outletSelect = document.getElementById('outletSelect');
    kasirSelect = document.getElementById('kasirSelect');
    btnOlsera = document.getElementById('btnOlsera');
    btnDigital = document.getElementById('btnDigital');
    btnMigrasi = document.getElementById('btnMigrasi');
    statusInfo = document.getElementById('statusInfo');
    statusText = document.getElementById('statusText');
    
    // Initialize Supabase client
    initSupabase();
    loadOutlets();
    setupEventListeners();
});

// Initialize Supabase
function initSupabase() {
    // Pastikan library sudah dimuat
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        showStatus('Error: Supabase library tidak dimuat. Muat ulang halaman.', 'error');
        return null;
    }
    
    try {
        // Inisialisasi client
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);
        console.log('Supabase client initialized successfully');
        return window.supabaseClient;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showStatus('Gagal inisialisasi database', 'error');
        return null;
    }
}

// Helper function untuk mendapatkan supabase client
function getSupabase() {
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }
    return window.supabaseClient;
}

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

// Load outlets from Supabase - MENGGUNAKAN SUPABASE CLIENT
async function loadOutlets() {
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('outlet')
            .select('outlet')
            .order('outlet');
        
        if (error) throw error;
        
        outlets = data || [];
        
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

// Load kasirs based on selected outlet - MENGGUNAKAN SUPABASE CLIENT
async function loadKasirs() {
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('karyawan')
            .select('nama_karyawan')
            .eq('outlet', currentOutlet)
            .eq('role', 'kasir')
            .order('nama_karyawan');
        
        if (error) throw error;
        
        kasirs = data || [];
        
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

// Load konversi point from outlet - MENGGUNAKAN SUPABASE CLIENT
async function loadKonversiPoint() {
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('outlet')
            .select('konversi_point')
            .eq('outlet', currentOutlet)
            .single();
        
        if (!error && data) {
            konversiPointValue = data.konversi_point || 0;
            console.log(`Konversi point: ${konversiPointValue}`);
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
    if (!statusText) return;
    
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

// Load Olsera data - MENGGUNAKAN SUPABASE CLIENT
async function loadOlseraData(searchTerm = '') {
    showLoading(true);
    
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
        let query = supabase
            .from('membercard_olsera')
            .select('*');
        
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
    
    // Update pagination
    document.getElementById('olseraPageInfo').textContent = `Page ${currentOlseraPage} of ${totalPages}`;
    document.getElementById('prevOlsera').disabled = currentOlseraPage === 1;
    document.getElementById('nextOlsera').disabled = currentOlseraPage === totalPages;
}

// Load Digital data - MENGGUNAKAN SUPABASE CLIENT
async function loadDigitalData(searchTerm = '') {
    showLoading(true);
    
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
        let query = supabase
            .from('membercard')
            .select('*');
        
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

// Search customer lama - MENGGUNAKAN SUPABASE CLIENT
async function searchCustomerLama() {
    const searchTerm = document.getElementById('searchCustomerLama').value.trim();
    
    if (!searchTerm) {
        showWarning('Silakan masukkan nama atau nomor WA untuk pencarian');
        return;
    }
    
    showLoading(true);
    
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
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

// Search customer baru - MENGGUNAKAN SUPABASE CLIENT
async function searchCustomerBaru() {
    const searchTerm = document.getElementById('searchCustomerBaru').value.trim();
    
    if (!searchTerm) {
        showWarning('Silakan masukkan nama atau nomor WA untuk pencarian');
        return;
    }
    
    showLoading(true);
    
    try {
        const supabase = getSupabase();
        if (!supabase) return;
        
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

// Fungsi-fungsi helper lainnya (sisa kode tetap sama)...

function showWarning(message) {
    document.getElementById('warningText').textContent = message;
    document.getElementById('warningInfo').classList.remove('hidden');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// Helper functions
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function cleanPhoneNumber(phone) {
    return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
}

// ... tambahkan fungsi-fungsi lainnya yang sudah diperbaiki sebelumnya
