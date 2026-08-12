/* ================================================================
   KENVEN HUB - MAIN APPLICATION
   Vanilla JS - No Frameworks
   ================================================================ */

'use strict';

// ==================== 1. CONFIGURATION ====================
const CONFIG = {
    // Firebase Configuration
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
    
    // Feature Flags
    USE_FIREBASE: false, // Set to true when Firestore is activated
    
    // Site Info
    site: {
        name: "Kenven Hub",
        logo: "https://cdn.phototourl.com/free/2026-08-09-001eb100-a118-4da2-a6fa-edd349bfe20e.jpg",
        discord: "https://discord.com/channels/1256937655984328714/",
        website: "https://yassine.com/"
    },
    
    // localStorage Keys
    storageKeys: {
        lang: 'kenven_hub_lang',
        theme: 'kenven_hub_theme',
        effects: 'kenven_hub_effects',
        recentPosts: 'kenven_hub_recent_posts',
        adminSession: 'kenven_hub_admin_session',
        commentDrafts: 'kenven_hub_comment_drafts',
        newsletter: 'kenven_hub_newsletter',
        commentLikes: 'kenven_hub_comment_likes',
        posts: 'kenven_hub_posts_data',
        comments: 'kenven_hub_comments_data'
    },
    
    // Rate Limiting
    rateLimit: {
        comments: { max: 5, windowMs: 60000 }, // 5 comments per minute
        newsletter: { max: 3, windowMs: 86400000 } // 3 per day
    }
};

// ==================== 2. UTILITIES ====================
const Utils = {
    /**
     * Escape HTML to prevent XSS attacks
     * CRITICAL: Use this for ALL user-generated content
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    /**
     * Sanitize HTML content (for admin-created content)
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        // Remove script tags and event handlers
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:/gi, '');
    },
    
    /**
     * Debounce function for search and resize events
     */
    debounce(fn, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    
    /**
     * Format timestamp to readable date
     */
    formatDate(timestamp, lang = 'en') {
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
    },
    
    /**
     * Calculate reading time in minutes
     */
    calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / wordsPerMinute));
    },
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Get URL parameter
     */
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },
    
    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (e) {
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    },
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Truncate text
     */
    truncate(text, maxLength = 150) {
        const plain = text.replace(/<[^>]*>/g, '');
        if (plain.length <= maxLength) return plain;
        return plain.substr(0, maxLength).trim() + '...';
    }
};

// ==================== 3. STORAGE MODULE ====================
// Uses localStorage as temporary storage until Firestore is activated
const Storage = {
    /**
     * Get data from localStorage
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage.get error:', e);
            return defaultValue;
        }
    },
    
    /**
     * Set data in localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage.set error:', e);
            return false;
        }
    },
    
    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage.remove error:', e);
            return false;
        }
    },
    
    /**
     * Clear all Kenven Hub data
     */
    clearAll() {
        Object.values(CONFIG.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// ==================== 4. MOCK DATA ====================
// Sample data for development (used when Firestore is not active)
const MockData = {
    categories: [
        { id: 'apps', slug: 'apps', name: { en: 'Apps & Tools', ar: 'تطبيقات وأدوات' }, icon: 'fa-mobile-screen', color: '#5B9FFF', postCount: 2 },
        { id: 'websites', slug: 'websites', name: { en: 'Websites', ar: 'مواقع' }, icon: 'fa-globe', color: '#8B5CF6', postCount: 1 },
        { id: 'activation', slug: 'activation', name: { en: 'Activation', ar: 'تفعيل' }, icon: 'fa-key', color: '#00FF9D', postCount: 1 },
        { id: 'fixes', slug: 'fixes', name: { en: 'Fixes & Tutorials', ar: 'إصلاحات وشروحات' }, icon: 'fa-screwdriver-wrench', color: '#FFE600', postCount: 1 },
        { id: 'deals', slug: 'deals', name: { en: 'Deals & Offers', ar: 'عروض وخصومات' }, icon: 'fa-tag', color: '#FF2E63', postCount: 1 },
        { id: 'guides', slug: 'guides', name: { en: 'Guides', ar: 'أدلة' }, icon: 'fa-book', color: '#5B9FFF', postCount: 1 }
    ],
    
    posts: [
        {
            id: 'post-1',
            slug: 'top-10-productivity-apps-2026',
            title: { en: 'Top 10 Productivity Apps for 2026', ar: 'أفضل 10 تطبيقات للإنتاجية في 2026' },
            excerpt: { 
                en: 'Discover the best productivity apps that will transform your workflow in 2026. From task management to AI-powered assistants.', 
                ar: 'اكتشف أفضل تطبيقات الإنتاجية التي ستحول سير عملك في 2026. من إدارة المهام إلى المساعدين المدعومين بالذكاء الاصطناعي.' 
            },
            content: {
                en: '<h2>Introduction</h2><p>In 2026, productivity apps have evolved dramatically with AI integration. Here are the top 10 apps you need.</p><h2>1. Notion AI</h2><p>The ultimate workspace with AI-powered features for notes, tasks, and databases.</p><h2>2. Todoist Pro</h2><p>Smart task management with natural language processing.</p><h2>3. Slack AI</h2><p>Team communication enhanced with AI summaries and translations.</p><h2>Conclusion</h2><p>These apps will boost your productivity significantly. Try them today!</p>',
                ar: '<h2>مقدمة</h2><p>في عام 2026، تطورت تطبيقات الإنتاجية بشكل كبير مع تكامل الذكاء الاصطناعي. إليك أفضل 10 تطبيقات تحتاجها.</p><h2>1. Notion AI</h2><p>مساحة العمل المثالية مع ميزات مدعومة بالذكاء الاصطناعي للملاحظات والمهام وقواعد البيانات.</p><h2>2. Todoist Pro</h2><p>إدارة مهام ذكية مع معالجة اللغة الطبيعية.</p><h2>3. Slack AI</h2><p>تواصل الفريق معزز بملخصات وترجمات الذكاء الاصطناعي.</p><h2>الخاتمة</h2><p>هذه التطبيقات ستعزز إنتاجيتك بشكل كبير. جربها اليوم!</p>'
            },
            category: 'apps',
            coverImage: 'https://picsum.photos/seed/apps1/800/450',
            downloadLink: 'https://example.com/apps',
            buttonText: { en: 'Download Apps', ar: 'تحميل التطبيقات' },
            isAffiliate: false,
            tags: ['productivity', 'apps', '2026'],
            featured: true,
            status: 'published',
            views: 1250,
            likes: 89,
            commentsCount: 12,
            createdAt: Date.now() - 86400000 * 2,
            updatedAt: Date.now() - 86400000 * 2
        },
        {
            id: 'post-2',
            slug: 'best-free-websites-for-developers',
            title: { en: 'Best Free Websites for Developers', ar: 'أفضل المواقع المجانية للمطورين' },
            excerpt: { 
                en: 'A curated list of free websites every developer should bookmark. Resources for learning, coding, and debugging.', 
                ar: 'قائمة منسقة بأفضل المواقع المجانية التي يجب على كل مطور حفظها. موارد للتعلم والبرمجة وتصحيح الأخطاء.' 
            },
            content: {
                en: '<h2>Essential Developer Resources</h2><p>These free websites will accelerate your development workflow.</p><h2>MDN Web Docs</h2><p>The definitive reference for web technologies.</p><h2>Stack Overflow</h2><p>Community-driven Q&A for programming problems.</p><h2>GitHub</h2><p>Code hosting and collaboration platform.</p>',
                ar: '<h2>موارد المطورين الأساسية</h2><p>هذه المواقع المجانية ستسرع سير عملك في التطوير.</p><h2>MDN Web Docs</h2><p>المرجع النهائي لتقنيات الويب.</p><h2>Stack Overflow</h2><p>أسئلة وأجوبة مجتمعية لمشاكل البرمجة.</p><h2>GitHub</h2><p>منصة استضافة الكود والتعاون.</p>'
            },
            category: 'websites',
            coverImage: 'https://picsum.photos/seed/web2/800/450',
            downloadLink: 'https://developer.mozilla.org',
            buttonText: { en: 'Visit MDN', ar: 'زيارة MDN' },
            isAffiliate: false,
            tags: ['developers', 'websites', 'free'],
            featured: false,
            status: 'published',
            views: 890,
            likes: 67,
            commentsCount: 8,
            createdAt: Date.now() - 86400000 * 5,
            updatedAt: Date.now() - 86400000 * 5
        },
        {
            id: 'post-3',
            slug: 'windows-activation-guide',
            title: { en: 'Complete Windows Activation Guide', ar: 'دليل تفعيل ويندوز الشامل' },
            excerpt: { 
                en: 'Learn how to properly activate Windows 11 with official methods. Step-by-step tutorial with screenshots.', 
                ar: 'تعلم كيفية تفعيل ويندوز 11 بشكل صحيح بالطرق الرسمية. دليل خطوة بخطوة مع الصور.' 
            },
            content: {
                en: '<h2>Windows Activation Methods</h2><p>This guide covers all official methods to activate Windows 11.</p><h2>Method 1: Digital License</h2><p>If you upgraded from Windows 10, you likely have a digital license.</p><h2>Method 2: Product Key</h2><p>Enter your 25-character product key in Settings > Activation.</p><h2>Troubleshooting</h2><p>If activation fails, run the Activation Troubleshooter.</p>',
                ar: '<h2>طرق تفعيل ويندوز</h2><p>يغطي هذا الدليل جميع الطرق الرسمية لتفعيل ويندوز 11.</p><h2>الطريقة 1: الترخيص الرقمي</h2><p>إذا قمت بالترقية من ويندوز 10، فمن المحتمل أن يكون لديك ترخيص رقمي.</p><h2>الطريقة 2: مفتاح المنتج</h2><p>أدخل مفتاح المنتج المكون من 25 حرفاً في الإعدادات > التفعيل.</p><h2>استكشاف الأخطاء</h2><p>إذا فشل التفعيل، قم بتشغيل مستكشف أخطاء التفعيل.</p>'
            },
            category: 'activation',
            coverImage: 'https://picsum.photos/seed/win3/800/450',
            downloadLink: 'https://microsoft.com',
            buttonText: { en: 'Get Windows', ar: 'احصل على ويندوز' },
            isAffiliate: false,
            tags: ['windows', 'activation', 'tutorial'],
            featured: false,
            status: 'published',
            views: 2100,
            likes: 145,
            commentsCount: 23,
            createdAt: Date.now() - 86400000 * 7,
            updatedAt: Date.now() - 86400000 * 7
        },
        {
            id: 'post-4',
            slug: 'fix-blue-screen-error-windows',
            title: { en: 'Fix Blue Screen Error in Windows', ar: 'إصلاح خطأ الشاشة الزرقاء في ويندوز' },
            excerpt: { 
                en: 'Complete guide to fixing the dreaded Blue Screen of Death (BSOD) in Windows 11. Multiple solutions included.', 
                ar: 'دليل شامل لإصلاح خطأ الشاشة الزرقاء المخيف (BSOD) في ويندوز 11. يتضمن حلول متعددة.' 
            },
            content: {
                en: '<h2>Understanding BSOD</h2><p>The Blue Screen of Death occurs when Windows encounters a critical error.</p><h2>Solution 1: Update Drivers</h2><p>Outdated drivers are the most common cause of BSOD.</p><h2>Solution 2: Run SFC Scan</h2><p>Open Command Prompt as admin and run: sfc /scannow</p><h2>Solution 3: Check for Malware</h2><p>Run a full system scan with Windows Defender.</p>',
                ar: '<h2>فهم الشاشة الزرقاء</h2><p>تحدث الشاشة الزرقاء عندما يواجه ويندوز خطأً فادحاً.</p><h2>الحل 1: تحديث التعريفات</h2><p>التعريفات القديمة هي السبب الأكثر شيوعاً للشاشة الزرقاء.</p><h2>الحل 2: تشغيل فحص SFC</h2><p>افتح موجه الأوامر كمسؤول وقم بتشغيل: sfc /scannow</p><h2>الحل 3: فحص الفيروسات</h2><p>قم بإجراء فحص كامل للنظام باستخدام Windows Defender.</p>'
            },
            category: 'fixes',
            coverImage: 'https://picsum.photos/seed/fix4/800/450',
            downloadLink: '',
            buttonText: { en: 'Read Guide', ar: 'اقرأ الدليل' },
            isAffiliate: false,
            tags: ['windows', 'bsod', 'fix'],
            featured: false,
            status: 'published',
            views: 3400,
            likes: 210,
            commentsCount: 34,
            createdAt: Date.now() - 86400000 * 10,
            updatedAt: Date.now() - 86400000 * 10
        },
        {
            id: 'post-5',
            slug: 'hostinger-black-friday-deal',
            title: { en: 'Hostinger Black Friday Deal - 80% OFF', ar: 'عرض الجمعة السوداء من Hostinger - خصم 80%' },
            excerpt: { 
                en: 'Massive Black Friday deal on Hostinger hosting! Get premium hosting at just $2.99/month. Limited time offer.', 
                ar: 'عرض ضخم للجمعة السوداء على استضافة Hostinger! احصل على استضافة مميزة بـ $2.99/شهر فقط. عرض محدود.' 
            },
            content: {
                en: '<h2>Hostinger Black Friday Sale</h2><p>Hostinger is offering their biggest discount of the year!</p><h2>Deal Details</h2><p>Premium hosting at $2.99/month instead of $11.99/month.</p><h2>What You Get</h2><ul><li>Free domain</li><li>Free SSL</li><li>100GB SSD storage</li><li>24/7 support</li></ul><h2>Affiliate Disclosure</h2><p>This post contains affiliate links. We may earn a commission.</p>',
                ar: '<h2>تخفيضات الجمعة السوداء من Hostinger</h2><p>تقدم Hostinger أكبر خصم لها هذا العام!</p><h2>تفاصيل العرض</h2><p>استضافة مميزة بـ $2.99/شهر بدلاً من $11.99/شهر.</p><h2>ماذا تحصل</h2><ul><li>دومين مجاني</li><li>SSL مجاني</li><li>تخزين SSD بسعة 100GB</li><li>دعم 24/7</li></ul><h2>إفصاح الأفلييت</h2><p>يحتوي هذا المنشور على روابط أفلييت. قد نحصل على عمولة.</p>'
            },
            category: 'deals',
            coverImage: 'https://picsum.photos/seed/deal5/800/450',
            downloadLink: 'https://hostinger.com?ref=kenven',
            buttonText: { en: 'Get Deal', ar: 'احصل على العرض' },
            isAffiliate: true,
            tags: ['hosting', 'deal', 'black-friday'],
            featured: false,
            status: 'published',
            views: 5600,
            likes: 320,
            commentsCount: 45,
            createdAt: Date.now() - 86400000 * 1,
            updatedAt: Date.now() - 86400000 * 1
        },
        {
            id: 'post-6',
            slug: 'complete-seo-guide-beginners',
            title: { en: 'Complete SEO Guide for Beginners', ar: 'دليل SEO الشامل للمبتدئين' },
            excerpt: { 
                en: 'Everything you need to know about SEO in 2026. From keyword research to technical SEO, this guide covers it all.', 
                ar: 'كل ما تحتاج معرفته عن SEO في 2026. من البحث عن الكلمات المفتاحية إلى SEO التقني، يغطي هذا الدليل كل شيء.' 
            },
            content: {
                en: '<h2>What is SEO?</h2><p>Search Engine Optimization is the practice of improving your website to rank higher in search results.</p><h2>Keyword Research</h2><p>Start with understanding what your audience searches for.</p><h2>On-Page SEO</h2><p>Optimize your titles, meta descriptions, and content structure.</p><h2>Technical SEO</h2><p>Ensure your site is fast, mobile-friendly, and crawlable.</p><h2>Link Building</h2><p>Earn quality backlinks from authoritative websites.</p>',
                ar: '<h2>ما هو SEO؟</h2><p>تحسين محركات البحث هو ممارسة تحسين موقعك ليظهر في نتائج البحث بشكل أعلى.</p><h2>البحث عن الكلمات المفتاحية</h2><p>ابدأ بفهم ما يبحث عنه جمهورك.</p><h2>SEO على الصفحة</h2><p>قم بتحسين عناوينك وأوصاف meta وبنية المحتوى.</p><h2>SEO التقني</h2><p>تأكد من أن موقعك سريع ومتوافق مع الجوال وقابل للزحف.</p><h2>بناء الروابط</h2><p>احصل على روابط خلفية عالية الجودة من مواقع موثوقة.</p>'
            },
            category: 'guides',
            coverImage: 'https://picsum.photos/seed/seo6/800/450',
            downloadLink: '',
            buttonText: { en: 'Read Guide', ar: 'اقرأ الدليل' },
            isAffiliate: false,
            tags: ['seo', 'guide', 'beginners'],
            featured: false,
            status: 'published',
            views: 1800,
            likes: 156,
            commentsCount: 19,
            createdAt: Date.now() - 86400000 * 14,
            updatedAt: Date.now() - 86400000 * 14
        }
    ],
    
    comments: [
        {
            id: 'comment-1',
            postId: 'post-1',
            authorName: 'Ahmed',
            authorEmail: 'ahmed@example.com',
            content: 'Great list! I\'ve been using Notion AI for months and it\'s amazing.',
            parentId: null,
            isAdmin: false,
            approved: true,
            likes: 12,
            createdAt: Date.now() - 86400000
        },
        {
            id: 'comment-2',
            postId: 'post-1',
            authorName: 'Kenven Admin',
            authorEmail: 'admin@kenven.com',
            content: 'Thanks Ahmed! Notion AI is definitely a game changer. Stay tuned for more app reviews!',
            parentId: 'comment-1',
            isAdmin: true,
            approved: true,
            likes: 5,
            createdAt: Date.now() - 43200000
        },
        {
            id: 'comment-3',
            postId: 'post-5',
            authorName: 'Sara',
            authorEmail: 'sara@example.com',
            content: 'Is this deal still available? I want to migrate my website to Hostinger.',
            parentId: null,
            isAdmin: false,
            approved: true,
            likes: 3,
            createdAt: Date.now() - 3600000
        }
    ]
};

// ==================== 5. DATA MODULE ====================
// Abstracts data operations (localStorage now, Firestore later)
const Data = {
    /**
     * Initialize data (load mock data if not exists)
     */
    init() {
        if (!Storage.get(CONFIG.storageKeys.posts)) {
            Storage.set(CONFIG.storageKeys.posts, MockData.posts);
        }
        if (!Storage.get(CONFIG.storageKeys.comments)) {
            Storage.set(CONFIG.storageKeys.comments, MockData.comments);
        }
    },
    
    // Posts
    getPosts() {
        return Storage.get(CONFIG.storageKeys.posts, MockData.posts);
    },
    
    getPublishedPosts() {
        return this.getPosts().filter(p => p.status === 'published');
    },
    
    getPostBySlug(slug) {
        return this.getPosts().find(p => p.slug === slug);
    },
    
    getPostById(id) {
        return this.getPosts().find(p => p.id === id);
    },
    
    getFeaturedPost() {
        return this.getPublishedPosts().find(p => p.featured);
    },
    
    getPostsByCategory(categorySlug) {
        return this.getPublishedPosts().filter(p => p.category === categorySlug);
    },
    
    getRelatedPosts(post, limit = 3) {
        return this.getPublishedPosts()
            .filter(p => p.id !== post.id && p.category === post.category)
            .slice(0, limit);
    },
    
    incrementViews(postId) {
        const posts = this.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.views = (post.views || 0) + 1;
            Storage.set(CONFIG.storageKeys.posts, posts);
        }
    },
    
    // Categories
    getCategories() {
        return MockData.categories;
    },
    
    getCategoryBySlug(slug) {
        return MockData.categories.find(c => c.slug === slug);
    },
    
    getCategoryById(id) {
        return MockData.categories.find(c => c.id === id);
    },
    
    // Comments
    getComments(postId) {
        const comments = Storage.get(CONFIG.storageKeys.comments, MockData.comments);
        return comments.filter(c => c.postId === postId && c.approved);
    },
    
    addComment(comment) {
        const comments = Storage.get(CONFIG.storageKeys.comments, MockData.comments);
        comments.push(comment);
        Storage.set(CONFIG.storageKeys.comments, comments);
        return comment;
    },
    
    likeComment(commentId) {
        const likedComments = Storage.get(CONFIG.storageKeys.commentLikes, []);
        if (likedComments.includes(commentId)) {
            return false; // Already liked
        }
        
        const comments = Storage.get(CONFIG.storageKeys.comments, MockData.comments);
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
            comment.likes = (comment.likes || 0) + 1;
            Storage.set(CONFIG.storageKeys.comments, comments);
            likedComments.push(commentId);
            Storage.set(CONFIG.storageKeys.commentLikes, likedComments);
            return true;
        }
        return false;
    },
    
    // Search
    searchPosts(query, category = 'all') {
        const posts = this.getPublishedPosts();
        const lowerQuery = query.toLowerCase();
        
        return posts.filter(post => {
            const matchesCategory = category === 'all' || post.category === category;
            const matchesTitle = post.title.en.toLowerCase().includes(lowerQuery) || 
                                post.title.ar.toLowerCase().includes(lowerQuery);
            const matchesExcerpt = post.excerpt.en.toLowerCase().includes(lowerQuery) || 
                                  post.excerpt.ar.toLowerCase().includes(lowerQuery);
            const matchesTags = post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
            return matchesCategory && (matchesTitle || matchesExcerpt || matchesTags);
        });
    }
};

// ==================== 6. I18N MODULE ====================
const I18n = {
    currentLang: 'en',
    
    translations: {
        // Navigation
        'nav.home': { en: 'Home', ar: 'الرئيسية' },
        'nav.posts': { en: 'Posts', ar: 'المنشورات' },
        'nav.categories': { en: 'Categories', ar: 'التصنيفات' },
        'nav.deals': { en: 'Deals', ar: 'العروض' },
        'nav.about': { en: 'About', ar: 'حول' },
        
        // Hero
        'hero.badge': { en: '✨ Your Resource Center', ar: '✨ مركز الموارد الخاص بك' },
        'hero.title': { en: 'KENVEN HUB', ar: 'KENVEN HUB' },
        'hero.subtitle': { 
            en: 'Discover the best apps, tools, tutorials, and exclusive deals. All in one place.', 
            ar: 'اكتشف أفضل التطبيقات والأدوات والشروحات والعروض الحصرية. كل شيء في مكان واحد.' 
        },
        'hero.btn.explore': { en: 'Explore Posts', ar: 'استكشف المنشورات' },
        'hero.btn.deals': { en: 'View Deals', ar: 'عرض العروض' },
        
        // Sections
        'section.featured': { en: 'Featured Post', ar: 'منشور مميز' },
        'section.latest': { en: 'Latest Posts', ar: 'أحدث المنشورات' },
        'section.categories': { en: 'Browse Categories', ar: 'تصفح التصنيفات' },
        'section.viewAll': { en: 'View All', ar: 'عرض الكل' },
        
        // Post Meta
        'post.views': { en: 'views', ar: 'مشاهدة' },
        'post.likes': { en: 'likes', ar: 'إعجاب' },
        'post.comments': { en: 'comments', ar: 'تعليق' },
        'post.readingTime': { en: 'min read', ar: 'دقيقة قراءة' },
        'post.by': { en: 'By', ar: 'بواسطة' },
        'post.share': { en: 'Share', ar: 'مشاركة' },
        'post.related': { en: 'Related Posts', ar: 'منشورات ذات صلة' },
        'post.notFound': { en: 'Post not found', ar: 'المنشور غير موجود' },
        
        // Affiliate Disclosure
        'affiliate.disclosure.title': { en: 'Affiliate Disclosure', ar: 'إفصاح الأفلييت' },
        'affiliate.disclosure.text': { 
            en: 'This post contains affiliate links. If you make a purchase through these links, we may earn a commission at no extra cost to you.', 
            ar: 'يحتوي هذا المنشور على روابط أفلييت. إذا قمت بالشراء من خلال هذه الروابط، قد نحصل على عمولة دون أي تكلفة إضافية عليك.' 
        },
        
        // Comments
        'comments.title': { en: 'Comments', ar: 'التعليقات' },
        'comments.name': { en: 'Your Name', ar: 'اسمك' },
        'comments.email': { en: 'Your Email', ar: 'بريدك الإلكتروني' },
        'comments.content': { en: 'Write your comment...', ar: 'اكتب تعليقك...' },
        'comments.submit': { en: 'Post Comment', ar: 'إرسال التعليق' },
        'comments.reply': { en: 'Reply', ar: 'رد' },
        'comments.like': { en: 'Like', ar: 'إعجاب' },
        'comments.empty': { en: 'No comments yet. Be the first to comment!', ar: 'لا توجد تعليقات بعد. كن أول من يعلق!' },
        'comments.sort.latest': { en: 'Latest', ar: 'الأحدث' },
        'comments.sort.oldest': { en: 'Oldest', ar: 'الأقدم' },
        'comments.sort.liked': { en: 'Most Liked', ar: 'الأكثر إعجاباً' },
        'comments.success': { en: 'Comment posted successfully!', ar: 'تم نشر التعليق بنجاح!' },
        'comments.error.rateLimit': { en: 'Too many comments. Please wait a minute.', ar: 'عدد كبير من التعليقات. يرجى الانتظار دقيقة.' },
        'comments.error.empty': { en: 'Please fill in all fields.', ar: 'يرجى ملء جميع الحقول.' },
        'comments.error.email': { en: 'Please enter a valid email.', ar: 'يرجى إدخال بريد إلكتروني صحيح.' },
        'comments.liked': { en: 'Comment liked!', ar: 'تم الإعجاب بالتعليق!' },
        'comments.alreadyLiked': { en: 'You already liked this comment.', ar: 'لقد أعجبت بهذا التعليق مسبقاً.' },
        
        // Search
        'search.title': { en: 'Search Kenven Hub', ar: 'ابحث في Kenven Hub' },
        'search.placeholder': { en: 'Type to search...', ar: 'اكتب للبحث...' },
        'search.empty': { en: 'Start typing to see results...', ar: 'ابدأ الكتابة لرؤية النتائج...' },
        'search.noResults': { en: 'No results found for', ar: 'لم يتم العثور على نتائج لـ' },
        'search.results': { en: 'results found', ar: 'نتيجة' },
        
        // Newsletter
        'newsletter.title': { en: 'Newsletter', ar: 'النشرة البريدية' },
        'newsletter.text': { en: 'Subscribe to get the latest resources and deals.', ar: 'اشترك للحصول على أحدث الموارد والعروض.' },
        'newsletter.placeholder': { en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
        'newsletter.btn': { en: 'Subscribe', ar: 'اشترك' },
        'newsletter.success': { en: 'Successfully subscribed!', ar: 'تم الاشتراك بنجاح!' },
        'newsletter.error': { en: 'Please enter a valid email.', ar: 'يرجى إدخال بريد إلكتروني صحيح.' },
        
        // Toast
        'toast.copied': { en: 'Link copied to clipboard!', ar: 'تم نسخ الرابط!' },
        'toast.error': { en: 'Something went wrong.', ar: 'حدث خطأ ما.' },
        
        // Footer
        'footer.quickLinks': { en: 'Quick Links', ar: 'روابط سريعة' },
        'footer.categories': { en: 'Categories', ar: 'التصنيفات' },
        'footer.rights': { en: '© 2026 Kenven Hub. All rights reserved.', ar: '© 2026 Kenven Hub. جميع الحقوق محفوظة.' },
        'footer.privacy': { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
        'footer.terms': { en: 'Terms of Service', ar: 'شروط الخدمة' },
        'footer.affiliate': { en: 'Affiliate Disclosure', ar: 'إفصاح الأفلييت' },
        
        // Buttons
        'btn.readMore': { en: 'Read More', ar: 'اقرأ المزيد' },
        'btn.download': { en: 'Download', ar: 'تحميل' },
        'btn.visitSite': { en: 'Visit Site', ar: 'زيارة الموقع' },
        'btn.getDeal': { en: 'Get Deal', ar: 'احصل على العرض' },
        'btn.backToHome': { en: 'Back to Home', ar: 'العودة للرئيسية' },
        'btn.loadMore': { en: 'Load More', ar: 'تحميل المزيد' },
        
        // Categories Page
        'categories.title': { en: 'All Categories', ar: 'جميع التصنيفات' },
        'categories.posts': { en: 'posts', ar: 'منشور' },
        
        // Deals Page
        'deals.title': { en: 'Deals & Offers', ar: 'العروض والخصومات' },
        'deals.subtitle': { en: 'Exclusive deals on hosting, tools, and services', ar: 'عروض حصرية على الاستضافة والأدوات والخدمات' },
        
        // About Page
        'about.title': { en: 'About Kenven Hub', ar: 'حول Kenven Hub' },
        'about.text': { 
            en: 'Kenven Hub is your ultimate resource center for apps, tools, tutorials, and exclusive deals. We\'re part of the Kenven Service family, dedicated to bringing you the best digital resources.', 
            ar: 'Kenven Hub هو مركزك الشامل للتطبيقات والأدوات والشروحات والعروض الحصرية. نحن جزء من عائلة Kenven Service، مكرسون لتقديم أفضل الموارد الرقمية لك.' 
        },
        
        // Empty States
        'empty.posts.title': { en: 'No Posts Yet', ar: 'لا توجد منشورات بعد' },
        'empty.posts.text': { en: 'Check back soon for new content!', ar: 'عد قريباً لمحتوى جديد!' },
        
        // Loading
        'loading': { en: 'Loading...', ar: 'جاري التحميل...' }
    },
    
    /**
     * Initialize i18n
     */
    init() {
        const savedLang = Storage.get(CONFIG.storageKeys.lang);
        this.currentLang = savedLang || this.detectBrowserLang();
        this.applyLanguage(this.currentLang);
    },
    
    /**
     * Detect browser language
     */
    detectBrowserLang() {
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('ar') ? 'ar' : 'en';
    },
    
    /**
     * Get translation
     */
    t(key) {
        const translation = this.translations[key];
        if (!translation) return key;
        return translation[this.currentLang] || translation.en;
    },
    
    /**
     * Set language
     */
    setLang(lang) {
        this.currentLang = lang;
        Storage.set(CONFIG.storageKeys.lang, lang);
        this.applyLanguage(lang);
        // Re-render current page
        Router.renderCurrentRoute();
    },
    
    /**
     * Toggle language
     */
    toggleLang() {
        const newLang = this.currentLang === 'en' ? 'ar' : 'en';
        this.setLang(newLang);
    },
    
    /**
     * Apply language to DOM
     */
    applyLanguage(lang) {
        const isRTL = lang === 'ar';
        
        // Set HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        
        // Update lang switcher button
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) {
            const langText = langSwitcher.querySelector('.lang-text');
            if (langText) {
                langText.textContent = lang === 'en' ? 'AR' : 'EN';
            }
        }
        
        // Update all elements with data-en / data-ar
        document.querySelectorAll('[data-en], [data-ar]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                el.textContent = text;
            }
        });
        
        // Update placeholders
        document.querySelectorAll('[data-en-placeholder], [data-ar-placeholder]').forEach(el => {
            const placeholder = el.getAttribute(`data-${lang}-placeholder`);
            if (placeholder) {
                el.placeholder = placeholder;
            }
        });
    }
};

// ==================== 7. UI MODULE ====================
const UI = {
    /**
     * Show loading screen
     */
    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.remove('hidden');
        }
    },
    
    /**
     * Hide loading screen
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${Utils.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    },
    
    /**
     * Remove toast with animation
     */
    removeToast(toast) {
        toast.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    },
    
    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    },
    
    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    },
    
    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal.open').forEach(modal => {
            this.closeModal(modal.id);
        });
    },
    
    /**
     * Render skeleton loading
     */
    renderSkeletons(container, count = 3) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="post-card-body">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },
    
    /**
     * Render empty state
     */
    renderEmptyState(container, icon, title, text) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <h3 class="empty-state-title">${Utils.escapeHtml(title)}</h3>
                <p class="empty-state-text">${Utils.escapeHtml(text)}</p>
            </div>
        `;
    }
};

// ==================== 8. EFFECTS MODULE ====================
const Effects = {
    isEnabled: true,
    particles: [],
    animationFrame: null,
    
    /**
     * Initialize effects
     */
    init() {
        const savedEffects = Storage.get(CONFIG.storageKeys.effects);
        this.isEnabled = savedEffects !== false;
        
        if (this.isEnabled) {
            this.enableEffects();
        } else {
            this.disableEffects();
        }
    },
    
    /**
     * Enable all effects
     */
    enableEffects() {
        this.isEnabled = true;
        Storage.set(CONFIG.storageKeys.effects, true);
        document.body.classList.remove('effects-disabled');
        
        this.initCursor();
        this.initParticles();
        
        const toggleBtn = document.getElementById('effects-toggle');
        if (toggleBtn) toggleBtn.classList.add('active');
    },
    
    /**
     * Disable all effects (Reduced Motion)
     */
    disableEffects() {
        this.isEnabled = false;
        Storage.set(CONFIG.storageKeys.effects, false);
        document.body.classList.add('effects-disabled');
        
        this.destroyCursor();
        this.destroyParticles();
        
        const toggleBtn = document.getElementById('effects-toggle');
        if (toggleBtn) toggleBtn.classList.remove('active');
    },
    
    /**
     * Toggle effects
     */
    toggle() {
        if (this.isEnabled) {
            this.disableEffects();
            UI.showToast('Effects disabled', 'info');
        } else {
            this.enableEffects();
            UI.showToast('Effects enabled', 'success');
        }
    },
    
    /**
     * Initialize custom cursor
     */
    initCursor() {
        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        
        if (!dot || !ring) return;
        
        // Hide default cursor on desktop
        if (window.matchMedia('(hover: hover)').matches) {
            document.body.style.cursor = 'none';
            
            document.addEventListener('mousemove', (e) => {
                dot.style.left = e.clientX + 'px';
                dot.style.top = e.clientY + 'px';
                
                // Ring follows with slight delay
                setTimeout(() => {
                    ring.style.left = e.clientX + 'px';
                    ring.style.top = e.clientY + 'px';
                }, 50);
            });
            
            // Hover effect on interactive elements
            const interactiveElements = 'a, button, input, textarea, [role="button"]';
            document.addEventListener('mouseover', (e) => {
                if (e.target.closest(interactiveElements)) {
                    ring.classList.add('hover');
                } else {
                    ring.classList.remove('hover');
                }
            });
        }
    },
    
    /**
     * Destroy custom cursor
     */
    destroyCursor() {
        document.body.style.cursor = '';
    },
    
    /**
     * Initialize particles background
     */
    initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', Utils.debounce(resizeCanvas, 200));
        
        // Create particles
        const particleCount = Math.min(50, Math.floor(window.innerWidth / 25));
        this.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        // Animation loop
        const animate = () => {
            if (!this.isEnabled) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            this.particles.forEach(p => {
                // Update position
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(91, 159, 255, ${p.opacity})`;
                ctx.fill();
            });
            
            // Draw connections
            this.particles.forEach((p1, i) => {
                this.particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(91, 159, 255, ${0.1 * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    },
    
    /**
     * Destroy particles
     */
    destroyParticles() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        const canvas = document.getElementById('particles-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
    
    /**
     * Initialize scroll progress bar
     */
    initScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (!progressBar) return;
        
        window.addEventListener('scroll', Utils.debounce(() => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        }, 10));
    },
    
    /**
     * Initialize scroll reveal
     */
    initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
            observer.observe(el);
        });
    },
    
    /**
     * Initialize back to top button
     */
    initBackToTop() {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;
        
        window.addEventListener('scroll', Utils.debounce(() => {
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }, 100));
        
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

// ==================== 9. ROUTER MODULE (SPA) ====================
const Router = {
    currentRoute: '',
    
    /**
     * Initialize router
     */
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },
    
    /**
     * Handle route change
     */
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        this.currentRoute = hash;
        
        // Close mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) mobileMenu.classList.remove('open');
        
        // Update active nav link
        this.updateActiveNavLink(hash);
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Render page
        this.renderCurrentRoute();
    },
    
    /**
     * Render current route
     */
    renderCurrentRoute() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        const hash = this.currentRoute;
        
        if (hash === 'home' || hash === '') {
            Pages.renderHome(container);
        } else if (hash === 'posts') {
            Pages.renderAllPosts(container);
        } else if (hash.startsWith('post/')) {
            const slug = hash.split('/')[1];
            Pages.renderPost(container, slug);
        } else if (hash === 'categories') {
            Pages.renderCategories(container);
        } else if (hash.startsWith('category/')) {
            const slug = hash.split('/')[1];
            Pages.renderCategoryPosts(container, slug);
        } else if (hash === 'affiliate' || hash === 'deals') {
            Pages.renderAffiliate(container);
        } else if (hash === 'about') {
            Pages.renderAbout(container);
        } else {
            Pages.render404(container);
        }
        
        // Re-init scroll reveal for new content
        Effects.initScrollReveal();
    },
    
    /**
     * Update active nav link
     */
    updateActiveNavLink(hash) {
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
            const linkHash = link.getAttribute('href')?.slice(1);
            if (linkHash === hash || (hash === '' && linkHash === 'home')) {
                link.classList.add('active');
            }
        });
    },
    
    /**
     * Navigate to route
     */
    navigate(route) {
        window.location.hash = route;
    }
};

// ==================== 10. PAGES MODULE ====================
const Pages = {
    /**
     * Render Home Page
     */
    renderHome(container) {
        const lang = I18n.currentLang;
        const featuredPost = Data.getFeaturedPost();
        const latestPosts = Data.getPublishedPosts()
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 6);
        const categories = Data.getCategories();
        
        container.innerHTML = `
            <!-- Hero Section -->
            <section class="hero reveal active">
                <div class="hero-badge">
                    <span>${I18n.t('hero.badge')}</span>
                </div>
                <h1 class="hero-title">${I18n.t('hero.title')}</h1>
                <p class="hero-subtitle">${I18n.t('hero.subtitle')}</p>
                <div class="hero-actions">
                    <a href="#posts" class="btn btn-primary magnetic-btn">
                        <i class="fas fa-rocket"></i>
                        <span>${I18n.t('hero.btn.explore')}</span>
                    </a>
                    <a href="#affiliate" class="btn btn-secondary magnetic-btn">
                        <i class="fas fa-tag"></i>
                        <span>${I18n.t('hero.btn.deals')}</span>
                    </a>
                </div>
            </section>
            
            <!-- Featured Post -->
            ${featuredPost ? `
            <section class="featured-section reveal">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="fas fa-star"></i>
                        <span>${I18n.t('section.featured')}</span>
                    </h2>
                </div>
                ${this.renderFeaturedCard(featuredPost, lang)}
            </section>
            ` : ''}
            
            <!-- Latest Posts -->
            <section class="latest-section reveal">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="fas fa-fire"></i>
                        <span>${I18n.t('section.latest')}</span>
                    </h2>
                    <a href="#posts" class="section-link">
                        <span>${I18n.t('section.viewAll')}</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                <div class="posts-grid">
                    ${latestPosts.map(post => this.renderPostCard(post, lang)).join('')}
                </div>
            </section>
            
            <!-- Categories -->
            <section class="categories-section reveal">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="fas fa-folder-open"></i>
                        <span>${I18n.t('section.categories')}</span>
                    </h2>
                </div>
                <div class="categories-grid">
                    ${categories.map(cat => this.renderCategoryCard(cat, lang)).join('')}
                </div>
            </section>
        `;
    },
    
    /**
     * Render Featured Card
     */
    renderFeaturedCard(post, lang) {
        const category = Data.getCategoryById(post.category);
        return `
            <article class="featured-card tilt-card">
                <div class="featured-card-image">
                    <img src="${post.coverImage}" alt="${Utils.escapeHtml(post.title[lang])}" loading="lazy">
                </div>
                <div class="featured-card-content">
                    <div class="featured-badge">
                        <i class="fas fa-star"></i>
                        <span>${I18n.t('section.featured')}</span>
                    </div>
                    ${category ? `
                        <span class="badge" style="background: ${category.color}20; color: ${category.color}; border-color: ${category.color};">
                            <i class="fas ${category.icon}"></i>
                            ${Utils.escapeHtml(category.name[lang])}
                        </span>
                    ` : ''}
                    <h3 class="post-card-title" style="font-size: 1.5rem; margin-top: var(--space-md);">
                        ${Utils.escapeHtml(post.title[lang])}
                    </h3>
                    <p class="post-card-excerpt">${Utils.escapeHtml(post.excerpt[lang])}</p>
                    <div class="post-card-meta" style="margin-bottom: var(--space-lg);">
                        <span><i class="fas fa-eye"></i> ${post.views} ${I18n.t('post.views')}</span>
                        <span><i class="fas fa-clock"></i> ${Utils.calculateReadingTime(post.content[lang])} ${I18n.t('post.readingTime')}</span>
                    </div>
                    <a href="#post/${post.slug}" class="btn btn-primary">
                        <span>${I18n.t('btn.readMore')}</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    },
    
    /**
     * Render Post Card
     */
    renderPostCard(post, lang) {
        const category = Data.getCategoryById(post.category);
        const readingTime = Utils.calculateReadingTime(post.content[lang]);
        
        return `
            <article class="card post-card reveal">
                <div class="post-card-image">
                    <img src="${post.coverImage}" alt="${Utils.escapeHtml(post.title[lang])}" loading="lazy">
                    ${category ? `
                        <span class="post-card-category" style="color: ${category.color}; border-color: ${category.color};">
                            <i class="fas ${category.icon}"></i>
                            ${Utils.escapeHtml(category.name[lang])}
                        </span>
                    ` : ''}
                </div>
                <div class="post-card-body">
                    <h3 class="post-card-title">${Utils.escapeHtml(post.title[lang])}</h3>
                    <p class="post-card-excerpt">${Utils.escapeHtml(post.excerpt[lang])}</p>
                    <div class="post-card-meta">
                        <span><i class="fas fa-eye"></i> ${post.views}</span>
                        <span><i class="fas fa-clock"></i> ${readingTime} ${I18n.t('post.readingTime')}</span>
                        <span><i class="fas fa-comments"></i> ${post.commentsCount || 0}</span>
                    </div>
                </div>
                <a href="#post/${post.slug}" class="post-card-link" aria-label="Read ${Utils.escapeHtml(post.title[lang])}"></a>
            </article>
        `;
    },
    
    /**
     * Render Category Card
     */
    renderCategoryCard(category, lang) {
        const postCount = Data.getPostsByCategory(category.slug).length;
        return `
            <div class="category-card reveal" onclick="Router.navigate('category/${category.slug}')" role="button" tabindex="0" aria-label="${Utils.escapeHtml(category.name[lang])}">
                <div class="category-icon" style="background: ${category.color}20; color: ${category.color};">
                    <i class="fas ${category.icon}"></i>
                </div>
                <h3 class="category-name">${Utils.escapeHtml(category.name[lang])}</h3>
                <span class="category-count">${postCount} ${I18n.t('categories.posts')}</span>
            </div>
        `;
    },
    
    /**
     * Render All Posts Page
     */
    renderAllPosts(container) {
        const lang = I18n.currentLang;
        const posts = Data.getPublishedPosts().sort((a, b) => b.createdAt - a.createdAt);
        
        container.innerHTML = `
            <section class="posts-page">
                <div class="section-header">
                    <h1 class="section-title">
                        <i class="fas fa-newspaper"></i>
                        <span>${I18n.t('nav.posts')}</span>
                    </h1>
                </div>
                <div class="posts-grid">
                    ${posts.map(post => this.renderPostCard(post, lang)).join('')}
                </div>
            </section>
        `;
    },
    
    /**
     * Render Single Post Page
     */
    renderPost(container, slug) {
        const post = Data.getPostBySlug(slug);
        const lang = I18n.currentLang;
        
        if (!post) {
            this.render404(container);
            return;
        }
        
        // Increment views count
        Data.incrementViews(post.id);
        
        const category = Data.getCategoryById(post.category);
        const readingTime = Utils.calculateReadingTime(post.content[lang]);
        const relatedPosts = Data.getRelatedPosts(post);
        const comments = Data.getComments(post.id);
        
        container.innerHTML = `
            <article class="post-page">
                <!-- Post Header -->
                <header class="post-header reveal active">
                    ${category ? `
                        <a href="#category/${category.slug}" class="badge" style="background: ${category.color}20; color: ${category.color}; border-color: ${category.color}; margin-bottom: var(--space-lg); display: inline-flex;">
                            <i class="fas ${category.icon}"></i>
                            ${Utils.escapeHtml(category.name[lang])}
                        </a>
                    ` : ''}
                    <h1 class="post-title">${Utils.escapeHtml(post.title[lang])}</h1>
                    <div class="post-meta" style="display: flex; gap: var(--space-lg); flex-wrap: wrap; color: var(--text-muted); font-size: 0.9rem;">
                        <span><i class="fas fa-calendar"></i> ${Utils.formatDate(post.createdAt, lang)}</span>
                        <span><i class="fas fa-clock"></i> ${readingTime} ${I18n.t('post.readingTime')}</span>
                        <span><i class="fas fa-eye"></i> ${post.views} ${I18n.t('post.views')}</span>
                        <span><i class="fas fa-comments"></i> ${comments.length} ${I18n.t('post.comments')}</span>
                    </div>
                </header>
                
                <!-- Cover Image -->
                <div class="post-cover reveal" style="margin: var(--space-xl) 0;">
                    <img src="${post.coverImage}" alt="${Utils.escapeHtml(post.title[lang])}" style="width: 100%; border-radius: var(--radius-lg);">
                </div>
                
                <!-- Affiliate Disclosure (if applicable) -->
                ${post.isAffiliate ? `
                    <div class="affiliate-disclosure reveal" style="background: var(--surface); border: 1px solid var(--neon-yellow); border-radius: var(--radius-md); padding: var(--space-lg); margin-bottom: var(--space-xl);">
                        <h3 style="color: var(--neon-yellow); display: flex; align-items: center; gap: var(--space-sm);">
                            <i class="fas fa-info-circle"></i>
                            ${I18n.t('affiliate.disclosure.title')}
                        </h3>
                        <p style="margin: 0;">${I18n.t('affiliate.disclosure.text')}</p>
                    </div>
                ` : ''}
                
                <!-- Post Content -->
                <div class="post-content reveal" style="max-width: 800px; margin: 0 auto;">
                    ${Utils.sanitizeHtml(post.content[lang])}
                </div>
                
                <!-- Download/Action Button -->
                ${post.downloadLink ? `
                    <div class="post-action" style="text-align: center; margin: var(--space-2xl) 0;">
                        <a href="${Utils.escapeHtml(post.downloadLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary glow" style="font-size: 1.2rem; padding: var(--space-lg) var(--space-2xl);">
                            <i class="fas fa-download"></i>
                            <span>${Utils.escapeHtml(post.buttonText[lang])}</span>
                        </a>
                    </div>
                ` : ''}
                
                <!-- Share Buttons -->
                <div class="post-share" style="text-align: center; margin: var(--space-2xl) 0;">
                    <button class="btn btn-secondary" id="share-post-btn">
                        <i class="fas fa-share-alt"></i>
                        <span>${I18n.t('post.share')}</span>
                    </button>
                </div>
                
                <!-- Related Posts -->
                ${relatedPosts.length > 0 ? `
                    <section class="related-posts reveal" style="margin-top: var(--space-3xl);">
                        <h2 class="section-title">
                            <i class="fas fa-link"></i>
                            <span>${I18n.t('post.related')}</span>
                        </h2>
                        <div class="posts-grid">
                            ${relatedPosts.map(p => this.renderPostCard(p, lang)).join('')}
                        </div>
                    </section>
                ` : ''}
                
                <!-- Comments Section -->
                <section class="comments-section reveal" style="margin-top: var(--space-3xl);">
                    ${Comments.render(post.id, comments)}
                </section>
            </article>
        `;
        
        // Bind share button
        const shareBtn = document.getElementById('share-post-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                UI.openModal('share-modal');
            });
        }
    },
    
    /**
     * Render Categories Page
     */
    renderCategories(container) {
        const lang = I18n.currentLang;
        const categories = Data.getCategories();
        
        container.innerHTML = `
            <section class="categories-page">
                <div class="section-header">
                    <h1 class="section-title">
                        <i class="fas fa-folder-open"></i>
                        <span>${I18n.t('categories.title')}</span>
                    </h1>
                </div>
                <div class="categories-grid">
                    ${categories.map(cat => this.renderCategoryCard(cat, lang)).join('')}
                </div>
            </section>
        `;
    },
    
    /**
     * Render Category Posts
     */
    renderCategoryPosts(container, slug) {
        const lang = I18n.currentLang;
        const category = Data.getCategoryBySlug(slug);
        const posts = Data.getPostsByCategory(slug);
        
        if (!category) {
            this.render404(container);
            return;
        }
        
        container.innerHTML = `
            <section class="category-page">
                <div class="section-header">
                    <h1 class="section-title" style="color: ${category.color};">
                        <i class="fas ${category.icon}"></i>
                        <span>${Utils.escapeHtml(category.name[lang])}</span>
                    </h1>
                </div>
                ${posts.length > 0 ? `
                    <div class="posts-grid">
                        ${posts.map(post => this.renderPostCard(post, lang)).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3>${I18n.t('empty.posts.title')}</h3>
                        <p>${I18n.t('empty.posts.text')}</p>
                    </div>
                `}
            </section>
        `;
    },
    
    /**
     * Render Affiliate Page
     */
    renderAffiliate(container) {
        const lang = I18n.currentLang;
        
        const tools = [
            { name: 'Hostinger', icon: 'fa-server', color: '#673DE6', rating: 4.8, desc: { en: 'Premium web hosting with free domain and SSL', ar: 'استضافة ويب مميزة مع دومين و SSL مجاني' }, url: 'https://hostinger.com?ref=kenven' },
            { name: 'Cloudways', icon: 'fa-cloud', color: '#2C39BD', rating: 4.7, desc: { en: 'Managed cloud hosting for developers', ar: 'استضافة سحابية مُدارة للمطورين' }, url: 'https://cloudways.com?ref=kenven' },
            { name: 'Fiverr', icon: 'fa-briefcase', color: '#1DBF73', rating: 4.5, desc: { en: 'Freelance services for your business', ar: 'خدمات فريلانس لأعمالك' }, url: 'https://fiverr.com?ref=kenven' },
            { name: 'Namecheap', icon: 'fa-globe', color: '#DE3723', rating: 4.6, desc: { en: 'Domain names and hosting at great prices', ar: 'دومينات واستضافة بأسعار رائعة' }, url: 'https://namecheap.com?ref=kenven' },
            { name: 'Canva', icon: 'fa-palette', color: '#00C4CC', rating: 4.9, desc: { en: 'Design anything with easy-to-use tools', ar: 'صمم أي شيء بأدوات سهلة الاستخدام' }, url: 'https://canva.com?ref=kenven' },
            { name: 'Envato Elements', icon: 'fa-box-open', color: '#82B541', rating: 4.7, desc: { en: 'Unlimited downloads of creative assets', ar: 'تحميلات غير محدودة للأصول الإبداعية' }, url: 'https://elements.envato.com?ref=kenven' }
        ];
        
        container.innerHTML = `
            <section class="affiliate-page">
                <div class="section-header" style="text-align: center; display: block;">
                    <h1 class="section-title" style="justify-content: center;">
                        <i class="fas fa-tag"></i>
                        <span>${I18n.t('deals.title')}</span>
                    </h1>
                    <p style="color: var(--text-secondary); max-width: 600px; margin: var(--space-md) auto;">
                        ${I18n.t('deals.subtitle')}
                    </p>
                </div>
                
                <!-- Affiliate Disclosure -->
                <div class="affiliate-disclosure" style="background: var(--surface); border: 1px solid var(--neon-yellow); border-radius: var(--radius-md); padding: var(--space-lg); margin-bottom: var(--space-2xl); text-align: center;">
                    <p style="margin: 0; color: var(--text-secondary);">
                        <i class="fas fa-info-circle" style="color: var(--neon-yellow);"></i>
                        ${I18n.t('affiliate.disclosure.text')}
                    </p>
                </div>
                
                <!-- Tools Grid -->
                <div class="affiliate-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-xl);">
                    ${tools.map(tool => `
                        <div class="card affiliate-card reveal">
                            <div style="padding: var(--space-xl); text-align: center;">
                                <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: ${tool.color}20; color: ${tool.color}; border-radius: var(--radius-md); margin: 0 auto var(--space-lg); font-size: 1.5rem;">
                                    <i class="fas ${tool.icon}"></i>
                                </div>
                                <h3 style="margin-bottom: var(--space-sm);">${tool.name}</h3>
                                <div style="color: var(--neon-yellow); margin-bottom: var(--space-md);">
                                    ${'★'.repeat(Math.floor(tool.rating))}${'☆'.repeat(5 - Math.floor(tool.rating))}
                                    <span style="color: var(--text-muted); font-size: 0.9rem;">(${tool.rating})</span>
                                </div>
                                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--space-lg);">
                                    ${Utils.escapeHtml(tool.desc[lang])}
                                </p>
                                <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width: 100%;">
                                    <span>${I18n.t('btn.visitSite')}</span>
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    },
    
    /**
     * Render About Page
     */
    renderAbout(container) {
        container.innerHTML = `
            <section class="about-page" style="text-align: center; max-width: 800px; margin: 0 auto;">
                <img src="${CONFIG.site.logo}" alt="Kenven Hub" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto var(--space-xl); box-shadow: var(--shadow-neon);">
                <h1 class="section-title" style="justify-content: center;">${I18n.t('about.title')}</h1>
                <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: var(--space-2xl);">
                    ${I18n.t('about.text')}
                </p>
                <div class="hero-actions">
                    <a href="${CONFIG.site.discord}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                        <i class="fab fa-discord"></i>
                        <span>Discord</span>
                    </a>
                    <a href="${CONFIG.site.website}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                        <i class="fas fa-globe"></i>
                        <span>Kenven Service</span>
                    </a>
                </div>
            </section>
        `;
    },
    
    /**
     * Render 404 Page
     */
    render404(container) {
        container.innerHTML = `
            <section class="error-page" style="text-align: center; padding: var(--space-3xl) 0;">
                <h1 style="font-family: var(--font-mono); font-size: 6rem; color: var(--neon); margin-bottom: var(--space-md);">404</h1>
                <h2 style="margin-bottom: var(--space-md);">${I18n.t('post.notFound')}</h2>
                <a href="#home" class="btn btn-primary">
                    <i class="fas fa-home"></i>
                    <span>${I18n.t('btn.backToHome')}</span>
                </a>
            </section>
        `;
    }
};

// ==================== 11. COMMENTS MODULE ====================
const Comments = {
    currentSort: 'latest',
    
    /**
     * Render comments section
     */
    render(postId, comments) {
        const lang = I18n.currentLang;
        const sortedComments = this.sortComments(comments, this.currentSort);
        const topLevelComments = sortedComments.filter(c => !c.parentId);
        
        return `
            <div class="comments-container">
                <div class="comments-header" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-xl);">
                    <h2 class="section-title" style="margin: 0;">
                        <i class="fas fa-comments"></i>
                        <span>${I18n.t('comments.title')} (${comments.length})</span>
                    </h2>
                    <div class="comments-sort" style="display: flex; gap: var(--space-sm);">
                        <button class="filter-chip ${this.currentSort === 'latest' ? 'active' : ''}" data-sort="latest">${I18n.t('comments.sort.latest')}</button>
                        <button class="filter-chip ${this.currentSort === 'oldest' ? 'active' : ''}" data-sort="oldest">${I18n.t('comments.sort.oldest')}</button>
                        <button class="filter-chip ${this.currentSort === 'liked' ? 'active' : ''}" data-sort="liked">${I18n.t('comments.sort.liked')}</button>
                    </div>
                </div>
                
                <!-- Comment Form -->
                <form class="comment-form" id="comment-form" style="background: var(--surface); border-radius: var(--radius-lg); padding: var(--space-xl); margin-bottom: var(--space-2xl);">
                    <div class="form-group">
                        <input type="text" id="comment-name" class="form-input" placeholder="${I18n.t('comments.name')}" required>
                    </div>
                    <div class="form-group">
                        <input type="email" id="comment-email" class="form-input" placeholder="${I18n.t('comments.email')}" required>
                    </div>
                    <div class="form-group">
                        <textarea id="comment-content" class="form-textarea" placeholder="${I18n.t('comments.content')}" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        <span>${I18n.t('comments.submit')}</span>
                    </button>
                </form>
                
                <!-- Comments List -->
                <div class="comments-list" id="comments-list">
                    ${topLevelComments.length > 0 
                        ? topLevelComments.map(comment => this.renderComment(comment, sortedComments, postId)).join('')
                        : `<div class="empty-state">
                               <div class="empty-state-icon"><i class="fas fa-comment-slash"></i></div>
                               <p>${I18n.t('comments.empty')}</p>
                           </div>`
                    }
                </div>
            </div>
        `;
    },
    
    /**
     * Render single comment with replies
     */
    renderComment(comment, allComments, postId, depth = 0) {
        const replies = allComments.filter(c => c.parentId === comment.id);
        
        return `
            <div class="comment" data-comment-id="${comment.id}" style="margin-bottom: var(--space-lg); ${depth > 0 ? 'margin-left: var(--space-2xl);' : ''}">
                <div class="comment-card" style="background: var(--surface); border-radius: var(--radius-md); padding: var(--space-lg); ${comment.isAdmin ? 'border: 1px solid var(--neon);' : ''}">
                    <div class="comment-header" style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);">
                        <div class="comment-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: ${comment.isAdmin ? 'var(--neon)' : 'var(--card)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; color: ${comment.isAdmin ? 'var(--bg-deep)' : 'var(--neon)'};">
                            ${Utils.escapeHtml(comment.authorName.charAt(0).toUpperCase())}
                        </div>
                        <div>
                            <div class="comment-author" style="font-weight: 600; display: flex; align-items: center; gap: var(--space-sm);">
                                ${Utils.escapeHtml(comment.authorName)}
                                ${comment.isAdmin ? '<span class="badge badge-neon">Admin</span>' : ''}
                            </div>
                            <div class="comment-date" style="font-size: 0.8rem; color: var(--text-muted);">
                                ${Utils.formatDate(comment.createdAt, I18n.currentLang)}
                            </div>
                        </div>
                    </div>
                    <div class="comment-content" style="color: var(--text-secondary); margin-bottom: var(--space-md);">
                        ${Utils.escapeHtml(comment.content)}
                    </div>
                    <div class="comment-actions" style="display: flex; gap: var(--space-lg);">
                        <button class="comment-like-btn" data-comment-id="${comment.id}" style="color: var(--text-muted); display: flex; align-items: center; gap: var(--space-xs);">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${comment.likes || 0}</span>
                        </button>
                        ${depth < 2 ? `
                            <button class="comment-reply-btn" data-comment-id="${comment.id}" style="color: var(--text-muted); display: flex; align-items: center; gap: var(--space-xs);">
                                <i class="fas fa-reply"></i>
                                <span>${I18n.t('comments.reply')}</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${replies.map(reply => this.renderComment(reply, allComments, postId, depth + 1)).join('')}
            </div>
        `;
    },
    
    /**
     * Sort comments
     */
    sortComments(comments, sortBy) {
        const sorted = [...comments];
        switch (sortBy) {
            case 'oldest':
                sorted.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'liked':
                sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            case 'latest':
            default:
                sorted.sort((a, b) => b.createdAt - a.createdAt);
        }
        return sorted;
    },
    
    /**
     * Bind comment events
     */
    bindEvents(postId) {
        // Comment form submission
        const form = document.getElementById('comment-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(postId);
            });
        }
        
        // Sort buttons
        document.querySelectorAll('.comments-sort .filter-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentSort = e.target.dataset.sort;
                const comments = Data.getComments(postId);
                const container = document.querySelector('.comments-section');
                if (container) {
                    container.innerHTML = this.render(postId, comments);
                    this.bindEvents(postId);
                }
            });
        });
        
        // Like buttons
        document.querySelectorAll('.comment-like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.currentTarget.dataset.commentId;
                this.handleLike(commentId);
            });
        });
        
        // Reply buttons
        document.querySelectorAll('.comment-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.currentTarget.dataset.commentId;
                this.handleReply(commentId, postId);
            });
        });
    },
    
    /**
     * Handle comment submission with rate limiting
     */
    handleSubmit(postId) {
        const name = document.getElementById('comment-name').value.trim();
        const email = document.getElementById('comment-email').value.trim();
        const content = document.getElementById('comment-content').value.trim();
        
        // Validation
        if (!name || !email || !content) {
            UI.showToast(I18n.t('comments.error.empty'), 'error');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            UI.showToast(I18n.t('comments.error.email'), 'error');
            return;
        }
        
        // Rate limiting
        const recentComments = Storage.get('kenven_hub_comment_timestamps', []);
        const now = Date.now();
        const recentCount = recentComments.filter(t => now - t < CONFIG.rateLimit.comments.windowMs).length;
        
        if (recentCount >= CONFIG.rateLimit.comments.max) {
            UI.showToast(I18n.t('comments.error.rateLimit'), 'warning');
            return;
        }
        
        // Create comment
        const comment = {
            id: Utils.generateId(),
            postId: postId,
            authorName: name,
            authorEmail: email,
            content: content,
            parentId: null,
            isAdmin: false,
            approved: true, // Auto-approve for now (moderation in admin panel)
            likes: 0,
            createdAt: Date.now()
        };
        
        Data.addComment(comment);
        recentComments.push(now);
        Storage.set('kenven_hub_comment_timestamps', recentComments);
        
        // Re-render comments
        const comments = Data.getComments(postId);
        const container = document.querySelector('.comments-section');
        if (container) {
            container.innerHTML = this.render(postId, comments);
            this.bindEvents(postId);
        }
        
        // Reset form
        document.getElementById('comment-form').reset();
        
        UI.showToast(I18n.t('comments.success'), 'success');
    },
    
    /**
     * Handle like
     */
    handleLike(commentId) {
        const success = Data.likeComment(commentId);
        if (success) {
            UI.showToast(I18n.t('comments.liked'), 'success');
            const likeCount = document.querySelector(`.comment[data-comment-id="${commentId}"] .like-count`);
            if (likeCount) {
                likeCount.textContent = parseInt(likeCount.textContent) + 1;
            }
        } else {
            UI.showToast(I18n.t('comments.alreadyLiked'), 'warning');
        }
    },
    
    /**
     * Handle reply
     */
    handleReply(commentId, postId) {
        const replyForm = `
            <form class="reply-form" data-parent-id="${commentId}" style="margin-top: var(--space-md); margin-left: var(--space-2xl);">
                <div class="form-group">
                    <input type="text" class="form-input reply-name" placeholder="${I18n.t('comments.name')}" required>
                </div>
                <div class="form-group">
                    <input type="email" class="form-input reply-email" placeholder="${I18n.t('comments.email')}" required>
                </div>
                <div class="form-group">
                    <textarea class="form-textarea reply-content" placeholder="${I18n.t('comments.content')}" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">
                    <span>${I18n.t('comments.reply')}</span>
                </button>
            </form>
        `;
        
        const commentCard = document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-card`);
        if (commentCard && !commentCard.nextElementSibling?.classList.contains('reply-form')) {
            commentCard.insertAdjacentHTML('afterend', replyForm);
            
            // Bind reply form
            const form = document.querySelector(`.reply-form[data-parent-id="${commentId}"]`);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReplySubmit(commentId, postId);
            });
        }
    },
    
    /**
     * Handle reply submission
     */
    handleReplySubmit(parentId, postId) {
        const form = document.querySelector(`.reply-form[data-parent-id="${parentId}"]`);
        const name = form.querySelector('.reply-name').value.trim();
        const email = form.querySelector('.reply-email').value.trim();
        const content = form.querySelector('.reply-content').value.trim();
        
        if (!name || !email || !content) {
            UI.showToast(I18n.t('comments.error.empty'), 'error');
            return;
        }
        
        const reply = {
            id: Utils.generateId(),
            postId: postId,
            authorName: name,
            authorEmail: email,
            content: content,
            parentId: parentId,
            isAdmin: false,
            approved: true,
            likes: 0,
            createdAt: Date.now()
        };
        
        Data.addComment(reply);
        
        // Re-render
        const comments = Data.getComments(postId);
        const container = document.querySelector('.comments-section');
        if (container) {
            container.innerHTML = this.render(postId, comments);
            this.bindEvents(postId);
        }
        
        UI.showToast(I18n.t('comments.success'), 'success');
    }
};

// ==================== 12. SEARCH MODULE ====================
const Search = {
    currentFilter: 'all',
    
    /**
     * Initialize search
     */
    init() {
        const searchBtn = document.getElementById('search-btn');
        const searchModal = document.getElementById('search-modal');
        const searchClose = document.getElementById('search-close');
        const searchInput = document.getElementById('search-input');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                UI.openModal('search-modal');
                setTimeout(() => searchInput?.focus(), 100);
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', () => {
                UI.closeModal('search-modal');
            });
        }
        
        // Close on backdrop click
        if (searchModal) {
            searchModal.querySelector('.modal-backdrop').addEventListener('click', () => {
                UI.closeModal('search-modal');
            });
        }
        
        // Search input with debounce
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.performSearch(e.target.value);
            }, 300));
        }
        
        // Filter chips
        document.querySelectorAll('.search-filters .filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.search-filters .filter-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.performSearch(searchInput?.value || '');
            });
        });
        
        // Keyboard shortcut (Ctrl+K or /)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
                e.preventDefault();
                UI.openModal('search-modal');
                setTimeout(() => searchInput?.focus(), 100);
            }
            if (e.key === 'Escape') {
                UI.closeAllModals();
            }
        });
    },
    
    /**
     * Perform search
     */
    performSearch(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        if (!query.trim()) {
            resultsContainer.innerHTML = `
                <div class="search-empty">${I18n.t('search.empty')}</div>
            `;
            return;
        }
        
        const results = Data.searchPosts(query, this.currentFilter);
        const lang = I18n.currentLang;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-empty">
                    ${I18n.t('search.noResults')} "${Utils.escapeHtml(query)}"
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = `
            <div class="search-results-count" style="margin-bottom: var(--space-md); color: var(--text-muted); font-size: 0.9rem;">
                ${results.length} ${I18n.t('search.results')}
            </div>
            ${results.map(post => `
                <div class="search-result-item" onclick="Router.navigate('post/${post.slug}'); UI.closeModal('search-modal');">
                    <img src="${post.coverImage}" alt="${Utils.escapeHtml(post.title[lang])}" class="search-result-image" loading="lazy">
                    <div class="search-result-content">
                        <h4 class="search-result-title">${Utils.escapeHtml(post.title[lang])}</h4>
                        <p class="search-result-excerpt">${Utils.escapeHtml(Utils.truncate(post.excerpt[lang], 100))}</p>
                    </div>
                </div>
            `).join('')}
        `;
    }
};

// ==================== 13. SHARE MODULE ====================
const Share = {
    /**
     * Initialize share functionality
     */
    init() {
        const shareClose = document.getElementById('share-close');
        const shareModal = document.getElementById('share-modal');
        
        if (shareClose) {
            shareClose.addEventListener('click', () => {
                UI.closeModal('share-modal');
            });
        }
        
        if (shareModal) {
            shareModal.querySelector('.modal-backdrop').addEventListener('click', () => {
                UI.closeModal('share-modal');
            });
        }
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.share(platform);
            });
        });
    },
    
    /**
     * Share to platform
     */
    share(platform) {
        const url = window.location.href;
        const title = document.title;
        
        const urls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        };
        
        if (platform === 'copy') {
            Utils.copyToClipboard(url).then(success => {
                if (success) {
                    UI.showToast(I18n.t('toast.copied'), 'success');
                } else {
                    UI.showToast(I18n.t('toast.error'), 'error');
                }
            });
        } else if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
        
        UI.closeModal('share-modal');
    }
};

// ==================== 14. NAVBAR MODULE ====================
const Navbar = {
    /**
     * Initialize navbar
     */
    init() {
        const navbar = document.getElementById('navbar');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        // Scroll effect
        window.addEventListener('scroll', Utils.debounce(() => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, 100));
        
        // Mobile menu toggle
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                const isOpen = mobileMenu.classList.toggle('open');
                mobileMenuBtn.setAttribute('aria-expanded', isOpen);
                const icon = mobileMenuBtn.querySelector('i');
                icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
            });
        }
        
        // Language switcher
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) {
            langSwitcher.addEventListener('click', () => {
                I18n.toggleLang();
            });
        }
        
        // Effects toggle
        const effectsToggle = document.getElementById('effects-toggle');
        if (effectsToggle) {
            effectsToggle.addEventListener('click', () => {
                Effects.toggle();
            });
        }
        
        // Admin button (Ctrl+Shift+A)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                window.location.href = 'admin.html';
            }
        });
        
        // Type "admin" to open admin panel
        let adminBuffer = '';
        document.addEventListener('keypress', (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            
            adminBuffer += e.key.toLowerCase();
            if (adminBuffer.includes('admin')) {
                window.location.href = 'admin.html';
                adminBuffer = '';
            }
            if (adminBuffer.length > 10) {
                adminBuffer = adminBuffer.slice(-10);
            }
        });
        
        // #admin hash
        if (window.location.hash === '#admin') {
            window.location.href = 'admin.html';
        }
    }
};

// ==================== 15. NEWSLETTER MODULE ====================
const Newsletter = {
    /**
     * Initialize newsletter
     */
    init() {
        const form = document.getElementById('newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubscribe();
            });
        }
    },
    
    /**
     * Handle subscription
     */
    handleSubscribe() {
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput.value.trim();
        
        if (!Utils.isValidEmail(email)) {
            UI.showToast(I18n.t('newsletter.error'), 'error');
            return;
        }
        
        // Rate limiting
        const subscriptions = Storage.get(CONFIG.storageKeys.newsletter, []);
        const today = new Date().toDateString();
        const todayCount = subscriptions.filter(s => new Date(s.date).toDateString() === today).length;
        
        if (todayCount >= CONFIG.rateLimit.newsletter.max) {
            UI.showToast('Too many subscriptions today. Try again tomorrow.', 'warning');
            return;
        }
        
        // Save subscription (in real implementation, send to backend)
        subscriptions.push({ email, date: new Date().toISOString() });
        Storage.set(CONFIG.storageKeys.newsletter, subscriptions);
        
        emailInput.value = '';
        UI.showToast(I18n.t('newsletter.success'), 'success');
    }
};

// ==================== 16. PWA MODULE ====================
const PWA = {
    /**
     * Register service worker
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration.scope);
                    })
                    .catch(error => {
                        console.log('SW registration failed:', error);
                    });
            });
        }
    }
};

// ==================== 17. EVENT LISTENERS ====================
const EventListeners = {
    /**
     * Initialize all event listeners
     */
    init() {
        // Ripple effect on buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (btn && Effects.isEnabled) {
                this.createRipple(e, btn);
            }
        });
        
        // Close modals on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UI.closeAllModals();
            }
        });
        
        // Prevent context menu on custom cursor (optional)
        // document.addEventListener('contextmenu', e => e.preventDefault());
    },
    
    /**
     * Create ripple effect
     */
    createRipple(event, button) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
};

// ==================== 18. APP INITIALIZATION ====================
const App = {
    /**
     * Initialize the entire application
     */
    async init() {
        try {
            console.log('🚀 Kenven Hub initializing...');
            
            // Initialize data (load mock data)
            Data.init();
            
            // Initialize i18n
            I18n.init();
            
            // Initialize effects
            Effects.init();
            Effects.initScrollProgress();
            Effects.initBackToTop();
            
            // Initialize navbar
            Navbar.init();
            
            // Initialize search
            Search.init();
            
            // Initialize share
            Share.init();
            
            // Initialize newsletter
            Newsletter.init();
            
            // Initialize event listeners
            EventListeners.init();
            
            // Initialize PWA
            PWA.registerServiceWorker();
            
            // Initialize router (this renders the page)
            Router.init();
            
            // Hide loader after short delay
            setTimeout(() => {
                UI.hideLoader();
            }, 1500);
            
            console.log('✅ Kenven Hub initialized successfully!');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            UI.showToast('Failed to load application. Please refresh.', 'error');
        }
    }
};

// ==================== 19. START APP ====================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle comments binding after post render
// This is a MutationObserver to bind comment events when post page renders
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            const commentsSection = document.querySelector('.comments-section');
            if (commentsSection && !commentsSection.dataset.bound) {
                const postId = document.querySelector('.comment-form')?.closest('.post-page') 
                    ? Data.getPostBySlug(Router.currentRoute.split('/')[1])?.id 
                    : null;
                if (postId) {
                    Comments.bindEvents(postId);
                    commentsSection.dataset.bound = 'true';
                }
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });
