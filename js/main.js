document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Toggle hamburger icon
            const icon = hamburger.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('ph-list');
                icon.classList.add('ph-x');
            } else {
                icon.classList.remove('ph-x');
                icon.classList.add('ph-list');
            }
        });
    }

    // Close mobile menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
        });
    });

    // 3. Scroll Animation (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // 4. Active Nav Link on Scroll
    const sections = document.querySelectorAll('section, header');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 5. Form Logic
    // App Script URL placeholder (Ganti ini setelah deploy)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7HyoCGaWAKztSrZZgecP_QmyTHedOTUKwbaPmcK9cB3x70SDHxaW_69UEmWYonqCE/exec';

    const form = document.getElementById('registration-form');
    const lombaSelect = document.getElementById('reg-lomba');
    const teamSection = document.getElementById('team-section');
    const btnAddMember = document.getElementById('btn-add-member');
    const teamContainer = document.getElementById('team-members-container');
    const fileInput = document.getElementById('reg-bukti');
    const fileWrapper = document.getElementById('file-upload-wrapper');
    const filePreview = document.getElementById('file-preview');
    const previewImage = document.getElementById('preview-image');
    const btnRemoveFile = document.getElementById('btn-remove-file');

    let memberCount = 0;
    const MAX_MEMBERS = 2; // Max 2 additional members (Total 3 including leader)

    // Auto-select dropdown based on URL parameter
    if (lombaSelect) {
        const urlParams = new URLSearchParams(window.location.search);
        const selectedLomba = urlParams.get('lomba');
        if (selectedLomba) {
            // Find option and set it as selected
            for (let i = 0; i < lombaSelect.options.length; i++) {
                if (lombaSelect.options[i].value === selectedLomba) {
                    lombaSelect.selectedIndex = i;
                    // Trigger change event manually
                    const event = new Event('change');
                    lombaSelect.dispatchEvent(event);
                    break;
                }
            }
        }
    }

    // Toggle Team Section based on selected Lomba
    if (lombaSelect) {
        lombaSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const isTim = selectedOption.getAttribute('data-tipe') === 'Tim';
            
            if (isTim) {
                teamSection.classList.remove('hidden');
                // Tambahkan 1 member input otomatis jika kosong
                if (memberCount === 0) {
                    addMemberInput();
                }
            } else {
                teamSection.classList.add('hidden');
                // Hapus semua member
                teamContainer.innerHTML = '';
                memberCount = 0;
            }
        });
    }

    if (btnAddMember) {
        btnAddMember.addEventListener('click', addMemberInput);
    }

    function addMemberInput() {
        if (memberCount >= MAX_MEMBERS) {
            showToast('Maksimal anggota tim telah tercapai', 'error');
            return;
        }

        memberCount++;
        const div = document.createElement('div');
        div.className = 'member-input-group';
        div.innerHTML = `
            <input type="text" name="anggota_nama[]" placeholder="Nama Anggota ${memberCount}">
            <input type="text" name="anggota_nim[]" placeholder="NIM/NPM">
            <button type="button" class="btn-remove-member" title="Hapus"><i class="ph ph-trash"></i></button>
        `;

        div.querySelector('.btn-remove-member').addEventListener('click', function() {
            div.remove();
            memberCount--;
        });

        teamContainer.appendChild(div);
    }

    // File Upload Preview
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and Drop
        fileWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileWrapper.classList.add('dragover');
        });
        fileWrapper.addEventListener('dragleave', () => {
            fileWrapper.classList.remove('dragover');
        });
        fileWrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            fileWrapper.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect();
            }
        });

        btnRemoveFile.addEventListener('click', () => {
            fileInput.value = '';
            filePreview.classList.add('hidden');
        });
    }

    function handleFileSelect() {
        const file = fileInput.files[0];
        if (!file) return;

        // Validasi ukuran (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB!', 'error');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            filePreview.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }

    // Form Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btn-submit-reg');
            const btnText = btnSubmit.querySelector('.btn-text');
            const btnIcon = btnSubmit.querySelector('.btn-icon');
            const spinner = btnSubmit.querySelector('.spinner');

            // Cek file base64
            const file = fileInput.files[0];
            if (!file) {
                showToast('Mohon upload bukti pembayaran', 'error');
                return;
            }

            try {
                // Set loading state
                btnSubmit.disabled = true;
                if (btnText) btnText.textContent = 'Mengirim...';
                if (btnIcon) btnIcon.classList.add('hidden');
                if (spinner) spinner.classList.remove('hidden');

                const base64Data = await toBase64(file);
                
                // Kumpulkan data anggota tim
                let anggotaList = [];
                const memberGroups = document.querySelectorAll('.member-input-group');
                memberGroups.forEach(group => {
                    const nama = group.querySelector('input[name="anggota_nama[]"]')?.value.trim();
                    const nim = group.querySelector('input[name="anggota_nim[]"]')?.value.trim();
                    if (nama) {
                        let memberString = nama;
                        if (nim) memberString += ` (${nim})`;
                        anggotaList.push(memberString);
                    }
                });

                const payload = {
                    action: 'register',
                    nama: document.getElementById('reg-nama').value,
                    nim: document.getElementById('reg-nim').value,
                    email: document.getElementById('reg-email').value,
                    whatsapp: document.getElementById('reg-wa').value,
                    institusi: document.getElementById('reg-institusi').value,
                    lomba: document.getElementById('reg-lomba').value,
                    anggota_tim: anggotaList.join('\n'), // Dipisah dengan newline
                    fileName: file.name,
                    mimeType: file.type,
                    fileBase64: base64Data.split(',')[1] // Ambil base64-nya saja
                };

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    const successModal = document.getElementById('success-modal');
                    if (successModal) {
                        successModal.classList.remove('hidden');
                        document.getElementById('btn-close-success').onclick = function() {
                            successModal.classList.add('hidden');
                            document.getElementById('cek-status').scrollIntoView({ behavior: 'smooth' });
                        };
                    } else {
                        showToast('Pendaftaran Berhasil! ID: ' + result.id, 'success');
                    }
                    
                    form.reset();
                    filePreview.classList.add('hidden');
                    teamSection.classList.add('hidden');
                    teamContainer.innerHTML = '';
                    memberCount = 0;
                    
                    // Tampilkan notifikasi spesial agar pendaftar mencatat ID
                    alert('Pendaftaran Berhasil!\n\nID Pendaftaran Anda: ' + result.id + '\n\nHarap catat ID ini untuk mengecek status verifikasi.');
                } else {
                    throw new Error(result.message || 'Terjadi kesalahan pada server');
                }
            } catch (error) {
                console.error(error);
                showToast('Gagal mengirim pendaftaran. Pastikan Apps Script URL sudah benar.', 'error');
            } finally {
                // Reset loading state
                btnSubmit.disabled = false;
                if (btnText) btnText.textContent = 'Kirim Pendaftaran';
                if (btnIcon) btnIcon.classList.remove('hidden');
                if (spinner) spinner.classList.add('hidden');
            }
        });
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // 6. Check Status Logic
    const statusForm = document.getElementById('status-form');
    const statusResult = document.getElementById('status-result');

    if (statusForm) {
        statusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idInput = document.getElementById('status-id').value.trim();
            const btnSubmit = document.getElementById('btn-check-status');
            const btnText = btnSubmit.querySelector('.btn-text');
            const spinner = btnSubmit.querySelector('.spinner');

            if (!idInput) return;

            try {
                btnSubmit.disabled = true;
                if (btnText) btnText.textContent = 'Mengecek...';
                if (spinner) spinner.classList.remove('hidden');
                statusResult.classList.add('hidden');

                const response = await fetch(`${SCRIPT_URL}?action=check_status&nim=${encodeURIComponent(idInput)}`);
                const result = await response.json();

                if (result.status === 'success') {
                    let badgeClass = 'badge-pending';
                    if (result.data.status === 'Terverifikasi') badgeClass = 'badge-approved';
                    if (result.data.status === 'Ditolak') badgeClass = 'badge-rejected';

                    statusResult.innerHTML = `
                        <h3>Status Pendaftaran</h3>
                        <p>ID: <strong>${result.data.id}</strong></p>
                        <p>Nama: ${result.data.nama}</p>
                        <p>NIM/NPM: ${result.data.nim}</p>
                        <p>Lomba: ${result.data.lomba}</p>
                        <div class="status-badge ${badgeClass}">${result.data.status}</div>
                    `;
                    statusResult.classList.remove('hidden');
                } else {
                    showToast(result.message || 'Data tidak ditemukan', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Gagal mengecek status', 'error');
            } finally {
                btnSubmit.disabled = false;
                if (btnText) btnText.textContent = 'Cek Status';
                if (spinner) spinner.classList.add('hidden');
            }
        });
    }

    // 7. Toast Notification System
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

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
