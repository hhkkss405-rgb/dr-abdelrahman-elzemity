// ==========================================
// رابط Google Apps Script (مقسم للحماية)
const _0xURL1 = 'https://script.google.com/macros/s/';
const _0xURL2 = 'AKfycbwdM2IOtynsJAPu1cnBHJJcoZH6Z0w9t4lVtKQ4THpQbZ9deYXEZA8TxbAE-_SiaaJG';
const _0xURL3 = '/exec';
const SCRIPT_URL = _0xURL1 + _0xURL2 + _0xURL3;

// كلمة المرور (بدون تشفير)
const ADMIN_PASSWORD = 'google2026';

const DOCTOR_WHATSAPP = '201095810582';

// ==================== نموذج الحجز مع الحماية ====================
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    // منع الجمعة
    dateInput.addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        if (selectedDate.getDay() === 5) {
            showMessage('عذراً، يوم الجمعة إجازة. اختر يوم آخر.', 'error');
            this.value = '';
        }
    });

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // ✅ حماية Honeypot: لو الروبوت ملأ الحقل المخفي، ارفض
        const honeypot = document.getElementById('honeypot');
        if (honeypot && honeypot.value !== '') {
            console.log('Bot detected!');
            return;
        }
        
        // جمع البيانات
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            gender: document.getElementById('gender').value,
            branch: document.getElementById('branch').value,
            date: document.getElementById('date').value,
            service: document.getElementById('service').value,
            notes: document.getElementById('notes').value || ''
        };
        
        // ✅ فتح واتساب فوراً
        sendWhatsAppMessage(formData);
        
        // ✅ إرسال للشيت في الخلفية
        const params = new URLSearchParams(formData).toString();
        fetch(`${SCRIPT_URL}?${params}`, {
            method: 'POST',
            mode: 'no-cors'
        }).catch(err => console.log('Sheet error:', err));
        
        // رسالة نجاح
        showMessage('تم تأكيد الحجز بنجاح!', 'success');
        bookingForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// دالة فتح واتساب
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
    
    const url = `https://api.whatsapp.com/send?phone=${DOCTOR_WHATSAPP}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// رسالة تأكيد
function showMessage(msg, type = 'success') {
    if (type === 'success' && msg.includes('تم تأكيد الحجز')) {
        msg = `✅ تم تأكيد الحجز بنجاح!<br>🔔 اضغط "فتح التطبيق" لإرسال الرسالة.<br>❤️ شكراً لاستخدامك خدماتنا`;
    }

    const div = document.createElement('div');
    div.className = `success-message ${type === 'error' ? 'error-message' : ''}`;
    div.innerHTML = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 8000);
}

// ==================== لوحة الإدارة ====================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('password').value === ADMIN_PASSWORD) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadBookings();
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
        
        if (bookings.length > lastCount && lastCount > 0) {
            playNotification();
        }
        lastCount = bookings.length;
        
    } catch (err) {
        console.error(err);
        const tbody = document.getElementById('bookingsBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="no-data">خطأ في التحميل</td></tr>';
    }
}

function displayBookings(bookings) {
    const tbody = document.getElementById('bookingsBody');
    if (!tbody) return;
    
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const branch = document.getElementById('filterBranch')?.value || '';
    const date = document.getElementById('filterDate')?.value || '';
    
    let filtered = bookings.filter(b => 
        (!search || (b.name?.toLowerCase().includes(search) || b.phone?.includes(search))) &&
        (!branch || b.branch === branch) &&
        (!date || b.date === date)
    ).reverse();
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">لا توجد حجوزات</td></tr>';
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
            <td><button class="delete-btn" onclick="showMessage('امسح الصف من الشيت يدوياً', 'error')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function updateStats(bookings) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
    
    const els = {
        today: document.getElementById('todayBookings'),
        week: document.getElementById('weekBookings'),
        total: document.getElementById('totalBookings'),
        damieta: document.getElementById('damietaBookings'),
        zarqa: document.getElementById('zarqaBookings')
    };
    
    if (els.today) els.today.textContent = bookings.filter(b => b.date === today).length;
    if (els.week) els.week.textContent = bookings.filter(b => new Date(b.date) >= new Date(weekAgo)).length;
    if (els.total) els.total.textContent = bookings.length;
    if (els.damieta) els.damieta.textContent = bookings.filter(b => b.branch === 'دمياط الجديدة').length;
    if (els.zarqa) els.zarqa.textContent = bookings.filter(b => b.branch === 'الزرقا').length;
}

function playNotification() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjV/Y4uJNwg=');
        audio.play();
    } catch(e) {}
}

// الفلاتر
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
    
    setInterval(loadBookings, 10000);
});
