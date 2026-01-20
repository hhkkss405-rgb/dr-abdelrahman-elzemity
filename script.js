// Configuration
const ADMIN_PASSWORD = 'admin2026';
const DOCTOR_WHATSAPP = '201095810582';

// Initialize LocalStorage
if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
}

// Booking Form Submission
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Disable Fridays
    dateInput.addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        if (selectedDate.getDay() === 5) { // Friday = 5
            showMessage('عذراً، يوم الجمعة إجازة. الرجاء اختيار يوم آخر.', 'error');
            this.value = '';
        }
    });

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            id: Date.now(),
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            gender: document.getElementById('gender').value,
            branch: document.getElementById('branch').value,
            date: document.getElementById('date').value,
            service: document.getElementById('service').value,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toLocaleString('ar-EG')
        };
        
        // Save to LocalStorage
        let bookings = JSON.parse(localStorage.getItem('bookings'));
        bookings.push(formData);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Send WhatsApp message
        sendWhatsAppMessage(formData);
        
        // Show success message
        showMessage('تم تأكيد حجزك بنجاح! سيتم التواصل معك قريباً.', 'success');
        
        // Reset form
        bookingForm.reset();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Send WhatsApp Message
function sendWhatsAppMessage(data) {
    const message = `
🏥 *حجز جديد من العيادة*

👤 *الاسم:* ${data.name}
📱 *الهاتف:* ${data.phone}
⚧ *النوع:* ${data.gender}
🏥 *الفرع:* ${data.branch}
📅 *التاريخ:* ${data.date}
💊 *نوع الخدمة:* ${data.service}
📝 *ملاحظات:* ${data.notes || 'لا توجد'}

⏰ *تم الحجز في:* ${data.timestamp}
    `.trim();
    
    const whatsappUrl = `https://wa.me/${DOCTOR_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Show Message
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Admin Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        if (password === ADMIN_PASSWORD) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadBookings();
            updateStatistics();
        } else {
            showMessage('كلمة المرور غير صحيحة!', 'error');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('submit', function() {
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('password').value = '';
    });
}

// Load Bookings
function loadBookings(filter = {}) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const tbody = document.getElementById('bookingsBody');
    
    if (!tbody) return;
    
    let filteredBookings = bookings;
    
    // Apply filters
    if (filter.search) {
        filteredBookings = filteredBookings.filter(b => 
            b.name.includes(filter.search) || b.phone.includes(filter.search)
        );
    }
    
    if (filter.branch) {
        filteredBookings = filteredBookings.filter(b => b.branch === filter.branch);
    }
    
    if (filter.date) {
        filteredBookings = filteredBookings.filter(b => b.date === filter.date);
    }
    
    // Sort by newest first
    filteredBookings.reverse();
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">لا توجد حجوزات</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredBookings.map((booking, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${booking.name}</td>
            <td><a href="tel:${booking.phone}">${booking.phone}</a></td>
            <td>${booking.gender}</td>
            <td>${booking.branch}</td>
            <td>${booking.date}</td>
            <td>${booking.service}</td>
            <td>${booking.notes || '-'}</td>
            <td>${booking.timestamp}</td>
            <td>
                <button class="delete-btn" onclick="deleteBooking(${booking.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        </tr>
    `).join('');
}

// Delete Booking
function deleteBooking(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
    
    let bookings = JSON.parse(localStorage.getItem('bookings'));
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    loadBookings();
    updateStatistics();
    showMessage('تم حذف الحجز بنجاح', 'success');
}

// Update Statistics
function updateStatistics() {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Today's bookings
    const todayBookings = bookings.filter(b => b.date === today).length;
    
    // Week's bookings
    const weekBookings = bookings.filter(b => b.date >= weekAgo).length;
    
    // Total bookings
    const totalBookings = bookings.length;
    
    // Branch bookings
    const damietaBookings = bookings.filter(b => b.branch === 'دمياط الجديدة').length;
    const zarqaBookings = bookings.filter(b => b.branch === 'الزرقا').length;
    
    // Update UI
    const todayEl = document.getElementById('todayBookings');
    const weekEl = document.getElementById('weekBookings');
    const totalEl = document.getElementById('totalBookings');
    const damietaEl = document.getElementById('damietaBookings');
    const zarqaEl = document.getElementById('zarqaBookings');
    
    if (todayEl) todayEl.textContent = todayBookings;
    if (weekEl) weekEl.textContent = weekBookings;
    if (totalEl) totalEl.textContent = totalBookings;
    if (damietaEl) damietaEl.textContent = damietaBookings;
    if (zarqaEl) zarqaEl.textContent = zarqaBookings;
}

// Filters
const searchInput = document.getElementById('searchInput');
const filterBranch = document.getElementById('filterBranch');
const filterDate = document.getElementById('filterDate');
const clearFilters = document.getElementById('clearFilters');

if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

if (filterBranch) {
    filterBranch.addEventListener('change', applyFilters);
}

if (filterDate) {
    filterDate.addEventListener('change', applyFilters);
}

if (clearFilters) {
    clearFilters.addEventListener('click', function() {
        searchInput.value = '';
        filterBranch.value = '';
        filterDate.value = '';
        loadBookings();
    });
}

function applyFilters() {
    const filter = {
        search: searchInput ? searchInput.value : '',
        branch: filterBranch ? filterBranch.value : '',
        date: filterDate ? filterDate.value : ''
    };
    loadBookings(filter);
}

// Notification Sound on New Booking (Check every 5 seconds)
let lastBookingCount = 0;

setInterval(() => {
    if (document.getElementById('adminDashboard') && 
        document.getElementById('adminDashboard').style.display !== 'none') {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        
        if (bookings.length > lastBookingCount) {
            const sound = document.getElementById('notificationSound');
            if (sound) sound.play();
            updateStatistics();
            loadBookings();
        }
        
        lastBookingCount = bookings.length;
    }
}, 5000);
