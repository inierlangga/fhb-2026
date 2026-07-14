document.addEventListener('DOMContentLoaded', () => {
    // URL Web App Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7HyoCGaWAKztSrZZgecP_QmyTHedOTUKwbaPmcK9cB3x70SDHxaW_69UEmWYonqCE/exec';

    // DOM Elements
    const loginOverlay = document.getElementById('login-overlay');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    
    const tableBody = document.getElementById('table-body');
    const tableLoading = document.getElementById('table-loading');
    const emptyState = document.getElementById('empty-state');
    const dataTable = document.getElementById('data-table');
    const btnRefresh = document.getElementById('btn-refresh');

    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnApprove = document.getElementById('btn-approve');
    const btnReject = document.getElementById('btn-reject');

    let currentData = [];
    let selectedRowId = null;

    // --- Authentication ---
    
    // Check if already logged in (sessionStorage)
    if (sessionStorage.getItem('fhb_admin_logged_in') === 'true') {
        showDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('admin-password').value;
        if (pwd === 'admin123') { // Simple static password
            sessionStorage.setItem('fhb_admin_logged_in', 'true');
            showDashboard();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('fhb_admin_logged_in');
        loginOverlay.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        document.getElementById('admin-password').value = '';
        loginError.classList.add('hidden');
    });

    function showDashboard() {
        loginOverlay.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        fetchData();
    }

    // --- Data Fetching & Rendering ---

    btnRefresh.addEventListener('click', fetchData);

    async function fetchData() {
        showTableLoading();
        
        try {
            const response = await fetch(`${SCRIPT_URL}?action=get_all`);
            const result = await response.json();
            
            if (result.status === 'success') {
                currentData = result.data;
                renderTable();
            } else {
                showToast('Gagal memuat data', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Kesalahan koneksi ke server', 'error');
        } finally {
            hideTableLoading();
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';
        
        if (currentData.length === 0) {
            dataTable.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        dataTable.classList.remove('hidden');
        emptyState.classList.add('hidden');

        currentData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Format Date
            let dateStr = row['Timestamp'];
            if (dateStr) {
                const d = new Date(dateStr);
                dateStr = d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
            }

            // Status Badge
            let statusBadge = `<span class="status-badge badge-pending">${row['Status']}</span>`;
            if (row['Status'] === 'Terverifikasi') statusBadge = `<span class="status-badge badge-approved">${row['Status']}</span>`;
            if (row['Status'] === 'Ditolak') statusBadge = `<span class="status-badge badge-rejected">${row['Status']}</span>`;

            tr.innerHTML = `
                <td><strong>${row['ID Pendaftaran']}</strong></td>
                <td>${dateStr}</td>
                <td>${row['Nama']}<br><small style="color: #64748b;">${row['NIM/NPM']}</small></td>
                <td>${row['Lomba']}</td>
                <td>${statusBadge}</td>
                <td style="display: flex; gap: 8px;">
                    <a href="${row['URL Bukti Bayar']}" target="_blank" class="btn btn-secondary btn-sm" title="Cek Bukti Bayar"><i class="ph ph-image"></i> Bukti</a>
                    <button class="btn btn-success btn-sm" onclick="updateStatusFromTable('${row['ID Pendaftaran']}', 'Terverifikasi')" ${row['Status'] === 'Terverifikasi' ? 'disabled' : ''}><i class="ph ph-check"></i> Verifikasi</button>
                    <button class="btn btn-danger btn-sm" onclick="updateStatusFromTable('${row['ID Pendaftaran']}', 'Ditolak')" ${row['Status'] === 'Ditolak' ? 'disabled' : ''}><i class="ph ph-x"></i> Tolak</button>
                    <button class="btn btn-outline btn-sm" onclick="viewDetails('${row['ID Pendaftaran']}')" title="Detail Lengkap"><i class="ph ph-list"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function showTableLoading() {
        tableLoading.classList.remove('hidden');
        dataTable.classList.add('hidden');
        emptyState.classList.add('hidden');
    }

    function hideTableLoading() {
        tableLoading.classList.add('hidden');
    }

    // --- Modal & Actions ---

    window.updateStatusFromTable = function(id, newStatus) {
        selectedRowId = id;
        // Kita bypass modal button dan langsung panggil updateStatus
        updateStatus(newStatus);
    }

    // Expose function to global so onclick in HTML works
    window.viewDetails = function(id) {
        selectedRowId = id;
        const row = currentData.find(r => r['ID Pendaftaran'] === id);
        
        if (!row) return;

        let anggotaHTML = '';
        if (row['Anggota Tim'] && row['Anggota Tim'] !== '-') {
            const anggota = row['Anggota Tim'].split('\n');
            anggotaHTML = `<ul>` + anggota.map(a => `<li>${a}</li>`).join('') + `</ul>`;
        } else {
            anggotaHTML = '-';
        }

        modalBody.innerHTML = `
            <div class="detail-row"><div class="detail-label">ID Pendaftaran</div><div class="detail-value">${row['ID Pendaftaran']}</div></div>
            <div class="detail-row"><div class="detail-label">Waktu Daftar</div><div class="detail-value">${new Date(row['Timestamp']).toLocaleString('id-ID')}</div></div>
            <div class="detail-row"><div class="detail-label">Nama / Ketua</div><div class="detail-value">${row['Nama']}</div></div>
            <div class="detail-row"><div class="detail-label">NIM/NPM</div><div class="detail-value">${row['NIM/NPM']}</div></div>
            <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${row['Email']}</div></div>
            <div class="detail-row"><div class="detail-label">WhatsApp</div><div class="detail-value"><a href="https://wa.me/${row['WhatsApp'].replace(/\D/g,'')}" target="_blank">${row['WhatsApp']}</a></div></div>
            <div class="detail-row"><div class="detail-label">Institusi</div><div class="detail-value">${row['Institusi']}</div></div>
            <div class="detail-row"><div class="detail-label">Lomba</div><div class="detail-value">${row['Lomba']}</div></div>
            <div class="detail-row"><div class="detail-label">Anggota Tim</div><div class="detail-value" style="font-weight:normal; font-size:14px;">${anggotaHTML}</div></div>
            <div class="detail-row"><div class="detail-label">Bukti Pembayaran</div><div class="detail-value"><a href="${row['URL Bukti Bayar']}" target="_blank">Lihat Bukti (Google Drive) <i class="ph ph-box-arrow-up-right"></i></a></div></div>
            <div class="detail-row"><div class="detail-label">Status Saat Ini</div><div class="detail-value">${row['Status']}</div></div>
        `;

        // Atur state tombol
        btnApprove.disabled = row['Status'] === 'Terverifikasi';
        btnReject.disabled = row['Status'] === 'Ditolak';

        modal.classList.remove('hidden');
    }

    btnCloseModal.addEventListener('click', () => {
        modal.classList.add('hidden');
        selectedRowId = null;
    });

    btnApprove.addEventListener('click', () => updateStatus('Terverifikasi'));
    btnReject.addEventListener('click', () => updateStatus('Ditolak'));

    async function updateStatus(newStatus) {
        if (!selectedRowId) return;
        if (!confirm(`Yakin ingin merubah status menjadi ${newStatus}?`)) return;

        const originalApproveText = btnApprove.textContent;
        const originalRejectText = btnReject.textContent;

        btnApprove.disabled = true;
        btnReject.disabled = true;

        if (newStatus === 'Terverifikasi') btnApprove.textContent = 'Menyimpan...';
        else btnReject.textContent = 'Menyimpan...';

        try {
            const payload = {
                action: 'update_status',
                id: selectedRowId,
                newStatus: newStatus
            };

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                showToast(`Status diperbarui: ${newStatus}`, 'success');
                modal.classList.add('hidden');
                fetchData(); // Refresh data
            } else {
                throw new Error(result.message || 'Server error');
            }
        } catch (error) {
            console.error(error);
            showToast('Gagal mengupdate status', 'error');
            btnApprove.disabled = false;
            btnReject.disabled = false;
            btnApprove.textContent = originalApproveText;
            btnReject.textContent = originalRejectText;
        }
    }

    // --- Toast Notification ---
    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
        
        toast.innerHTML = `
            <i class="ph-fill ${iconClass} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
