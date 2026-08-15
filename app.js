/* ================================================================
   KENVEN HUB - MAIN APPLICATION (ARMORED + ORGANIZED)
   Mirror Storage + Code Rotation + Auth Persistence
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
        walletMeta: 'kenven_hub_wallet_meta',   // { id, isGuest }
        uidMap: 'kenven_hub_uid_map',            // { "firebaseUID": "walletID" }
        mirror: 'kenven_hub_mirror',             // { walletID: {...walletData} }
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
    
    todayStr() { return new Date().toDateString(); }
};

// ==================== 3. LOCAL STORAGE ====================
const LS = {
    get(k, d = null) {
        try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
        catch (e) { return d; }
    },
    set(k, v) {
        try { localStorage.setItem(k, JSON.stringify(v)); }
        catch (e) { console.warn('LS set failed', e); }
    },
    remove(k) { localStorage.removeItem(k); }
};

// ==================== 4. FIREBASE CORE ====================
const FB = {
    db: null,
    auth: null,
    ok: false,
    user: null,
    userPromise: null,
    
    init() {
        try {
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(CONFIG.firebase);
                this.db = firebase.firestore();
                this.auth = firebase.auth();
                this.ok = true;
                
                // Persistence: LOCAL (survives reloads / browser restarts)
                this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                    .catch(e => console.warn('Persistence error:', e));
                
                this.userPromise = new Promise(resolve => {
                    this.auth.onAuthStateChanged(user => {
                        this.user = user;
                        resolve(user);
                    });
                });
            }
        } catch (e) {
            console.warn('Firebase init failed:', e);
            this.ok = false;
        }
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
        'hero.badge': { en: '✨ Your Resource Center', ar: '✨ مركز الموارد الخاص بك' },
        'hero.subtitle': {
            en: 'Discover the best apps, tools, tutorials, and exclusive deals.',
            ar: 'اكتشف أفضل التطبيقات والأدوات والشروحات والعروض الحصرية.'
        },
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
        'affiliate.disclosure.text': {
            en: 'This post contains affiliate links. We may earn a commission at no extra cost.',
            ar: 'يحتوي على روابط أفلييت. قد نحصل على عمولة دون تكلفة إضافية.'
        },
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
        'deals.subtitle': {
            en: 'Exclusive deals on tools and services',
            ar: 'عروض حصرية على الأدوات والخدمات'
        },
        'about.text': {
            en: 'Kenven Hub is your resource center for apps, tools, tutorials, and deals.',
            ar: 'Kenven Hub مركزك الشامل للتطبيقات والأدوات والشروحات والعروض.'
        },
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
        'theme.dark': { en: 'Dark mode', ar: 'وضع ليلي' }
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
        if (l) {
            l.classList.add('hidden');
            setTimeout(() => l.style.display = 'none', 600);
        }
    },
    
    showToast(msg, type = 'info', dur = 3000) {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.innerHTML = '<i class="fas ' + icons[type] + ' toast-icon"></i><span class="toast-message">' +
            Utils.escapeHtml(msg) + '</span>';
        c.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 300);
        }, dur);
    },
    
    openModal(id) {
        const m = document.getElementById(id);
        if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
    },
    
    closeModal(id) {
        const m = document.getElementById(id);
        if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
    },
    
    closeAll() {
        document.querySelectorAll('.modal.open').forEach(m => this.closeModal(m.id));
    }
};

// ==================== 8. EFFECTS ====================
const Effects = {
    enabled: true,
    raf: null,
    particles: [],
    
    init() {
        this.enabled = LS.get(CONFIG.keys.effects, true) !== false;
        this.apply();
        this.initScroll();
    },
    
    apply() {
        document.body.classList.toggle('effects-disabled', !this.enabled);
        document.getElementById('effects-toggle')?.classList.toggle('active', this.enabled);
        if (this.enabled) {
            this.initCursor();
            this.initParticles();
        } else {
            this.stopParticles();
            document.body.style.cursor = '';
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        LS.set(CONFIG.keys.effects, this.enabled);
        this.apply();
    },
    
    initCursor() {
        const d = document.getElementById('cursor-dot');
        const r = document.getElementById('cursor-ring');
        if (!d || !r || !matchMedia('(hover: hover)').matches) return;
        document.body.style.cursor = 'none';
        
        document.addEventListener('mousemove', (e) => {
            d.style.left = e.clientX + 'px';
            d.style.top = e.clientY + 'px';
            r.style.left = e.clientX + 'px';
            r.style.top = e.clientY + 'px';
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
            x: Math.random() * c.width,
            y: Math.random() * c.height,
            s: Math.random() * 2 + 1,
            vx: (Math.random() - .5) * .4,
            vy: (Math.random() - .5) * .4,
            o: Math.random() * .4 + .15
        }));
        
        const draw = () => {
            if (!this.enabled) return;
            ctx.clearRect(0, 0, c.width, c.height);
            const rgb = document.body.classList.contains('light-theme') ? '46,123,255' : '91,159,255';
            
            this.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = c.width;
                if (p.x > c.width) p.x = 0;
                if (p.y < 0) p.y = c.height;
                if (p.y > c.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + rgb + ',' + p.o + ')';
                ctx.fill();
            });
            
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const a = this.particles[i], b = this.particles[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < 100) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.1 * (1 - d / 100)) + ')';
                        ctx.lineWidth = .5;
                        ctx.stroke();
                    }
                }
            }
            this.raf = requestAnimationFrame(draw);
        };
        draw();
    },
    
    stopParticles() {
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    },
    
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
            } catch (e) {
                console.warn('Firestore load failed, using cache:', e);
            }
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
            try { await FB.db.collection('posts').doc(pid).update({ views: firebase.firestore.FieldValue.increment(1) }); }
            catch (e) {}
        }
    },
    
    search(q, c = 'all') {
        const l = q.toLowerCase();
        return this.published().filter(p => {
            const ok = c === 'all' || p.category === c;
            const h = [
                p.title?.en || '', p.title?.ar || '',
                p.excerpt?.en || '', p.excerpt?.ar || '',
                (p.tags || []).join(' ')
            ].join(' ').toLowerCase();
            return ok && h.includes(l);
        });
    }
};

// ==================== 10. MIRROR STORAGE (Cloud + Local) ====================
const Mirror = {
    async writeWallet(wallet) {
        // 1) Save to local mirror immediately
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        mirror[wallet.id] = wallet;
        LS.set(CONFIG.keys.mirror, mirror);
        
        // 2) Try to save to cloud
        if (FB.ok) {
            try {
                await FB.db.collection('wallets').doc(wallet.id).set(wallet, { merge: true });
                return { ok: true, source: 'cloud' };
            } catch (e) {
                console.warn('Cloud write failed, mirror used:', e);
                return { ok: false, source: 'mirror', error: e.message };
            }
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
            } catch (e) {
                console.warn('Cloud read failed, using mirror:', e);
            }
        }
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        return mirror[id] || null;
    },
    
    async createWallet(wallet) {
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        mirror[wallet.id] = wallet;
        LS.set(CONFIG.keys.mirror, mirror);
        if (FB.ok) {
            try {
                await FB.db.collection('wallets').doc(wallet.id).set(wallet);
                return { ok: true };
            } catch (e) {
                console.warn('Cloud create failed:', e);
                return { ok: false, error: e.message };
            }
        }
        return { ok: false };
    },
    
    async markTransferred(id) {
        const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
        mirror[id] = { transferred: true, id: id };
        LS.set(CONFIG.keys.mirror, mirror);
        if (FB.ok) {
            try {
                await FB.db.collection('wallets').doc(id).update({
                    transferred: true, balance: 0, unlockedPosts: [], ownerUid: null
                });
            } catch (e) {}
        }
    }
};

// ==================== 11. COINS SYSTEM (ARMORED) ====================
const Coins = {
    wallet: null,
    adTimer: null,
    
    getMeta() {
        let m = LS.get(CONFIG.keys.walletMeta);
        if (!m) {
            m = { id: Utils.genRecoveryCode(), isGuest: true };
            LS.set(CONFIG.keys.walletMeta, m);
        }
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
        
        // If logged in and we have a map, use linked wallet
        if (FB.user) {
            const map = this.getUidMap();
            if (map[FB.user.uid]) {
                const w = await Mirror.readWallet(map[FB.user.uid]);
                if (w && !w.transferred) {
                    this.wallet = w;
                    this.setMeta({ id: w.id, isGuest: false });
                    this.bindUI();
                    this.updateUI();
                    return;
                }
            }
        }
        
        // Not logged in: use current meta
        const meta = this.getMeta();
        let w = await Mirror.readWallet(meta.id);
        
        if (!w) {
            w = {
                id: meta.id,
                balance: 0,
                unlockedPosts: [],
                recoveryCode: meta.id,
                ownerUid: FB.user ? FB.user.uid : null,
                createdAt: Date.now(),
                transferred: false
            };
            await Mirror.createWallet(w);
        }
        
        // If transferred (recovered in another device): start fresh
        if (w.transferred) {
            const newId = Utils.genRecoveryCode();
            w = {
                id: newId,
                balance: 0,
                unlockedPosts: [],
                recoveryCode: newId,
                ownerUid: FB.user ? FB.user.uid : null,
                createdAt: Date.now(),
                transferred: false
            };
            await Mirror.createWallet(w);
            this.setMeta({ id: newId, isGuest: !FB.user });
            UI.showToast(I18n.t('coins.transferred'), 'warning');
        }
        
        this.wallet = w;
        
        // Link to account if exists
        if (FB.user && !w.ownerUid) {
            w.ownerUid = FB.user.uid;
            await Mirror.writeWallet(w);
            this.setUidMap(FB.user.uid, w.id);
            this.setMeta({ id: w.id, isGuest: false });
        }
        
        this.bindUI();
        this.updateUI();
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
                if (w && !w.transferred) {
                    this.wallet = w;
                    this.setMeta({ id: w.id, isGuest: false });
                }
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
        if (mode) mode.textContent = this.wallet && this.wallet.ownerUid
            ? I18n.t('coins.member') : I18n.t('coins.guest');
        
        const rc = document.getElementById('recovery-code-display');
        if (rc) rc.textContent = this.wallet ? this.wallet.id : '---';
    },
    
    isUnlocked(pid) {
        return this.wallet && (this.wallet.unlockedPosts || []).includes(pid);
    },
    
    async addCoins(amount) {
        if (!this.wallet) return;
        this.wallet.balance = (this.wallet.balance || 0) + amount;
        await Mirror.writeWallet(this.wallet);
        this.updateUI();
    },
    
    bindUI() {
        document.getElementById('coins-btn')?.addEventListener('click', () => {
            UI.openModal('coins-modal');
            this.updateUI();
        });
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
        if (this.wallet.lastDailyGift === today) {
            UI.showToast(I18n.t('coins.dailyDone'), 'warning');
            return;
        }
        this.wallet.lastDailyGift = today;
        await Mirror.writeWallet(this.wallet);
        await this.addCoins(Data.settings.dailyGiftAmount || 1);
        UI.showToast('+' + (Data.settings.dailyGiftAmount || 1) + ' ' + I18n.t('coins.coins') + ' 🎁', 'success');
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
                clearInterval(this.adTimer);
                this.adTimer = null;
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
            if (!c.active || (c.maxUses > 0 && c.usedCount >= c.maxUses)) {
                UI.showToast(I18n.t('coins.invalidCode'), 'error');
                return;
            }
            await FB.db.collection('coin_codes').doc(code).update({ usedCount: (c.usedCount || 0) + 1 });
            await this.addCoins(c.amount || 0);
            input.value = '';
            UI.showToast('+' + c.amount + ' ' + I18n.t('coins.codeSuccess'), 'success');
        } catch (e) {
            UI.showToast(I18n.t('coins.invalidCode'), 'error');
        }
    },
    
    async restore() {
        const input = document.getElementById('restore-code-input');
        const code = (input.value || '').trim().toUpperCase();
        if (!code || !this.wallet) return;
        
        if (code === this.wallet.id) {
            UI.showToast(I18n.t('coins.sameWallet'), 'warning');
            return;
        }
        
        if (!FB.ok) { UI.showToast(I18n.t('coins.offline'), 'warning'); return; }
        
        try {
            // 1) Fetch old wallet by entered code
            const oldSnap = await FB.db.collection('wallets').doc(code).get();
            if (!oldSnap.exists) { UI.showToast(I18n.t('coins.restoreFail'), 'error'); return; }
            const old = oldSnap.data();
            if (old.transferred) { UI.showToast(I18n.t('coins.restoreFail'), 'error'); return; }
            
            // 2) Merge data into current wallet
            this.wallet.balance = (this.wallet.balance || 0) + (old.balance || 0);
            const merged = [...new Set([...(this.wallet.unlockedPosts || []), ...(old.unlockedPosts || [])])];
            this.wallet.unlockedPosts = merged;
            
            // 3) Generate NEW recovery code for new wallet
            const newId = Utils.genRecoveryCode();
            
            // 4) Create new wallet with new code
            const newWallet = {
                id: newId,
                balance: this.wallet.balance,
                unlockedPosts: this.wallet.unlockedPosts,
                recoveryCode: newId,
                ownerUid: this.wallet.ownerUid || null,
                createdAt: Date.now(),
                transferred: false,
                lastDailyGift: this.wallet.lastDailyGift || null
            };
            await Mirror.createWallet(newWallet);
            
            // 5) Mark old wallet as transferred (rules protect it from further writes)
            await Mirror.markTransferred(code);
            
            // 6) Remove old wallet from local mirror
            const mirror = LS.get(CONFIG.keys.mirror, {}) || {};
            delete mirror[code];
            LS.set(CONFIG.keys.mirror, mirror);
            
            // 7) Switch to new wallet
            this.wallet = newWallet;
            this.setMeta({ id: newId, isGuest: !this.wallet.ownerUid });
            
            // 8) Update UID map
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
    }
};

// ==================== 12. USER AUTH ====================
const UserAuth = {
    mode: 'register',
    
    init() {
        document.getElementById('auth-close')?.addEventListener('click', () => UI.closeModal('auth-modal'));
        document.getElementById('auth-register-tab')?.addEventListener('click', () => this.setMode('register'));
        document.getElementById('auth-login-tab')?.addEventListener('click', () => this.setMode('login'));
        document.getElementById('auth-form')?.addEventListener('submit', e => {
            e.preventDefault();
            this.submit();
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
        
        if (!FB.ok) {
            err.textContent = I18n.t('auth.unavailable');
            err.style.display = 'block';
            return;
        }
        
        try {
            if (this.mode === 'register') {
                const cred = await FB.auth.createUserWithEmailAndPassword(email, pass);
                if (name) await cred.user.updateProfile({ displayName: name });
                try {
                    await FB.db.collection('users').doc(cred.user.uid).set({
                        email, name: name || 'User', role: 'user', createdAt: Date.now()
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
    }
};

// ==================== 13. COMMENTS ====================
const Comments = {
    sort: 'latest',
    
    async load(pid) {
        if (FB.ok) {
            try {
                const s = await FB.db.collection('comments')
                    .where('postId', '==', pid)
                    .where('approved', '==', true)
                    .get();
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
        return '<div class="comment">' +
            '<div class="comment-card ' + (c.isAdmin ? 'admin-comment' : '') + '">' +
            '<div class="comment-header"><div class="comment-avatar">' +
            Utils.escapeHtml((c.authorName || '?').charAt(0).toUpperCase()) + '</div>' +
            '<div><div class="comment-author">' + Utils.escapeHtml(c.authorName || '') +
            (c.isAdmin ? ' <span class="badge badge-neon">Admin</span>' : '') +
            '</div><div class="comment-date">' + Utils.formatDate(c.createdAt, I18n.lang) +
            '</div></div></div>' +
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
            try { await FB.db.collection('comments').doc(id).update({ likes: firebase.firestore.FieldValue.increment(1) }); }
            catch (e) {}
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
        
        document.querySelector('[data-id="' + id + '"].comment-reply-btn')
            ?.closest('.comment-card')?.insertAdjacentHTML('beforeend', h);
        
        document.querySelector('#rf-' + id + ' .rf-submit').onclick = () => {
            this.submit(window._currentPostId, id);
        };
    },
    
    async submit(pid, parentId = null) {
        const px = parentId ? '#rf-' + parentId + ' ' : '#comment-form ';
        const n = document.querySelector(parentId ? px + '.rf-name' : '#comment-name');
        const e = document.querySelector(parentId ? px + '.rf-email' : '#comment-email');
        const c = document.querySelector(parentId ? px + '.rf-content' : '#comment-content');
        if (!n || !e || !c) return;
        
        const name = n.value.trim();
        const email = e.value.trim();
        const content = c.value.trim();
        
        if (!name || !content || !Utils.isValidEmail(email)) {
            UI.showToast(I18n.t('comments.fillAll'), 'error');
            return;
        }
        
        const times = LS.get(CONFIG.keys.commentTimes, []).filter(t => Date.now() - t < 60000);
        if (times.length >= 5) {
            UI.showToast(I18n.t('comments.rateLimit'), 'warning');
            return;
        }
        times.push(Date.now());
        LS.set(CONFIG.keys.commentTimes, times);
        
        const cm = {
            id: Utils.genId(),
            postId: pid,
            authorName: name,
            authorEmail: email,
            content,
            parentId,
            isAdmin: false,
            approved: true,
            likes: 0,
            createdAt: Date.now()
        };
        
        if (FB.ok) {
            try { await FB.db.collection('comments').doc(cm.id).set(cm); }
            catch (e) {}
        }
        
        UI.showToast(I18n.t('comments.success'), 'success');
        const list = await this.load(pid);
        this.render(pid, list);
        
        const f = document.getElementById('comment-form');
        if (f && !parentId) f.reset();
    }
};

// ==================== 14. PAGES ====================
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
        const L = this.lang();
        const f = Data.featured();
        const l = Data.latest(6);
        c.innerHTML =
            '<section class="hero reveal active"><div class="hero-badge"><span>' + I18n.t('hero.badge') + '</span></div>' +
            '<h1 class="hero-title">KENVEN HUB</h1>' +
            '<p class="hero-subtitle">' + I18n.t('hero.subtitle') + '</p>' +
            '<div class="hero-actions"><a href="#posts" class="btn btn-primary"><i class="fas fa-rocket"></i> ' + I18n.t('hero.btn.explore') + '</a>' +
            '<a href="#affiliate" class="btn btn-secondary"><i class="fas fa-tag"></i> ' + I18n.t('hero.btn.deals') + '</a></div></section>' +
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
            '<h3 class="category-name">' + Utils.escapeHtml(cat.name[L]) + '</h3>' +
            '<span class="category-count">' + n + ' ' + I18n.t('categories.posts') + '</span></div>';
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
            (p.length ? '<div class="posts-grid">' + p.map(x => this.postCard(x)).join('') + '</div>' : '<div class="empty-state"><p>' + I18n.t('empty.posts') + '</p></div>') +
            '</section>';
    },
    
    categories(c) {
        c.innerHTML = '<section><div class="section-header"><h1 class="section-title"><i class="fas fa-folder-open"></i> ' + I18n.t('nav.categories') + '</h1></div>' +
            '<div class="categories-grid">' + Data.categories.map(x => this.catCard(x)).join('') + '</div></section>';
    },
    
    affiliate(c) {
        const L = this.lang();
        const t = Data.affiliate.length ? Data.affiliate : [
            { name: 'Hostinger', icon: 'fa-server', color: '#673DE6', rating: 4.8, description: 'Premium hosting', url: 'https://hostinger.com' }
        ];
        c.innerHTML = '<section style="text-align:center;"><div class="section-header" style="justify-content:center;">' +
            '<h1 class="section-title"><i class="fas fa-tag"></i> ' + I18n.t('nav.deals') + '</h1></div>' +
            '<p style="max-width:600px;margin:0 auto var(--space-xl);">' + I18n.t('deals.subtitle') + '</p>' +
            '<div class="affiliate-disclosure" style="text-align:start;"><p><i class="fas fa-info-circle" style="color:var(--neon-yellow);"></i> ' + I18n.t('affiliate.disclosure.text') + '</p></div>' +
            '<div class="posts-grid" style="text-align:start;">' + t.map(x =>
                '<div class="card reveal"><div style="padding:var(--space-xl);text-align:center;">' +
                '<div style="width:60px;height:60px;margin:0 auto var(--space-md);border-radius:var(--radius-md);background:' + (x.color || '#5B9FFF') + '20;color:' + (x.color || '#5B9FFF') + ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="fas ' + (x.icon || 'fa-link') + '"></i></div>' +
                '<h3>' + Utils.escapeHtml(x.name || '') + '</h3>' +
                '<div style="color:var(--neon-yellow);margin-bottom:var(--space-sm);">★ ' + (x.rating || 5) + '</div>' +
                '<p style="font-size:.9rem;">' + Utils.escapeHtml(x.description || x.desc?.[L] || '') + '</p>' +
                '<a href="' + Utils.escapeHtml(x.url || '#') + '" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-primary" style="width:100%;">' + I18n.t('affiliate.visit') + ' <i class="fas fa-external-link-alt"></i></a></div></div>'
            ).join('') + '</div></section>';
    },
    
    about(c) {
        c.innerHTML = '<section style="text-align:center;max-width:800px;margin:0 auto;">' +
            '<img src="' + CONFIG.site.logo + '" alt="" style="width:100px;height:100px;border-radius:50%;margin:0 auto var(--space-xl);box-shadow:var(--shadow-neon);">' +
            '<h1>' + I18n.t('nav.about') + '</h1>' +
            '<p style="font-size:1.1rem;">' + I18n.t('about.text') + '</p>' +
            '<div class="hero-actions">' +
            '<a href="' + CONFIG.site.discord + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary"><i class="fab fa-discord"></i> Discord</a>' +
            '<a href="' + CONFIG.site.website + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fas fa-globe"></i> Kenven Service</a></div></section>';
    },
    
    privacy(c) {
        c.innerHTML = '<div class="legal-page reveal active"><h1><i class="fas fa-shield-alt"></i> ' + (I18n.lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy') + '</h1>' +
        '<p class="legal-updated">' + (I18n.lang === 'ar' ? 'آخر تحديث: أغسطس 2026' : 'Last updated: August 2026') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '1. البيانات التي نجمعها' : '1. Data We Collect') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'نجمع الحد الأدنى من البيانات اللازمة لتشغيل الموقع: بيانات المصادقة (البريد الإلكتروني) عند إنشاء حساب، بيانات المحفظة (الرصيد، الكود الاسترجاعي)، والتعليقات التي تكتبها.' : 'We collect the minimum data necessary to operate the site: authentication data (email) when creating an account, wallet data (balance, recovery code), and comments you write.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '2. استخدام البيانات' : '2. How We Use Your Data') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'تُستخدم بياناتك حصرياً لتشغيل خدمات الموقع: إدارة محفظتك، عرض تعليقاتك، وتخصيص تجربتك. لا نبيع أو نشارك بياناتك مع أي طرف ثالث.' : 'Your data is used exclusively to operate the site services: managing your wallet, displaying your comments, and personalizing your experience. We do not sell or share your data with any third party.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '3. التخزين المحلي' : '3. Local Storage') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'نستخدم localStorage لحفظ تفضيلاتك (اللغة، الثيم، التأثيرات) وبيانات محفظتك كمرآة احتياطية. يمكنك مسح هذه البيانات في أي وقت من إعدادات المتصفح.' : 'We use localStorage to save your preferences (language, theme, effects) and wallet data as a backup mirror. You can clear this data at any time from browser settings.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '4. حقوقك' : '4. Your Rights') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'يحق لك طلب الوصول إلى بياناتك أو تعديلها أو حذفها في أي وقت. تواصل معنا عبر الواتساب أو الديسكورد.' : 'You have the right to request access to, modify, or delete your data at any time. Contact us via WhatsApp or Discord.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '5. التواصل' : '5. Contact') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'لأي استفسار حول الخصوصية، تواصل معنا عبر:' : 'For any privacy inquiry, contact us via:') + ' <a href="https://wa.me/212631204978" target="_blank">WhatsApp</a> | <a href="' + CONFIG.site.discord + '" target="_blank">Discord</a></p></div>';
    },
    terms(c) {
        c.innerHTML = '<div class="legal-page reveal active"><h1><i class="fas fa-file-contract"></i> ' + (I18n.lang === 'ar' ? 'شروط الاستخدام' : 'Terms of Service') + '</h1>' +
        '<p class="legal-updated">' + (I18n.lang === 'ar' ? 'آخر تحديث: أغسطس 2026' : 'Last updated: August 2026') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '1. القبول بالشروط' : '1. Acceptance of Terms') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'باستخدامك لموقع Kenven Hub، فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام الموقع.' : 'By using Kenven Hub, you agree to these terms. If you do not agree, please do not use the site.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '2. نظام الكوينز' : '2. Coins System') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'الكوينز عملة افتراضية داخلية لا قيمة نقدية لها. لا يمكن استبدالها بأموال حقيقية. نحتفظ بحق تعديل أو إيقاف النظام في أي وقت.' : 'Coins are an internal virtual currency with no cash value. They cannot be exchanged for real money. We reserve the right to modify or discontinue the system at any time.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '3. المحتوى' : '3. Content') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'المحتوى المقدم للأغراض التعليمية والمعلوماتية فقط. نحن غير مسؤولين عن أي أضرار ناتجة عن استخدام المعلومات المنشورة.' : 'Content is provided for educational and informational purposes only. We are not responsible for any damages resulting from the use of published information.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '4. روابط الأفلييت' : '4. Affiliate Links') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'بعض المنشورات تحتوي على روابط أفلييت. قد نحصل على عمولة عند الشراء من خلالها دون أي تكلفة إضافية عليك.' : 'Some posts contain affiliate links. We may earn a commission when you purchase through them at no extra cost to you.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? '5. حدود المسؤولية' : '5. Limitation of Liability') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'لا يتحمل Kenven Hub أي مسؤولية عن أضرار مباشرة أو غير مباشرة ناتجة عن استخدام الموقع أو المحتوى المنشور فيه.' : 'Kenven Hub shall not be liable for any direct or indirect damages resulting from the use of the site or its published content.') + '</p></div>';
    },
    cookiePolicy(c) {
        c.innerHTML = '<div class="legal-page reveal active"><h1><i class="fas fa-cookie-bite"></i> ' + (I18n.lang === 'ar' ? 'سياسة الكوكيز' : 'Cookie Policy') + '</h1>' +
        '<p class="legal-updated">' + (I18n.lang === 'ar' ? 'آخر تحديث: أغسطس 2026' : 'Last updated: August 2026') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? 'ما هي الكوكيز؟' : 'What are Cookies?') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'الكوكيز ملفات نصية صغيرة تُخزن على جهازك عند زيارة الموقع. نستخدم أيضاً localStorage وهو تقنية مشابهة.' : 'Cookies are small text files stored on your device when visiting the site. We also use localStorage, a similar technology.') + '</p>' +
        '<h2>' + (I18n.lang === 'ar' ? 'ما الذي نخزنه؟' : 'What do we store?') + '</h2>' +
        '<ul><li>' + (I18n.lang === 'ar' ? 'تفضيلات اللغة والثيم والتأثيرات' : 'Language, theme, and effects preferences') + '</li>' +
        '<li>' + (I18n.lang === 'ar' ? 'بيانات المحفظة (الرصيد، الكود الاسترجاعي)' : 'Wallet data (balance, recovery code)') + '</li>' +
        '<li>' + (I18n.lang === 'ar' ? 'حالة تسجيل الدخول' : 'Login session state') + '</li>' +
        '<li>' + (I18n.lang === 'ar' ? 'إعجابات التعليقات' : 'Comment likes') + '</li></ul>' +
        '<h2>' + (I18n.lang === 'ar' ? 'التحكم' : 'Control') + '</h2>' +
        '<p>' + (I18n.lang === 'ar' ? 'يمكنك مسح كل البيانات المخزنة من إعدادات المتصفح في أي وقت. رفض الكوكيز قد يؤثر على بعض وظائف الموقع مثل حفظ المحفظة.' : 'You can clear all stored data from browser settings at any time. Declining cookies may affect some site functions like wallet saving.') + '</p></div>';
    },
   
   notFound(c) {
        c.innerHTML = '<section style="text-align:center;padding:var(--space-3xl) 0;">' +
            '<h1 style="font-family:var(--font-mono);font-size:5rem;color:var(--neon);">404</h1>' +
            '<p>' + I18n.t('post.notFound') + '</p>' +
            '<a href="#home" class="btn btn-primary">' + I18n.t('btn.backHome') + '</a></section>';
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
        
        // Table of contents
        let toc = '';
        const heads = [...raw.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi)];
        if (heads.length) {
            toc = '<div class="post-toc reveal"><h3><i class="fas fa-list"></i> ' + I18n.t('post.toc') + '</h3><ul class="toc-list">' +
                heads.map((h, i) => '<li><a href="#sec-' + i + '">' + h[2].replace(/<[^>]*>/g, '') + '</a></li>').join('') +
                '</ul></div>';
        }
        
        let html = raw;
        heads.forEach((h, i) => {
            html = html.replace(h[0], h[0].replace('<h' + h[1], '<h' + h[1] + ' id="sec-' + i + '"'));
        });
        
        // Inline affiliate injection
        const affIds = p.affiliateIds && p.affiliateIds.length ? p.affiliateIds
            : (p.isAffiliate && Data.affiliate.length ? [Data.affiliate[0].id] : []);
        const affBoxes = affIds.map(id => Data.affiliate.find(a => a.id === id)).filter(Boolean);
        
        if (affBoxes.length) {
            const seg = html.split(/(<h2[^>]*>)/);
            if (seg.length > 3) {
                const idx = 1 + (Utils.hashCode(p.id) % Math.max(1, Math.floor((seg.length - 1) / 2))) * 2;
                const a = affBoxes[0];
                const box = '<div class="inline-affiliate">' +
                    '<div class="inline-affiliate-icon"><i class="fas ' + (a.icon || 'fa-tag') + '"></i></div>' +
                    '<div class="inline-affiliate-info">' +
                    '<div class="inline-affiliate-name">' + Utils.escapeHtml(a.name || '') + '</div>' +
                    '<div class="inline-affiliate-stars">★ ' + (a.rating || 5) + '</div>' +
                    '<div class="inline-affiliate-desc">' + Utils.escapeHtml(a.description || '') + '</div>' +
                    '<span class="inline-affiliate-tag">' + I18n.t('affiliate.sponsored') + '</span></div>' +
                    '<a href="' + Utils.escapeHtml(a.url || '#') + '" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-gold btn-sm">' + I18n.t('affiliate.visit') + ' <i class="fas fa-external-link-alt"></i></a></div>';
                seg.splice(Math.min(idx, seg.length - 1), 0, box);
                html = seg.join('');
            }
        }
        
        // Body (with paywall if locked)
        let body;
        if (unlocked) {
            body = '<div class="post-content reveal">' + html + '</div>';
        } else {
            const prev = html.split('</p>')[0] + '</p>';
            body = '<div class="paywall-wrapper">' +
                '<div class="paywall-preview">' + prev + '</div>' +
                '<div class="paywall-card">' +
                '<div class="paywall-icon"><i class="fas fa-lock"></i></div>' +
                '<h2 class="paywall-title">' + I18n.t('paywall.title') + '</h2>' +
                '<p class="paywall-text">' + I18n.t('paywall.text') + '</p>' +
                '<div class="paywall-price"><i class="fas fa-coins"></i> ' + price + ' <small>' + I18n.t('coins.coins') + '</small></div>' +
                '<div class="paywall-actions">' +
                '<button class="btn btn-gold" id="unlock-btn"><i class="fas fa-unlock"></i> ' + I18n.t('paywall.unlock') + ' ' + price + '</button>' +
                '<button class="btn btn-secondary" id="earn-more-btn"><i class="fas fa-coins"></i> ' + I18n.t('paywall.earn') + '</button></div>' +
                '<div class="paywall-balance">' + I18n.t('paywall.balance') + ': <strong style="color:var(--gold);">' + (Coins.wallet?.balance || 0) + '</strong></div>' +
                '</div></div>';
        }
        
        // Full post HTML
        c.innerHTML = '<article class="post-page">' +
            '<header class="post-header reveal active">' +
            (cat ? '<a href="#category/' + cat.slug + '" class="badge" style="color:' + cat.color + ';border:1px solid ' + cat.color + ';background:' + cat.color + '20;"><i class="fas ' + cat.icon + '"></i> ' + Utils.escapeHtml(cat.name[L]) + '</a>' : '') +
            '<h1 class="post-title">' + Utils.escapeHtml(p.title?.[L] || '') + '</h1>' +
            '<div class="post-meta"><span><i class="fas fa-calendar"></i> ' + Utils.formatDate(p.createdAt, L) + '</span>' +
            '<span><i class="fas fa-clock"></i> ' + Utils.readingTime(raw) + ' ' + I18n.t('post.readingTime') + '</span>' +
            '<span><i class="fas fa-eye"></i> ' + (p.views || 0) + ' ' + I18n.t('post.views') + '</span></div></header>' +
            '<div class="post-cover reveal"><img src="' + (p.coverImage || '') + '" alt="" loading="lazy"></div>' +
            (p.isAffiliate ? '<div class="affiliate-disclosure reveal"><h3><i class="fas fa-info-circle"></i> ' + I18n.t('affiliate.disclosure.title') + '</h3><p>' + I18n.t('affiliate.disclosure.text') + '</p></div>' : '') +
            toc + body +
            (p.downloadLink && unlocked ? '<div style="text-align:center;margin:var(--space-2xl) 0;"><a href="' + Utils.escapeHtml(p.downloadLink) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary glow" style="font-size:1.15rem;padding:var(--space-lg) var(--space-2xl);"><i class="fas fa-download"></i> ' + Utils.escapeHtml(p.buttonText?.[L] || p.buttonText?.en || 'Download') + '</a></div>' : '') +
            '<div style="text-align:center;margin:var(--space-2xl) 0;"><button class="btn btn-secondary" id="share-post-btn"><i class="fas fa-share-alt"></i> ' + I18n.t('post.share') + '</button></div>' +
            (Data.related(p).length ? '<section class="reveal"><h2 class="section-title"><i class="fas fa-link"></i> ' + I18n.t('post.related') + '</h2><div class="posts-grid">' + Data.related(p).map(x => this.postCard(x)).join('') + '</div></section>' : '') +
            '<section class="comments-section reveal"><div class="comments-header"><h2 class="section-title"><i class="fas fa-comments"></i> ' + I18n.t('comments.title') + '</h2>' +
            '<div class="comments-sort"><button class="filter-chip active" data-sort="latest">' + I18n.t('comments.sort.latest') + '</button><button class="filter-chip" data-sort="oldest">' + I18n.t('comments.sort.oldest') + '</button><button class="filter-chip" data-sort="liked">' + I18n.t('comments.sort.liked') + '</button></div></div>' +
            '<form class="comment-form" id="comment-form"><div class="form-group"><input type="text" id="comment-name" class="form-input" placeholder="' + I18n.t('comments.name') + '"></div><div class="form-group"><input type="email" id="comment-email" class="form-input" placeholder="' + I18n.t('comments.email') + '"></div><div class="form-group"><textarea id="comment-content" class="form-textarea" placeholder="' + I18n.t('comments.content') + '"></textarea></div><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> ' + I18n.t('comments.submit') + '</button></form><div id="comments-list"></div></section></article>';
        
        // Bind post events
        document.getElementById('share-post-btn')?.addEventListener('click', () => UI.openModal('share-modal'));
        document.getElementById('comment-form')?.addEventListener('submit', e => {
            e.preventDefault();
            Comments.submit(p.id);
        });
        
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
        
        // Load comments async
        const list = await Comments.load(p.id);
        Comments.render(p.id, list);
        Effects.reveal();
    }
};

// ==================== 15. ROUTER ====================
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
        else if (r === 'privacy') Pages.privacy(c);
        else if (r === 'terms') Pages.terms(c);
        else if (r === 'cookie-policy') Pages.cookiePolicy(c);
        else Pages.notFound(c);
        Effects.reveal();
    }
};

// ==================== 16. SEARCH / SHARE / NEWSLETTER ====================
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
        if (!q.trim()) {
            b.innerHTML = '<div class="search-empty">' + I18n.t('search.empty') + '</div>';
            return;
        }
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
        const u = location.href;
        const t = document.title;
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
            if (!Utils.isValidEmail(em)) {
                UI.showToast(I18n.t('newsletter.error'), 'error');
                return;
            }
            if (FB.ok) {
                try { await FB.db.collection('subscribers').add({ email: em, date: Date.now() }); }
                catch (e) {}
            }
            i.value = '';
            UI.showToast(I18n.t('newsletter.success'), 'success');
        });
    }
};

// ==================== 17. NAVBAR ====================
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
        
        // Admin shortcuts
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
        
        // Ripple effect
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

// ==================== COOKIE CONSENT ====================
const CookieConsent = {
    key: 'kenven_hub_cookie_consent',
    init() {
        const consent = LS.get(this.key);
        if (consent !== null) return;
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.style.display = 'block';
        document.getElementById('cookie-accept')?.addEventListener('click', () => this.accept());
        document.getElementById('cookie-decline')?.addEventListener('click', () => this.decline());
    },
    accept() {
        LS.set(this.key, 'accepted');
        document.getElementById('cookie-banner').style.display = 'none';
    },
    decline() {
        LS.set(this.key, 'declined');
        document.getElementById('cookie-banner').style.display = 'none';
    }
};

// ==================== MAINTENANCE CHECK ====================
const Maintenance = {
    async check() {
        if (!FB.ok) return false;
        try {
            const doc = await FB.db.collection('settings').doc('site').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.maintenance && data.maintenance.enabled) {
                    this.show(data.maintenance);
                    return true;
                }
            }
        } catch (e) {}
        return false;
    },
    show(m) {
        const msg = m.message || (I18n.lang === 'ar' ? 'الموقع تحت الصيانة. سنعود قريباً!' : 'Site is under maintenance. We will be back soon!');
        const eta = m.eta ? '<p class="maintenance-eta"><i class="fas fa-clock"></i> ' + Utils.escapeHtml(m.eta) + '</p>' : '';
        document.body.innerHTML = '<div class="maintenance-screen"><div><div class="maintenance-icon"><i class="fas fa-tools"></i></div>' +
            '<h1 class="maintenance-title">KENVEN HUB</h1>' +
            '<p class="maintenance-msg">' + Utils.escapeHtml(msg) + '</p>' + eta + '</div></div>';
    }
};
// ==================== 18. APP INIT ====================
// ==================== COOKIE CONSENT ====================
const CookieConsent = {
    key: 'kenven_hub_cookie_consent',
    init() {
        const consent = LS.get(this.key);
        if (consent !== null) return;
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.style.display = 'block';
        document.getElementById('cookie-accept')?.addEventListener('click', () => this.accept());
        document.getElementById('cookie-decline')?.addEventListener('click', () => this.decline());
    },
    accept() {
        LS.set(this.key, 'accepted');
        document.getElementById('cookie-banner').style.display = 'none';
    },
    decline() {
        LS.set(this.key, 'declined');
        document.getElementById('cookie-banner').style.display = 'none';
    }
};

// ==================== MAINTENANCE ====================
const Maintenance = {
    async check() {
        if (!FB.ok) return false;
        try {
            const doc = await FB.db.collection('settings').doc('site').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.maintenance && data.maintenance.enabled) {
                    this.show(data.maintenance);
                    return true;
                }
            }
        } catch (e) {}
        return false;
    },
    show(m) {
        const msg = m.message || (I18n.lang === 'ar' ? 'الموقع تحت الصيانة. سنعود قريباً!' : 'Site is under maintenance. We will be back soon!');
        const eta = m.eta ? '<p class="maintenance-eta"><i class="fas fa-clock"></i> ' + Utils.escapeHtml(m.eta) + '</p>' : '';
        document.body.innerHTML = '<div class="maintenance-screen"><div><div class="maintenance-icon"><i class="fas fa-tools"></i></div>' +
            '<h1 class="maintenance-title">KENVEN HUB</h1>' +
            '<p class="maintenance-msg">' + Utils.escapeHtml(msg) + '</p>' + eta + '</div></div>';
    }
};

// ==================== APP ====================
const App = {
    async init() {
        try {
            console.log('🚀 Kenven Hub starting...');
            FB.init();
            // Maintenance check
            const isMaintenance = await Maintenance.check();
            if (isMaintenance) return;
            CookieConsent.init();
            // Maintenance check
            const isMaintenance = await Maintenance.check();
            if (isMaintenance) return;
            CookieConsent.init();
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
            
            // Sync wallet on auth changes
            if (FB.ok) FB.auth.onAuthStateChanged(u => Coins.onAuthChange(u));
            
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

// Error boundary
window.addEventListener('error', e => console.warn('Caught:', e.message));

document.addEventListener('DOMContentLoaded', () => App.init());

window.UI = UI;
window.Router = Router;
