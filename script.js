// ==========================================
// رابط Google Apps Script بتاعك (شغال!)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwdM2IOtynsJAPu1cnBHJJcoZH6Z0w9t4lVtKQ4THpQbZ9deYXEZA8TxbAE-_SiaaJG/exec';
// ==========================================

const ADMIN_PASSWORD = 'admin2026';
const DOCTOR_WHATSAPP = '201095810582';

// ==================== FORM الحجز ====================
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    dateInput.addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        if (selectedDate.getDay() === 5) { // الجمعة
            showMessage('عذراً، يوم الجمعة إجازة. اختر يوم آخر.', 'error');
            this.value = '';
        }
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            gender: document.getElementById('gender').value,
            branch: document.getElementById('branch').value,
            date: document.getElementById('date').value,
            service: document.getElementById('service').value,
            notes: document.getElementById('notes').value || ''
        };
        
        // 1. إرسال للـ Google Sheet (تلقائي)
        try {
            const params = new URLSearchParams(formData).toString();
            await fetch(`${SCRIPT_URL}?${params}`, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        } catch (err) {
            console.error('Sheet error:', err);
        }
        
        // 2. فتح واتساب (زي الأول)
        sendWhatsAppMessage(formData);
        
        // نجح!
        showMessage('🎉 تم تأكيد الحجز! سيتم التواصل قريباً.', 'success');
        bookingForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function sendWhatsAppMessage(data) {
    const message = `🏥 *حجز جديد في عيادة الدكتور عبدالرحمن الزميتي*

👤 *الاسم:* ${data.name}
📱 *الهاتف:* ${data.phone}
⚧ *النوع:* ${data.gender}
🏥 *الفرع:* ${data.branch}
📅 *التاريخ:* ${data.date}
💊 *نوع الخدمة:* ${data.service}
📝 *ملاحظات:* ${data.notes || 'لا يوجد'}

⏰ *وقت الحجز:* ${new Date().toLocaleString('ar-EG')}`;
    
    const url = `https://wa.me/${DOCTOR_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function showMessage(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `success-message ${type === 'error' ? 'error-message' : ''}`;
    div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${msg}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

// ==================== لوحة الإدارة ====================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('password').value === ADMIN_PASSWORD) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadBookings(); // تحميل أول مرة
        } else {
            showMessage('كلمة المرور خاطئة!', 'error');
        }
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('password').value = '';
    });
}

let lastCount = 0;
async function loadBookings() {
    try {
        const res = await fetch(SCRIPT_URL);
        const bookings = await res.json();
        
        displayBookings(bookings);
        updateStats(bookings);
        
        // صوت تنبيه لو حجز جديد
        if (bookings.length > lastCount) {
            playNotification();
        }
        lastCount = bookings.length;
        
    } catch (err) {
        console.error(err);
        document.getElementById('bookingsBody').innerHTML = '<tr><td colspan="10" class="no-data">خطأ في التحميل، جرب تاني</td></tr>';
    }
}

// عرض الحجوزات مع فلاتر
function displayBookings(bookings) {
    const tbody = document.getElementById('bookingsBody');
    if (!tbody) return;
    
    // فلاتر
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const branch = document.getElementById('filterBranch')?.value || '';
    const date = document.getElementById('filterDate')?.value || '';
    
    let filtered = bookings.filter(b => 
        (!search || (b.name?.toLowerCase().includes(search) || b.phone?.includes(search))) &&
        (!branch || b.branch === branch) &&
        (!date || b.date === date)
    ).reverse(); // الأحدث أول
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">لا توجد حجوزات مطابقة</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((b, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${b.name || '-'}</td>
            <td><a href="tel:${b.phone}">${b.phone || '-'}</a></td>
            <td>${b.gender || '-'}</td>
            <td>${b.branch || '-'}</td>
            <td>${b.date || '-'}</td>
            <td>${b.service || '-'}</td>
            <td>${b.notes || '-'}</td>
            <td>${b.createdAt || '-'}</td>
            <td>
                <button class="delete-btn" onclick="confirmDelete('${b.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        </tr>
    `).join('');
}

// إحصائيات
function updateStats(bookings) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
    
    document.getElementById('todayBookings').textContent = bookings.filter(b => b.date === today).length;
    document.getElementById('weekBookings').textContent = bookings.filter(b => new Date(b.date) >= new Date(weekAgo)).length;
    document.getElementById('totalBookings').textContent = bookings.length;
    document.getElementById('damietaBookings').textContent = bookings.filter(b => b.branch === 'دمياط الجديدة').length;
    document.getElementById('zarqaBookings').textContent = bookings.filter(b => b.branch === 'الزرقا').length;
}

// صوت تنبيه
function playNotification() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjV/Y4uJNwg='); // بيب قصير
    audio.play().catch(() => {}); // لو المتصفح منع الصوت
}

// فلاتر
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const filterBranch = document.getElementById('filterBranch');
    const filterDate = document.getElementById('filterDate');
    const clearFilters = document.getElementById('clearFilters');
    
    if (searchInput) searchInput.addEventListener('input', loadBookings);
    if (filterBranch) filterBranch.addEventListener('change', loadBookings);
    if (filterDate) filterDate.addEventListener('change', loadBookings);
    if (clearFilters) clearFilters.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterBranch) filterBranch.value = '';
        if (filterDate) filterDate.value = '';
        loadBookings();
    });
    
    // تحديث تلقائي كل 10 ثواني في الإدارة
    setInterval(loadBookings, 10000);
});

// حذف (يحذف من الشيت)
function confirmDelete(id) {
    if (confirm('متأكد إنك عايز تحذف الحجز ده؟')) {
        // للحذف، روح على الشيت وامسح الصف يدوياً (أسهل للآن)
        showMessage('للحذف: افتح Google Sheet وامسح الصف يدوياً', 'error');
    }
}
