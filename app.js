// ================= CONFIGURATION =================
const supabaseUrlL = 'https://intzwjmlypmopzauxeqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTc5MTIsImV4cCI6MjA3MDI5MzkxMn0.VwwVEDdHtYP5gui4epTcNfLXhPkmfFbRVb5y8mrXJiM';
const WAHA_URL = 'https://waha-yetv8qi4e3zk.anakit.sumopod.my.id/api/sendText';
const WAHA_KEY = 'sfcoGbpdLDkGZhKw2rx8sbb14vf4d8V6';

// Inisialisasi Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= SETUP FUNCTIONS =================
function setupApp() {
    loadOutlets();
    setupEventListeners();
}

function setupEventListeners() {
    // Outlet & Kasir
    document.getElementById('outletSelect').addEventListener('change', handleOutletChange);
    document.getElementById('kasirSelect').addEventListener('change', handleKasirChange);
    
    // Tombol utama
    document.getElementById('btnOlsera').addEventListener('click', () => {
        if (currentOutlet && currentKasir) {
            showModal('modalOlsera');
        }
    });
    
    document.getElementById('btnDigital').addEventListener('click', () => {
        if (currentOutlet && currentKasir) {
            showModal('modalDigital');
        }
    });
    
    document.getElementById('btnMigrasi').addEventListener('click', () => {
        if (currentOutlet && currentKasir) {
            showModal('modalMigrasi');
        }
    });
    
    // Search
    document.getElementById('searchOlsera').addEventListener('input', (e) => loadTableData('olsera', e.target.value));
    document.getElementById('searchDigital').addEventListener('input', (e) => loadTableData('digital', e.target.value));
    
    // Migrasi search
    document.getElementById('searchCustomerLama').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCustomer('lama');
    });
    
    document.getElementById('searchCustomerBaru').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCustomer('baru');
    });
}

// ================= DATABASE FUNCTIONS =================
async function loadOutlets() {
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('outlet')
            .select('outlet')
            .order('outlet');
        
        if (error) throw error;
        
        const select = document.getElementById('outletSelect');
        select.innerHTML = '<option value="">Pilih Outlet</option>';
        
        if (data && data.length > 0) {
            data.forEach(outlet => {
                const option = document.createElement('option');
                option.value = outlet.outlet;
                option.textContent = outlet.outlet;
                select.appendChild(option);
            });
            
            showStatus('Silakan pilih outlet', 'info');
        } else {
            showStatus('Tidak ada outlet ditemukan', 'warning');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error load outlets:', error);
        showError('Gagal memuat outlet: ' + error.message);
        showLoading(false);
    }
}

async function handleOutletChange() {
    currentOutlet = document.getElementById('outletSelect').value;
    
    if (!currentOutlet) {
        document.getElementById('kasirSelect').disabled = true;
        document.getElementById('kasirSelect').innerHTML = '<option value="">Pilih Kasir</option>';
        updateButtons();
        return;
    }
    
    // Load kasirs
    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('karyawan')
            .select('nama_karyawan')
            .eq('outlet', currentOutlet)
            .eq('role', 'kasir')
            .order('nama_karyawan');
        
        if (error) throw error;
        
        const select = document.getElementById('kasirSelect');
        select.innerHTML = '<option value="">Pilih Kasir</option>';
        select.disabled = false;
        
        if (data && data.length > 0) {
            data.forEach(kasir => {
                const option = document.createElement('option');
                option.value = kasir.nama_karyawan;
                option.textContent = kasir.nama_karyawan;
                select.appendChild(option);
            });
        } else {
            showStatus('Tidak ada kasir ditemukan di outlet ini', 'warning');
        }
        
        // Load konversi point
        await loadKonversiPoint();
        
        showStatus(`Outlet: ${currentOutlet}`, 'success');
        updateButtons();
        showLoading(false);
        
    } catch (error) {
        console.error('Error load kasirs:', error);
        showError('Gagal memuat kasir: ' + error.message);
        showLoading(false);
    }
}

async function loadKonversiPoint() {
    try {
        const { data, error } = await supabase
            .from('outlet')
            .select('konversi_point')
            .eq('outlet', currentOutlet)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            konversiPoint = data.konversi_point || 0;
            console.log('Konversi point:', konversiPoint);
        } else {
            konversiPoint = 0;
        }
    } catch (error) {
        console.error('Error load konversi point:', error);
        konversiPoint = 0;
    }
}

function handleKasirChange() {
    currentKasir = document.getElementById('kasirSelect').value;
    updateButtons();
    
    if (currentKasir) {
        showStatus(`Kasir: ${currentKasir}`, 'success');
    }
}

function updateButtons() {
    const enabled = currentOutlet && currentKasir;
    
    const btnOlsera = document.getElementById('btnOlsera');
    const btnDigital = document.getElementById('btnDigital');
    const btnMigrasi = document.getElementById('btnMigrasi');
    
    if (btnOlsera) btnOlsera.disabled = !enabled;
    if (btnDigital) btnDigital.disabled = !enabled;
    if (btnMigrasi) btnMigrasi.disabled = !enabled;
}

// ================= TABLE FUNCTIONS =================
async function loadTableData(type, search = '') {
    showLoading(true);
    
    try {
        let query;
        if (type === 'olsera') {
            query = supabase.from('membercard_olsera').select('*');
            if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
        } else {
            query = supabase.from('membercard').select('*');
            if (search) query = query.or(`nama.ilike.%${search}%,nomorWA.ilike.%${search}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        renderTable(type, data || []);
    } catch (error) {
        console.error(`Error load ${type}:`, error);
        showError(`Gagal memuat data ${type}: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function renderTable(type, data) {
    const tbodyId = type === 'olsera' ? 'olseraTableBody' : 'digitalTableBody';
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-gray-500">
                    Tidak ada data ditemukan
                </td>
            </tr>
        `;
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        if (type === 'olsera') {
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
        } else {
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
        }
        
        tbody.appendChild(row);
    });
}

// ================= MIGRASI FUNCTIONS =================
async function searchCustomer(type) {
    const searchId = type === 'lama' ? 'searchCustomerLama' : 'searchCustomerBaru';
    const searchTerm = document.getElementById(searchId).value.trim();
    
    if (!searchTerm) {
        showWarning('Masukkan nama atau nomor WA');
        return;
    }
    
    showLoading(true);
    
    try {
        let query;
        if (type === 'lama') {
            query = supabase
                .from('membercard_olsera')
                .select('*')
                .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .neq('status_migrasi', 'Sudah migrasi');
        } else {
            query = supabase
                .from('membercard')
                .select('*')
                .or(`nama.ilike.%${searchTerm}%,nomorWA.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        showSearchResults(type, data || []);
    } catch (error) {
        console.error(`Error search ${type}:`, error);
        showWarning(`Gagal mencari customer ${type}: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function showSearchResults(type, results) {
    const resultsId = type === 'lama' ? 'customerLamaResults' : 'customerBaruResults';
    const resultsDiv = document.getElementById(resultsId);
    resultsDiv.innerHTML = '';
    
    if (!results || results.length === 0) {
        resultsDiv.innerHTML = '<p class="p-3 text-gray-500">Tidak ditemukan</p>';
    } else {
        results.forEach(customer => {
            const div = document.createElement('div');
            div.className = 'p-3 border-b border-gray-200 hover:bg-blue-50 cursor-pointer';
            
            if (type === 'lama') {
                div.innerHTML = `
                    <p class="font-medium">${customer.name || '-'}</p>
                    <p class="text-sm text-gray-600">${customer.phone || '-'} | ${customer.code || '-'}</p>
                    <p class="text-sm text-gray-600">Points: ${formatNumber(customer.loyalty_points || 0)}</p>
                `;
                div.onclick = () => selectCustomer('lama', customer);
            } else {
                div.innerHTML = `
                    <p class="font-medium">${customer.nama || '-'}</p>
                    <p class="text-sm text-gray-600">${customer.nomorWA || '-'} | ${customer.id_member || '-'}</p>
                    <p class="text-sm text-gray-600">Point: ${customer.point || 0}</p>
                `;
                div.onclick = () => selectCustomer('baru', customer);
            }
            
            resultsDiv.appendChild(div);
        });
    }
    
    resultsDiv.classList.remove('hidden');
}

function selectCustomer(type, customer) {
    if (type === 'lama') {
        selectedLama = customer;
        const selectedDiv = document.getElementById('selectedCustomerLama');
        selectedDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-bold">${customer.name || '-'}</p>
                    <p class="text-sm text-gray-600">${customer.phone || '-'} | ${customer.code || '-'}</p>
                    <p class="text-sm">Points: <span class="font-bold">${formatNumber(customer.loyalty_points || 0)}</span></p>
                </div>
                <button onclick="deselectCustomer('lama')" class="text-red-500 hover:text-red-700">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
        selectedDiv.classList.remove('hidden');
        document.getElementById('customerLamaResults').classList.add('hidden');
        
        // Auto-search matching baru
        if (customer.phone) {
            autoFindMatching(customer.phone);
        }
    } else {
        selectedBaru = customer;
        const selectedDiv = document.getElementById('selectedCustomerBaru');
        selectedDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-bold">${customer.nama || '-'}</p>
                    <p class="text-sm text-gray-600">${customer.nomorWA || '-'} | ${customer.id_member || '-'}</p>
                    <p class="text-sm">Point: <span class="font-bold">${customer.point || 0}</span></p>
                </div>
                <button onclick="deselectCustomer('baru')" class="text-red-500 hover:text-red-700">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
        selectedDiv.classList.remove('hidden');
        document.getElementById('customerBaruResults').classList.add('hidden');
    }
    
    // Jika kedua customer sudah dipilih, tampilkan perbandingan
    if (selectedLama && selectedBaru) {
        showComparison();
    }
}

function deselectCustomer(type) {
    if (type === 'lama') {
        selectedLama = null;
        document.getElementById('selectedCustomerLama').innerHTML = '';
        document.getElementById('selectedCustomerLama').classList.add('hidden');
    } else {
        selectedBaru = null;
        document.getElementById('selectedCustomerBaru').innerHTML = '';
        document.getElementById('selectedCustomerBaru').classList.add('hidden');
    }
    
    document.getElementById('dataComparison').classList.add('hidden');
    document.getElementById('pointCalculation').classList.add('hidden');
    document.getElementById('submitMigrasi').disabled = true;
}

async function autoFindMatching(phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^0+/, '');
    
    if (!cleanPhone) return;
    
    try {
        const { data, error } = await supabase
            .from('membercard')
            .select('*')
            .eq('nomorWA', cleanPhone)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            selectCustomer('baru', data[0]);
        }
    } catch (error) {
        console.error('Auto-find error:', error);
    }
}

function showComparison() {
    if (!selectedLama || !selectedBaru) return;
    
    // Data perbandingan
    document.getElementById('namaLama').textContent = selectedLama.name || '-';
    document.getElementById('namaBaru').textContent = selectedBaru.nama || '-';
    document.getElementById('waLama').textContent = selectedLama.phone || '-';
    document.getElementById('waBaru').textContent = selectedBaru.nomorWA || '-';
    document.getElementById('alamatLama').textContent = selectedLama.address || '-';
    document.getElementById('alamatBaru').textContent = selectedBaru.alamat || '-';
    document.getElementById('idLama').textContent = selectedLama.code || '-';
    document.getElementById('idBaru').textContent = selectedBaru.id_member || '-';
    
    // Hitung point
    const pointLama = parseFloat(selectedLama.loyalty_points || 0);
    const pointBaru = Math.ceil(pointLama / (konversiPoint || 1));
    
    document.getElementById('pointLama').textContent = formatNumber(pointLama);
    document.getElementById('konversiPoint').textContent = formatNumber(konversiPoint);
    document.getElementById('pointBaru').textContent = pointBaru;
    
    document.getElementById('dataComparison').classList.remove('hidden');
    document.getElementById('pointCalculation').classList.remove('hidden');
    document.getElementById('submitMigrasi').disabled = false;
}

async function submitMigrasi() {
    if (!selectedLama || !selectedBaru) {
        showWarning('Pilih customer lama dan baru');
        return;
    }
    
    if (selectedLama.status_migrasi === 'Sudah migrasi') {
        showWarning('Customer sudah dimigrasi');
        return;
    }
    
    showLoading(true);
    
    try {
        const pointLama = parseFloat(selectedLama.loyalty_points || 0);
        const pointBaru = Math.ceil(pointLama / (konversiPoint || 1));
        const newPoint = (selectedBaru.point || 0) + pointBaru;
        
        // 1. Update membercard
        const { error: updateError } = await supabase
            .from('membercard')
            .update({ point: newPoint })
            .eq('id', selectedBaru.id);
        
        if (updateError) throw updateError;
        
        // 2. Update membercard_olsera
        const { error: olseraError } = await supabase
            .from('membercard_olsera')
            .update({
                outlet: currentOutlet,
                id_member: selectedBaru.id_member,
                nama: selectedBaru.nama,
                nomor_wa: selectedBaru.nomorWA,
                kasir: currentKasir,
                konversi_point: konversiPoint,
                status_migrasi: 'Sudah migrasi',
                tanggal_migrasi: new Date().toISOString(),
                point_migrasi: pointBaru
            })
            .eq('id', selectedLama.id);
        
        if (olseraError) throw olseraError;
        
        // 3. Kirim WA
        await sendWA(selectedBaru.nomorWA, pointBaru, newPoint);
        
        // Success
        document.getElementById('successMessage').textContent = 
            `Migrasi berhasil! ${pointBaru} point ditambahkan ke ${selectedBaru.nama}. Total: ${newPoint}`;
        
        showLoading(false);
        closeModal('modalMigrasi');
        showModal('successModal');
        
        // Refresh data
        setTimeout(() => {
            loadTableData('olsera');
            loadTableData('digital');
        }, 500);
        
    } catch (error) {
        console.error('Migrasi error:', error);
        showWarning('Gagal migrasi: ' + error.message);
        showLoading(false);
    }
}

async function sendWA(phone, added, total) {
    try {
        if (!phone) return;
        
        const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^0+/, '');
        const chatId = `62${cleanPhone}@c.us`;
        const message = `Selamat! Membercard Babeh Barbershop telah dimigrasi.\n\nPoint ditambahkan: ${added}\nTotal point: ${total}\n\nTerima kasih!`;
        
        await fetch(WAHA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WAHA_KEY
            },
            body: JSON.stringify({
                session: 'session3',
                chatId: chatId,
                text: message
            })
        });
    } catch (error) {
        console.warn('WA gagal:', error);
    }
}

// ================= UI FUNCTIONS =================
function showModal(id) {
    if (id === 'modalOlsera') loadTableData('olsera');
    if (id === 'modalDigital') loadTableData('digital');
    if (id === 'modalMigrasi') {
        document.getElementById('migrasiOutlet').textContent = currentOutlet || '-';
        document.getElementById('migrasiKasir').textContent = currentKasir || '-';
        deselectCustomer('lama');
        deselectCustomer('baru');
    }
    
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function showStatus(message, type = 'info') {
    const el = document.getElementById('statusInfo');
    const text = document.getElementById('statusText');
    
    if (!el || !text) return;
    
    text.textContent = message;
    el.className = 'flex items-center p-4 rounded-xl mb-6';
    
    const colors = {
        error: ['bg-red-50', 'border-red-500', 'text-red-700'],
        success: ['bg-green-50', 'border-green-500', 'text-green-700'],
        warning: ['bg-yellow-50', 'border-yellow-500', 'text-yellow-700'],
        info: ['bg-blue-50', 'border-blue-500', 'text-blue-700']
    };
    
    el.classList.add(...colors[type]);
    el.classList.remove('hidden');
}

function showError(message) {
    showStatus(message, 'error');
}

function showWarning(message) {
    const warningText = document.getElementById('warningText');
    const warningInfo = document.getElementById('warningInfo');
    
    if (warningText && warningInfo) {
        warningText.textContent = message;
        warningInfo.classList.remove('hidden');
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function formatNumber(num) {
    if (isNaN(num)) num = 0;
    return new Intl.NumberFormat('id-ID').format(num);
}

// ================= GLOBAL FUNCTIONS =================
window.showModal = showModal;
window.closeModal = closeModal;
window.searchCustomerLama = () => searchCustomer('lama');
window.searchCustomerBaru = () => searchCustomer('baru');
window.deselectCustomer = deselectCustomer;
window.submitMigrasi = submitMigrasi;

// PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}
