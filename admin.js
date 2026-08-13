/* ================================================================
   KENVEN HUB - ADMIN PANEL
   Vanilla JS - No Frameworks
   ================================================================ */

'use strict';

// ==================== 1. ADMIN CONFIGURATION ====================
const ADMIN_CONFIG = {
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
    USE_FIREBASE: false, // Set to true when Firebase Auth is activated
    
    // Admin Credentials (temporary - use Firebase Auth when activated)
    adminCredentials: {
        email: "admin@kenven.com",
        password: "kenven2026"
    },
    
    // Storage Keys (same as app.js)
    storageKeys: {
        lang: 'kenven_hub_lang',
        posts: 'kenven_hub_posts_data',
        comments: 'kenven_hub_comments_data',
        adminSession: 'kenven_hub_admin_session',
        settings: 'kenven_hub_settings',
        affiliateLinks: 'kenven_hub_affiliate_links'
    },
    
    // Session timeout (30 minutes)
    sessionTimeout: 30 * 60 * 1000
};

// ==================== 2. ADMIN UTILITIES ====================
const AdminUtils = {
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    },
    
    showToast(message, type = 'info') {
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
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// ==================== 3. ADMIN STORAGE ====================
const AdminStorage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    }
};

// ==================== 4. ADMIN DATA ====================
const AdminData = {
    // Posts
    getPosts() {
        return AdminStorage.get(ADMIN_CONFIG.storageKeys.posts, []);
    },
    
    savePosts(posts) {
        AdminStorage.set(ADMIN_CONFIG.storageKeys.posts, posts);
    },
    
    getPostById(id) {
        return this.getPosts().find(p => p.id === id);
    },
    
    addPost(post) {
        const posts = this.getPosts();
        posts.unshift(post);
        this.savePosts(posts);
    },
    
    updatePost(id, updatedData) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updatedData, updatedAt: Date.now() };
            this.savePosts(posts);
            return true;
        }
        return false;
    },
    
    deletePost(id) {
        const posts = this.getPosts().filter(p => p.id !== id);
        this.savePosts(posts);
    },
    
    // Comments
    getComments() {
        return AdminStorage.get(ADMIN_CONFIG.storageKeys.comments, []);
    },
    
    saveComments(comments) {
        AdminStorage.set(ADMIN_CONFIG.storageKeys.comments, comments);
    },
    
    updateComment(id, updatedData) {
        const comments = this.getComments();
        const index = comments.findIndex(c => c.id === id);
        if (index !== -1) {
            comments[index] = { ...comments[index], ...updatedData };
            this.saveComments(comments);
            return true;
        }
        return false;
    },
    
    deleteComment(id) {
        const comments = this.getComments().filter(c => c.id !== id);
        this.saveComments(comments);
    },
    
    // Categories
    getCategories() {
        return [
            { id: 'apps', slug: 'apps', name: { en: 'Apps & Tools', ar: 'تطبيقات وأدوات' }, icon: 'fa-mobile-screen', color: '#5B9FFF', postCount: 0 },
            { id: 'websites', slug: 'websites', name: { en: 'Websites', ar: 'مواقع' }, icon: 'fa-globe', color: '#8B5CF6', postCount: 0 },
            { id: 'activation', slug: 'activation', name: { en: 'Activation', ar: 'تفعيل' }, icon: 'fa-key', color: '#00FF9D', postCount: 0 },
            { id: 'fixes', slug: 'fixes', name: { en: 'Fixes & Tutorials', ar: 'إصلاحات وشروحات' }, icon: 'fa-screwdriver-wrench', color: '#FFE600', postCount: 0 },
            { id: 'deals', slug: 'deals', name: { en: 'Deals & Offers', ar: 'عروض وخصومات' }, icon: 'fa-tag', color: '#FF2E63', postCount: 0 },
            { id: 'guides', slug: 'guides', name: { en: 'Guides', ar: 'أدلة' }, icon: 'fa-book', color: '#5B9FFF', postCount: 0 }
        ];
    },
    
    // Affiliate Links
    getAffiliateLinks() {
        return AdminStorage.get(ADMIN_CONFIG.storageKeys.affiliateLinks, [
            { id: '1', name: 'Hostinger', url: 'https://hostinger.com?ref=kenven', clicks: 0, active: true },
            { id: '2', name: 'Cloudways', url: 'https://cloudways.com?ref=kenven', clicks: 0, active: true },
            { id: '3', name: 'Fiverr', url: 'https://fiverr.com?ref=kenven', clicks: 0, active: true },
            { id: '4', name: 'Namecheap', url: 'https://namecheap.com?ref=kenven', clicks: 0, active: true },
            { id: '5', name: 'Canva', url: 'https://canva.com?ref=kenven', clicks: 0, active: true }
        ]);
    },
    
    // Stats
    getStats() {
        const posts = this.getPosts();
        const comments = this.getComments();
        const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
        
        return {
            totalPosts: posts.length,
            totalComments: comments.length,
            totalViews: totalViews,
            totalCategories: this.getCategories().length
        };
    }
};

// ==================== 5. ADMIN AUTH ====================
const AdminAuth = {
    isAuthenticated: false,
    
    /**
     * Initialize auth check
     */
    init() {
        const session = AdminStorage.get(ADMIN_CONFIG.storageKeys.adminSession);
        
        if (session && this.isSessionValid(session)) {
            this.isAuthenticated = true;
            this.showDashboard();
        } else {
            this.showLogin();
        }
    },
    
    /**
     * Check if session is valid (not expired)
     */
    isSessionValid(session) {
        if (!session || !session.loginTime) return false;
        const elapsed = Date.now() - session.loginTime;
        return elapsed < ADMIN_CONFIG.sessionTimeout;
    },
    
    /**
     * Login
     */
    async login(email, password) {
        // If Firebase Auth is enabled, use it
        if (ADMIN_CONFIG.USE_FIREBASE) {
            return this.loginWithFirebase(email, password);
        }
        
        // Temporary: Check against hardcoded credentials
        if (email === ADMIN_CONFIG.adminCredentials.email && 
            password === ADMIN_CONFIG.adminCredentials.password) {
            this.isAuthenticated = true;
            AdminStorage.set(ADMIN_CONFIG.storageKeys.adminSession, {
                email: email,
                loginTime: Date.now()
            });
            return { success: true };
        }
        
        return { success: false, error: 'Invalid credentials' };
    },
    
    /**
     * Login with Firebase Auth (for future use)
     */
    async loginWithFirebase(email, password) {
        try {
            // Firebase Auth code will go here when activated
            // const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Check if user has admin role in Firestore
            // const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            // if (userDoc.data().role !== 'admin') throw new Error('Not authorized');
            
            return { success: false, error: 'Firebase Auth not activated yet' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Logout
     */
    logout() {
        this.isAuthenticated = false;
        AdminStorage.remove(ADMIN_CONFIG.storageKeys.adminSession);
        this.showLogin();
    },
    
    /**
     * Show login screen
     */
    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    },
    
    /**
     * Show dashboard
     */
    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'grid';
    }
};

// ==================== 6. ADMIN NAVIGATION ====================
const AdminNav = {
    currentTab: 'dashboard',
    
    init() {
        // Tab navigation
        document.querySelectorAll('.admin-nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // View site button
        document.getElementById('view-site-btn')?.addEventListener('click', () => {
            window.open('index.html', '_blank');
        });
        
        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                AdminAuth.logout();
            }
        });
    },
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update nav active state
        document.querySelectorAll('.admin-nav-item[data-tab]').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
        
        // Update tab content
        document.querySelectorAll('.admin-tab').forEach(tabEl => {
            tabEl.classList.toggle('active', tabEl.id === `tab-${tab}`);
        });
        
        // Load tab data
        this.loadTabData(tab);
    },
    
    loadTabData(tab) {
        switch (tab) {
            case 'dashboard':
                Dashboard.render();
                break;
            case 'posts':
                PostsManager.render();
                break;
            case 'comments':
                CommentsManager.render();
                break;
            case 'categories':
                CategoriesManager.render();
                break;
            case 'affiliate':
                AffiliateManager.render();
                break;
            case 'analytics':
                Analytics.render();
                break;
            case 'settings':
                Settings.render();
                break;
        }
    }
};

// ==================== 7. DASHBOARD MODULE ====================
const Dashboard = {
    render() {
        const stats = AdminData.getStats();
        
        // Update stat cards
        document.getElementById('stat-posts').textContent = stats.totalPosts;
        document.getElementById('stat-comments').textContent = stats.totalComments;
        document.getElementById('stat-views').textContent = stats.totalViews.toLocaleString();
        document.getElementById('stat-categories').textContent = stats.totalCategories;
        
        // Update date
        document.getElementById('dashboard-date').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Render recent comments
        this.renderRecentComments();
        
        // Render top posts
        this.renderTopPosts();
    },
    
    renderRecentComments() {
        const comments = AdminData.getComments()
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);
        
        const container = document.getElementById('recent-comments-list');
        
        if (comments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No comments yet.</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div style="display: flex; gap: var(--space-md); padding: var(--space-md); border-bottom: 1px solid var(--glass-border);">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--card); display: flex; align-items: center; justify-content: center; color: var(--neon); font-weight: 700;">
                    ${AdminUtils.escapeHtml(comment.authorName?.charAt(0).toUpperCase() || '?')}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.9rem;">
                        ${AdminUtils.escapeHtml(comment.authorName)}
                        <span style="color: var(--text-muted); font-weight: 400; font-size: 0.8rem;">
                            · ${AdminUtils.formatDate(comment.createdAt)}
                        </span>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
                        ${AdminUtils.escapeHtml(comment.content?.substring(0, 100))}${comment.content?.length > 100 ? '...' : ''}
                    </div>
                </div>
                <span class="status-badge ${comment.approved ? 'status-approved' : 'status-pending'}">
                    ${comment.approved ? 'Approved' : 'Pending'}
                </span>
            </div>
        `).join('');
    },
    
    renderTopPosts() {
        const posts = AdminData.getPosts()
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
        
        const container = document.getElementById('top-posts-list');
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No posts yet.</p>';
            return;
        }
        
        container.innerHTML = posts.map((post, index) => `
            <div style="display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md); border-bottom: 1px solid var(--glass-border);">
                <span style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: ${index === 0 ? 'var(--neon-yellow)' : 'var(--text-muted)'}; width: 30px;">
                    ${index + 1}
                </span>
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${AdminUtils.escapeHtml(post.title?.en || 'Untitled')}</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem;">
                        ${post.views || 0} views · ${post.commentsCount || 0} comments
                    </div>
                </div>
                <a href="index.html#post/${post.slug}" target="_blank" class="action-btn view" title="View">
                    <i class="fas fa-eye"></i>
                </a>
            </div>
        `).join('');
    }
};

// ==================== 8. POSTS MANAGER ====================
const PostsManager = {
    quillEditor: null,
    editingPostId: null,
    
    init() {
        // New post button
        document.getElementById('new-post-btn')?.addEventListener('click', () => {
            this.showEditor();
        });
        
        // Cancel button
        document.getElementById('cancel-post-btn')?.addEventListener('click', () => {
            this.hideEditor();
        });
        
        // Post form submission
        document.getElementById('post-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePost();
        });
        
        // Auto-generate slug from title
        document.getElementById('post-title-en')?.addEventListener('input', (e) => {
            const slugInput = document.getElementById('post-slug');
            if (!slugInput.value || slugInput.value === '') {
                slugInput.value = AdminUtils.generateSlug(e.target.value);
            }
        });
    },
    
    render() {
        const posts = AdminData.getPosts();
        const categories = AdminData.getCategories();
        const tbody = document.getElementById('posts-table-body');
        
        if (posts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: var(--space-2xl); color: var(--text-muted);">
                        No posts yet. Click "New Post" to create your first post.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = posts.map(post => {
            const category = categories.find(c => c.id === post.category);
            return `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${AdminUtils.escapeHtml(post.title?.en || 'Untitled')}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">/${post.slug}</div>
                    </td>
                    <td>
                        ${category ? `
                            <span style="color: ${category.color};">
                                <i class="fas ${category.icon}"></i>
                                ${category.name.en}
                            </span>
                        ` : '-'}
                    </td>
                    <td>
                        <span class="status-badge status-${post.status}">
                            ${post.status}
                        </span>
                    </td>
                    <td>${post.views || 0}</td>
                    <td>${AdminUtils.formatDate(post.createdAt)}</td>
                    <td>
                        <button class="action-btn edit" onclick="PostsManager.editPost('${post.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <a href="index.html#post/${post.slug}" target="_blank" class="action-btn view" title="View">
                            <i class="fas fa-eye"></i>
                        </a>
                        <button class="action-btn delete" onclick="PostsManager.deletePost('${post.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showEditor(postId = null) {
        this.editingPostId = postId;
        
        // Hide list, show editor
        document.getElementById('posts-list-container').style.display = 'none';
        document.getElementById('post-editor').style.display = 'block';
        document.querySelector('#tab-posts .admin-header').style.display = 'none';
        
        // Populate category dropdown
        const categorySelect = document.getElementById('post-category');
        categorySelect.innerHTML = AdminData.getCategories().map(cat => 
            `<option value="${cat.id}">${cat.name.en}</option>`
        ).join('');
        
        // Initialize Quill editor if not already
        if (!this.quillEditor) {
            this.quillEditor = new Quill('#post-content-editor', {
                theme: 'snow',
                placeholder: 'Write your post content here...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image', 'code-block'],
                        ['clean']
                    ]
                }
            });
        }
        
        // If editing, populate form
        if (postId) {
            const post = AdminData.getPostById(postId);
            if (post) {
                document.getElementById('post-editor-title').textContent = 'Edit Post';
                document.getElementById('post-title-en').value = post.title?.en || '';
                document.getElementById('post-title-ar').value = post.title?.ar || '';
                document.getElementById('post-slug').value = post.slug || '';
                document.getElementById('post-excerpt-en').value = post.excerpt?.en || '';
                document.getElementById('post-excerpt-ar').value = post.excerpt?.ar || '';
                document.getElementById('post-status').value = post.status || 'draft';
                document.getElementById('post-category').value = post.category || 'apps';
                document.getElementById('post-featured').checked = post.featured || false;
                document.getElementById('post-cover').value = post.coverImage || '';
                document.getElementById('post-download-link').value = post.downloadLink || '';
                document.getElementById('post-button-text-en').value = post.buttonText?.en || '';
                document.getElementById('post-button-text-ar').value = post.buttonText?.ar || '';
                document.getElementById('post-is-affiliate').checked = post.isAffiliate || false;
                document.getElementById('post-tags').value = (post.tags || []).join(', ');
                
                // Set Quill content
                this.quillEditor.root.innerHTML = post.content?.en || '';
            }
        } else {
            document.getElementById('post-editor-title').textContent = 'Create New Post';
            document.getElementById('post-form').reset();
            this.quillEditor.root.innerHTML = '';
        }
    },
    
    hideEditor() {
        document.getElementById('posts-list-container').style.display = 'block';
        document.getElementById('post-editor').style.display = 'none';
        document.querySelector('#tab-posts .admin-header').style.display = 'flex';
        this.editingPostId = null;
    },
    
    savePost() {
        const titleEn = document.getElementById('post-title-en').value.trim();
        const titleAr = document.getElementById('post-title-ar').value.trim();
        const slug = document.getElementById('post-slug').value.trim();
        
        if (!titleEn || !titleAr) {
            AdminUtils.showToast('Please fill in both English and Arabic titles', 'error');
            return;
        }
        
        const contentHtml = this.quillEditor.root.innerHTML;
        
        const postData = {
            title: { en: titleEn, ar: titleAr },
            slug: slug || AdminUtils.generateSlug(titleEn),
            excerpt: {
                en: document.getElementById('post-excerpt-en').value.trim(),
                ar: document.getElementById('post-excerpt-ar').value.trim()
            },
            content: {
                en: contentHtml,
                ar: contentHtml // In real implementation, separate Arabic content
            },
            category: document.getElementById('post-category').value,
            coverImage: document.getElementById('post-cover').value.trim() || 'https://picsum.photos/seed/' + Math.random().toString(36).substr(2, 5) + '/800/450',
            downloadLink: document.getElementById('post-download-link').value.trim(),
            buttonText: {
                en: document.getElementById('post-button-text-en').value.trim() || 'Read More',
                ar: document.getElementById('post-button-text-ar').value.trim() || 'اقرأ المزيد'
            },
            isAffiliate: document.getElementById('post-is-affiliate').checked,
            tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
            featured: document.getElementById('post-featured').checked,
            status: document.getElementById('post-status').value
        };
        
        if (this.editingPostId) {
            // Update existing post
            AdminData.updatePost(this.editingPostId, postData);
            AdminUtils.showToast('Post updated successfully!', 'success');
        } else {
            // Create new post
            const newPost = {
                id: AdminUtils.generateId(),
                ...postData,
                views: 0,
                likes: 0,
                commentsCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            AdminData.addPost(newPost);
            AdminUtils.showToast('Post created successfully!', 'success');
        }
        
        this.hideEditor();
        this.render();
    },
    
    editPost(postId) {
        this.showEditor(postId);
    },
    
    deletePost(postId) {
        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            AdminData.deletePost(postId);
            AdminUtils.showToast('Post deleted successfully', 'success');
            this.render();
        }
    }
};

// ==================== 9. COMMENTS MANAGER ====================
const CommentsManager = {
    render() {
        const comments = AdminData.getComments();
        const posts = AdminData.getPosts();
        const tbody = document.getElementById('comments-table-body');
        
        if (comments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: var(--space-2xl); color: var(--text-muted);">
                        No comments yet.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = comments.map(comment => {
            const post = posts.find(p => p.id === comment.postId);
            return `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${AdminUtils.escapeHtml(comment.authorName)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${AdminUtils.escapeHtml(comment.authorEmail)}</div>
                    </td>
                    <td>
                        <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${AdminUtils.escapeHtml(comment.content)}
                        </div>
                    </td>
                    <td>${post ? AdminUtils.escapeHtml(post.title?.en || 'Unknown') : 'Unknown'}</td>
                    <td>
                        <span class="status-badge ${comment.approved ? 'status-approved' : 'status-pending'}">
                            ${comment.approved ? 'Approved' : 'Pending'}
                        </span>
                    </td>
                    <td>${AdminUtils.formatDate(comment.createdAt)}</td>
                    <td>
                        ${!comment.approved ? `
                            <button class="action-btn approve" onclick="CommentsManager.approveComment('${comment.id}')" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn delete" onclick="CommentsManager.deleteComment('${comment.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    approveComment(commentId) {
        AdminData.updateComment(commentId, { approved: true });
        AdminUtils.showToast('Comment approved', 'success');
        this.render();
    },
    
    deleteComment(commentId) {
        if (confirm('Are you sure you want to delete this comment?')) {
            AdminData.deleteComment(commentId);
            AdminUtils.showToast('Comment deleted', 'success');
            this.render();
        }
    }
};

// ==================== 10. CATEGORIES MANAGER ====================
const CategoriesManager = {
    render() {
        const categories = AdminData.getCategories();
        const posts = AdminData.getPosts();
        const container = document.getElementById('categories-grid');
        
        container.innerHTML = categories.map(cat => {
            const postCount = posts.filter(p => p.category === cat.id).length;
            return `
                <div class="category-card" style="cursor: default;">
                    <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color};">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <h3 class="category-name">${cat.name.en}</h3>
                    <span class="category-count">${postCount} posts</span>
                    <div style="margin-top: var(--space-md); font-size: 0.8rem; color: var(--text-muted);">
                        Slug: /${cat.slug}
                    </div>
                </div>
            `;
        }).join('');
    }
};

// ==================== 11. AFFILIATE MANAGER ====================
const AffiliateManager = {
    render() {
        const links = AdminData.getAffiliateLinks();
        const tbody = document.getElementById('affiliate-table-body');
        
        tbody.innerHTML = links.map(link => `
            <tr>
                <td style="font-weight: 600;">${AdminUtils.escapeHtml(link.name)}</td>
                <td>
                    <a href="${link.url}" target="_blank" style="color: var(--neon);">
                        ${link.url.substring(0, 40)}...
                    </a>
                </td>
                <td>${link.clicks || 0}</td>
                <td>
                    <span class="status-badge ${link.active ? 'status-approved' : 'status-archived'}">
                        ${link.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="action-btn view" onclick="window.open('${link.url}', '_blank')" title="Visit">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
};

// ==================== 12. ANALYTICS MODULE ====================
const Analytics = {
    render() {
        const posts = AdminData.getPosts();
        const comments = AdminData.getComments();
        const categories = AdminData.getCategories();
        
        const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
        const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;
        const engagementRate = totalViews > 0 
            ? Math.round((comments.length / totalViews) * 100) 
            : 0;
        
        // Update stats
        document.getElementById('analytics-total-views').textContent = totalViews.toLocaleString();
        document.getElementById('analytics-avg-views').textContent = avgViews.toLocaleString();
        document.getElementById('analytics-total-comments').textContent = comments.length;
        document.getElementById('analytics-engagement').textContent = engagementRate + '%';
        
        // Category analytics
        const categoryAnalytics = categories.map(cat => {
            const catPosts = posts.filter(p => p.category === cat.id);
            const catViews = catPosts.reduce((sum, p) => sum + (p.views || 0), 0);
            return { ...cat, postCount: catPosts.length, totalViews: catViews };
        }).sort((a, b) => b.totalViews - a.totalViews);
        
        const maxViews = Math.max(...categoryAnalytics.map(c => c.totalViews), 1);
        
        document.getElementById('category-analytics').innerHTML = categoryAnalytics.map(cat => `
            <div style="margin-bottom: var(--space-lg);">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
                    <span style="color: ${cat.color};">
                        <i class="fas ${cat.icon}"></i>
                        ${cat.name.en}
                    </span>
                    <span style="color: var(--text-muted);">${cat.totalViews} views</span>
                </div>
                <div style="height: 8px; background: var(--surface); border-radius: var(--radius-full); overflow: hidden;">
                    <div style="height: 100%; width: ${(cat.totalViews / maxViews) * 100}%; background: ${cat.color}; border-radius: var(--radius-full);"></div>
                </div>
            </div>
        `).join('');
    }
};

// ==================== 13. SETTINGS MODULE ====================
const Settings = {
    render() {
        const settings = AdminStorage.get(ADMIN_CONFIG.storageKeys.settings, {});
        
        document.getElementById('setting-site-name').value = settings.siteName || 'Kenven Hub';
        document.getElementById('setting-logo-url').value = settings.logoUrl || 'https://cdn.phototourl.com/free/2026-08-09-001eb100-a118-4da2-a6fa-edd349bfe20e.jpg';
        document.getElementById('setting-discord-url').value = settings.discordUrl || 'https://discord.com/channels/1256937655984328714/';
        document.getElementById('setting-website-url').value = settings.websiteUrl || 'https://yassine.com/';
        
        // Save settings button
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Clear data button
        document.getElementById('clear-data-btn')?.addEventListener('click', () => {
            this.clearData();
        });
    },
    
    saveSettings() {
        const settings = {
            siteName: document.getElementById('setting-site-name').value,
            logoUrl: document.getElementById('setting-logo-url').value,
            discordUrl: document.getElementById('setting-discord-url').value,
            websiteUrl: document.getElementById('setting-website-url').value
        };
        
        AdminStorage.set(ADMIN_CONFIG.storageKeys.settings, settings);
        AdminUtils.showToast('Settings saved successfully!', 'success');
    },
    
    clearData() {
        if (confirm('WARNING: This will delete ALL posts and comments. Are you sure?')) {
            if (confirm('This action CANNOT be undone. Continue?')) {
                AdminStorage.remove(ADMIN_CONFIG.storageKeys.posts);
                AdminStorage.remove(ADMIN_CONFIG.storageKeys.comments);
                AdminUtils.showToast('All data cleared', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        }
    }
};

// ==================== 14. ADMIN INITIALIZATION ====================
const AdminApp = {
    init() {
        console.log('🔐 Kenven Hub Admin Panel initializing...');
        
        // Initialize auth
        AdminAuth.init();
        
        // Initialize login form
        this.initLoginForm();
        
        // Initialize navigation
        AdminNav.init();
        
        // Initialize posts manager
        PostsManager.init();
        
        // Initialize dashboard
        Dashboard.render();
        
        // Check session timeout periodically
        setInterval(() => {
            const session = AdminStorage.get(ADMIN_CONFIG.storageKeys.adminSession);
            if (session && !AdminAuth.isSessionValid(session)) {
                AdminUtils.showToast('Session expired. Please login again.', 'warning');
                AdminAuth.logout();
            }
        }, 60000); // Check every minute
        
        console.log('✅ Admin Panel initialized successfully!');
    },
    
    /**
     * Initialize login form handler
     */
    initLoginForm() {
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;
                
                if (!email || !password) {
                    loginError.style.display = 'block';
                    loginError.textContent = 'Please fill in all fields.';
                    return;
                }
                
                // Hide previous error
                loginError.style.display = 'none';
                
                // Attempt login
                const result = await AdminAuth.login(email, password);
                
                if (result.success) {
                    AdminUtils.showToast('Login successful!', 'success');
                    AdminAuth.showDashboard();
                    Dashboard.render();
                } else {
                    loginError.style.display = 'block';
                    loginError.textContent = result.error || 'Invalid credentials. Please try again.';
                }
            });
        }
    }
};

// ==================== 15. START ADMIN APP ====================
document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});

// Expose functions to global scope for onclick handlers
window.PostsManager = PostsManager;
window.CommentsManager = CommentsManager;
window.AdminUtils = AdminUtils;
