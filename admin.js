/* ================================================================
KENVEN HUB - ADMIN PANEL (FINAL - CLEAN)
Firebase Auth + Firestore - Full Cloud Management
================================================================ */
'use strict';

// ==================== 1. CONFIGURATION ====================
const ADMIN_CONFIG = {
    firebase: {
        apiKey: "AIzaSyDQ7q03kfdOQAm_B03O47GlC4v8DCru94E",
        authDomain: "kenven-hub.firebaseapp.com",
        projectId: "kenven-hub",
        storageBucket: "kenven-hub.firebasestorage.app",
        messagingSenderId: "181277894032",
        appId: "1:181277894032:web:7f42a19f3bcf3ea3033f15",
        measurementId: "G-VLW5MCJ2CM"
    },
    adminEmail: "admin@kenven.com",
    sessionKey: 'kenven_hub_admin_session',
    sessionTimeout: 30 * 60 * 1000
};

// ==================== 2. CATEGORIES ====================
const CATEGORIES = [
    { id: 'apps', slug: 'apps', name: { en: 'Apps & Tools', ar: 'تطبيقات وأدوات' }, icon: 'fa-mobile-screen', color: '#5B9FFF' },
    { id: 'websites', slug: 'websites', name: { en: 'Websites', ar: 'مواقع' }, icon: 'fa-globe', color: '#8B5CF6' },
    { id: 'activation', slug: 'activation', name: { en: 'Activation', ar: 'تفعيل' }, icon: 'fa-key', color: '#00FF9D' },
    { id: 'fixes', slug: 'fixes', name: { en: 'Fixes & Tutorials', ar: 'إصلاحات وشروحات' }, icon: 'fa-screwdriver-wrench', color: '#FFE600' },
    { id: 'deals', slug: 'deals', name: { en: 'Deals & Offers', ar: 'عروض وخصومات' }, icon: 'fa-tag', color: '#FF2E63' },
    { id: 'guides', slug: 'guides', name: { en: 'Guides', ar: 'أدلة' }, icon: 'fa-book', color: '#5B9FFF' }
];

// ==================== 3. UTILITIES ====================
const AUtils = {
    esc(s) {
        if (typeof s !== 'string') return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    },
    date(ts) {
        try {
            return new Date(ts).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) { return ''; }
    },
    id() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    },
    slug(t) {
        return (t || '').toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    },
    toast(msg, type = 'info') {
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
            this.esc(msg) + '</span>';
        c.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 300);
        }, 3000);
    },
    confirm(msg) { return window.confirm(msg); }
};

// ==================== 4. FIREBASE ====================
let db = null, auth = null, FB_OK = false;
try {
    firebase.initializeApp(ADMIN_CONFIG.firebase);
    db = firebase.firestore();
    auth = firebase.auth();
    FB_OK = true;
} catch (e) {
    console.error('Firebase init failed:', e);
}

// ==================== 5. AUTH ====================
const AdminAuth = {
    async login(email, password) {
        if (!FB_OK) return { success: false, error: 'Firebase not available' };
        try {
            const cred = await auth.signInWithEmailAndPassword(email, password);
            let isAdmin = false;
            try {
                const doc = await db.collection('users').doc(cred.user.uid).get();
                isAdmin = doc.exists && doc.data().role === 'admin';
            } catch (e) {
                isAdmin = email === ADMIN_CONFIG.adminEmail;
            }
            if (!isAdmin) {
                await auth.signOut();
                return { success: false, error: 'Not authorized as admin' };
            }
            localStorage.setItem(ADMIN_CONFIG.sessionKey, JSON.stringify({
                uid: cred.user.uid,
                email: email,
                time: Date.now()
            }));
            return { success: true };
        } catch (e) {
            return { success: false, error: 'Invalid email or password' };
        }
    },
    checkSession() {
        try {
            const s = JSON.parse(localStorage.getItem(ADMIN_CONFIG.sessionKey));
            return s && (Date.now() - s.time) < ADMIN_CONFIG.sessionTimeout;
        } catch (e) {
            return false;
        }
    },
    logout() {
        localStorage.removeItem(ADMIN_CONFIG.sessionKey);
        if (FB_OK) auth.signOut();
        location.reload();
    }
};

// ==================== 6. DATA LAYER ====================
const AData = {
    async getPosts() {
        if (!FB_OK) return [];
        try {
            const s = await db.collection('posts').get();
            return s.docs.map(d => d.data());
        } catch (e) {
            console.warn('getPosts failed:', e);
            return [];
        }
    },
    async savePost(data, id) {
        if (id) {
            await db.collection('posts').doc(id).update(data);
        } else {
            await db.collection('posts').doc(data.id).set(data);
        }
    },
    async deletePost(id) {
        await db.collection('posts').doc(id).delete();
    },
    async getComments() {
        try {
            const s = await db.collection('comments').limit(200).get();
            return s.docs.map(d => d.data()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (e) { return []; }
    },
    async updateComment(id, patch) {
        await db.collection('comments').doc(id).update(patch);
    },
    async deleteComment(id) {
        await db.collection('comments').doc(id).delete();
    },
    async getAffiliate() {
        try {
            const s = await db.collection('affiliate_links').get();
            return s.docs.map(d => d.data());
        } catch (e) { return []; }
    },
    async saveAff(data) {
        await db.collection('affiliate_links').doc(data.id).set(data);
    },
    async deleteAff(id) {
        await db.collection('affiliate_links').doc(id).delete();
    },
    async getSettings() {
        try {
            const d = await db.collection('settings').doc('site').get();
            return d.exists ? d.data() : null;
        } catch (e) { return null; }
    },
    async saveSettings(obj) {
        await db.collection('settings').doc('site').set(obj, { merge: true });
    },
    async getCodes() {
        try {
            const s = await db.collection('coin_codes').get();
            return s.docs.map(d => d.data());
        } catch (e) { return []; }
    },
    async saveCode(data) {
        await db.collection('coin_codes').doc(data.code).set(data);
    },
    async updateCode(code, patch) {
        await db.collection('coin_codes').doc(code).update(patch);
    },
    async deleteCode(code) {
        await db.collection('coin_codes').doc(code).delete();
    },
    async getWallets() {
        try {
            const s = await db.collection('wallets')
                .where('transferred', '!=', true)
                .limit(200)
                .get();
            return s.docs.map(d => d.data());
        } catch (e) {
            try {
                const s2 = await db.collection('wallets').limit(200).get();
                return s2.docs.map(d => d.data()).filter(w => !w.transferred);
            } catch (e2) { return []; }
        }
    },
    async adjustWallet(id, delta) {
        await db.collection('wallets').doc(id).update({
            balance: firebase.firestore.FieldValue.increment(delta)
        });
    }
};

// ==================== 7. NAVIGATION ====================
const ANav = {
    init() {
        document.querySelectorAll('.admin-nav-item[data-tab]').forEach(i => {
            i.addEventListener('click', () => this.switch(i.dataset.tab));
        });
        document.getElementById('view-site-btn')?.addEventListener('click', () => {
            open('index.html', '_blank');
        });
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (AUtils.confirm('Logout?')) AdminAuth.logout();
        });
    },
    switch(t) {
        document.querySelectorAll('.admin-nav-item[data-tab]').forEach(i => {
            i.classList.toggle('active', i.dataset.tab === t);
        });
        document.querySelectorAll('.admin-tab').forEach(x => {
            x.classList.toggle('active', x.id === 'tab-' + t);
        });
        this.load(t);
    },
    load(t) {
        switch (t) {
            case 'dashboard': Dashboard.render(); break;
            case 'posts': Posts.render(); break;
            case 'comments': CommentsAdmin.render(); break;
            case 'categories': CategoriesAdmin.render(); break;
            case 'affiliate': AffiliateAdmin.render(); break;
            case 'coins': CoinsAdmin.render(); break;
            case 'analytics': AnalyticsAdmin.render(); break;
            case 'settings': SettingsAdmin.render(); break;
        }
    }
};

// ==================== 8. DASHBOARD ====================
const Dashboard = {
    async render() {
        const [posts, comments, wallets] = await Promise.all([
            AData.getPosts(),
            AData.getComments(),
            AData.getWallets()
        ]);
        const views = posts.reduce((s, p) => s + (p.views || 0), 0);
        const coins = wallets.reduce((s, w) => s + (w.balance || 0), 0);
        document.getElementById('stat-posts').textContent = posts.length;
        document.getElementById('stat-comments').textContent = comments.length;
        document.getElementById('stat-views').textContent = views.toLocaleString();
        document.getElementById('stat-coins').textContent = coins.toLocaleString();
        document.getElementById('dashboard-date').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('recent-comments-list').innerHTML = comments.slice(0, 5).map(c =>
            '<div class="comment-item">' +
            '<div class="comment-avatar">' + AUtils.esc((c.authorName || '?').charAt(0).toUpperCase()) + '</div>' +
            '<div class="comment-content"><div class="comment-author">' + AUtils.esc(c.authorName || '') +
            ' <span>· ' + AUtils.date(c.createdAt) + '</span></div>' +
            '<div class="comment-text">' + AUtils.esc((c.content || '').substring(0, 100)) + '</div></div>' +
            '<span class="status-badge ' + (c.approved ? 'status-approved' : 'status-pending') + '">' +
            (c.approved ? 'Approved' : 'Pending') + '</span></div>'
        ).join('') || '<p style="color:var(--text-muted);text-align:center;padding:var(--space-lg);">No comments yet.</p>';
        const top = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        document.getElementById('top-posts-list').innerHTML = top.map((p, i) =>
            '<div class="top-post-item">' +
            '<span class="top-post-rank ' + (i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '') + '">' + (i + 1) + '</span>' +
            '<div class="top-post-info"><div class="top-post-title">' + AUtils.esc(p.title?.en || '') + '</div>' +
            '<div class="top-post-stats"><i class="fas fa-eye"></i> ' + (p.views || 0) + ' · <i class="fas fa-coins"></i> ' + (p.coinPrice || 0) + '</div></div>' +
            '<a href="index.html#post/' + AUtils.esc(p.slug) + '" target="_blank" class="action-btn view"><i class="fas fa-eye"></i></a></div>'
        ).join('') || '<p style="color:var(--text-muted);text-align:center;padding:var(--space-lg);">No posts yet.</p>';
    }
};

// ==================== 9. POSTS MANAGEMENT ====================
const Posts = {
    quill: null,
    editId: null,
    affList: [],
    init() {
        document.getElementById('new-post-btn')?.addEventListener('click', () => this.showEditor());
        document.getElementById('cancel-post-btn')?.addEventListener('click', () => this.hideEditor());
        document.getElementById('post-form')?.addEventListener('submit', e => {
            e.preventDefault();
            this.save();
        });
        document.getElementById('post-title-en')?.addEventListener('input', e => {
            const s = document.getElementById('post-slug');
            if (s && !s.value) s.value = AUtils.slug(e.target.value);
        });
    },
    async render() {
        this.hideEditor();
        const posts = await AData.getPosts();
        const tbody = document.getElementById('posts-table-body');
        if (!posts.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No posts yet. Click "New Post".</td></tr>';
            return;
        }
        tbody.innerHTML = posts.map(p => {
            const c = CATEGORIES.find(x => x.id === p.category);
            return '<tr>' +
                '<td><div style="font-weight:600;margin-bottom:4px;">' + AUtils.esc(p.title?.en || '') + '</div>' +
                '<div style="font-size:.8rem;color:var(--text-muted);">/' + AUtils.esc(p.slug || '') + '</div></td>' +
                '<td>' + (c ? '<span style="color:' + c.color + '"><i class="fas ' + c.icon + '"></i> ' + c.name.en + '</span>' : '-') + '</td>' +
                '<td>' + (p.coinPrice > 0
                    ? '<span class="status-badge" style="background:rgba(255,215,0,.15);color:var(--gold);"><i class="fas fa-coins"></i> ' + p.coinPrice + '</span>'
                    : '<span class="status-badge status-active">Free</span>') + '</td>' +
                '<td><span class="status-badge status-' + p.status + '">' + p.status + '</span></td>' +
                '<td>' + (p.views || 0) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="action-btn edit" onclick="Posts.edit(\'' + p.id + '\')"><i class="fas fa-edit"></i></button>' +
                '<a href="index.html#post/' + AUtils.esc(p.slug) + '" target="_blank" class="action-btn view"><i class="fas fa-eye"></i></a>' +
                '<button class="action-btn delete" onclick="Posts.del(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    },
    async showEditor(id = null) {
        this.editId = id;
        this.affList = await AData.getAffiliate();
        document.getElementById('posts-list-container').style.display = 'none';
        document.getElementById('post-editor').style.display = 'block';
        const header = document.querySelector('#tab-posts .admin-header');
        if (header) header.style.display = 'none';
        document.getElementById('post-category').innerHTML = CATEGORIES.map(c =>
            '<option value="' + c.id + '">' + c.name.en + '</option>'
        ).join('');
        document.getElementById('post-affiliate-select').innerHTML = this.affList.map(a =>
            '<label class="checkbox-label"><input type="checkbox" value="' + AUtils.esc(a.id) + '" class="post-aff-check"><span>' + AUtils.esc(a.name) + '</span></label>'
        ).join('') || '<p style="color:var(--text-muted);font-size:.85rem;">No offers yet. Add them in Affiliate tab.</p>';
        if (!this.quill) {
            this.quill = new Quill('#post-content-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'code-block'],
                        ['clean']
                    ]
                }
            });
        }
        if (id) {
            const p = (await AData.getPosts()).find(x => x.id === id);
            if (p) {
                document.getElementById('post-editor-title').textContent = 'Edit Post';
                document.getElementById('post-title-en').value = p.title?.en || '';
                document.getElementById('post-title-ar').value = p.title?.ar || '';
                document.getElementById('post-slug').value = p.slug || '';
                document.getElementById('post-excerpt-en').value = p.excerpt?.en || '';
                document.getElementById('post-excerpt-ar').value = p.excerpt?.ar || '';
                document.getElementById('post-status').value = p.status || 'draft';
                document.getElementById('post-category').value = p.category || 'apps';
                document.getElementById('post-featured').checked = !!p.featured;
                document.getElementById('post-is-affiliate').checked = !!p.isAffiliate;
                document.getElementById('post-coin-price').value = p.coinPrice || 0;
                document.getElementById('post-cover').value = p.coverImage || '';
                document.getElementById('post-download-link').value = p.downloadLink || '';
                document.getElementById('post-button-text-en').value = p.buttonText?.en || '';
                document.getElementById('post-button-text-ar').value = p.buttonText?.ar || '';
                document.getElementById('post-tags').value = (p.tags || []).join(', ');
                const yt = document.getElementById('post-youtube-url');
                if (yt) yt.value = p.youtubeUrl || '';
                const pub = document.getElementById('post-publish-at');
                if (pub && p.publishAt) {
                    const d = new Date(p.publishAt);
                    pub.value = d.toISOString().slice(0, 16);
                }
                document.querySelectorAll('.post-aff-check').forEach(ch => {
                    if ((p.affiliateIds || []).includes(ch.value)) ch.checked = true;
                });
                this.quill.root.innerHTML = p.content?.en || '';
                return;
            }
        }
        document.getElementById('post-editor-title').textContent = 'Create New Post';
        document.getElementById('post-form').reset();
        document.getElementById('post-coin-price').value = 0;
        this.quill.root.innerHTML = '';
    },
    hideEditor() {
        document.getElementById('posts-list-container').style.display = 'block';
        document.getElementById('post-editor').style.display = 'none';
        const h = document.querySelector('#tab-posts .admin-header');
        if (h) h.style.display = 'flex';
        this.editId = null;
    },
    async save() {
        const tEn = document.getElementById('post-title-en').value.trim();
        const tAr = document.getElementById('post-title-ar').value.trim();
        if (!tEn || !tAr) {
            AUtils.toast('Fill both titles', 'error');
            return;
        }
        const affIds = [...document.querySelectorAll('.post-aff-check:checked')].map(c => c.value);
        const existing = this.editId ? (await AData.getPosts()).find(p => p.id === this.editId) : null;
        const pubEl = document.getElementById('post-publish-at');
        let publishAt = null;
        if (pubEl && pubEl.value) {
            publishAt = new Date(pubEl.value).getTime();
        }
        const ytEl = document.getElementById('post-youtube-url');
        const data = {
            id: this.editId || AUtils.id(),
            title: { en: tEn, ar: tAr },
            slug: document.getElementById('post-slug').value.trim() || AUtils.slug(tEn),
            excerpt: {
                en: document.getElementById('post-excerpt-en').value.trim(),
                ar: document.getElementById('post-excerpt-ar').value.trim()
            },
            content: {
                en: this.quill.root.innerHTML,
                ar: this.quill.root.innerHTML
            },
            category: document.getElementById('post-category').value,
            coverImage: document.getElementById('post-cover').value.trim() ||
                'https://picsum.photos/seed/' + Math.random().toString(36).substr(2, 5) + '/800/450',
            downloadLink: document.getElementById('post-download-link').value.trim(),
            buttonText: {
                en: document.getElementById('post-button-text-en').value.trim() || 'Read More',
                ar: document.getElementById('post-button-text-ar').value.trim() || 'اقرأ المزيد'
            },
            isAffiliate: document.getElementById('post-is-affiliate').checked,
            affiliateIds: affIds,
            tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            featured: document.getElementById('post-featured').checked,
            status: document.getElementById('post-status').value,
            coinPrice: parseInt(document.getElementById('post-coin-price').value) || 0,
            youtubeUrl: ytEl ? ytEl.value.trim() : '',
            views: existing?.views || 0,
            commentsCount: existing?.commentsCount || 0,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            publishAt: publishAt
        };
        try {
            await AData.savePost(data, this.editId);
            AUtils.toast(this.editId ? 'Updated!' : 'Created!', 'success');
            this.hideEditor();
            this.render();
        } catch (e) {
            AUtils.toast('Save failed: ' + e.message, 'error');
        }
    },
    async edit(id) { await this.showEditor(id); },
    async del(id) {
        if (AUtils.confirm('Delete this post permanently?')) {
            try {
                await AData.deletePost(id);
                AUtils.toast('Deleted', 'success');
                this.render();
            } catch (e) {
                AUtils.toast('Delete failed', 'error');
            }
        }
    }
};

// ==================== 10. COMMENTS ====================
const CommentsAdmin = {
    async render() {
        const comments = await AData.getComments();
        const tbody = document.getElementById('comments-table-body');
        if (!comments.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No comments.</td></tr>';
            return;
        }
        tbody.innerHTML = comments.map(x =>
            '<tr><td><div style="font-weight:600;">' + AUtils.esc(x.authorName || '') + '</div>' +
            '<div style="font-size:.8rem;color:var(--text-muted);">' + AUtils.esc(x.authorEmail || '') + '</div></td>' +
            '<td><div style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + AUtils.esc(x.content || '') + '</div></td>' +
            '<td><span class="status-badge ' + (x.approved ? 'status-approved' : 'status-pending') + '">' +
            (x.approved ? 'Approved' : 'Pending') + '</span></td>' +
            '<td>' + AUtils.date(x.createdAt) + '</td>' +
            '<td><div class="actions-cell">' +
            (!x.approved ? '<button class="action-btn approve" onclick="CommentsAdmin.approve(\'' + x.id + '\')"><i class="fas fa-check"></i></button>' : '') +
            '<button class="action-btn delete" onclick="CommentsAdmin.del(\'' + x.id + '\')"><i class="fas fa-trash"></i></button>' +
            '</div></td></tr>'
        ).join('');
    },
    async approve(id) {
        try {
            await AData.updateComment(id, { approved: true });
            AUtils.toast('Approved', 'success');
            this.render();
        } catch (e) {}
    },
    async del(id) {
        if (AUtils.confirm('Delete comment?')) {
            try {
                await AData.deleteComment(id);
                AUtils.toast('Deleted', 'success');
                this.render();
            } catch (e) {}
        }
    }
};

// ==================== 11. CATEGORIES (FIXED) ====================
const CategoriesAdmin = {
    async render() {
        const posts = await AData.getPosts();
        document.getElementById('categories-grid').innerHTML = CATEGORIES.map(c => {
            const n = posts.filter(x => x.category === c.id).length;
            return '<div style="cursor:default;background:var(--card);border:1px solid var(--glass-border);border-radius:var(--radius-lg);padding:var(--space-xl);text-align:center;">' +
                '<div style="width:60px;height:60px;margin:0 auto var(--space-md);border-radius:var(--radius-md);background:' + c.color + '20;color:' + c.color + ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;">' +
                '<i class="fas ' + c.icon + '"></i></div>' +
                '<h3 style="margin-bottom:4px;">' + c.name.en + '</h3>' +
                '<span style="color:var(--text-muted);font-size:.85rem;">' + n + ' posts · /' + c.slug + '</span></div>';
        }).join('');
    }
};

// ==================== 12. AFFILIATE ====================
const AffiliateAdmin = {
    init() {
        document.getElementById('save-aff-btn')?.addEventListener('click', () => this.save());
    },
    async save() {
        const name = document.getElementById('aff-name').value.trim();
        const url = document.getElementById('aff-url').value.trim();
        if (!name || !url) {
            AUtils.toast('Name and URL required', 'error');
            return;
        }
        const data = {
            id: AUtils.id(),
            name: name,
            url: url,
            icon: document.getElementById('aff-icon').value.trim() || 'fa-tag',
            color: document.getElementById('aff-color').value || '#5B9FFF',
            rating: parseFloat(document.getElementById('aff-rating').value) || 5,
            description: document.getElementById('aff-desc').value.trim(),
            clicks: 0,
            active: true
        };
        try {
            await AData.saveAff(data);
            AUtils.toast('Saved!', 'success');
            this.render();
        } catch (e) {
            AUtils.toast('Failed', 'error');
        }
    },
    async render() {
        const list = await AData.getAffiliate();
        const tbody = document.getElementById('affiliate-table-body');
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No offers yet. Add your first above.</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(a =>
            '<tr><td style="font-weight:600;"><i class="fas ' + AUtils.esc(a.icon || 'fa-tag') + '" style="color:' + (a.color || '#5B9FFF') + ';"></i> ' + AUtils.esc(a.name || '') + '</td>' +
            '<td><a href="' + AUtils.esc(a.url || '#') + '" target="_blank" style="color:var(--neon);">' + (a.url || '').substring(0, 35) + '...</a></td>' +
            '<td>★ ' + (a.rating || 5) + '</td>' +
            '<td><span class="status-badge ' + (a.active !== false ? 'status-active' : 'status-inactive') + '">' +
            (a.active !== false ? 'Active' : 'Inactive') + '</span></td>' +
            '<td><button class="action-btn delete" onclick="AffiliateAdmin.del(\'' + a.id + '\')"><i class="fas fa-trash"></i></button></td></tr>'
        ).join('');
    },
    async del(id) {
        if (AUtils.confirm('Delete offer?')) {
            try {
                await AData.deleteAff(id);
                AUtils.toast('Deleted', 'success');
                this.render();
            } catch (e) {}
        }
    }
};

// ==================== 13. COINS ADMIN ====================
const CoinsAdmin = {
    init() {
        document.getElementById('save-coin-settings-btn')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('generate-code-btn')?.addEventListener('click', () => this.genCode());
    },
    async render() {
        if (!AdminAuth.checkSession()) {
            AUtils.toast('Session expired', 'error');
            return;
        }
        const s = await AData.getSettings();
        const d = {
            dailyGiftAmount: 1, adRewardAmount: 5,
            adUrl: 'https://yassine.com/', adWaitSeconds: 30,
            whatsappNumber: '212631204978',
            enableDailyGift: true, enableAd: true,
            enableWhatsapp: true, enableCodes: true,
            ...(s || {})
        };
        document.getElementById('coin-setting-daily').value = d.dailyGiftAmount;
        document.getElementById('coin-setting-ad-reward').value = d.adRewardAmount;
        document.getElementById('coin-setting-ad-wait').value = d.adWaitSeconds;
        document.getElementById('coin-setting-ad-url').value = d.adUrl;
        document.getElementById('coin-setting-whatsapp').value = d.whatsappNumber;
        document.getElementById('coin-enable-daily').checked = d.enableDailyGift;
        document.getElementById('coin-enable-ad').checked = d.enableAd;
        document.getElementById('coin-enable-whatsapp').checked = d.enableWhatsapp;
        document.getElementById('coin-enable-codes').checked = d.enableCodes;
        await this.renderCodes();
        await this.renderWallets();
    },
    async saveSettings() {
        if (!AdminAuth.checkSession()) {
            AUtils.toast('Please login again', 'error');
            return;
        }
        try {
            await AData.saveSettings({
                dailyGiftAmount: parseInt(document.getElementById('coin-setting-daily').value) || 1,
                adRewardAmount: parseInt(document.getElementById('coin-setting-ad-reward').value) || 5,
                adWaitSeconds: parseInt(document.getElementById('coin-setting-ad-wait').value) || 30,
                adUrl: document.getElementById('coin-setting-ad-url').value.trim(),
                whatsappNumber: document.getElementById('coin-setting-whatsapp').value.trim(),
                enableDailyGift: document.getElementById('coin-enable-daily').checked,
                enableAd: document.getElementById('coin-enable-ad').checked,
                enableWhatsapp: document.getElementById('coin-enable-whatsapp').checked,
                enableCodes: document.getElementById('coin-enable-codes').checked
            });
            AUtils.toast('Saved!', 'success');
        } catch (e) {
            AUtils.toast('Failed: ' + e.message, 'error');
        }
    },
    async genCode() {
        if (!AdminAuth.checkSession()) {
            AUtils.toast('Please login again', 'error');
            return;
        }
        const amount = parseInt(document.getElementById('code-amount').value) || 10;
        const maxUses = parseInt(document.getElementById('code-max-uses').value) || 0;
        let code = (document.getElementById('code-text').value || '').trim().toUpperCase();
        if (!code) {
            code = 'KV' + Math.random().toString(36).substr(2, 6).toUpperCase();
        }
        if (!/^[A-Z0-9-]+$/.test(code)) {
            AUtils.toast('Code must be alphanumeric', 'error');
            return;
        }
        try {
            await AData.saveCode({
                code: code,
                amount: amount,
                maxUses: maxUses,
                usedCount: 0,
                active: true,
                createdAt: Date.now()
            });
            document.getElementById('code-text').value = '';
            AUtils.toast('Code created: ' + code, 'success');
            await this.renderCodes();
        } catch (e) {
            AUtils.toast('Failed: ' + e.message, 'error');
        }
    },
    async renderCodes() {
        const codes = await AData.getCodes();
        const tbody = document.getElementById('codes-table-body');
        if (!codes.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No codes yet.</td></tr>';
            return;
        }
        tbody.innerHTML = codes.map(c =>
            '<tr><td style="font-family:var(--font-mono);color:var(--gold);font-weight:700;">' + AUtils.esc(c.code) + '</td>' +
            '<td><i class="fas fa-coins" style="color:var(--gold);"></i> ' + c.amount + '</td>' +
            '<td>' + (c.usedCount || 0) + (c.maxUses > 0 ? ' / ' + c.maxUses : '') + '</td>' +
            '<td><span class="status-badge ' + (c.active ? 'status-active' : 'status-inactive') + '">' +
            (c.active ? 'Active' : 'Disabled') + '</span></td>' +
            '<td><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="CoinsAdmin.toggleCode(\'' + c.code + '\', ' + !c.active + ')"><i class="fas fa-' + (c.active ? 'ban' : 'check') + '"></i></button>' +
            '<button class="action-btn delete" onclick="CoinsAdmin.delCode(\'' + c.code + '\')"><i class="fas fa-trash"></i></button>' +
            '</div></td></tr>'
        ).join('');
    },
    async toggleCode(code, active) {
        try {
            await AData.updateCode(code, { active: active });
            await this.renderCodes();
        } catch (e) {}
    },
    async delCode(code) {
        if (AUtils.confirm('Delete ' + code + '?')) {
            try {
                await AData.deleteCode(code);
                await this.renderCodes();
            } catch (e) {}
        }
    },
    async renderWallets() {
        const wallets = await AData.getWallets();
        const tbody = document.getElementById('wallets-table-body');
        if (!wallets.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No wallets yet.</td></tr>';
            return;
        }
        tbody.innerHTML = wallets.map(w =>
            '<tr><td style="font-family:var(--font-mono);font-size:.85rem;">' + AUtils.esc(w.id || '') + '</td>' +
            '<td style="color:var(--gold);font-weight:700;"><i class="fas fa-coins"></i> ' + (w.balance || 0) + '</td>' +
            '<td>' + (w.ownerUid
                ? '<span class="status-badge status-approved">Member</span>'
                : '<span class="status-badge status-draft">Guest</span>') + '</td>' +
            '<td><div class="actions-cell">' +
            '<button class="action-btn approve" onclick="CoinsAdmin.adjust(\'' + w.id + '\', 5)" title="+5"><i class="fas fa-plus"></i></button>' +
            '<button class="action-btn delete" onclick="CoinsAdmin.adjust(\'' + w.id + '\', -5)" title="-5"><i class="fas fa-minus"></i></button>' +
            '</div></td></tr>'
        ).join('');
    },
    async adjust(id, delta) {
        try {
            await AData.adjustWallet(id, delta);
            await this.renderWallets();
        } catch (e) {
            AUtils.toast('Failed', 'error');
        }
    }
};

// ==================== 14. ANALYTICS ====================
const AnalyticsAdmin = {
    async render() {
        const [posts, comments, wallets] = await Promise.all([
            AData.getPosts(),
            AData.getComments(),
            AData.getWallets()
        ]);
        const views = posts.reduce((s, x) => s + (x.views || 0), 0);
        const coins = wallets.reduce((s, x) => s + (x.balance || 0), 0);
        document.getElementById('analytics-total-views').textContent = views.toLocaleString();
        document.getElementById('analytics-avg-views').textContent = posts.length ? Math.round(views / posts.length) : 0;
        document.getElementById('analytics-total-comments').textContent = comments.length;
        document.getElementById('analytics-coins').textContent = coins.toLocaleString();
        const max = Math.max(...CATEGORIES.map(cat =>
            posts.filter(x => x.category === cat.id).reduce((s, x) => s + (x.views || 0), 0)
        ), 1);
        document.getElementById('category-analytics').innerHTML = CATEGORIES.map(cat => {
            const v = posts.filter(x => x.category === cat.id).reduce((s, x) => s + (x.views || 0), 0);
            return '<div class="progress-item">' +
                '<div class="progress-header">' +
                '<span style="color:' + cat.color + '"><i class="fas ' + cat.icon + '"></i> ' + cat.name.en + '</span>' +
                '<span style="color:var(--text-muted);">' + v + '</span></div>' +
                '<div class="progress-bar">' +
                '<div class="progress-fill" style="width:' + (v / max) * 100 + '%;background:' + cat.color + ';"></div></div></div>';
        }).join('');
    }
};

// ==================== 15. SETTINGS + MAINTENANCE ====================
const SettingsAdmin = {
    async render() {
        const s = await AData.getSettings();
        document.getElementById('setting-site-name').value = s?.siteName || 'Kenven Hub';
        document.getElementById('setting-logo-url').value = s?.logoUrl || 'https://cdn.phototourl.com/free/2026-08-09-001eb100-a118-4da2-a6fa-edd349bfe20e.jpg';
        document.getElementById('setting-discord-url').value = s?.discordUrl || 'https://discord.com/channels/1256937655984328714/';
        document.getElementById('setting-website-url').value = s?.websiteUrl || 'https://yassine.com/';
        document.getElementById('save-settings-btn').onclick = async () => {
            try {
                await AData.saveSettings({
                    siteName: document.getElementById('setting-site-name').value,
                    logoUrl: document.getElementById('setting-logo-url').value,
                    discordUrl: document.getElementById('setting-discord-url').value,
                    websiteUrl: document.getElementById('setting-website-url').value
                });
                AUtils.toast('Saved!', 'success');
            } catch (e) {
                AUtils.toast('Failed', 'error');
            }
        };
        // Maintenance Mode
        const maint = s?.maintenance || {};
        document.getElementById('maintenance-enabled').checked = !!maint.enabled;
        document.getElementById('maintenance-message').value = maint.message || '';
        document.getElementById('maintenance-eta').value = maint.eta || '';
        document.getElementById('save-maintenance-btn').onclick = async () => {
            try {
                await AData.saveSettings({
                    maintenance: {
                        enabled: document.getElementById('maintenance-enabled').checked,
                        message: document.getElementById('maintenance-message').value.trim(),
                        eta: document.getElementById('maintenance-eta').value.trim()
                    }
                });
                AUtils.toast('Maintenance settings saved!', 'success');
            } catch (e) {
                AUtils.toast('Failed: ' + e.message, 'error');
            }
        };
        document.getElementById('reload-cache-btn').onclick = () => {
            AUtils.toast('Reloading...', 'info');
            setTimeout(() => location.reload(), 800);
        };
    }
};

// ==================== 16. ADMIN APP INIT ====================
const AdminApp = {
    init() {
        console.log('🔐 Admin Panel starting...');
        if (AdminAuth.checkSession()) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            Dashboard.render();
        }
        document.getElementById('login-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            const err = document.getElementById('login-error');
            err.style.display = 'none';
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            const r = await AdminAuth.login(email, pass);
            btn.disabled = false;
            if (r.success) {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('admin-dashboard').style.display = 'block';
                Dashboard.render();
                AUtils.toast('Welcome back, Admin!', 'success');
            } else {
                err.textContent = r.error || 'Invalid credentials.';
                err.style.display = 'block';
            }
        });
        ANav.init();
        Posts.init();
        AffiliateAdmin.init();
        CoinsAdmin.init();
        setInterval(() => {
            if (!AdminAuth.checkSession() && document.getElementById('admin-dashboard').style.display !== 'none') {
                AUtils.toast('Session expired', 'warning');
                setTimeout(() => location.reload(), 1500);
            }
        }, 60000);
        console.log('✅ Admin Panel ready!');
    }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());

window.Posts = Posts;
window.CommentsAdmin = CommentsAdmin;
window.AffiliateAdmin = AffiliateAdmin;
window.CoinsAdmin = CoinsAdmin;
