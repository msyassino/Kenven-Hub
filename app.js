/* ================================================================
   KENVEN HUB - MAIN APPLICATION (V2 FULL)
   Firebase + Coins + Chat + Profiles + Ranks + Reading + Chat
   ================================================================ */
'use strict';

// ==================== 1. CONFIGURATION ====================
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyDQ7q03kfdOQAm_B03O47GlC4v8DCru94E",
        authDomain: "kenven-hub.firebaseapp.com",
        projectId: "kenven-hub",
        storageBucket: "kenven-hub.firebasestorage.app",
        messagingSenderId: "181277894032",
        appId: "1:181277894032:web:7f42a19f3bcf3ea3033f15",
        measurementId: "G-VLW5MCJ2CM"
    },
    site: {
        name: "Kenven Hub",
        logo: "https://cdn.phototourl.com/free/2026-08-09-001eb100-a118-4da2-a6fa-edd349bfe20e.jpg",
        discord: "https://discord.com/channels/1256937655984328714/",
        website: "https://yassine.com/",
        whatsapp: "212631204978"
    },
    keys: {
        lang: 'kenven_hub_lang',
        theme: 'kenven_hub_theme',
        effects: 'kenven_hub_effects',
        walletMeta: 'kenven_hub_wallet_meta',
        uidMap: 'kenven_hub_uid_map',
        mirror: 'kenven_hub_mirror',
        likedComments: 'kenven_hub_liked_comments',
        commentTimes: 'kenven_hub_comment_times',
        cachePosts: 'kenven_hub_cache_posts',
        cacheAff: 'kenven_hub_cache_aff',
        bookmarks: 'kenven_hub_bookmarks',
        readProgress: 'kenven_hub_read_progress',
        chatSeen: 'kenven_hub_chat_seen',
        cookieConsent: 'kenven_hub_cookie_consent',
        achievements: 'kenven_hub_achievements'
    },
    defaultSettings: {
        dailyGiftAmount: 1,
        adRewardAmount: 5,
        adUrl: 'https://yassine.com/',
        adWaitSeconds: 30,
        whatsappNumber: '212631204978',
        enableDailyGift: true,
        enableAd: true,
        enableWhatsapp: true,
        enableCodes: true,
        maintenance: { enabled: false, message: '', eta: '' },
        chatDeleteDays: 3,
        onlineBoost: 0
    },
    ranks: [
        { id: 'bronze', name: { en: 'Bronze', ar: 'برونز' }, minCoins: 0, color: '#CD7F32', icon: 'fa-medal', dailyGift: 1 },
        { id: 'silver', name: { en: 'Silver', ar: 'فضي' }, minCoins: 50, color: '#C0C0C0', icon: 'fa-medal', dailyGift: 2 },
        { id: 'gold', name: { en: 'Gold', ar: 'ذهبي' }, minCoins: 150, color: '#FFD700', icon: 'fa-medal', dailyGift: 3 },
        { id: 'platinum', name: { en: 'Platinum', ar: 'بلاتيني' }, minCoins: 400, color: '#E5E4E2', icon: 'fa-crown', dailyGift: 5 },
        { id: 'diamond', name: { en: 'Diamond', ar: 'ألماسي' }, minCoins: 800, color: '#B9F2FF', icon: 'fa-gem', dailyGift: 7 },
        { id: 'vip', name: { en: 'VIP', ar: 'VIP' }, minCoins: 1500, color: '#FF2E63', icon: 'fa-crown', dailyGift: 10 }
    ]
};

// ==================== 2. UTILITIES ====================
const Utils = {
    escapeHtml(s) {
        if (typeof s !== 'string') return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    },
    sanitizeHtml(h) {
        if (typeof h !== 'string') return '';
        return h
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:/gi, '');
    },
    debounce(fn, d = 300) {
        let t;
        return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); };
    },
    formatDate(ts, lang = 'en') {
        try {
            return new Date(ts).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch (e) { return ''; }
    },
    readingTime(c) {
        const w = (c || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(w / 200));
    },
    genId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    },
    genRecoveryCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'KV-';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },
    hashCode(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h);
    },
    isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); },
    truncate(t, m = 120) {
        const p = (t || '').replace(/<[^>]*>/g, '');
        return p.length <= m ? p : p.substr(0, m).trim() + '...';
    },
    async copy(t) {
        try {
            await navigator.clipboard.writeText(t);
            return true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = t;
            ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); return true; }
            catch (e2) { return false; }
            finally { document.body.removeChild(ta); }
        }
    },
    todayStr() { return new Date().toDateString(); },
    timeAgo(ts) {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return mins + 'm';
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h';
        return Math.floor(hrs / 24) + 'd';
    },
    getRank(totalEarned) {
        let rank = CONFIG.ranks[0];
        for (const r of CONFIG.ranks) {
            if (totalEarned >= r.minCoins) rank = r;
        }
        return rank;
    },
    embedYoutube(url) {
        if (!url) return '';
        let id = '';
        const m1 = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (m1) id = m1[1];
        if (!id) return '';
        return '<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/' + id + '" allowfullscreen loading="lazy"></iframe></div>';
    }
};

// ==================== 3. LOCAL STORAGE ====================
const LS = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('LS set failed', e); } },
    remove(k) { localStorage.removeItem(k); }
};

// ==================== 4. FIREBASE CORE ====================
const FB = {
    db: null, auth: null, ok: false, user: null, userPromise: null,
    init() {
        try {
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(CONFIG.firebase);
                this.db = firebase.firestore();
                this.auth = firebase.auth();
                this.ok = true;
                this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e => console.warn('Persistence error:', e));
                this.userPromise = new Promise(resolve => {
                    this.auth.onAuthStateChanged(user => { this.user = user; resolve(user); });
                });
            }
        } catch (e) { console.warn('Firebase init failed:', e); this.ok = false; }
    },
    async waitForAuth() {
        if (!this.ok) return null;
        if (this.user !== null) return this.user;
        return this.userPromise;
    }
};

// ==================== 5. I18N ====================
const I18n = {
    lang: 'en',
    tr: {
        'nav.home': { en: 'Home', ar: 'الرئيسية' },
        'nav.posts': { en: 'Posts', ar: 'المنشورات' },
        'nav.categories': { en: 'Categories', ar: 'التصنيفات' },
        'nav.deals': { en: 'Deals', ar: 'العروض' },
        'nav.about': { en: 'About', ar: 'حول' },
        'nav.chat': { en: 'Chat', ar: 'الشات' },
        'hero.badge': { en: '✨ Your Resource Center', ar: '✨ مركز الموارد الخاص بك' },
        'hero.subtitle': { en: 'Discover the best apps, tools, tutorials, and exclusive deals. All in one place.', ar: 'اكتشف أفضل التطبيقات والأدوات والشروحات والعروض الحصرية. كل شيء في مكان واحد.' },
        'hero.btn.explore': { en: 'Explore Posts', ar: 'استكشف المنشورات' },
        'hero.btn.deals': { en: 'View Deals', ar: 'عرض العروض' },
        'section.featured': { en: 'Featured Post', ar: 'منشور مميز' },
        'section.latest': { en: 'Latest Posts', ar: 'أحدث المنشورات' },
        'section.categories': { en: 'Browse Categories', ar: 'تصفح التصنيفات' },
        'section.viewAll': { en: 'View All', ar: 'عرض الكل' },
        'post.views': { en: 'views', ar: 'مشاهدة' },
        'post.readingTime': { en: 'min read', ar: 'دقيقة قراءة' },
        'post.related': { en: 'Related Posts', ar: 'منشورات ذات صلة' },
        'post.share': { en: 'Share', ar: 'مشاركة' },
        'post.notFound': { en: 'Post not found', ar: 'المنشور غير موجود' },
        'post.toc': { en: 'Table of Contents', ar: 'جدول المحتويات' },
        'post.free': { en: 'FREE', ar: 'مجاني' },
        'affiliate.disclosure.title': { en: 'Affiliate Disclosure', ar: 'إفصاح الأفلييت' },
        'affiliate.disclosure.text': { en: 'This post contains affiliate links. We may earn a commission at no extra cost.', ar: 'يحتوي على روابط أفلييت. قد نحصل على عمولة دون تكلفة إضافية.' },
        'affiliate.sponsored': { en: 'Sponsored', ar: 'إعلان' },
        'affiliate.visit': { en: 'Visit', ar: 'زيارة' },
        'comments.title': { en: 'Comments', ar: 'التعليقات' },
        'comments.name': { en: 'Your Name', ar: 'اسمك' },
        'comments.email': { en: 'Your Email', ar: 'بريدك الإلكتروني' },
        'comments.content': { en: 'Write your comment...', ar: 'اكتب تعليقك...' },
        'comments.submit': { en: 'Post Comment', ar: 'إرسال التعليق' },
        'comments.reply': { en: 'Reply', ar: 'رد' },
        'comments.empty': { en: 'No comments yet. Be the first!', ar: 'لا تعليقات بعد. كن الأول!' },
        'comments.sort.latest': { en: 'Latest', ar: 'الأحدث' },
        'comments.sort.oldest': { en: 'Oldest', ar: 'الأقدم' },
        'comments.sort.liked': { en: 'Most Liked', ar: 'الأكثر إعجاباً' },
        'comments.success': { en: 'Comment posted!', ar: 'تم نشر التعليق!' },
        'comments.rateLimit': { en: 'Too many comments. Wait a minute.', ar: 'تعليقات كثيرة. انتظر دقيقة.' },
        'comments.fillAll': { en: 'Please fill all fields correctly.', ar: 'املأ الحقول بشكل صحيح.' },
        'comments.liked': { en: 'Liked!', ar: 'تم الإعجاب!' },
        'search.empty': { en: 'Start typing to see results...', ar: 'ابدأ الكتابة...' },
        'search.noResults': { en: 'No results for', ar: 'لا نتائج لـ' },
        'search.results': { en: 'results', ar: 'نتائج' },
        'newsletter.success': { en: 'Subscribed!', ar: 'تم الاشتراك!' },
        'newsletter.error': { en: 'Invalid email.', ar: 'بريد غير صحيح.' },
        'toast.copied': { en: 'Copied!', ar: 'تم النسخ!' },
        'toast.error': { en: 'Something went wrong.', ar: 'حدث خطأ.' },
        'btn.readMore': { en: 'Read More', ar: 'اقرأ المزيد' },
        'btn.backHome': { en: 'Back to Home', ar: 'العودة' },
        'categories.posts': { en: 'posts', ar: 'منشور' },
        'deals.subtitle': { en: 'Exclusive deals on tools and services', ar: 'عروض حصرية على الأدوات والخدمات' },
        'about.text': { en: 'Kenven Hub is your resource center for apps, tools, tutorials, and deals.', ar: 'Kenven Hub مركزك الشامل للتطبيقات والأدوات والشروحات والعروض.' },
        'empty.posts': { en: 'No posts yet.', ar: 'لا منشورات.' },
        'coins.coins': { en: 'Coins', ar: 'كوينز' },
        'coins.guest': { en: 'Guest Wallet', ar: 'محفظة زائر' },
        'coins.member': { en: 'Member Wallet', ar: 'محفظة عضو' },
        'coins.claimed': { en: 'Coins added!', ar: 'تمت الإضافة!' },
        'coins.dailyDone': { en: 'Already claimed today. Come back tomorrow!', ar: 'تم استلام هدية اليوم. عد غداً!' },
        'coins.adWait': { en: 'Wait', ar: 'انتظر' },
        'coins.adOpen': { en: 'Ad opened! Claiming in', ar: 'الاستلام بعد' },
        'coins.adSec': { en: 's', ar: 'ث' },
        'coins.invalidCode': { en: 'Invalid or used code.', ar: 'كود غير صالح.' },
        'coins.codeSuccess': { en: 'Code redeemed!', ar: 'تم التفعيل!' },
        'coins.restored': { en: 'Wallet restored! New code issued.', ar: 'تم الاسترجاع! كود جديد مُصدر.' },
        'coins.restoreFail': { en: 'Recovery code not found or already transferred.', ar: 'كود الاسترجاع غير موجود أو منقول.' },
        'coins.copied': { en: 'Recovery code copied! Keep it safe.', ar: 'تم النسخ! احتفظ به.' },
        'coins.notEnough': { en: 'Not enough coins.', ar: 'كوينز غير كافية.' },
        'coins.unlocked': { en: 'Post unlocked!', ar: 'تم الفتح!' },
        'coins.offline': { en: 'Offline - try later', ar: 'بدون اتصال - حاول لاحقاً' },
        'coins.sameWallet': { en: 'Same wallet', ar: 'نفس المحفظة' },
        'coins.transferred': { en: 'Your wallet was transferred. New wallet created.', ar: 'تم نقل محفظتك. محفظة جديدة.' },
        'paywall.title': { en: 'Premium Content', ar: 'محتوى مميز' },
        'paywall.text': { en: 'Unlock with coins or earn for free.', ar: 'افتحه بالكوينز أو اربح مجاناً.' },
        'paywall.unlock': { en: 'Unlock for', ar: 'افتح مقابل' },
        'paywall.earn': { en: '+ Earn Coins', ar: '+ اربح كوينز' },
        'paywall.balance': { en: 'Your balance', ar: 'رصيدك' },
        'auth.registerOk': { en: 'Account created!', ar: 'تم إنشاء الحساب!' },
        'auth.loginOk': { en: 'Welcome back!', ar: 'مرحباً بعودتك!' },
        'auth.error': { en: 'Auth failed. Check email/password.', ar: 'فشل الدخول.' },
        'auth.unavailable': { en: 'Firebase not available', ar: 'Firebase غير متاح' },
        'auth.createAccount': { en: 'Create Account', ar: 'إنشاء حساب' },
        'auth.login': { en: 'Login', ar: 'دخول' },
        'theme.light': { en: 'Light mode', ar: 'وضع نهاري' },
        'theme.dark': { en: 'Dark mode', ar: 'وضع ليلي' },
        'chat.title': { en: 'Public Chat', ar: 'الشات العام' },
        'chat.placeholder': { en: 'Type your message...', ar: 'اكتب رسالتك...' },
        'chat.send': { en: 'Send', ar: 'إرسال' },
        'chat.empty': { en: 'No messages yet. Say hello!', ar: 'لا رسائل بعد. قل مرحباً!' },
        'profile.title': { en: 'My Profile', ar: 'ملفي الشخصي' },
        'profile.login': { en: 'Login to see your profile', ar: 'سجّل الدخول لعرض ملفك' },
        'profile.postsRead': { en: 'Posts Read', ar: 'منشورات مقروءة' },
        'profile.comments': { en: 'Comments', ar: 'التعليقات' },
        'profile.coinsEarned': { en: 'Total Earned', ar: 'إجمالي المكتسب' },
        'profile.rank': { en: 'Your Rank', ar: 'رتبتك' },
        'leaderboard.title': { en: 'Leaderboard', ar: 'المتصدرون' },
        'transfer.title': { en: 'Transfer Coins', ar: 'تحويل الكوينز' },
        'transfer.to': { en: 'Recipient wallet code', ar: 'كود محفظة المستلم' },
        'transfer.amount': { en: 'Amount', ar: 'الكمية' },
        'transfer.send': { en: 'Send', ar: 'أرسل' },
        'transfer.success': { en: 'Transfer successful!', ar: 'تم التحويل بنجاح!' },
        'reading.progress': { en: 'Reading progress', ar: 'تقدم القراءة' },
        'reading.saved': { en: 'Bookmark saved!', ar: 'تم حفظ العلامة!' },
        'rewards.title': { en: 'Rewards & Coupons', ar: 'المكافآت والكوبونات' },
        'rewards.empty': { en: 'No coupons available right now.', ar: 'لا كوبونات متاحة حالياً.' }
    },
    init() {
        this.lang = LS.get(CONFIG.keys.lang) || (navigator.language.startsWith('ar') ? 'ar' : 'en');
        this.apply();
    },
    t(k) {
        const e = this.tr[k];
        return e ? (e[this.lang] || e.en) : k;
    },
    toggle() {
        this.lang = this.lang === 'en' ? 'ar' : 'en';
        LS.set(CONFIG.keys.lang, this.lang);
        this.apply();
        Router.renderCurrent();
    },
    apply() {
        const rtl = this.lang === 'ar';
        document.documentElement.lang = this.lang;
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
        const lt = document.querySelector('#lang-switcher .lang-text');
        if (lt) lt.textContent = this.lang === 'en' ? 'AR' : 'EN';
        document.querySelectorAll('[data-en]').forEach(el => {
            const v = el.getAttribute('data-' + this.lang);
            if (v) el.textContent = v;
        });
        document.querySelectorAll('[data-en-placeholder]').forEach(el => {
            const v = el.getAttribute('data-' + this.lang + '-placeholder');
            if (v) el.placeholder = v;
        });
    }
};

// ==================== 6. THEME ====================
const Theme = {
    current: 'dark',
    init() {
        this.current = LS.get(CONFIG.keys.theme, 'dark');
        this.apply(false);
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggle());
    },
    apply(save = true) {
        document.body.classList.toggle('light-theme', this.current === 'light');
        const i = document.querySelector('#theme-toggle i');
        if (i) i.className = this.current === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        if (save) LS.set(CONFIG.keys.theme, this.current);
    },
    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        this.apply();
        UI.showToast(I18n.t(this.current === 'light' ? 'theme.light' : 'theme.dark'), 'info');
    }
};

// ==================== 7. UI ====================
const UI = {
    hideLoader() {
        const l = document.getElementById('loader');
        if (l) { l.classList.add('hidden'); setTimeout(() => l.style.display = 'none', 600); }
    },
    showToast(msg, type = 'info', dur = 3000) {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.innerHTML = '<i class="fas ' + icons[type] + ' toast-icon"></i><span class="toast-message">' + Utils.escapeHtml(msg) + '</span>';
        c.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, dur);
    },
    openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; } },
    closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('open'); document.body.style.overflow = ''; } },
    closeAll() { document.querySelectorAll('.modal.open').forEach(m => this.closeModal(m.id)); }
};

// ==================== 8. EFFECTS ====================
const Effects = {
    enabled: true, raf: null, particles: [],
    init() {
        this.enabled = LS.get(CONFIG.keys.effects, true) !== false;
        this.apply();
        this.initScroll();
    },
    apply() {
        document.body.classList.toggle('effects-disabled', !this.enabled);
        document.getElementById('effects-toggle')?.classList.toggle('active', this.enabled);
        if (this.enabled) { this.initCursor(); this.initParticles(); }
        else { this.stopParticles(); document.body.style.cursor = ''; }
    },
    toggle() {
        this.enabled = !this.enabled;
        LS.set(CONFIG.keys.effects, this.enabled);
        this.apply();
    },
    initCursor() {
        const d = document.getElementById('cursor-dot'), r = document.getElementById('cursor-ring');
        if (!d || !r || !matchMedia('(hover: hover)').matches) return;
        document.body.style.cursor = 'none';
        document.addEventListener('mousemove', (e) => {
            d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
            r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
        });
        document.addEventListener('mouseover', (e) => {
            r.classList.toggle('hover', !!e.target.closest('a, button, input, textarea, [role="button"]'));
        });
    },
    initParticles() {
        this.stopParticles();
        const c = document.getElementById('particles-canvas');
        if (!c) return;
        const ctx = c.getContext('2d');
        const resize = () => { c.width = innerWidth; c.height = innerHeight; };
        resize();
        addEventListener('resize', Utils.debounce(resize, 200));
        const n = Math.min(45, Math.floor(innerWidth / 30));
        this.particles = Array.from({ length: n }, () => ({
            x: Math.random() * c.width, y: Math.random() * c.height,
            s: Math.random() * 2 + 1, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
            o: Math.random() * .4 + .15
        }));
        const draw = () => {
            if (!this.enabled) return;
            ctx.clearRect(0, 0, c.width, c.height);
            const rgb = document.body.classList.contains('light-theme') ? '46,123,255' : '91,159,255';
            this.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
                if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + rgb + ',' + p.o + ')'; ctx.fill();
            });
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const a = this.particles[i], b = this.particles[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < 100) {
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.1 * (1 - d / 100)) + ')';
                        ctx.lineWidth = .5; ctx.stroke();
                    }
                }
            }
            this.raf = requestAnimationFrame(draw);
        };
        draw();
    },
    stopParticles() { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; } },
    initScroll() {
        const bar = document.querySelector('.scroll-progress-bar');
        const btn = document.getElementById('back-to-top');
        addEventListener('scroll', Utils.debounce(() => {
            if (bar) {
                const h = document.documentElement.scrollHeight - innerHeight;
                bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
            }
            if (btn) btn.classList.toggle('visible', scrollY > 300);
        }, 10));
        btn?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    },
    reveal() {
        const obs = new IntersectionObserver(es => {
            es.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
        }, { threshold: 0.08 });
        document.querySelectorAll('.reveal:not(.active)').forEach(el => obs.observe(el));
    }
};

// ==================== 9. DATA LAYER ====================
const Data = {
    posts: [],
    categories: [
        { id: 'apps', slug: 'apps', name: { en: 'Apps & Tools', ar: 'تطبيقات وأدوات' }, icon: 'fa-mobile-screen', color: '#5B9FFF' },
        { id: 'websites', slug: 'websites', name: { en: 'Websites', ar: 'مواقع' }, icon: 'fa-globe', color: '#8B5CF6' },
        { id: 'activation', slug: 'activation', name: { en: 'Activation', ar: 'تفعيل' }, icon: 'fa-key', color: '#00FF9D' },
        { id: 'fixes', slug: 'fixes', name: { en: 'Fixes & Tutorials', ar: 'إصلاحات وشروحات' }, icon: 'fa-screwdriver-wrench', color: '#FFE600' },
        { id: 'deals', slug: 'deals', name: { en: 'Deals & Offers', ar: 'عروض وخصومات' }, icon: 'fa-tag', color: '#FF2E63' },
        { id: 'guides', slug: 'guides', name: { en: 'Guides', ar: 'أدلة' }, icon: 'fa-book', color: '#5B9FFF' }
    ],
    affiliate: [],
    settings: { ...CONFIG.defaultSettings },
    async load() {
        if (FB.ok) {
            try {
                const [pSnap, aSnap, sDoc] = await Promise.all([
                    FB.db.collection('posts').where('status', '==', 'published').get(),
                    FB.db.collection('affiliate_links').get(),
                    FB.db.collection('settings').doc('site').get()
                ]);
                const now = Date.now();
                this.posts = pSnap.docs.map(d => d.data()).filter(p => !p.publishAt || p.publishAt <= now);
                this.affiliate = aSnap.docs.map(d => d.data()).filter(a => a.active !== false);
                if (sDoc.exists) this.settings = { ...CONFIG.defaultSettings, ...sDoc.data() };
                LS.set(CONFIG.keys.cachePosts, this.posts);
                LS.set(CONFIG.keys.cacheAff, this.affiliate);
                return;
            } catch (e) { console.warn('Firestore load failed, using cache:', e); }
        }
        this.posts = LS.get(CONFIG.keys.cachePosts, []);
        this.affiliate = LS.get(CONFIG.keys.cacheAff, []);
    },
    published() { return this.posts.filter(p => p.status === 'published'); },
    bySlug(s) { return this.posts.find(p => p.slug === s); },
    byCategory(s) { return this.published().filter(p => p.category === s); },
    featured() { return this.published().find(p => p.featured); },
    latest(n) { return [...this.published()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, n); },
    related(p, n = 3) { return this.published().filter(x => x.id !== p.id && x.category === p.category).slice(0, n); },
    catById(i) { return this.categories.find(c => c.id === i); },
    catBySlug(s) { return this.categories.find(c => c.slug === s); },
    async addView(pid) {
        this.posts.forEach(p => { if (p.id === pid) p.views = (p.views || 0) + 1; });
        if (FB.ok) {
            try { await FB.db.collection('posts').doc(pid).update({ views: firebase.firestore.FieldValue.increment(1) }); } catch (e) {}
        }
    },
    search(q, c = 'all') {
        const l = q.toLowerCase();
        return this.published().filter(p => {
            const ok = c === 'all' || p.category === c;
            const h = [p.title?.en || '', p.title?.ar || '', p.excerpt?.en || '', p.excerpt?.ar || '', (p.tags || []).join(' ')].join(' ').toLowerCase();
            return ok && h.includes(l);
        });
    }
};

// ==================== 10. MIRROR STORAGE ====================
const Mirror = {
    async writeWallet(wallet) {
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        mirror[wallet.id] = wallet;
        LS.set(CONFIG.keys.mirror, mirror);
        if (FB.ok) {
            try {
                await FB.db.collection('wallets').doc(wallet.id).set(wallet, { merge: true });
                return { ok: true, source: 'cloud' };
            } catch (e) { console.warn('Cloud write failed, mirror used:', e); return { ok: false, source: 'mirror', error: e.message }; }
        }
        return { ok: false, source: 'mirror' };
    },
    async readWallet(id) {
        if (FB.ok) {
            try {
                const snap = await FB.db.collection('wallets').doc(id).get();
                if (snap.exists) {
                    const data = snap.data();
                    const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
                    mirror[id] = data;
                    LS.set(CONFIG.keys.mirror, mirror);
                    return data;
                }
            } catch (e) { console.warn('Cloud read failed, using mirror:', e); }
        }
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        return mirror[id] || null;
    },
    async createWallet(wallet) {
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        mirror[wallet.id] = wallet;
        LS.set(CONFIG.keys.mirror, mirror);
        if (FB.ok) {
            try { await FB.db.collection('wallets').doc(wallet.id).set(wallet); return { ok: true }; }
            catch (e) { console.warn('Cloud create failed:', e); return { ok: false, error: e.message }; }
        }
        return { ok: false };
    },
    async markTransferred(id) {
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        mirror[id] = { transferred: true, id: id };
        LS.set(CONFIG.keys.mirror, mirror);
        if (FB.ok) {
            try { await FB.db.collection('wallets').doc(id).update({ transferred: true, balance: 0, unlockedPosts: [], ownerUid: null }); } catch (e) {}
        }
    }
};

// ==================== 11. COINS SYSTEM ====================
const Coins = {
    wallet: null, adTimer: null,
    getMeta() {
        let m = LS.get(CONFIG.keys.walletMeta);
        if (!m) { m = { id: Utils.genRecoveryCode(), isGuest: true }; LS.set(CONFIG.keys.walletMeta, m); }
        return m;
    },
    setMeta(m) { LS.set(CONFIG.keys.walletMeta, m); },
    getUidMap() { return LS.get(CONFIG.keys.uidMap, {}) || {}; },
    setUidMap(uid, wid) {
        const m = this.getUidMap();
        m[uid] = wid;
        LS.set(CONFIG.keys.uidMap, m);
    },
    async init() {
        await FB.waitForAuth();
        if (FB.user) {
            const map = this.getUidMap();
            if (map[FB.user.uid]) {
                const w = await Mirror.readWallet(map[FB.user.uid]);
                if (w && !w.transferred) {
                    this.wallet = w;
                    this.setMeta({ id: w.id, isGuest: false });
                    this.bindUI(); this.updateUI();
                    return;
                }
            }
        }
        const meta = this.getMeta();
        let w = await Mirror.readWallet(meta.id);
        if (!w) {
            w = { id: meta.id, balance: 0, unlockedPosts: [], recoveryCode: meta.id, ownerUid: FB.user ? FB.user.uid : null, createdAt: Date.now(), transferred: false, totalEarned: 0 };
            await Mirror.createWallet(w);
        }
        if (w.transferred) {
            const newId = Utils.genRecoveryCode();
            w = { id: newId, balance: 0, unlockedPosts: [], recoveryCode: newId, ownerUid: FB.user ? FB.user.uid : null, createdAt: Date.now(), transferred: false, totalEarned: 0 };
            await Mirror.createWallet(w);
            this.setMeta({ id: newId, isGuest: !FB.user });
            UI.showToast(I18n.t('coins.transferred'), 'warning');
        }
        this.wallet = w;
        if (FB.user && !w.ownerUid) {
            w.ownerUid = FB.user.uid;
            await Mirror.writeWallet(w);
            this.setUidMap(FB.user.uid, w.id);
            this.setMeta({ id: w.id, isGuest: false });
        }
        this.bindUI(); this.updateUI();
    },
    async onAuthChange(user) {
        if (!this.wallet) return;
        if (user) {
            const map = this.getUidMap();
            if (!map[user.uid]) {
                this.wallet.ownerUid = user.uid;
                await Mirror.writeWallet(this.wallet);
                this.setUidMap(user.uid, this.wallet.id);
                this.setMeta({ id: this.wallet.id, isGuest: false });
            } else if (map[user.uid] !== this.wallet.id) {
                const w = await Mirror.readWallet(map[user.uid]);
                if (w && !w.transferred) { this.wallet = w; this.setMeta({ id: w.id, isGuest: false }); }
            }
        }
        this.updateUI();
    },
    updateUI() {
        const b = this.wallet ? (this.wallet.balance || 0) : 0;
        const nav = document.getElementById('coin-balance');
        const modal = document.getElementById('coins-balance-display');
        if (nav) nav.textContent = b;
        if (modal) modal.textContent = b;
        const mode = document.getElementById('wallet-mode-text');
        if (mode) mode.textContent = this.wallet && this.wallet.ownerUid ? I18n.t('coins.member') : I18n.t('coins.guest');
        const rc = document.getElementById('recovery-code-display');
        if (rc) rc.textContent = this.wallet ? this.wallet.id : '---';
    },
    isUnlocked(pid) { return this.wallet && (this.wallet.unlockedPosts || []).includes(pid); },
    getRank() {
        const total = this.wallet ? (this.wallet.totalEarned || 0) : 0;
        return Utils.getRank(total);
    },
    getDailyGiftAmount() {
        const rank = this.getRank();
        return rank.dailyGift || Data.settings.dailyGiftAmount || 1;
    },
    async addCoins(amount) {
        if (!this.wallet) return;
        this.wallet.balance = (this.wallet.balance || 0) + amount;
        this.wallet.totalEarned = (this.wallet.totalEarned || 0) + amount;
        await Mirror.writeWallet(this.wallet);
        this.updateUI();
        Achievements.check();
    },
    bindUI() {
        document.getElementById('coins-btn')?.addEventListener('click', () => { UI.openModal('coins-modal'); this.updateUI(); });
        document.getElementById('coins-close')?.addEventListener('click', () => UI.closeModal('coins-modal'));
        document.getElementById('copy-recovery-btn')?.addEventListener('click', async () => {
            if (await Utils.copy(this.wallet.id)) UI.showToast(I18n.t('coins.copied'), 'success');
        });
        document.getElementById('restore-code-btn')?.addEventListener('click', () => this.restore());
        document.getElementById('daily-gift-btn')?.addEventListener('click', () => this.dailyGift());
        document.getElementById('ad-earn-btn')?.addEventListener('click', () => this.adEarn());
        document.getElementById('redeem-code-btn')?.addEventListener('click', () => this.redeem());
        const wa = document.getElementById('whatsapp-link');
        if (wa) wa.href = 'https://wa.me/' + (Data.settings.whatsappNumber || CONFIG.site.whatsapp);
        document.getElementById('open-auth-btn')?.addEventListener('click', () => {
            UI.closeModal('coins-modal');
            UI.openModal('auth-modal');
        });
    },
    async dailyGift() {
        if (!Data.settings.enableDailyGift || !this.wallet) return;
        const today = Utils.todayStr();
        if (this.wallet.lastDailyGift === today) { UI.showToast(I18n.t('coins.dailyDone'), 'warning'); return; }
        this.wallet.lastDailyGift = today;
        await Mirror.writeWallet(this.wallet);
        const amount = this.getDailyGiftAmount();
        await this.addCoins(amount);
        UI.showToast('+' + amount + ' ' + I18n.t('coins.coins') + ' 🎁', 'success');
    },
    adEarn() {
        if (!Data.settings.enableAd || this.adTimer) return;
        const wait = Data.settings.adWaitSeconds || 30;
        open(Data.settings.adUrl || CONFIG.site.website, '_blank');
        let left = wait;
        const txt = document.getElementById('ad-timer-text');
        const btn = document.getElementById('ad-earn-btn');
        if (btn) btn.disabled = true;
        UI.showToast(I18n.t('coins.adOpen') + ' ' + left + I18n.t('coins.adSec'), 'info');
        this.adTimer = setInterval(async () => {
            left--;
            if (txt) txt.textContent = I18n.t('coins.adWait') + ': ' + left + I18n.t('coins.adSec');
            if (left <= 0) {
                clearInterval(this.adTimer); this.adTimer = null;
                if (btn) btn.disabled = false;
                if (txt) txt.textContent = '';
                await this.addCoins(Data.settings.adRewardAmount || 5);
                UI.showToast('+' + (Data.settings.adRewardAmount || 5) + ' ' + I18n.t('coins.coins') + ' 🎉', 'success');
            }
        }, 1000);
    },
    async redeem() {
        if (!Data.settings.enableCodes) return;
        const input = document.getElementById('coin-code-input');
        const code = (input.value || '').trim().toUpperCase();
        if (!code) return;
        if (!FB.ok) { UI.showToast(I18n.t('coins.offline'), 'warning'); return; }
        try {
            const snap = await FB.db.collection('coin_codes').doc(code).get();
            if (!snap.exists) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); return; }
            const c = snap.data();
            if (!c.active || (c.maxUses > 0 && c.usedCount >= c.maxUses)) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); return; }
            await FB.db.collection('coin_codes').doc(code).update({ usedCount: (c.usedCount || 0) + 1 });
            await this.addCoins(c.amount || 0);
            input.value = '';
            UI.showToast('+' + c.amount + ' ' + I18n.t('coins.codeSuccess'), 'success');
        } catch (e) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); }
    },
    async restore() {
        const input = document.getElementById('restore-code-input');
        const code = (input.value || '').trim().toUpperCase();
        if (!code || !this.wallet) return;
        if (code === this.wallet.id) { UI.showToast(I18n.t('coins.sameWallet'), 'warning'); return; }
        if (!FB.ok) { UI.showToast(I18n.t('coins.offline'), 'warning'); return; }
        try {
            const oldSnap = await FB.db.collection('wallets').doc(code).get();
            if (!oldSnap.exists) { UI.showToast(I18n.t('coins.restoreFail'), 'error'); return; }
            const old = oldSnap.data();
            if (old.transferred) { UI.showToast(I18n.t('coins.restoreFail'), 'error'); return; }
            this.wallet.balance = (this.wallet.balance || 0) + (old.balance || 0);
            this.wallet.totalEarned = (this.wallet.totalEarned || 0) + (old.totalEarned || 0);
            const merged = [...new Set([...(this.wallet.unlockedPosts || []), ...(old.unlockedPosts || [])])];
            this.wallet.unlockedPosts = merged;
            const newId = Utils.genRecoveryCode();
            const newWallet = {
                id: newId, balance: this.wallet.balance, unlockedPosts: this.wallet.unlockedPosts,
                recoveryCode: newId, ownerUid: this.wallet.ownerUid || null, createdAt: Date.now(),
                transferred: false, lastDailyGift: this.wallet.lastDailyGift || null,
                totalEarned: this.wallet.totalEarned || 0
            };
            await Mirror.createWallet(newWallet);
            await Mirror.markTransferred(code);
            const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
            delete mirror[code];
            LS.set(CONFIG.keys.mirror, mirror);
            this.wallet = newWallet;
            this.setMeta({ id: newId, isGuest: !this.wallet.ownerUid });
            if (newWallet.ownerUid) this.setUidMap(newWallet.ownerUid, newId);
            input.value = '';
            this.updateUI();
            UI.showToast(I18n.t('coins.restored') + ' ' + newId, 'success', 5000);
        } catch (e) {
            console.error('Restore error:', e);
            UI.showToast(I18n.t('coins.restoreFail'), 'error');
        }
    },
    async unlockPost(post) {
        const price = post.coinPrice || 0;
        if (!this.wallet || (this.wallet.balance || 0) < price) {
            UI.showToast(I18n.t('coins.notEnough'), 'warning');
            UI.openModal('coins-modal');
            return false;
        }
        this.wallet.balance = (this.wallet.balance || 0) - price;
        this.wallet.unlockedPosts = [...new Set([...(this.wallet.unlockedPosts || []), post.id])];
        await Mirror.writeWallet(this.wallet);
        this.updateUI();
        return true;
    },
    async transferCoins(toCode, amount) {
        if (!this.wallet || amount <= 0) return false;
        if ((this.wallet.balance || 0) < amount) {
            UI.showToast(I18n.t('coins.notEnough'), 'warning');
            return false;
        }
        if (toCode === this.wallet.id) {
            UI.showToast(I18n.t('coins.sameWallet'), 'warning');
            return false;
        }
        if (!FB.ok) { UI.showToast(I18n.t('coins.offline'), 'warning'); return false; }
        try {
            const targetSnap = await FB.db.collection('wallets').doc(toCode).get();
            if (!targetSnap.exists) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); return false; }
            const target = targetSnap.data();
            if (target.transferred) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); return false; }
            this.wallet.balance -= amount;
            await Mirror.writeWallet(this.wallet);
            await FB.db.collection('wallets').doc(toCode).update({
                balance: firebase.firestore.FieldValue.increment(amount),
                totalEarned: firebase.firestore.FieldValue.increment(amount)
            });
            if (FB.ok) {
                try {
                    await FB.db.collection('coin_transfers').add({
                        fromWallet: this.wallet.id, toWallet: toCode, amount: amount,
                        fromUid: this.wallet.ownerUid || null, at: Date.now()
                    });
                } catch (e) {}
            }
            this.updateUI();
            return true;
        } catch (e) {
            console.error('Transfer error:', e);
            UI.showToast(I18n.t('toast.error'), 'error');
            return false;
        }
    }
};

// ==================== 12. USER AUTH ====================
const UserAuth = {
    mode: 'register',
    init() {
        document.getElementById('auth-close')?.addEventListener('click', () => UI.closeModal('auth-modal'));
        document.getElementById('auth-register-tab')?.addEventListener('click', () => this.setMode('register'));
        document.getElementById('auth-login-tab')?.addEventListener('click', () => this.setMode('login'));
        document.getElementById('auth-form')?.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
        document.getElementById('profile-btn')?.addEventListener('click', () => {
            if (FB.user) { UI.openModal('profile-modal'); Profile.render(); }
            else UI.openModal('auth-modal');
        });
    },
    setMode(m) {
        this.mode = m;
        document.getElementById('auth-register-tab')?.classList.toggle('active', m === 'register');
        document.getElementById('auth-login-tab')?.classList.toggle('active', m === 'login');
        const ng = document.getElementById('auth-name-group');
        if (ng) ng.style.display = m === 'register' ? 'block' : 'none';
        const t = document.getElementById('auth-title');
        const s = document.querySelector('#auth-submit span');
        const label = m === 'register' ? I18n.t('auth.createAccount') : I18n.t('auth.login');
        if (t) t.textContent = label;
        if (s) s.textContent = label;
        const err = document.getElementById('auth-error');
        if (err) err.style.display = 'none';
    },
    async submit() {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-password').value;
        const name = (document.getElementById('auth-name').value || '').trim();
        const err = document.getElementById('auth-error');
        if (!FB.ok) { err.textContent = I18n.t('auth.unavailable'); err.style.display = 'block'; return; }
        try {
            if (this.mode === 'register') {
                const cred = await FB.auth.createUserWithEmailAndPassword(email, pass);
                if (name) await cred.user.updateProfile({ displayName: name });
                try {
                    await FB.db.collection('users').doc(cred.user.uid).set({
                        email, name: name || 'User', role: 'user', createdAt: Date.now(),
                        totalEarned: 0, bookmarks: [], postsRead: 0
                    });
                } catch (e) {}
                UI.closeModal('auth-modal');
                UI.showToast(I18n.t('auth.registerOk'), 'success');
            } else {
                await FB.auth.signInWithEmailAndPassword(email, pass);
                UI.closeModal('auth-modal');
                UI.showToast(I18n.t('auth.loginOk'), 'success');
            }
        } catch (e) {
            err.textContent = I18n.t('auth.error');
            err.style.display = 'block';
        }
    },
    async logout() {
        if (FB.ok) {
            await FB.auth.signOut();
            location.reload();
        }
    }
};

// ==================== 13. COMMENTS ====================
const Comments = {
    sort: 'latest',
    async load(pid) {
        if (FB.ok) {
            try {
                const s = await FB.db.collection('comments').where('postId', '==', pid).where('approved', '==', true).get();
                return s.docs.map(d => d.data());
            } catch (e) {}
        }
        return [];
    },
    render(pid, list) {
        const s = this.sortList(list);
        const t = s.filter(c => !c.parentId);
        const b = document.getElementById('comments-list');
        if (b) {
            b.innerHTML = t.length
                ? t.map(c => this.one(c, s, 0)).join('')
                : '<div class="empty-state"><p>' + I18n.t('comments.empty') + '</p></div>';
        }
        this.bind();
    },
    one(c, all, d) {
        const r = all.filter(x => x.parentId === c.id);
        const rankBadge = c.userRank ? '<span class="rank-badge ' + c.userRank + '">' + c.userRank.toUpperCase() + '</span>' : '';
        return '<div class="comment">' +
            '<div class="comment-card ' + (c.isAdmin ? 'admin-comment' : '') + '">' +
            '<div class="comment-header"><div class="comment-avatar">' +
            (c.userAvatar ? '<img src="' + Utils.escapeHtml(c.userAvatar) + '" alt="">' : Utils.escapeHtml((c.authorName || '?').charAt(0).toUpperCase())) +
            '</div><div><div class="comment-author">' + Utils.escapeHtml(c.authorName || '') + rankBadge +
            (c.isAdmin ? ' <span class="badge badge-neon">Admin</span>' : '') +
            '</div><div class="comment-date">' + Utils.formatDate(c.createdAt, I18n.lang) + '</div></div></div>' +
            '<div class="comment-content">' + Utils.escapeHtml(c.content || '') + '</div>' +
            '<div class="comment-actions">' +
            '<button class="comment-like-btn" data-id="' + c.id + '"><i class="fas fa-heart"></i> <span>' + (c.likes || 0) + '</span></button>' +
            (d < 2 ? '<button class="comment-reply-btn" data-id="' + c.id + '"><i class="fas fa-reply"></i> ' + I18n.t('comments.reply') + '</button>' : '') +
            '</div></div>' +
            (r.length ? '<div class="comment-replies">' + r.map(x => this.one(x, all, d + 1)).join('') + '</div>' : '') +
            '</div>';
    },
    sortList(l) {
        const s = [...l];
        if (this.sort === 'oldest') s.sort((a, b) => a.createdAt - b.createdAt);
        else if (this.sort === 'liked') s.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        else s.sort((a, b) => b.createdAt - a.createdAt);
        return s;
    },
    bind() {
        document.querySelectorAll('.comment-like-btn').forEach(b => {
            b.onclick = e => this.like(e.currentTarget.dataset.id, e.currentTarget);
        });
        document.querySelectorAll('.comment-reply-btn').forEach(b => {
            b.onclick = e => this.replyForm(e.currentTarget.dataset.id);
        });
    },
    async like(id, btn) {
        const l = LS.get(CONFIG.keys.likedComments, []);
        if (l.includes(id)) return;
        l.push(id);
        LS.set(CONFIG.keys.likedComments, l);
        if (FB.ok) {
            try { await FB.db.collection('comments').doc(id).update({ likes: firebase.firestore.FieldValue.increment(1) }); } catch (e) {}
        }
        const s = btn.querySelector('span');
        if (s) s.textContent = parseInt(s.textContent || 0) + 1;
        UI.showToast(I18n.t('comments.liked'), 'success');
    },
    replyForm(id) {
        const e = document.getElementById('rf-' + id);
        if (e) { e.remove(); return; }
        const h = '<div class="comment-form" id="rf-' + id + '" style="margin:var(--space-md) 0 0 var(--space-2xl);">' +
            '<input type="text" class="form-input rf-name" placeholder="' + I18n.t('comments.name') + '" style="margin-bottom:var(--space-sm);">' +
            '<input type="email" class="form-input rf-email" placeholder="' + I18n.t('comments.email') + '" style="margin-bottom:var(--space-sm);">' +
            '<textarea class="form-textarea rf-content" placeholder="' + I18n.t('comments.content') + '" style="margin-bottom:var(--space-sm);"></textarea>' +
            '<button class="btn btn-primary btn-sm rf-submit">' + I18n.t('comments.reply') + '</button></div>';
        document.querySelector('[data-id="' + id + '"].comment-reply-btn')?.closest('.comment-card')?.insertAdjacentHTML('beforeend', h);
        document.querySelector('#rf-' + id + ' .rf-submit').onclick = () => this.submit(window._currentPostId, id);
    },
    async submit(pid, parentId = null) {
        const px = parentId ? '#rf-' + parentId + ' ' : '#comment-form ';
        const n = document.querySelector(parentId ? px + '.rf-name' : '#comment-name');
        const e = document.querySelector(parentId ? px + '.rf-email' : '#comment-email');
        const c = document.querySelector(parentId ? px + '.rf-content' : '#comment-content');
        if (!n || !e || !c) return;
        let name = n.value.trim();
        let email = e.value.trim();
        const content = c.value.trim();
        const isLoggedIn = FB.user;
        if (isLoggedIn) {
            name = FB.user.displayName || FB.user.email.split('@')[0];
            email = FB.user.email;
        }
        if (!name || !content || !Utils.isValidEmail(email)) {
            UI.showToast(I18n.t('comments.fillAll'), 'error');
            return;
        }
        const times = LS.get(CONFIG.keys.commentTimes, []).filter(t => Date.now() - t < 60000);
        if (times.length >= 5) { UI.showToast(I18n.t('comments.rateLimit'), 'warning'); return; }
        times.push(Date.now());
        LS.set(CONFIG.keys.commentTimes, times);
        const rank = Coins.getRank();
        const cm = {
            id: Utils.genId(), postId: pid, authorName: name, authorEmail: email,
            content, parentId, isAdmin: false, approved: true, likes: 0,
            createdAt: Date.now(), userRank: rank.id,
            userAvatar: FB.user?.photoURL || null,
            userUid: FB.user?.uid || null
        };
        if (FB.ok) {
            try { await FB.db.collection('comments').doc(cm.id).set(cm); } catch (e) {}
        }
        UI.showToast(I18n.t('comments.success'), 'success');
        const list = await this.load(pid);
        this.render(pid, list);
        const f = document.getElementById('comment-form');
        if (f && !parentId) f.reset();
    }
};

// ==================== 14. CHAT SYSTEM ====================
const Chat = {
    messages: [],
    unsub: null,
    async init() {
        document.getElementById('chat-btn')?.addEventListener('click', () => {
            UI.openModal('chat-modal');
            this.load();
        });
        document.getElementById('chat-close')?.addEventListener('click', () => {
            UI.closeModal('chat-modal');
            this.unsubscribe();
        });
        document.getElementById('chat-send-btn')?.addEventListener('click', () => this.send());
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); this.send(); }
            });
            chatInput.addEventListener('input', () => {
                const len = chatInput.value.length;
                const counter = document.getElementById('chat-char-count');
                if (counter) {
                    counter.textContent = len + '/100';
                    counter.className = 'chat-char-count' + (len > 100 ? ' over' : '');
                }
            });
        }
    },
    async load() {
        if (!FB.ok) return;
        this.unsubscribe();
        const deleteDays = Data.settings.chatDeleteDays || 3;
        const cutoff = Date.now() - (deleteDays * 24 * 60 * 60 * 1000);
        try {
            this.unsub = FB.db.collection('chat')
                .where('createdAt', '>=', cutoff)
                .orderBy('createdAt', 'asc')
                .limit(100)
                .onSnapshot(snap => {
                    this.messages = snap.docs.map(d => d.data());
                    this.render();
                });
        } catch (e) { console.warn('Chat load failed:', e); }
    },
    unsubscribe() {
        if (this.unsub) { this.unsub(); this.unsub = null; }
    },
    render() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        if (!this.messages.length) {
            container.innerHTML = '<div class="chat-empty">' + I18n.t('chat.empty') + '</div>';
            return;
        }
        container.innerHTML = this.messages.map(m => {
            const rankBadge = m.userRank ? '<span class="rank-badge ' + m.userRank + ' chat-msg-rank">' + m.userRank.toUpperCase() + '</span>' : '';
            return '<div class="chat-message">' +
                '<div class="chat-msg-avatar">' + Utils.escapeHtml((m.authorName || '?').charAt(0).toUpperCase()) + '</div>' +
                '<div class="chat-msg-content">' +
                '<div class="chat-msg-header">' +
                '<span class="chat-msg-author">' + Utils.escapeHtml(m.authorName || 'Anonymous') + '</span>' +
                rankBadge +
                '<span class="chat-msg-time">' + Utils.timeAgo(m.createdAt) + '</span></div>' +
                '<div class="chat-msg-text">' + Utils.escapeHtml(m.content || '') + '</div></div></div>';
        }).join('');
        container.scrollTop = container.scrollHeight;
    },
    async send() {
        const input = document.getElementById('chat-input');
        const content = (input.value || '').trim();
        if (!content || content.length > 100) return;
        if (!FB.ok) { UI.showToast(I18n.t('coins.offline'), 'warning'); return; }
        const name = FB.user ? (FB.user.displayName || FB.user.email.split('@')[0]) : 'Guest';
        const rank = Coins.getRank();
        try {
            await FB.db.collection('chat').add({
                content: content,
                authorName: name,
                userRank: rank.id,
                createdAt: Date.now()
            });
            input.value = '';
            const counter = document.getElementById('chat-char-count');
            if (counter) { counter.textContent = '0/100'; counter.className = 'chat-char-count'; }
        } catch (e) {
            UI.showToast(I18n.t('toast.error'), 'error');
        }
    }
};

// ==================== 15. PROFILE ====================
const Profile = {
    render() {
        const container = document.getElementById('profile-content');
        if (!container) return;
        if (!FB.user) {
            container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);">' +
                '<i class="fas fa-user-circle" style="font-size:4rem;color:var(--text-muted);margin-bottom:var(--space-lg);"></i>' +
                '<p>' + I18n.t('profile.login') + '</p>' +
                '<button class="btn btn-primary" onclick="UI.closeModal(\'profile-modal\');UI.openModal(\'auth-modal\');">' + I18n.t('auth.login') + '</button></div>';
            return;
        }
        const rank = Coins.getRank();
        const bookmarks = LS.get(CONFIG.keys.bookmarks, []);
        const readProgress = LS.get(CONFIG.keys.readProgress, {});
        const postsRead = Object.keys(readProgress).length;
        const name = FB.user.displayName || FB.user.email.split('@')[0];
        const avatar = FB.user.photoURL;
        container.innerHTML =
            '<div style="text-align:center;">' +
            (avatar ? '<img src="' + Utils.escapeHtml(avatar) + '" class="profile-avatar-large" alt="">' :
                '<div class="profile-avatar-large" style="display:flex;align-items:center;justify-content:center;background:var(--card);">' + Utils.escapeHtml(name.charAt(0).toUpperCase()) + '</div>') +
            '<h3 style="margin:var(--space-md) 0 var(--space-xs);">' + Utils.escapeHtml(name) + '</h3>' +
            '<span class="rank-badge ' + rank.id + '">' + rank.icon + ' ' + rank.name[I18n.lang] + '</span>' +
            '<p style="color:var(--text-muted);font-size:.85rem;margin-top:var(--space-xs);">' + Utils.escapeHtml(FB.user.email) + '</p></div>' +
            '<div class="profile-stats-grid">' +
            '<div class="profile-stat"><div class="profile-stat-value">' + (Coins.wallet?.totalEarned || 0) + '</div><div class="profile-stat-label">' + I18n.t('profile.coinsEarned') + '</div></div>' +
            '<div class="profile-stat"><div class="profile-stat-value">' + postsRead + '</div><div class="profile-stat-label">' + I18n.t('profile.postsRead') + '</div></div>' +
            '<div class="profile-stat"><div class="profile-stat-value">' + bookmarks.length + '</div><div class="profile-stat-label">' + I18n.t('reading.saved') + '</div></div>' +
            '</div>' +
            '<div style="text-align:center;margin-top:var(--space-lg);">' +
            '<button class="btn btn-danger btn-sm" onclick="UserAuth.logout()"><i class="fas fa-sign-out-alt"></i> ' + I18n.t('auth.login') + ' → Logout</button></div>';
    }
};

// ==================== 16. READING PROGRESS ====================
const ReadingProgress = {
    init() {
        addEventListener('scroll', Utils.debounce(() => {
            const postId = window._currentPostId;
            if (!postId) return;
            const progress = Math.min(100, Math.round((scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100));
            const bar = document.getElementById('reading-progress-bar');
            if (bar) bar.style.width = progress + '%';
            const progressData = LS.get(CONFIG.keys.readProgress, {});
            progressData[postId] = Math.max(progress, progressData[postId] || 0);
            LS.set(CONFIG.keys.readProgress, progressData);
        }, 50));
    },
    saveBookmark(postId) {
        const bookmarks = LS.get(CONFIG.keys.bookmarks, []);
        if (!bookmarks.includes(postId)) {
            bookmarks.push(postId);
            LS.set(CONFIG.keys.bookmarks, bookmarks);
            UI.showToast(I18n.t('reading.saved'), 'success');
        }
    }
};

// ==================== 17. ACHIEVEMENTS ====================
const Achievements = {
    definitions: [
        { id: 'first_comment', name: { en: 'First Comment', ar: 'أول تعليق' }, icon: 'fa-comment', requirement: 1, type: 'comments' },
        { id: 'bookworm', name: { en: 'Bookworm', ar: 'قارئ نهم' }, icon: 'fa-book', requirement: 10, type: 'postsRead' },
        { id: 'rich', name: { en: 'Rich', ar: 'ثري' }, icon: 'fa-coins', requirement: 100, type: 'totalEarned' },
        { id: 'chatterbox', name: { en: 'Chatterbox', ar: 'ثرثار' }, icon: 'fa-comments', requirement: 10, type: 'comments' },
        { id: 'veteran', name: { en: 'Veteran', ar: 'مخضرم' }, icon: 'fa-medal', requirement: 500, type: 'totalEarned' }
    ],
    check() {
        const earned = LS.get(CONFIG.keys.achievements, []);
        let newAchievements = false;
        for (const a of this.definitions) {
            if (earned.includes(a.id)) continue;
            let value = 0;
            if (a.type === 'totalEarned') value = Coins.wallet?.totalEarned || 0;
            else if (a.type === 'postsRead') value = Object.keys(LS.get(CONFIG.keys.readProgress, {})).length;
            if (value >= a.requirement) {
                earned.push(a.id);
                newAchievements = true;
                UI.showToast('🏆 ' + a.name[I18n.lang] + '!', 'success');
            }
        }
        if (newAchievements) LS.set(CONFIG.keys.achievements, earned);
    }
};

// ==================== 18. LEADERBOARD ====================
const Leaderboard = {
    async render() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;
        if (!FB.ok) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">' + I18n.t('coins.offline') + '</p>';
            return;
        }
        try {
            const snap = await FB.db.collection('wallets')
                .where('transferred', '!=', true)
                .orderBy('totalEarned', 'desc')
                .limit(10)
                .get();
            const wallets = snap.docs.map(d => d.data());
            if (!wallets.length) {
                container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No data yet.</p>';
                return;
            }
            container.innerHTML = wallets.map((w, i) => {
                const rank = Utils.getRank(w.totalEarned || 0);
                const posClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
                const name = w.ownerUid ? 'Member' : 'Guest ' + w.id.slice(-4);
                return '<div class="leaderboard-item ' + posClass + '">' +
                    '<span class="leaderboard-rank">' + (i + 1) + '</span>' +
                    '<span class="leaderboard-avatar" style="background:var(--card);display:flex;align-items:center;justify-content:center;">' + name.charAt(0) + '</span>' +
                    '<div class="leaderboard-info"><div class="leaderboard-name">' + Utils.escapeHtml(name) + ' <span class="rank-badge ' + rank.id + '">' + rank.name[I18n.lang] + '</span></div></div>' +
                    '<span class="leaderboard-coins"><i class="fas fa-coins"></i> ' + (w.totalEarned || 0) + '</span></div>';
            }).join('');
        } catch (e) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Failed to load.</p>';
        }
    }
};

// ==================== 19. ONLINE USERS ====================
const OnlineUsers = {
    async update() {
        if (!FB.ok || !FB.user) return;
        try {
            await FB.db.collection('online_users').doc(FB.user.uid).set({
                uid: FB.user.uid,
                name: FB.user.displayName || 'User',
                lastSeen: Date.now(),
                isOnline: true
            });
        } catch (e) {}
    },
    async getCount() {
        const boost = Data.settings.onlineBoost || 0;
        if (!FB.ok) return boost;
        try {
            const cutoff = Date.now() - (5 * 60 * 1000);
            const snap = await FB.db.collection('online_users')
                .where('lastSeen', '>=', cutoff)
                .get();
            return snap.size + boost;
        } catch (e) { return boost; }
    }
};

// ==================== 20. PAGES ====================
const Pages = {
    lang() { return I18n.lang; },
    postCard(p) {
        const L = this.lang();
        const cat = Data.catById(p.category);
        const price = p.coinPrice || 0;
        return '<article class="card post-card reveal">' +
            '<div class="post-card-image"><img src="' + (p.coverImage || '') + '" alt="' + Utils.escapeHtml(p.title?.[L] || '') + '" loading="lazy">' +
            (cat ? '<span class="post-card-category" style="color:' + cat.color + '"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</span>' : '') +
            '<span class="post-card-price ' + (price === 0 ? 'free' : '') + '"><i class="fas ' + (price === 0 ? 'fa-check' : 'fa-coins') + '"></i> ' +
            (price === 0 ? I18n.t('post.free') : price) + '</span></div>' +
            '<div class="post-card-body"><h3 class="post-card-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</h3>' +
            '<p class="post-card-excerpt">' + Utils.escapeHtml(p.excerpt?.[L] || '') + '</p>' +
            '<div class="post-card-meta"><span><i class="fas fa-eye"></i> ' + (p.views || 0) + '</span>' +
            '<span><i class="fas fa-clock"></i> ' + Utils.readingTime(p.content?.[L]) + ' ' + I18n.t('post.readingTime') + '</span></div></div>' +
            '<a href="#post/' + p.slug + '" class="post-card-link" aria-label="' + Utils.escapeHtml(p.title?.[L] || '') + '"></a></article>';
    },
    home(c) {
        const f = Data.featured();
        const l = Data.latest(6);
        c.innerHTML =
            '<section class="hero reveal active"><div class="hero-badge"><span>' + I18n.t('hero.badge') + '</span></div>' +
            '<h1 class="hero-title">KENVEN HUB</h1><p class="hero-subtitle">' + I18n.t('hero.subtitle') + '</p>' +
            '<div class="hero-actions"><a href="#posts" class="btn btn-primary"><i class="fas fa-rocket"></i> ' + I18n.t('hero.btn.explore') + '</a>' +
            '<a href="#affiliate" class="btn btn-secondary"><i class="fas fa-tag"></i> ' + I18n.t('hero.btn.deals') + '</a>' +
            '<a href="#chat" class="btn btn-ghost"><i class="fas fa-comments"></i> ' + I18n.t('nav.chat') + '</a></div></section>' +
            (f ? '<section class="reveal"><div class="section-header"><h2 class="section-title"><i class="fas fa-star"></i> ' + I18n.t('section.featured') + '</h2></div>' + this.featCard(f) + '</section>' : '') +
            '<section class="reveal"><div class="section-header"><h2 class="section-title"><i class="fas fa-fire"></i> ' + I18n.t('section.latest') + '</h2>' +
            '<a href="#posts" class="section-link">' + I18n.t('section.viewAll') + ' <i class="fas fa-arrow-right"></i></a></div>' +
            '<div class="posts-grid">' + l.map(p => this.postCard(p)).join('') + '</div></section>' +
            '<section class="reveal" style="margin-top:var(--space-3xl);"><div class="section-header"><h2 class="section-title"><i class="fas fa-folder-open"></i> ' + I18n.t('section.categories') + '</h2></div>' +
            '<div class="categories-grid">' + Data.categories.map(x => this.catCard(x)).join('') + '</div></section>';
    },
    featCard(p) {
        const L = this.lang();
        const c = Data.catById(p.category);
        return '<article class="featured-card reveal active"><div class="featured-card-image"><img src="' + p.coverImage + '" alt="" loading="lazy"></div>' +
            '<div class="featured-card-content"><div class="featured-badge"><i class="fas fa-star"></i> ' + I18n.t('section.featured') + '</div>' +
            (c ? '<span class="badge" style="color:' + c.color + ';border:1px solid ' + c.color + ';background:' + c.color + '20;"><i class="fas ' + c.icon + '"></i> ' + Utils.escapeHtml(c.name[L]) + '</span>' : '') +
            '<h3 style="font-size:1.5rem;margin:var(--space-md) 0;">' + Utils.escapeHtml(p.title?.[L] || '') + '</h3>' +
            '<p class="post-card-excerpt">' + Utils.escapeHtml(p.excerpt?.[L] || '') + '</p>' +
            '<a href="#post/' + p.slug + '" class="btn btn-primary" style="align-self:flex-start;">' + I18n.t('btn.readMore') + ' <i class="fas fa-arrow-right"></i></a></div></article>';
    },
    catCard(cat) {
        const L = this.lang();
        const n = Data.byCategory(cat.slug).length;
        return '<div class="category-card reveal" onclick="location.hash=\'category/' + cat.slug + '\'">' +
            '<div class="category-icon" style="background:' + cat.color + '20;color:' + cat.color + ';"><i class="fas ' + cat.icon + '"></i></div>' +
            '<h3 class="category-name">' + Utils.escapeHtml(cat.name[L]) + '</h3><span class="category-count">' + n + ' ' + I18n.t('categories.posts') + '</span></div>';
    },
    allPosts(c) {
        c.innerHTML = '<section><div class="section-header"><h1 class="section-title"><i class="fas fa-newspaper"></i> ' + I18n.t('nav.posts') + '</h1></div>' +
            '<div class="posts-grid">' + Data.latest(100).map(p => this.postCard(p)).join('') + '</div></section>';
    },
    category(c, s) {
        const L = this.lang();
        const cat = Data.catBySlug(s);
        if (!cat) { this.notFound(c); return; }
        const p = Data.byCategory(s);
        c.innerHTML = '<section><div class="section-header"><h1 class="section-title" style="color:' + cat.color + ';"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</h1></div>' +
            (p.length ? '<div class="posts-grid">' + p.map(x => this.postCard(x)).join('') + '</div>' : '<div class="empty-state"><p>' + I18n.t('empty.posts') + '</p></div>') + '</section>';
    },
    categories(c) {
        c.innerHTML = '<section><div class="section-header"><h1 class="section-title"><i class="fas fa-folder-open"></i> ' + I18n.t('nav.categories') + '</h1></div>' +
            '<div class="categories-grid">' + Data.categories.map(x => this.catCard(x)).join('') + '</div></section>';
    },
    affiliate(c) {
        const L = this.lang();
        const t = Data.affiliate.length ? Data.affiliate : [];
        c.innerHTML = '<section style="text-align:center;"><div class="section-header" style="justify-content:center;">' +
            '<h1 class="section-title"><i class="fas fa-tag"></i> ' + I18n.t('nav.deals') + '</h1></div>' +
            '<p style="max-width:600px;margin:0 auto var(--space-xl);">' + I18n.t('deals.subtitle') + '</p>' +
            '<div class="affiliate-disclosure" style="text-align:start;"><p><i class="fas fa-info-circle" style="color:var(--neon-yellow);"></i> ' + I18n.t('affiliate.disclosure.text') + '</p></div>' +
            '<div class="posts-grid" style="text-align:start;">' + t.map(x =>
                '<div class="card reveal"><div style="padding:var(--space-xl);text-align:center;">' +
                '<div style="width:60px;height:60px;margin:0 auto var(--space-md);border-radius:var(--radius-md);background:' + (x.color || '#5B9FFF') + '20;color:' + (x.color || '#5B9FFF') + ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="fas ' + (x.icon || 'fa-link') + '"></i></div>' +
                '<h3>' + Utils.escapeHtml(x.name || '') + '</h3>' +
                '<div style="color:var(--neon-yellow);margin-bottom:var(--space-sm);">★ ' + (x.rating || 5) + '</div>' +
                '<p style="font-size:.9rem;">' + Utils.escapeHtml(x.description || '') + '</p>' +
                '<a href="' + Utils.escapeHtml(x.url || '#') + '" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-primary" style="width:100%;">' + I18n.t('affiliate.visit') + ' <i class="fas fa-external-link-alt"></i></a></div></div>'
            ).join('') + '</div></section>';
    },
    about(c) {
        c.innerHTML = '<section style="text-align:center;max-width:800px;margin:0 auto;">' +
            '<img src="' + CONFIG.site.logo + '" alt="" style="width:100px;height:100px;border-radius:50%;margin:0 auto var(--space-xl);box-shadow:var(--shadow-neon);">' +
            '<h1>' + I18n.t('nav.about') + '</h1><p style="font-size:1.1rem;">' + I18n.t('about.text') + '</p>' +
            '<div class="hero-actions"><a href="' + CONFIG.site.discord + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary"><i class="fab fa-discord"></i> Discord</a>' +
            '<a href="' + CONFIG.site.website + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fas fa-globe"></i> Kenven Service</a></div></section>';
    },
    notFound(c) {
        c.innerHTML = '<section style="text-align:center;padding:var(--space-3xl) 0;">' +
            '<h1 style="font-family:var(--font-mono);font-size:5rem;color:var(--neon);">404</h1>' +
            '<p>' + I18n.t('post.notFound') + '</p><a href="#home" class="btn btn-primary">' + I18n.t('btn.backHome') + '</a></section>';
    },
    async post(c, slug) {
        const L = this.lang();
        const p = Data.bySlug(slug);
        if (!p) { this.notFound(c); return; }
        Data.addView(p.id);
        window._currentPostId = p.id;
        const cat = Data.catById(p.category);
        const price = p.coinPrice || 0;
        const unlocked = price === 0 || Coins.isUnlocked(p.id);
        const raw = Utils.sanitizeHtml(p.content?.[L] || p.content?.en || '');
        let toc = '';
        const heads = [...raw.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi)];
        if (heads.length) {
            toc = '<div class="post-toc reveal"><h3><i class="fas fa-list"></i> ' + I18n.t('post.toc') + '</h3><ul class="toc-list">' +
                heads.map((h, i) => '<li><a href="#sec-' + i + '">' + h[2].replace(/<[^>]*>/g, '') + '</a></li>').join('') + '</ul></div>';
        }
        let html = raw;
        heads.forEach((h, i) => { html = html.replace(h[0], h[0].replace('<h' + h[1], '<h' + h[1] + ' id="sec-' + i + '"')); });
        const affIds = p.affiliateIds && p.affiliateIds.length ? p.affiliateIds : (p.isAffiliate && Data.affiliate.length ? [Data.affiliate[0].id] : []);
        const affBoxes = affIds.map(id => Data.affiliate.find(a => a.id === id)).filter(Boolean);
        if (affBoxes.length) {
            const seg = html.split(/(<h2[^>]*>)/);
            if (seg.length > 3) {
                const idx = 1 + (Utils.hashCode(p.id) % Math.max(1, Math.floor((seg.length - 1) / 2))) * 2;
                const a = affBoxes[0];
                const box = '<div class="inline-affiliate"><div class="inline-affiliate-icon"><i class="fas ' + (a.icon || 'fa-tag') + '"></i></div>' +
                    '<div class="inline-affiliate-info"><div class="inline-affiliate-name">' + Utils.escapeHtml(a.name || '') + '</div>' +
                    '<div class="inline-affiliate-stars">★ ' + (a.rating || 5) + '</div>' +
                    '<div class="inline-affiliate-desc">' + Utils.escapeHtml(a.description || '') + '</div>' +
                    '<span class="inline-affiliate-tag">' + I18n.t('affiliate.sponsored') + '</span></div>' +
                    '<a href="' + Utils.escapeHtml(a.url || '#') + '" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-gold btn-sm">' + I18n.t('affiliate.visit') + ' <i class="fas fa-external-link-alt"></i></a></div>';
                seg.splice(Math.min(idx, seg.length - 1), 0, box);
                html = seg.join('');
            }
        }
        let body;
        if (unlocked) {
            body = '<div class="post-content reveal">' + html + '</div>';
        } else {
            const prev = html.split('</p>')[0] + '</p>';
            body = '<div class="paywall-wrapper"><div class="paywall-preview">' + prev + '</div>' +
                '<div class="paywall-card"><div class="paywall-icon"><i class="fas fa-lock"></i></div>' +
                '<h2 class="paywall-title">' + I18n.t('paywall.title') + '</h2>' +
                '<p class="paywall-text">' + I18n.t('paywall.text') + '</p>' +
                '<div class="paywall-price"><i class="fas fa-coins"></i> ' + price + ' <small>' + I18n.t('coins.coins') + '</small></div>' +
                '<div class="paywall-actions"><button class="btn btn-gold" id="unlock-btn"><i class="fas fa-unlock"></i> ' + I18n.t('paywall.unlock') + ' ' + price + '</button>' +
                '<button class="btn btn-secondary" id="earn-more-btn"><i class="fas fa-coins"></i> ' + I18n.t('paywall.earn') + '</button></div>' +
                '<div class="paywall-balance">' + I18n.t('paywall.balance') + ': <strong style="color:var(--gold);">' + (Coins.wallet?.balance || 0) + '</strong></div></div></div>';
        }
        const youtubeEmbed = Utils.embedYoutube(p.youtubeUrl);
        c.innerHTML = '<article class="post-page">' +
            '<div class="reading-progress-container"><div class="reading-progress-bar-bg"><div class="reading-progress-bar-fill" id="reading-progress-bar" style="width:0%"></div></div></div>' +
            '<header class="post-header reveal active">' +
            (cat ? '<a href="#category/' + cat.slug + '" class="badge" style="color:' + cat.color + ';border:1px solid ' + cat.color + ';background:' + cat.color + '20;"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</a>' : '') +
            '<h1 class="post-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</h1>' +
            '<div class="post-meta"><span><i class="fas fa-calendar"></i> ' + Utils.formatDate(p.createdAt, L) + '</span>' +
            '<span><i class="fas fa-clock"></i> ' + Utils.readingTime(raw) + ' ' + I18n.t('post.readingTime') + '</span>' +
            '<span><i class="fas fa-eye"></i> ' + (p.views || 0) + ' ' + I18n.t('post.views') + '</span>' +
            '<button class="btn btn-sm btn-ghost" onclick="ReadingProgress.saveBookmark(\'' + p.id + '\')" style="margin-left:auto;"><i class="fas fa-bookmark"></i></button></div></header>' +
            '<div class="post-cover reveal"><img src="' + (p.coverImage || '') + '" alt="" loading="lazy"></div>' +
            youtubeEmbed +
            (p.isAffiliate ? '<div class="affiliate-disclosure reveal"><h3><i class="fas fa-info-circle"></i> ' + I18n.t('affiliate.disclosure.title') + '</h3><p>' + I18n.t('affiliate.disclosure.text') + '</p></div>' : '') +
            toc + body +
            (p.downloadLink && unlocked ? '<div style="text-align:center;margin:var(--space-2xl) 0;"><a href="' + Utils.escapeHtml(p.downloadLink) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary glow" style="font-size:1.15rem;padding:var(--space-lg) var(--space-2xl);"><i class="fas fa-download"></i> ' + Utils.escapeHtml(p.buttonText?.[L] || p.buttonText?.en || 'Download') + '</a></div>' : '') +
            '<div style="text-align:center;margin:var(--space-2xl) 0;"><button class="btn btn-secondary" id="share-post-btn"><i class="fas fa-share-alt"></i> ' + I18n.t('post.share') + '</button></div>' +
            (Data.related(p).length ? '<section class="reveal"><h2 class="section-title"><i class="fas fa-link"></i> ' + I18n.t('post.related') + '</h2><div class="posts-grid">' + Data.related(p).map(x => this.postCard(x)).join('') + '</div></section>' : '') +
            '<section class="comments-section reveal"><div class="comments-header"><h2 class="section-title"><i class="fas fa-comments"></i> ' + I18n.t('comments.title') + '</h2>' +
            '<div class="comments-sort"><button class="filter-chip active" data-sort="latest">' + I18n.t('comments.sort.latest') + '</button><button class="filter-chip" data-sort="oldest">' + I18n.t('comments.sort.oldest') + '</button><button class="filter-chip" data-sort="liked">' + I18n.t('comments.sort.liked') + '</button></div></div>' +
            (FB.user ? '' : '<form class="comment-form" id="comment-form"><div class="form-group"><input type="text" id="comment-name" class="form-input" placeholder="' + I18n.t('comments.name') + '"></div><div class="form-group"><input type="email" id="comment-email" class="form-input" placeholder="' + I18n.t('comments.email') + '"></div><div class="form-group"><textarea id="comment-content" class="form-textarea" placeholder="' + I18n.t('comments.content') + '"></textarea></div><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> ' + I18n.t('comments.submit') + '</button></form>' :
                '<form class="comment-form" id="comment-form"><div class="form-group"><textarea id="comment-content" class="form-textarea" placeholder="' + I18n.t('comments.content') + '"></textarea></div><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> ' + I18n.t('comments.submit') + '</button></form>') +
            '<div id="comments-list"></div></section></article>';
        document.getElementById('share-post-btn')?.addEventListener('click', () => UI.openModal('share-modal'));
        document.getElementById('comment-form')?.addEventListener('submit', e => { e.preventDefault(); Comments.submit(p.id); });
        document.querySelectorAll('.comments-sort .filter-chip').forEach(b => {
            b.onclick = async e => {
                document.querySelectorAll('.comments-sort .filter-chip').forEach(x => x.classList.remove('active'));
                e.target.classList.add('active');
                Comments.sort = e.target.dataset.sort;
                Comments.render(p.id, await Comments.load(p.id));
            };
        });
        const unlockBtn = document.getElementById('unlock-btn');
        if (unlockBtn) {
            unlockBtn.onclick = async () => {
                if (await Coins.unlockPost(p)) {
                    UI.showToast(I18n.t('coins.unlocked'), 'success');
                    Router.renderCurrent();
                }
            };
        }
        document.getElementById('earn-more-btn')?.addEventListener('click', () => UI.openModal('coins-modal'));
        const list = await Comments.load(p.id);
        Comments.render(p.id, list);
        Effects.reveal();
    }
};

// ==================== 21. ROUTER ====================
const Router = {
    route: '',
    init() {
        addEventListener('hashchange', () => this.handle());
        this.handle();
    },
    handle() {
        this.route = location.hash.slice(1) || 'home';
        document.getElementById('mobile-menu')?.classList.remove('open');
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(l => {
            l.classList.toggle('active', (l.getAttribute('href') || '').slice(1) === this.route);
        });
        scrollTo(0, 0);
        this.renderCurrent();
    },
    renderCurrent() {
        const c = document.getElementById('app-container');
        if (!c) return;
        const r = this.route;
        if (r === 'home' || r === '') Pages.home(c);
        else if (r === 'posts') Pages.allPosts(c);
        else if (r.startsWith('post/')) Pages.post(c, r.split('/')[1]);
        else if (r === 'categories') Pages.categories(c);
        else if (r.startsWith('category/')) Pages.category(c, r.split('/')[1]);
        else if (r === 'affiliate' || r === 'deals') Pages.affiliate(c);
        else if (r === 'about') Pages.about(c);
        else if (r === 'chat') { UI.openModal('chat-modal'); Chat.load(); Router.handle(); }
        else if (r === 'leaderboard') { UI.openModal('leaderboard-modal'); Leaderboard.render(); Router.handle(); }
        else Pages.notFound(c);
        Effects.reveal();
    }
};

// ==================== 22. SEARCH / SHARE / NEWSLETTER ====================
const Search = {
    filter: 'all',
    init() {
        document.getElementById('search-btn')?.addEventListener('click', () => {
            UI.openModal('search-modal');
            setTimeout(() => document.getElementById('search-input')?.focus(), 100);
        });
        document.getElementById('search-close')?.addEventListener('click', () => UI.closeModal('search-modal'));
        document.querySelector('#search-modal .modal-backdrop')?.addEventListener('click', () => UI.closeModal('search-modal'));
        document.getElementById('search-input')?.addEventListener('input', Utils.debounce(e => this.run(e.target.value), 300));
        document.querySelectorAll('.search-filters .filter-chip').forEach(c => {
            c.addEventListener('click', e => {
                document.querySelectorAll('.search-filters .filter-chip').forEach(x => x.classList.remove('active'));
                e.target.classList.add('active');
                this.filter = e.target.dataset.filter;
                this.run(document.getElementById('search-input').value);
            });
        });
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 'k') { e.preventDefault(); UI.openModal('search-modal'); }
            if (e.key === 'Escape') UI.closeAll();
        });
    },
    run(q) {
        const b = document.getElementById('search-results');
        if (!b) return;
        if (!q.trim()) { b.innerHTML = '<div class="search-empty">' + I18n.t('search.empty') + '</div>'; return; }
        const r = Data.search(q, this.filter);
        const L = I18n.lang;
        b.innerHTML = r.length
            ? '<div style="color:var(--text-muted);font-size:.85rem;margin-bottom:var(--space-md);">' + r.length + ' ' + I18n.t('search.results') + '</div>' +
            r.map(p => '<div class="search-result-item" onclick="location.hash=\'post/' + p.slug + '\';UI.closeModal(\'search-modal\');"><img src="' + p.coverImage + '" class="search-result-image" alt="" loading="lazy"><div><div class="search-result-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</div><div class="search-result-excerpt">' + Utils.escapeHtml(Utils.truncate(p.excerpt?.[L] || '')) + '</div></div></div>').join('')
            : '<div class="search-empty">' + I18n.t('search.noResults') + ' "' + Utils.escapeHtml(q) + '"</div>';
    }
};

const Share = {
    init() {
        document.getElementById('share-close')?.addEventListener('click', () => UI.closeModal('share-modal'));
        document.querySelector('#share-modal .modal-backdrop')?.addEventListener('click', () => UI.closeModal('share-modal'));
        document.querySelectorAll('.share-btn').forEach(b => {
            b.addEventListener('click', e => this.do(e.currentTarget.dataset.platform));
        });
    },
    do(p) {
        const u = location.href, t = document.title;
        const urls = {
            twitter: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t),
            facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u),
            whatsapp: 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u),
            telegram: 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t)
        };
        if (p === 'copy') {
            Utils.copy(u).then(ok => UI.showToast(ok ? I18n.t('toast.copied') : I18n.t('toast.error'), ok ? 'success' : 'error'));
        } else if (urls[p]) {
            open(urls[p], '_blank', 'width=600,height=400');
        }
        UI.closeModal('share-modal');
    }
};

const Newsletter = {
    init() {
        document.getElementById('newsletter-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            const i = document.getElementById('newsletter-email');
            const em = i.value.trim();
            if (!Utils.isValidEmail(em)) { UI.showToast(I18n.t('newsletter.error'), 'error'); return; }
            if (FB.ok) {
                try { await FB.db.collection('subscribers').add({ email: em, date: Date.now() }); } catch (e) {}
            }
            i.value = '';
            UI.showToast(I18n.t('newsletter.success'), 'success');
        });
    }
};

// ==================== 23. NAVBAR ====================
const Navbar = {
    init() {
        addEventListener('scroll', Utils.debounce(() => {
            document.getElementById('navbar')?.classList.toggle('scrolled', scrollY > 50);
        }, 100));
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        btn?.addEventListener('click', () => {
            const o = menu.classList.toggle('open');
            btn.setAttribute('aria-expanded', o);
            btn.querySelector('i').className = o ? 'fas fa-times' : 'fas fa-bars';
        });
        document.getElementById('lang-switcher')?.addEventListener('click', () => I18n.toggle());
        document.getElementById('effects-toggle')?.addEventListener('click', () => Effects.toggle());
        document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
            UI.openModal('leaderboard-modal');
            Leaderboard.render();
        });
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                location.href = 'admin.html';
            }
        });
        let buf = '';
        document.addEventListener('keypress', e => {
            const t = document.activeElement?.tagName;
            if (t === 'INPUT' || t === 'TEXTAREA') return;
            buf += e.key.toLowerCase();
            if (buf.includes('admin')) { location.href = 'admin.html'; buf = ''; }
            if (buf.length > 10) buf = buf.slice(-10);
        });
        if (location.hash === '#admin') location.href = 'admin.html';
        const fc = document.getElementById('footer-categories');
        if (fc) {
            fc.innerHTML = Data.categories.map(c =>
                '<li><a href="#category/' + c.slug + '">' + Utils.escapeHtml(c.name[I18n.lang]) + '</a></li>'
            ).join('');
        }
        document.addEventListener('click', e => {
            const b = e.target.closest('.btn');
            if (b && Effects.enabled) {
                const r = document.createElement('span');
                r.className = 'ripple';
                const rect = b.getBoundingClientRect();
                const s = Math.max(rect.width, rect.height);
                r.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - rect.left - s / 2) + 'px;top:' + (e.clientY - rect.top - s / 2) + 'px;';
                b.appendChild(r);
                setTimeout(() => r.remove(), 600);
            }
        });
    }
};

// ==================== 24. COOKIE CONSENT ====================
const CookieConsent = {
    init() {
        const consent = LS.get(CONFIG.keys.cookieConsent);
        if (consent !== null) return;
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.style.display = 'block';
        document.getElementById('cookie-accept-btn')?.addEventListener('click', () => this.accept());
        document.getElementById('cookie-decline-btn')?.addEventListener('click', () => this.decline());
    },
    accept() {
        LS.set(CONFIG.keys.cookieConsent, 'accepted');
        document.getElementById('cookie-banner').style.display = 'none';
    },
    decline() {
        LS.set(CONFIG.keys.cookieConsent, 'declined');
        document.getElementById('cookie-banner').style.display = 'none';
    }
};

// ==================== 25. MAINTENANCE ====================
const Maintenance = {
    check() {
        const m = Data.settings.maintenance;
        if (m && m.enabled) {
            this.show(m);
            return true;
        }
        return false;
    },
    show(m) {
        const screen = document.getElementById('maintenance-screen');
        if (!screen) return;
        screen.style.display = 'flex';
        const msg = m.message || (I18n.lang === 'ar' ? 'الموقع تحت الصيانة. سنعود قريباً!' : 'Site is under maintenance. We will be back soon!');
        const msgEl = document.getElementById('maintenance-msg');
        if (msgEl) msgEl.textContent = msg;
        const etaEl = document.getElementById('maintenance-eta');
        const etaText = document.getElementById('maintenance-eta-text');
        if (m.eta) {
            if (etaEl) etaEl.style.display = 'inline-flex';
            if (etaText) etaText.textContent = m.eta;
        }
        const particles = document.getElementById('maintenance-particles');
        if (particles) {
            particles.innerHTML = '';
            for (let i = 0; i < 20; i++) {
                const s = document.createElement('span');
                s.className = 'maintenance-particle';
                s.style.left = Math.random() * 100 + '%';
                s.style.animationDuration = (4 + Math.random() * 6) + 's';
                s.style.animationDelay = Math.random() * 5 + 's';
                particles.appendChild(s);
            }
        }
    }
};

// ==================== 26. ONLINE COUNTER ====================
const OnlineCounter = {
    async init() {
        const update = async () => {
            const count = await OnlineUsers.getCount();
            const el = document.getElementById('online-count');
            if (el) el.textContent = count;
        };
        update();
        setInterval(update, 30000);
        if (FB.user) {
            OnlineUsers.update();
            setInterval(() => OnlineUsers.update(), 60000);
        }
    }
};

// ==================== 27. APP INIT ====================
const App = {
    async init() {
        try {
            console.log('🚀 Kenven Hub starting...');
            FB.init();
            I18n.init();
            Theme.init();
            Effects.init();
            await Data.load();
            const isMaintenance = Maintenance.check();
            if (isMaintenance) return;
            CookieConsent.init();
            await Coins.init();
            UserAuth.init();
            Chat.init();
            ReadingProgress.init();
            Navbar.init();
            Search.init();
            Share.init();
            Newsletter.init();
            Router.init();
            OnlineCounter.init();
            if (FB.ok) FB.auth.onAuthStateChanged(u => {
                Coins.onAuthChange(u);
                OnlineUsers.update();
            });
            if ('serviceWorker' in navigator) {
                addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
            }
            setTimeout(() => UI.hideLoader(), 1200);
            console.log('✅ Kenven Hub ready!');
        } catch (e) {
            console.error('Init error:', e);
            UI.hideLoader();
        }
    }
};

window.addEventListener('error', e => console.warn('Caught:', e.message));
document.addEventListener('DOMContentLoaded', () => App.init());
window.UI = UI;
window.Router = Router;
window.ReadingProgress = ReadingProgress;
window.UserAuth = UserAuth;
