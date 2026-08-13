/* ================================================================
   KENVEN HUB - MAIN APPLICATION (FINAL)
   Vanilla JS + Firebase (Auth + Firestore) + Coins System
   ================================================================ */

'use strict';

// ==================== 1. CONFIGURATION ====================
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyDQ7q03kfdOQAm_B03O47GlC4v8DCru94E",
        authDomain: "kenven-hub.firebaseapp.com",
        databaseURL: "https://kenven-hub-default-rtdb.firebaseio.com",
        projectId: "kenven-hub",
        storageBucket: "kenven-hub.firebasestorage.app",
        messagingSenderId: "181277894032",
        appId: "1:181277894032:web:7f42a19f3bcf3ea3033f15",
        measurementId: "G-VLW5MCJ2CM"
    },
    
    USE_FIREBASE: true,
    
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
        wallet: 'kenven_hub_wallet',
        likedComments: 'kenven_hub_liked_comments',
        commentTimes: 'kenven_hub_comment_times',
        cachePosts: 'kenven_hub_cache_posts',
        cacheAff: 'kenven_hub_cache_aff'
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
        enableCodes: true
    }
};

// ==================== 2. UTILITIES ====================
const Utils = {
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:/gi, '');
    },
    
    debounce(fn, delay = 300) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    },
    
    formatDate(ts, lang = 'en') {
        try {
            return new Date(ts).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { return ''; }
    },
    
    readingTime(content) {
        const words = (content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    },
    
    genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8); },
    
    genRecoveryCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'KV-';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },
    
    hashCode(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
        return Math.abs(h);
    },
    
    isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
    
    truncate(text, max = 120) {
        const plain = (text || '').replace(/<[^>]*>/g, '');
        return plain.length <= max ? plain : plain.substr(0, max).trim() + '...';
    },
    
    async copy(text) {
        try { await navigator.clipboard.writeText(text); return true; }
        catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); return true; } catch (e2) { return false; }
            finally { document.body.removeChild(ta); }
        }
    },
    
    todayStr() { return new Date().toDateString(); }
};

// ==================== 3. LOCAL STORAGE ====================
const LS = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    remove(k) { localStorage.removeItem(k); }
};

// ==================== 4. FIREBASE CORE ====================
const FB = {
    db: null,
    auth: null,
    ok: false,
    user: null,
    
    init() {
        try {
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(CONFIG.firebase);
                this.db = firebase.firestore();
                this.auth = firebase.auth();
                this.ok = true;
                
                this.auth.onAuthStateChanged((user) => {
                    this.user = user;
                    Coins.onAuthChange(user);
                });
            }
        } catch (e) {
            console.warn('Firebase init failed, using offline mode:', e);
            this.ok = false;
        }
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
        'post.comments': { en: 'comments', ar: 'تعليق' },
        'post.related': { en: 'Related Posts', ar: 'منشورات ذات صلة' },
        'post.share': { en: 'Share', ar: 'مشاركة' },
        'post.notFound': { en: 'Post not found', ar: 'المنشور غير موجود' },
        'post.toc': { en: 'Table of Contents', ar: 'جدول المحتويات' },
        'post.free': { en: 'FREE', ar: 'مجاني' },
        'affiliate.disclosure.title': { en: 'Affiliate Disclosure', ar: 'إفصاح الأفلييت' },
        'affiliate.disclosure.text': { en: 'This post contains affiliate links. If you purchase through them, we may earn a commission at no extra cost to you.', ar: 'يحتوي هذا المنشور على روابط أفلييت. إذا اشتريت من خلالها، قد نحصل على عمولة دون أي تكلفة إضافية عليك.' },
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
        'comments.fillAll': { en: 'Please fill all fields correctly.', ar: 'يرجى ملء جميع الحقول بشكل صحيح.' },
        'comments.liked': { en: 'Liked!', ar: 'تم الإعجاب!' },
        'search.empty': { en: 'Start typing to see results...', ar: 'ابدأ الكتابة لرؤية النتائج...' },
        'search.noResults': { en: 'No results for', ar: 'لا نتائج لـ' },
        'search.results': { en: 'results', ar: 'نتائج' },
        'newsletter.success': { en: 'Subscribed successfully!', ar: 'تم الاشتراك بنجاح!' },
        'newsletter.error': { en: 'Please enter a valid email.', ar: 'أدخل بريداً صحيحاً.' },
        'toast.copied': { en: 'Link copied!', ar: 'تم نسخ الرابط!' },
        'toast.error': { en: 'Something went wrong.', ar: 'حدث خطأ ما.' },
        'btn.readMore': { en: 'Read More', ar: 'اقرأ المزيد' },
        'btn.backHome': { en: 'Back to Home', ar: 'العودة للرئيسية' },
        'categories.posts': { en: 'posts', ar: 'منشور' },
        'deals.subtitle': { en: 'Exclusive deals on hosting, tools, and services', ar: 'عروض حصرية على الاستضافة والأدوات والخدمات' },
        'about.text': { en: 'Kenven Hub is your ultimate resource center for apps, tools, tutorials, and exclusive deals. Part of the Kenven Service family.', ar: 'Kenven Hub هو مركزك الشامل للتطبيقات والأدوات والشروحات والعروض الحصرية. جزء من عائلة Kenven Service.' },
        'empty.posts': { en: 'No posts yet. Check back soon!', ar: 'لا منشورات بعد. عد قريباً!' },
        'coins.coins': { en: 'Coins', ar: 'كوينز' },
        'coins.guest': { en: 'Guest Wallet', ar: 'محفظة زائر' },
        'coins.member': { en: 'Member Wallet', ar: 'محفظة عضو' },
        'coins.claimed': { en: 'Coins added!', ar: 'تمت إضافة الكوينز!' },
        'coins.dailyDone': { en: 'Daily gift already claimed. Come back tomorrow!', ar: 'تم استلام هدية اليوم. عد غداً!' },
        'coins.adWait': { en: 'Wait', ar: 'انتظر' },
        'coins.adOpen': { en: 'Ad opened! Claiming in', ar: 'فُتح الإعلان! الاستلام بعد' },
        'coins.adSec': { en: 's', ar: 'ث' },
        'coins.invalidCode': { en: 'Invalid or used code.', ar: 'كود غير صالح أو مستخدم.' },
        'coins.codeSuccess': { en: 'Code redeemed!', ar: 'تم تفعيل الكود!' },
        'coins.restored': { en: 'Wallet restored!', ar: 'تم استرجاع المحفظة!' },
        'coins.restoreFail': { en: 'Recovery code not found.', ar: 'كود الاسترجاع غير موجود.' },
        'coins.copied': { en: 'Recovery code copied! Keep it safe.', ar: 'تم نسخ كود الاسترجاع! احتفظ به بأمان.' },
        'coins.notEnough': { en: 'Not enough coins! Earn more first.', ar: 'كوينز غير كافية! اربح المزيد أولاً.' },
        'coins.unlocked': { en: 'Post unlocked!', ar: 'تم فتح المنشور!' },
        'paywall.title': { en: 'Premium Content', ar: 'محتوى مميز' },
        'paywall.text': { en: 'This post is locked. Unlock it with coins or earn more coins for free.', ar: 'هذا المنشور مقفل. افتحه بالكوينز أو اربح كوينز مجانية.' },
        'paywall.unlock': { en: 'Unlock for', ar: 'افتح مقابل' },
        'paywall.earn': { en: '+ Earn Coins', ar: '+ اربح كوينز' },
        'paywall.balance': { en: 'Your balance', ar: 'رصيدك' },
        'auth.registerOk': { en: 'Account created! Wallet linked.', ar: 'تم إنشاء الحساب! تم ربط المحفظة.' },
        'auth.loginOk': { en: 'Welcome back!', ar: 'مرحباً بعودتك!' },
        'auth.error': { en: 'Auth failed. Check email/password.', ar: 'فشل الدخول. تحقق من البيانات.' },
        'theme.light': { en: 'Light mode', ar: 'الوضع النهاري' },
        'theme.dark': { en: 'Dark mode', ar: 'الوضع الليلي' }
    },
    
    init() {
        this.lang = LS.get(CONFIG.keys.lang) || (navigator.language.startsWith('ar') ? 'ar' : 'en');
        this.apply();
    },
    
    t(key) { const e = this.tr[key]; return e ? (e[this.lang] || e.en) : key; },
    
    toggle() { this.lang = this.lang === 'en' ? 'ar' : 'en'; LS.set(CONFIG.keys.lang, this.lang); this.apply(); Router.renderCurrent(); },
    
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
        this.apply(this.current, false);
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.addEventListener('click', () => this.toggle());
    },
    
    apply(mode, save = true) {
        this.current = mode;
        document.body.classList.toggle('light-theme', mode === 'light');
        const icon = document.querySelector('#theme-toggle i');
        if (icon) icon.className = mode === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        if (save) LS.set(CONFIG.keys.theme, mode);
    },
    
    toggle() {
        const next = this.current === 'dark' ? 'light' : 'dark';
        this.apply(next);
        UI.showToast(I18n.t(next === 'light' ? 'theme.light' : 'theme.dark'), 'info');
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
    enabled: true,
    particles: [],
    raf: null,
    
    init() {
        this.enabled = LS.get(CONFIG.keys.effects, true) !== false;
        this.apply();
        this.initScroll();
        this.initBackTop();
    },
    
    apply() {
        document.body.classList.toggle('effects-disabled', !this.enabled);
        const btn = document.getElementById('effects-toggle');
        if (btn) btn.classList.toggle('active', this.enabled);
        if (this.enabled) { this.initCursor(); this.initParticles(); }
        else { this.stopParticles(); document.body.style.cursor = ''; }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        LS.set(CONFIG.keys.effects, this.enabled);
        this.apply();
    },
    
    initCursor() {
        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (!dot || !ring || !window.matchMedia('(hover: hover)').matches) return;
        document.body.style.cursor = 'none';
        document.addEventListener('mousemove', (e) => {
            dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
            ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
        });
        document.addEventListener('mouseover', (e) => {
            ring.classList.toggle('hover', !!e.target.closest('a, button, input, textarea, [role="button"]'));
        });
    },
    
    initParticles() {
        this.stopParticles();
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
        resize();
        addEventListener('resize', Utils.debounce(resize, 200));
        
        const count = Math.min(45, Math.floor(innerWidth / 30));
        this.particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            s: Math.random() * 2 + 1,
            vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
            o: Math.random() * .4 + .15
        }));
        
        const draw = () => {
            if (!this.enabled) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const light = document.body.classList.contains('light-theme');
            const rgb = light ? '46,123,255' : '91,159,255';
            this.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
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
        if (btn) btn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    },
    
    initBackTop() {},
    
    reveal() {
        const obs = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }), { threshold: 0.08 });
        document.querySelectorAll('.reveal:not(.active)').forEach(el => obs.observe(el));
    }
};

// ==================== 9. DATA LAYER (Firestore + cache fallback) ====================
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
            } catch (e) { console.warn('Firestore read failed, using cache:', e); }
        }
        this.posts = LS.get(CONFIG.keys.cachePosts, []);
        this.affiliate = LS.get(CONFIG.keys.cacheAff, []);
    },
    
    published() { return this.posts.filter(p => p.status === 'published'); },
    bySlug(slug) { return this.posts.find(p => p.slug === slug); },
    byCategory(slug) { return this.published().filter(p => p.category === slug); },
    featured() { return this.published().find(p => p.featured); },
    latest(n) { return [...this.published()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, n); },
    related(post, n = 3) { return this.published().filter(p => p.id !== post.id && p.category === post.category).slice(0, n); },
    catById(id) { return this.categories.find(c => c.id === id); },
    catBySlug(slug) { return this.categories.find(c => c.slug === slug); },
    
    async addView(postId) {
        this.posts.forEach(p => { if (p.id === postId) p.views = (p.views || 0) + 1; });
        if (FB.ok) { try { await FB.db.collection('posts').doc(postId).update({ views: firebase.firestore.FieldValue.increment(1) }); } catch (e) {} }
    },
    
    search(q, cat = 'all') {
        const lq = q.toLowerCase();
        return this.published().filter(p => {
            const okCat = cat === 'all' || p.category === cat;
            const hay = [(p.title?.en || ''), (p.title?.ar || ''), (p.excerpt?.en || ''), (p.excerpt?.ar || ''), (p.tags || []).join(' ')].join(' ').toLowerCase();
            return okCat && hay.includes(lq);
        });
    }
};

// ==================== 10. COINS SYSTEM ====================
const Coins = {
    wallet: null,      // { id, balance, unlockedPosts, ... }
    adTimer: null,
    
    // --- Wallet lifecycle ---
    localMeta() {
        let m = LS.get(CONFIG.keys.wallet);
        if (!m) { m = { id: Utils.genRecoveryCode() }; LS.set(CONFIG.keys.wallet, m); }
        return m;
    },
    
    async init() {
        const meta = this.localMeta();
        await this.loadWallet(meta.id);
        this.bindUI();
        this.updateUI();
    },
    
    async loadWallet(id) {
        const meta = this.localMeta();
        if (FB.ok) {
            try {
                const base = { id: id, recoveryCode: id, balance: 0, unlockedPosts: [], ownerUid: FB.user ? FB.user.uid : null, createdAt: Date.now() };
                await FB.db.collection('wallets').doc(id).set(base, { merge: true });
                const snap = await FB.db.collection('wallets').doc(id).get();
                this.wallet = snap.exists ? snap.data() : base;
                return;
            } catch (e) { console.warn('Wallet load failed:', e); }
        }
        // Offline fallback
        this.wallet = LS.get('kenven_hub_wallet_data_' + id, null) || { id: id, balance: 0, unlockedPosts: [], recoveryCode: id };
    },
    
    async save(patch) {
        if (!this.wallet) return;
        Object.assign(this.wallet, patch);
        if (FB.ok) {
            try { await FB.db.collection('wallets').doc(this.wallet.id).update(patch); }
            catch (e) { LS.set('kenven_hub_wallet_data_' + this.wallet.id, this.wallet); }
        } else {
            LS.set('kenven_hub_wallet_data_' + this.wallet.id, this.wallet);
        }
        this.updateUI();
    },
    
    async addCoins(amount) {
        if (!this.wallet) return;
        if (FB.ok) {
            try {
                await FB.db.collection('wallets').doc(this.wallet.id).update({ balance: firebase.firestore.FieldValue.increment(amount) });
                const snap = await FB.db.collection('wallets').doc(this.wallet.id).get();
                this.wallet = snap.data();
                this.updateUI();
                return;
            } catch (e) {}
        }
        await this.save({ balance: (this.wallet.balance || 0) + amount });
    },
    
    updateUI() {
        const b = this.wallet ? (this.wallet.balance || 0) : 0;
        const nav = document.getElementById('coin-balance');
        const modal = document.getElementById('coins-balance-display');
        if (nav) nav.textContent = b;
        if (modal) modal.textContent = b;
        const mode = document.getElementById('wallet-mode-text');
        if (mode) mode.textContent = (this.wallet && this.wallet.ownerUid) ? I18n.t('coins.member') : I18n.t('coins.guest');
        const rc = document.getElementById('recovery-code-display');
        if (rc) rc.textContent = this.wallet ? this.wallet.id : '---';
    },
    
    isUnlocked(postId) { return this.wallet && (this.wallet.unlockedPosts || []).includes(postId); },
    
    // --- Auth linking ---
    async onAuthChange(user) {
        if (!this.wallet) return;
        if (user) {
            if (FB.ok) {
                try {
                    const q = await FB.db.collection('wallets').where('ownerUid', '==', user.uid).get();
                    if (!q.empty && q.docs[0].id !== this.wallet.id && (this.wallet.balance || 0) === 0) {
                        LS.set(CONFIG.keys.wallet, { id: q.docs[0].id });
                        await this.loadWallet(q.docs[0].id);
                    } else {
                        await this.save({ ownerUid: user.uid });
                    }
                } catch (e) {}
            }
        }
        this.updateUI();
    },
    
    // --- UI bindings ---
    bindUI() {
        const open = document.getElementById('coins-btn');
        if (open) open.addEventListener('click', () => { UI.openModal('coins-modal'); this.updateUI(); });
        const close = document.getElementById('coins-close');
        if (close) close.addEventListener('click', () => UI.closeModal('coins-modal'));
        
        const copyBtn = document.getElementById('copy-recovery-btn');
        if (copyBtn) copyBtn.addEventListener('click', async () => {
            if (await Utils.copy(this.wallet.id)) UI.showToast(I18n.t('coins.copied'), 'success');
        });
        
        const restoreBtn = document.getElementById('restore-code-btn');
        if (restoreBtn) restoreBtn.addEventListener('click', () => this.restore());
        
        const giftBtn = document.getElementById('daily-gift-btn');
        if (giftBtn) giftBtn.addEventListener('click', () => this.dailyGift());
        
        const adBtn = document.getElementById('ad-earn-btn');
        if (adBtn) adBtn.addEventListener('click', () => this.adEarn());
        
        const redeemBtn = document.getElementById('redeem-code-btn');
        if (redeemBtn) redeemBtn.addEventListener('click', () => this.redeem());
        
        const wa = document.getElementById('whatsapp-link');
        if (wa) wa.href = 'https://wa.me/' + (Data.settings.whatsappNumber || CONFIG.site.whatsapp);
        
        const authBtn = document.getElementById('open-auth-btn');
        if (authBtn) authBtn.addEventListener('click', () => { UI.closeModal('coins-modal'); UI.openModal('auth-modal'); });
    },
    
    // --- Earn methods ---
    async dailyGift() {
        if (!Data.settings.enableDailyGift) return;
        const today = Utils.todayStr();
        if (this.wallet.lastDailyGift === today) { UI.showToast(I18n.t('coins.dailyDone'), 'warning'); return; }
        await this.save({ lastDailyGift: today });
        await this.addCoins(Data.settings.dailyGiftAmount || 1);
        UI.showToast('+' + (Data.settings.dailyGiftAmount || 1) + ' ' + I18n.t('coins.coins') + ' 🎁', 'success');
    },
    
    adEarn() {
        if (!Data.settings.enableAd || this.adTimer) return;
        const wait = Data.settings.adWaitSeconds || 30;
        window.open(Data.settings.adUrl || CONFIG.site.website, '_blank');
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
        if (FB.ok) {
            try {
                const snap = await FB.db.collection('coin_codes').doc(code).get();
                if (!snap.exists) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); return; }
                const c = snap.data();
                if (!c.active || (c.maxUses > 0 && c.usedCount >= c.maxUses)) { UI.showToast(I18n.t('coins.invalidCode'), 'error'); return; }
                await FB.db.collection('coin_codes').doc(code).update({ usedCount: (c.usedCount || 0) + 1 });
                await this.addCoins(c.amount || 0);
                input.value = '';
                UI.showToast('+' + c.amount + ' ' + I18n.t('coins.codeSuccess'), 'success');
                return;
            } catch (e) {}
        }
        UI.showToast(I18n.t('coins.invalidCode'), 'error');
    },
    
    async restore() {
        const input = document.getElementById('restore-code-input');
        const code = (input.value || '').trim().toUpperCase();
        if (!code) return;
        if (FB.ok) {
            try {
                const snap = await FB.db.collection('wallets').doc(code).get();
                if (snap.exists) {
                    LS.set(CONFIG.keys.wallet, { id: code });
                    await this.loadWallet(code);
                    this.updateUI();
                    input.value = '';
                    UI.showToast(I18n.t('coins.restored'), 'success');
                    return;
                }
            } catch (e) {}
        }
        UI.showToast(I18n.t('coins.restoreFail'), 'error');
    },
    
    // --- Spend ---
    async unlockPost(post) {
        const price = post.coinPrice || 0;
        if ((this.wallet.balance || 0) < price) {
            UI.showToast(I18n.t('coins.notEnough'), 'warning');
            UI.openModal('coins-modal');
            return false;
        }
        if (FB.ok) {
            try {
                await FB.db.collection('wallets').doc(this.wallet.id).update({
                    balance: firebase.firestore.FieldValue.increment(-price),
                    unlockedPosts: firebase.firestore.FieldValue.arrayUnion(post.id)
                });
                const snap = await FB.db.collection('wallets').doc(this.wallet.id).get();
                this.wallet = snap.data();
                this.updateUI();
                return true;
            } catch (e) {}
        }
        await this.save({ balance: (this.wallet.balance || 0) - price, unlockedPosts: [...(this.wallet.unlockedPosts || []), post.id] });
        return true;
    }
};

// ==================== 11. AUTH (Public users) ====================
const UserAuth = {
    mode: 'register',
    
    init() {
        const close = document.getElementById('auth-close');
        if (close) close.addEventListener('click', () => UI.closeModal('auth-modal'));
        
        const regTab = document.getElementById('auth-register-tab');
        const logTab = document.getElementById('auth-login-tab');
        if (regTab) regTab.addEventListener('click', () => this.setMode('register'));
        if (logTab) logTab.addEventListener('click', () => this.setMode('login'));
        
        const form = document.getElementById('auth-form');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
    },
    
    setMode(m) {
        this.mode = m;
        document.getElementById('auth-register-tab').classList.toggle('active', m === 'register');
        document.getElementById('auth-login-tab').classList.toggle('active', m === 'login');
        document.getElementById('auth-name-group').style.display = m === 'register' ? 'block' : 'none';
        const title = document.getElementById('auth-title');
        const submit = document.querySelector('#auth-submit span');
        if (m === 'register') { title.textContent = I18n.t('auth.registerOk').split('!')[0] || 'Create Account'; if (submit) submit.textContent = 'Create Account'; }
        else { title.textContent = 'Login'; if (submit) submit.textContent = 'Login'; }
        document.getElementById('auth-error').style.display = 'none';
    },
    
    async submit() {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-password').value;
        const name = (document.getElementById('auth-name').value || '').trim();
        const err = document.getElementById('auth-error');
        
        if (!FB.ok) { err.textContent = 'Firebase not available'; err.style.display = 'block'; return; }
        
        try {
            if (this.mode === 'register') {
                const cred = await FB.auth.createUserWithEmailAndPassword(email, pass);
                if (name) await cred.user.updateProfile({ displayName: name });
                try {
                    await FB.db.collection('users').doc(cred.user.uid).set({ email: email, name: name || 'User', role: 'user', createdAt: Date.now() });
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
    }
};

// ==================== 12. COMMENTS ====================
const Comments = {
    sort: 'latest',
    
    async load(postId) {
        if (FB.ok) {
            try {
                const snap = await FB.db.collection('comments').where('postId', '==', postId).where('approved', '==', true).get();
                return snap.docs.map(d => d.data());
            } catch (e) {}
        }
        return LS.get('kenven_hub_comments_cache', []).filter(c => c.postId === postId && c.approved);
    },
    
    render(postId, list) {
        const sorted = this.sortList(list);
        const top = sorted.filter(c => !c.parentId);
        const box = document.getElementById('comments-list');
        if (box) {
            box.innerHTML = top.length ? top.map(c => this.renderOne(c, sorted, 0)).join('') :
                '<div class="empty-state"><p>' + I18n.t('comments.empty') + '</p></div>';
        }
        this.bind(postId);
    },
    
    renderOne(c, all, depth) {
        const replies = all.filter(r => r.parentId === c.id);
        return '<div class="comment">' +
            '<div class="comment-card ' + (c.isAdmin ? 'admin-comment' : '') + '">' +
            '<div class="comment-header"><div class="comment-avatar">' + Utils.escapeHtml((c.authorName || '?').charAt(0).toUpperCase()) + '</div>' +
            '<div><div class="comment-author">' + Utils.escapeHtml(c.authorName || '') + (c.isAdmin ? ' <span class="badge badge-neon">Admin</span>' : '') + '</div>' +
            '<div class="comment-date">' + Utils.formatDate(c.createdAt, I18n.lang) + '</div></div></div>' +
            '<div class="comment-content">' + Utils.escapeHtml(c.content || '') + '</div>' +
            '<div class="comment-actions">' +
            '<button class="comment-like-btn" data-id="' + c.id + '"><i class="fas fa-heart"></i> <span>' + (c.likes || 0) + '</span></button>' +
            (depth < 2 ? '<button class="comment-reply-btn" data-id="' + c.id + '"><i class="fas fa-reply"></i> ' + I18n.t('comments.reply') + '</button>' : '') +
            '</div></div>' +
            (replies.length ? '<div class="comment-replies">' + replies.map(r => this.renderOne(r, all, depth + 1)).join('') + '</div>' : '') +
            '</div>';
    },
    
    sortList(list) {
        const s = [...list];
        if (this.sort === 'oldest') s.sort((a, b) => a.createdAt - b.createdAt);
        else if (this.sort === 'liked') s.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        else s.sort((a, b) => b.createdAt - a.createdAt);
        return s;
    },
    
    bind(postId) {
        document.querySelectorAll('.comment-like-btn').forEach(b => b.onclick = (e) => this.like(e.currentTarget.dataset.id, e.currentTarget));
        document.querySelectorAll('.comment-reply-btn').forEach(b => b.onclick = (e) => this.replyForm(e.currentTarget.dataset.id, postId));
    },
    
    async like(id, btn) {
        const liked = LS.get(CONFIG.keys.likedComments, []);
        if (liked.includes(id)) return;
        liked.push(id); LS.set(CONFIG.keys.likedComments, liked);
        if (FB.ok) { try { await FB.db.collection('comments').doc(id).update({ likes: firebase.firestore.FieldValue.increment(1) }); } catch (e) {} }
        const span = btn.querySelector('span');
        if (span) span.textContent = parseInt(span.textContent || 0) + 1;
        UI.showToast(I18n.t('comments.liked'), 'success');
    },
    
    replyForm(id, postId) {
        const card = document.querySelector('.comment-card');
        const existing = document.getElementById('reply-form-' + id);
        if (existing) { existing.remove(); return; }
        const html = '<div class="comment-form" id="reply-form-' + id + '" style="margin: var(--space-md) 0 0 var(--space-2xl);">' +
            '<input type="text" class="form-input rf-name" placeholder="' + I18n.t('comments.name') + '" style="margin-bottom: var(--space-sm);">' +
            '<input type="email" class="form-input rf-email" placeholder="' + I18n.t('comments.email') + '" style="margin-bottom: var(--space-sm);">' +
            '<textarea class="form-textarea rf-content" placeholder="' + I18n.t('comments.content') + '" style="margin-bottom: var(--space-sm);"></textarea>' +
            '<button class="btn btn-primary btn-sm rf-submit">' + I18n.t('comments.reply') + '</button></div>';
        const target = document.querySelector('[data-id="' + id + '"].comment-reply-btn');
        if (target) target.closest('.comment-card').insertAdjacentHTML('beforeend', html);
        document.querySelector('#reply-form-' + id + ' .rf-submit').onclick = () => this.submit(postId, id);
    },
    
    async submit(postId, parentId = null) {
        const prefix = parentId ? '#reply-form-' + parentId + ' ' : '#comment-form ';
        const nameEl = document.querySelector(parentId ? prefix + '.rf-name' : '#comment-name');
        const emailEl = document.querySelector(parentId ? prefix + '.rf-email' : '#comment-email');
        const contentEl = document.querySelector(parentId ? prefix + '.rf-content' : '#comment-content');
        if (!nameEl || !emailEl || !contentEl) return;
        
        const name = nameEl.value.trim(), email = emailEl.value.trim(), content = contentEl.value.trim();
        if (!name || !content || !Utils.isValidEmail(email)) { UI.showToast(I18n.t('comments.fillAll'), 'error'); return; }
        
        const times = LS.get(CONFIG.keys.commentTimes, []).filter(t => Date.now() - t < 60000);
        if (times.length >= 5) { UI.showToast(I18n.t('comments.rateLimit'), 'warning'); return; }
        times.push(Date.now()); LS.set(CONFIG.keys.commentTimes, times);
        
        const comment = { id: Utils.genId(), postId: postId, authorName: name, authorEmail: email, content: content, parentId: parentId, isAdmin: false, approved: true, likes: 0, createdAt: Date.now() };
        
        if (FB.ok) { try { await FB.db.collection('comments').doc(comment.id).set(comment); } catch (e) {} }
        else { const all = LS.get('kenven_hub_comments_cache', []); all.push(comment); LS.set('kenven_hub_comments_cache', all); }
        
        UI.showToast(I18n.t('comments.success'), 'success');
        const list = await this.load(postId);
        this.render(postId, list);
        const form = document.getElementById('comment-form');
        if (form && !parentId) form.reset();
    }
};

// ==================== 13. PAGES ====================
const Pages = {
    lang() { return I18n.lang; },
    
    postCard(p) {
        const L = this.lang();
        const cat = Data.catById(p.category);
        const price = p.coinPrice || 0;
        return '<article class="card post-card reveal">' +
            '<div class="post-card-image"><img src="' + (p.coverImage || '') + '" alt="' + Utils.escapeHtml(p.title?.[L] || '') + '" loading="lazy">' +
            (cat ? '<span class="post-card-category" style="color:' + cat.color + '"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</span>' : '') +
            '<span class="post-card-price ' + (price === 0 ? 'free' : '') + '"><i class="fas ' + (price === 0 ? 'fa-check' : 'fa-coins') + '"></i> ' + (price === 0 ? I18n.t('post.free') : price) + '</span></div>' +
            '<div class="post-card-body"><h3 class="post-card-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</h3>' +
            '<p class="post-card-excerpt">' + Utils.escapeHtml(p.excerpt?.[L] || '') + '</p>' +
            '<div class="post-card-meta"><span><i class="fas fa-eye"></i> ' + (p.views || 0) + '</span>' +
            '<span><i class="fas fa-clock"></i> ' + Utils.readingTime(p.content?.[L]) + ' ' + I18n.t('post.readingTime') + '</span></div></div>' +
            '<a href="#post/' + p.slug + '" class="post-card-link" aria-label="' + Utils.escapeHtml(p.title?.[L] || '') + '"></a></article>';
    },
    
    home(c) {
        const L = this.lang();
        const feat = Data.featured();
        const latest = Data.latest(6);
        c.innerHTML =
            '<section class="hero reveal active"><div class="hero-badge"><span>' + I18n.t('hero.badge') + '</span></div>' +
            '<h1 class="hero-title">KENVEN HUB</h1><p class="hero-subtitle">' + I18n.t('hero.subtitle') + '</p>' +
            '<div class="hero-actions"><a href="#posts" class="btn btn-primary"><i class="fas fa-rocket"></i> ' + I18n.t('hero.btn.explore') + '</a>' +
            '<a href="#affiliate" class="btn btn-secondary"><i class="fas fa-tag"></i> ' + I18n.t('hero.btn.deals') + '</a></div></section>' +
            (feat ? '<section class="reveal"><div class="section-header"><h2 class="section-title"><i class="fas fa-star"></i> ' + I18n.t('section.featured') + '</h2></div>' + this.featuredCard(feat) + '</section>' : '') +
            '<section class="reveal"><div class="section-header"><h2 class="section-title"><i class="fas fa-fire"></i> ' + I18n.t('section.latest') + '</h2><a href="#posts" class="section-link">' + I18n.t('section.viewAll') + ' <i class="fas fa-arrow-right"></i></a></div>' +
            '<div class="posts-grid">' + latest.map(p => this.postCard(p)).join('') + '</div></section>' +
            '<section class="reveal" style="margin-top: var(--space-3xl);"><div class="section-header"><h2 class="section-title"><i class="fas fa-folder-open"></i> ' + I18n.t('section.categories') + '</h2></div>' +
            '<div class="categories-grid">' + Data.categories.map(cat => this.catCard(cat)).join('') + '</div></section>';
    },
    
    featuredCard(p) {
        const L = this.lang();
        const cat = Data.catById(p.category);
        return '<article class="featured-card reveal active"><div class="featured-card-image"><img src="' + p.coverImage + '" alt="" loading="lazy"></div>' +
            '<div class="featured-card-content"><div class="featured-badge"><i class="fas fa-star"></i> ' + I18n.t('section.featured') + '</div>' +
            (cat ? '<span class="badge" style="color:' + cat.color + ';border:1px solid ' + cat.color + ';background:' + cat.color + '20;"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</span>' : '') +
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
    
    category(c, slug) {
        const L = this.lang();
        const cat = Data.catBySlug(slug);
        if (!cat) { this.notFound(c); return; }
        const posts = Data.byCategory(slug);
        c.innerHTML = '<section><div class="section-header"><h1 class="section-title" style="color:' + cat.color + ';"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</h1></div>' +
            (posts.length ? '<div class="posts-grid">' + posts.map(p => this.postCard(p)).join('') + '</div>' : '<div class="empty-state"><p>' + I18n.t('empty.posts') + '</p></div>') + '</section>';
    },
    
    categories(c) {
        c.innerHTML = '<section><div class="section-header"><h1 class="section-title"><i class="fas fa-folder-open"></i> ' + I18n.t('nav.categories') + '</h1></div>' +
            '<div class="categories-grid">' + Data.categories.map(cat => this.catCard(cat)).join('') + '</div></section>';
    },
    
    affiliate(c) {
        const L = this.lang();
        const tools = Data.affiliate.length ? Data.affiliate : [
            { name: 'Hostinger', icon: 'fa-server', color: '#673DE6', rating: 4.8, description: 'Premium hosting + free domain', url: 'https://hostinger.com' },
            { name: 'Canva', icon: 'fa-palette', color: '#00C4CC', rating: 4.9, description: 'Design anything easily', url: 'https://canva.com' }
        ];
        c.innerHTML = '<section style="text-align:center;"><div class="section-header" style="justify-content:center;"><h1 class="section-title"><i class="fas fa-tag"></i> ' + I18n.t('nav.deals') + '</h1></div>' +
            '<p style="max-width:600px;margin:0 auto var(--space-xl);">' + I18n.t('deals.subtitle') + '</p>' +
            '<div class="affiliate-disclosure" style="text-align:start;"><p><i class="fas fa-info-circle" style="color:var(--neon-yellow);"></i> ' + I18n.t('affiliate.disclosure.text') + '</p></div>' +
            '<div class="posts-grid" style="text-align:start;">' + tools.map(t =>
                '<div class="card reveal"><div style="padding:var(--space-xl);text-align:center;">' +
                '<div style="width:60px;height:60px;margin:0 auto var(--space-md);border-radius:var(--radius-md);background:' + (t.color || '#5B9FFF') + '20;color:' + (t.color || '#5B9FFF') + ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="fas ' + (t.icon || 'fa-link') + '"></i></div>' +
                '<h3>' + Utils.escapeHtml(t.name || '') + '</h3>' +
                '<div style="color:var(--neon-yellow);margin-bottom:var(--space-sm);">★ ' + (t.rating || 5) + '</div>' +
                '<p style="font-size:.9rem;">' + Utils.escapeHtml(t.description || t.desc?.[L] || '') + '</p>' +
                '<a href="' + Utils.escapeHtml(t.url || '#') + '" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-primary" style="width:100%;">' + I18n.t('affiliate.visit') + ' <i class="fas fa-external-link-alt"></i></a></div></div>'
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
        c.innerHTML = '<section style="text-align:center;padding:var(--space-3xl) 0;"><h1 style="font-family:var(--font-mono);font-size:5rem;color:var(--neon);">404</h1>' +
            '<p>' + I18n.t('post.notFound') + '</p><a href="#home" class="btn btn-primary">' + I18n.t('btn.backHome') + '</a></section>';
    },
    
    // ---- FULL POST PAGE ----
    async post(c, slug) {
        const L = this.lang();
        const p = Data.bySlug(slug);
        if (!p) { this.notFound(c); return; }
        Data.addView(p.id);
        
        const cat = Data.catById(p.category);
        const price = p.coinPrice || 0;
        const unlocked = price === 0 || Coins.isUnlocked(p.id);
        const rawContent = Utils.sanitizeHtml(p.content?.[L] || p.content?.en || '');
        
        // TOC
        let toc = '';
        const heads = [...rawContent.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi)];
        if (heads.length) {
            toc = '<div class="post-toc reveal"><h3><i class="fas fa-list"></i> ' + I18n.t('post.toc') + '</h3><ul class="toc-list">' +
                heads.map((h, i) => '<li><a href="#sec-' + i + '">' + h[2].replace(/<[^>]*>/g, '') + '</a></li>').join('') + '</ul></div>';
        }
        let contentHtml = rawContent;
        heads.forEach((h, i) => { contentHtml = contentHtml.replace(h[0], h[0].replace('<h' + h[1], '<h' + h[1] + ' id="sec-' + i + '"')); });
        
        // Inline affiliate injection
        const affIds = p.affiliateIds && p.affiliateIds.length ? p.affiliateIds : (p.isAffiliate && Data.affiliate.length ? [Data.affiliate[0].id] : []);
        const affBoxes = affIds.map(id => Data.affiliate.find(a => a.id === id)).filter(Boolean);
        if (affBoxes.length) {
            const segments = contentHtml.split(/(<h2[^>]*>)/);
            if (segments.length > 3) {
                const idx = 1 + (Utils.hashCode(p.id) % Math.max(1, Math.floor((segments.length - 1) / 2))) * 2;
                const a = affBoxes[0];
                const box = '<div class="inline-affiliate"><div class="inline-affiliate-icon"><i class="fas ' + (a.icon || 'fa-tag') + '"></i></div>' +
                    '<div class="inline-affiliate-info"><div class="inline-affiliate-name">' + Utils.escapeHtml(a.name || '') + '</div>' +
                    '<div class="inline-affiliate-stars">★ ' + (a.rating || 5) + '</div>' +
                    '<div class="inline-affiliate-desc">' + Utils.escapeHtml(a.description || '') + '</div>' +
                    '<span class="inline-affiliate-tag">' + I18n.t('affiliate.sponsored') + '</span></div>' +
                    '<a href="' + Utils.escapeHtml(a.url || '#') + '" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-gold btn-sm">' + I18n.t('affiliate.visit') + ' <i class="fas fa-external-link-alt"></i></a></div>';
                segments.splice(Math.min(idx, segments.length - 1), 0, box);
                contentHtml = segments.join('');
            }
        }
        
        // Paywall
        let bodyHtml;
        if (unlocked) {
            bodyHtml = '<div class="post-content reveal">' + contentHtml + '</div>';
        } else {
            const preview = contentHtml.split('</p>')[0] + '</p>';
            bodyHtml = '<div class="paywall-wrapper">' +
                '<div class="paywall-preview">' + preview + '</div>' +
                '<div class="paywall-card"><div class="paywall-icon"><i class="fas fa-lock"></i></div>' +
                '<h2 class="paywall-title">' + I18n.t('paywall.title') + '</h2>' +
                '<p class="paywall-text">' + I18n.t('paywall.text') + '</p>' +
                '<div class="paywall-price"><i class="fas fa-coins"></i> ' + price + ' <small>' + I18n.t('coins.coins') + '</small></div>' +
                '<div class="paywall-actions"><button class="btn btn-gold" id="unlock-btn"><i class="fas fa-unlock"></i> ' + I18n.t('paywall.unlock') + ' ' + price + '</button>' +
                '<button class="btn btn-secondary" id="earn-more-btn"><i class="fas fa-coins"></i> ' + I18n.t('paywall.earn') + '</button></div>' +
                '<div class="paywall-balance">' + I18n.t('paywall.balance') + ': <strong style="color:var(--gold);">' + (Coins.wallet?.balance || 0) + '</strong></div></div></div>';
        }
        
        c.innerHTML = '<article class="post-page">' +
            '<header class="post-header reveal active">' +
            (cat ? '<a href="#category/' + cat.slug + '" class="badge" style="color:' + cat.color + ';border:1px solid ' + cat.color + ';background:' + cat.color + '20;"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</a>' : '') +
            '<h1 class="post-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</h1>' +
            '<div class="post-meta"><span><i class="fas fa-calendar"></i> ' + Utils.formatDate(p.createdAt, L) + '</span>' +
            '<span><i class="fas fa-clock"></i> ' + Utils.readingTime(rawContent) + ' ' + I18n.t('post.readingTime') + '</span>' +
            '<span><i class="fas fa-eye"></i> ' + (p.views || 0) + ' ' + I18n.t('post.views') + '</span></div></header>' +
            '<div class="post-cover reveal"><img src="' + (p.coverImage || '') + '" alt="" loading="lazy"></div>' +
            (p.isAffiliate ? '<div class="affiliate-disclosure reveal"><h3><i class="fas fa-info-circle"></i> ' + I18n.t('affiliate.disclosure.title') + '</h3><p>' + I18n.t('affiliate.disclosure.text') + '</p></div>' : '') +
            toc + bodyHtml +
            (p.downloadLink && unlocked ? '<div style="text-align:center;margin:var(--space-2xl) 0;"><a href="' + Utils.escapeHtml(p.downloadLink) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary glow" style="font-size:1.15rem;padding:var(--space-lg) var(--space-2xl);"><i class="fas fa-download"></i> ' + Utils.escapeHtml(p.buttonText?.[L] || p.buttonText?.en || 'Download') + '</a></div>' : '') +
            '<div style="text-align:center;margin:var(--space-2xl) 0;"><button class="btn btn-secondary" id="share-post-btn"><i class="fas fa-share-alt"></i> ' + I18n.t('post.share') + '</button></div>' +
            (Data.related(p).length ? '<section class="reveal"><h2 class="section-title"><i class="fas fa-link"></i> ' + I18n.t('post.related') + '</h2><div class="posts-grid">' + Data.related(p).map(x => this.postCard(x)).join('') + '</div></section>' : '') +
            '<section class="comments-section reveal"><div class="comments-header"><h2 class="section-title"><i class="fas fa-comments"></i> ' + I18n.t('comments.title') + '</h2>' +
            '<div class="comments-sort"><button class="filter-chip active" data-sort="latest">' + I18n.t('comments.sort.latest') + '</button><button class="filter-chip" data-sort="oldest">' + I18n.t('comments.sort.oldest') + '</button><button class="filter-chip" data-sort="liked">' + I18n.t('comments.sort.liked') + '</button></div></div>' +
            '<form class="comment-form" id="comment-form"><div class="form-group"><input type="text" id="comment-name" class="form-input" placeholder="' + I18n.t('comments.name') + '"></div>' +
            '<div class="form-group"><input type="email" id="comment-email" class="form-input" placeholder="' + I18n.t('comments.email') + '"></div>' +
            '<div class="form-group"><textarea id="comment-content" class="form-textarea" placeholder="' + I18n.t('comments.content') + '"></textarea></div>' +
            '<button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> ' + I18n.t('comments.submit') + '</button></form>' +
            '<div id="comments-list"></div></section></article>';
        
        // Bind post events
        document.getElementById('share-post-btn')?.addEventListener('click', () => UI.openModal('share-modal'));
        document.getElementById('comment-form')?.addEventListener('submit', (e) => { e.preventDefault(); Comments.submit(p.id); });
        document.querySelectorAll('.comments-sort .filter-chip').forEach(b => b.onclick = async (e) => {
            document.querySelectorAll('.comments-sort .filter-chip').forEach(x => x.classList.remove('active'));
            e.target.classList.add('active');
            Comments.sort = e.target.dataset.sort;
            Comments.render(p.id, await Comments.load(p.id));
        });
        
        const unlockBtn = document.getElementById('unlock-btn');
        if (unlockBtn) unlockBtn.onclick = async () => {
            const ok = await Coins.unlockPost(p);
            if (ok) { UI.showToast(I18n.t('coins.unlocked'), 'success'); Router.renderCurrent(); }
        };
        document.getElementById('earn-more-btn')?.addEventListener('click', () => UI.openModal('coins-modal'));
        
        // Load comments async
        const list = await Comments.load(p.id);
        Comments.render(p.id, list);
        Effects.reveal();
    }
};

// ==================== 14. ROUTER ====================
const Router = {
    route: '',
    
    init() {
        addEventListener('hashchange', () => this.handle());
        this.handle();
    },
    
    handle() {
        this.route = location.hash.slice(1) || 'home';
        const mm = document.getElementById('mobile-menu');
        if (mm) mm.classList.remove('open');
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(l => l.classList.toggle('active', (l.getAttribute('href') || '').slice(1) === this.route));
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
        else Pages.notFound(c);
        Effects.reveal();
    }
};

// ==================== 15. SEARCH / SHARE / NEWSLETTER / NAVBAR ====================
const Search = {
    filter: 'all',
    init() {
        document.getElementById('search-btn')?.addEventListener('click', () => { UI.openModal('search-modal'); setTimeout(() => document.getElementById('search-input')?.focus(), 100); });
        document.getElementById('search-close')?.addEventListener('click', () => UI.closeModal('search-modal'));
        document.querySelector('#search-modal .modal-backdrop')?.addEventListener('click', () => UI.closeModal('search-modal'));
        document.getElementById('search-input')?.addEventListener('input', Utils.debounce((e) => this.run(e.target.value), 300));
        document.querySelectorAll('.search-filters .filter-chip').forEach(ch => ch.addEventListener('click', (e) => {
            document.querySelectorAll('.search-filters .filter-chip').forEach(x => x.classList.remove('active'));
            e.target.classList.add('active');
            this.filter = e.target.dataset.filter;
            this.run(document.getElementById('search-input').value);
        }));
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k')) { e.preventDefault(); UI.openModal('search-modal'); }
            if (e.key === 'Escape') UI.closeAll();
        });
    },
    run(q) {
        const box = document.getElementById('search-results');
        if (!box) return;
        if (!q.trim()) { box.innerHTML = '<div class="search-empty">' + I18n.t('search.empty') + '</div>'; return; }
        const res = Data.search(q, this.filter);
        const L = I18n.lang;
        box.innerHTML = res.length ? '<div style="color:var(--text-muted);font-size:.85rem;margin-bottom:var(--space-md);">' + res.length + ' ' + I18n.t('search.results') + '</div>' +
            res.map(p => '<div class="search-result-item" onclick="location.hash=\'post/' + p.slug + '\';UI.closeModal(\'search-modal\');"><img src="' + p.coverImage + '" class="search-result-image" alt="" loading="lazy"><div><div class="search-result-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</div><div class="search-result-excerpt">' + Utils.escapeHtml(Utils.truncate(p.excerpt?.[L] || '')) + '</div></div></div>').join('')
            : '<div class="search-empty">' + I18n.t('search.noResults') + ' "' + Utils.escapeHtml(q) + '"</div>';
    }
};

const Share = {
    init() {
        document.getElementById('share-close')?.addEventListener('click', () => UI.closeModal('share-modal'));
        document.querySelector('#share-modal .modal-backdrop')?.addEventListener('click', () => UI.closeModal('share-modal'));
        document.querySelectorAll('.share-btn').forEach(b => b.addEventListener('click', (e) => this.do(e.currentTarget.dataset.platform)));
    },
    do(platform) {
        const url = location.href, title = document.title;
        const urls = {
            twitter: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title),
            facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
            whatsapp: 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url),
            telegram: 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title)
        };
        if (platform === 'copy') Utils.copy(url).then(ok => UI.showToast(ok ? I18n.t('toast.copied') : I18n.t('toast.error'), ok ? 'success' : 'error'));
        else if (urls[platform]) open(urls[platform], '_blank', 'width=600,height=400');
        UI.closeModal('share-modal');
    }
};

const Newsletter = {
    init() {
        document.getElementById('newsletter-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('newsletter-email');
            const email = input.value.trim();
            if (!Utils.isValidEmail(email)) { UI.showToast(I18n.t('newsletter.error'), 'error'); return; }
            if (FB.ok) { try { await FB.db.collection('subscribers').add({ email: email, date: Date.now() }); } catch (err) {} }
            input.value = '';
            UI.showToast(I18n.t('newsletter.success'), 'success');
        });
    }
};

const Navbar = {
    init() {
        addEventListener('scroll', Utils.debounce(() => document.getElementById('navbar')?.classList.toggle('scrolled', scrollY > 50), 100));
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        btn?.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            btn.setAttribute('aria-expanded', open);
            btn.querySelector('i').className = open ? 'fas fa-times' : 'fas fa-bars';
        });
        document.getElementById('lang-switcher')?.addEventListener('click', () => I18n.toggle());
        document.getElementById('effects-toggle')?.addEventListener('click', () => Effects.toggle());
        
        // Admin shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) { e.preventDefault(); location.href = 'admin.html'; }
        });
        let buf = '';
        document.addEventListener('keypress', (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            buf += e.key.toLowerCase();
            if (buf.includes('admin')) { location.href = 'admin.html'; buf = ''; }
            if (buf.length > 10) buf = buf.slice(-10);
        });
        if (location.hash === '#admin') location.href = 'admin.html';
        
        // Footer categories
        const fc = document.getElementById('footer-categories');
        if (fc) fc.innerHTML = Data.categories.map(cat => '<li><a href="#category/' + cat.slug + '">' + Utils.escapeHtml(cat.name[I18n.lang]) + '</a></li>').join('');
        
        // Ripple
        document.addEventListener('click', (e) => {
            const b = e.target.closest('.btn');
            if (b && Effects.enabled) {
                const r = document.createElement('span');
                r.className = 'ripple';
                const rect = b.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                r.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - rect.left - size / 2) + 'px;top:' + (e.clientY - rect.top - size / 2) + 'px;';
                b.appendChild(r);
                setTimeout(() => r.remove(), 600);
            }
        });
    }
};

// ==================== 16. APP INIT ====================
const App = {
    async init() {
        try {
            console.log('🚀 Kenven Hub starting...');
            FB.init();
            I18n.init();
            Theme.init();
            Effects.init();
            await Data.load();
            await Coins.init();
            UserAuth.init();
            Navbar.init();
            Search.init();
            Share.init();
            Newsletter.init();
            Router.init();
            
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

// Error boundary - keep site alive
window.addEventListener('error', (e) => { console.warn('Caught:', e.message); });

document.addEventListener('DOMContentLoaded', () => App.init());

// Global exposure for inline handlers
window.UI = UI;
window.Router = Router;
