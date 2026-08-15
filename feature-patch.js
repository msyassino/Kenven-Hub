/* Kenven Hub feature helpers loaded after app.js/admin.js */
'use strict';

window.KenvenHub = window.KenvenHub || {};
window.KenvenHub.safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.KenvenHub.rank = total => {
  const n = Number(total) || 0;
  if (n >= 1500) return {id:'vip', name:'VIP', dailyGift:10};
  if (n >= 800) return {id:'diamond', name:'Diamond', dailyGift:7};
  if (n >= 400) return {id:'platinum', name:'Platinum', dailyGift:5};
  if (n >= 150) return {id:'gold', name:'Gold', dailyGift:3};
  if (n >= 50) return {id:'silver', name:'Silver', dailyGift:2};
  return {id:'bronze', name:'Bronze', dailyGift:1};
};

// Deterministic daily cleanup helper for chat; actual deletion should be secured by Firestore rules/server automation.
window.KenvenHub.chatCutoff = days => Date.now() - Math.max(1, Number(days)||3) * 86400000;

// Manual video reward submission. Admin approval is required before any coins/VIP are granted.
window.KenvenHub.submitVideoReward = async (videoUrl, screenshotUrl, views, likes) => {
  if (typeof FB === 'undefined' || !FB.ok || !FB.user) throw new Error('LOGIN_REQUIRED');
  if ((Number(views)||0) < 1000 || (Number(likes)||0) < 20) throw new Error('REQUIREMENTS_NOT_MET');
  const id = (typeof Utils !== 'undefined' ? Utils.genId() : Date.now().toString(36));
  await FB.db.collection('video_reward_submissions').doc(id).set({
    id, uid: FB.user.uid, email: FB.user.email || '', videoUrl: String(videoUrl||'').trim(),
    screenshotUrl: String(screenshotUrl||'').trim(), claimedViews: Number(views)||0,
    claimedLikes: Number(likes)||0, status: 'pending', createdAt: Date.now()
  });
  return id;
};

// Coupons are public, but managed from the admin panel.
window.KenvenHub.loadCoupons = async container => {
  if (typeof FB === 'undefined' || !FB.ok || !container) return;
  const snap = await FB.db.collection('coupons').where('active','==',true).get();
  const coupons = snap.docs.map(d => ({id:d.id, ...d.data()})).filter(c => !c.usedUp);
  container.innerHTML = coupons.length ? coupons.map(c =>
    `<article class="coupon-card" data-coupon-id="${window.KenvenHub.safe(c.id)}">
      <div class="coupon-icon"><i class="fas ${window.KenvenHub.safe(c.icon||'fa-ticket-alt')}"></i></div>
      <div class="coupon-info"><div class="coupon-title">${window.KenvenHub.safe(c.title||'Coupon')}</div>
      <div class="coupon-desc">${window.KenvenHub.safe(c.description||'')}</div></div>
      <div class="coupon-code-box"><span class="coupon-code">${window.KenvenHub.safe(c.code||'')}</span>
      <button class="copy-coupon-btn" data-code="${window.KenvenHub.safe(c.code||'')}"><i class="fas fa-copy"></i></button></div>
    </article>`).join('') : '<div class="rewards-empty"><i class="fas fa-ticket-alt"></i><p>No coupons available right now.</p></div>';
  container.querySelectorAll('.copy-coupon-btn').forEach(btn => btn.addEventListener('click', async () => {
    const code = btn.dataset.code || '';
    try { await navigator.clipboard.writeText(code); } catch(e) {
      const ta=document.createElement('textarea'); ta.value=code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(()=>btn.innerHTML='<i class="fas fa-copy"></i>',1500);
  }));
};
