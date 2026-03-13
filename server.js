const express = require('express');
const gplay = require('google-play-scraper');
const cors = require('cors');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // كاش لمدة ساعة

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── مساعد: جلب مع كاش ───────────────────────────────────────
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit) return hit;
  const result = await fn();
  cache.set(key, result);
  return result;
}

// ─── 1. معلومات تطبيق بالـ App ID ────────────────────────────
app.get('/api/app/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const lang = req.query.lang || 'ar';
    const data = await cached(`app_${appId}_${lang}`, () =>
      gplay.app({ appId, lang, country: 'eg' })
    );
    res.json({
      success: true,
      data: {
        appId: data.appId,
        title: data.title,
        description: data.description,
        shortDescription: data.summary,
        score: data.score,
        ratings: data.ratings,
        reviews: data.reviews,
        installs: data.installs,
        version: data.version,
        updated: data.updated,
        developer: data.developer,
        genre: data.genre,
        icon: data.icon,
        screenshots: data.screenshots,
        price: data.price,
        free: data.free,
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'تعذر جلب بيانات التطبيق. تأكد من صحة App ID.' });
  }
});

// ─── 2. بحث بالكلمة المفتاحية ─────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const { q, lang = 'ar', num = 10 } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'أدخل كلمة البحث' });

    const results = await cached(`search_${q}_${lang}`, () =>
      gplay.search({ term: q, lang, country: 'eg', num: parseInt(num), fullDetail: false })
    );

    res.json({
      success: true,
      keyword: q,
      count: results.length,
      results: results.map((app, i) => ({
        rank: i + 1,
        appId: app.appId,
        title: app.title,
        developer: app.developer,
        score: app.score,
        installs: app.installs,
        icon: app.icon,
        free: app.free,
        genre: app.genre,
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'فشل البحث. حاول مرة أخرى.' });
  }
});

// ─── 3. تحليل ASO كامل لتطبيق ────────────────────────────────
app.get('/api/analyze/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    const appData = await cached(`app_${appId}_ar`, () =>
      gplay.app({ appId, lang: 'ar', country: 'eg' })
    );

    const titleLen = (appData.title || '').length;
    const shortLen = (appData.summary || '').length;
    const descLen = (appData.description || '').length;
    const score = appData.score || 0;
    const ratings = appData.ratings || 0;

    let asoScore = 0;
    let issues = [];

    // تحليل العنوان
    if (titleLen >= 20 && titleLen <= 30) {
      asoScore += 20;
      issues.push({ type: 'ok', title: 'العنوان ممتاز', text: `${titleLen}/30 حرف - مثالي` });
    } else if (titleLen > 0 && titleLen < 20) {
      asoScore += 8;
      issues.push({ type: 'warn', title: 'العنوان قصير', text: `${titleLen}/30 حرف - استخدم 20-30 حرف وأضف كلمة مفتاحية` });
    } else if (titleLen > 30) {
      asoScore += 8;
      issues.push({ type: 'warn', title: 'العنوان طويل', text: `${titleLen} حرف - Google Play يعرض أول 30 حرف فقط` });
    } else {
      issues.push({ type: 'err', title: 'العنوان مفقود', text: 'أضف عنواناً يحتوي كلمة مفتاحية رئيسية' });
    }

    // تحليل الوصف القصير
    if (shortLen >= 60) {
      asoScore += 20;
      issues.push({ type: 'ok', title: 'الوصف القصير ممتاز', text: `${shortLen}/80 حرف` });
    } else if (shortLen > 0) {
      asoScore += 8;
      issues.push({ type: 'warn', title: 'الوصف القصير لم يُستغل', text: `${shortLen}/80 حرف - استخدم كامل المساحة` });
    } else {
      issues.push({ type: 'err', title: 'الوصف القصير مفقود', text: 'يظهر أول شيء في البحث - لا تتركه فارغاً' });
    }

    // تحليل الوصف الكامل
    if (descLen >= 2000) {
      asoScore += 25;
      issues.push({ type: 'ok', title: 'الوصف الكامل ممتاز', text: `${descLen} حرف - محتوى ثري` });
    } else if (descLen >= 1000) {
      asoScore += 15;
      issues.push({ type: 'warn', title: 'الوصف يحتاج توسعة', text: `${descLen} حرف - يُنصح بـ 2000+ حرف` });
    } else if (descLen > 0) {
      asoScore += 5;
      issues.push({ type: 'err', title: 'الوصف قصير جداً', text: `${descLen} حرف فقط - أضف تفاصيل الميزات` });
    }

    // تحليل التقييم
    if (score >= 4.2) {
      asoScore += 20;
      issues.push({ type: 'ok', title: `تقييم ممتاز ${score.toFixed(1)}⭐`, text: 'يعطيك ميزة تنافسية قوية في البحث' });
    } else if (score >= 3.8) {
      asoScore += 12;
      issues.push({ type: 'warn', title: `تقييم جيد ${score.toFixed(1)}⭐`, text: 'الهدف 4.2+ لتحسين الترتيب بشكل ملحوظ' });
    } else if (score >= 3.0) {
      asoScore += 5;
      issues.push({ type: 'warn', title: `تقييم متوسط ${score.toFixed(1)}⭐`, text: 'يؤثر سلباً على ترتيبك' });
    } else {
      issues.push({ type: 'err', title: `تقييم منخفض ${score.toFixed(1)}⭐`, text: 'أولويتك الأولى تحسين التطبيق والرد على الشكاوى' });
    }

    // عدد التقييمات
    if (ratings >= 10000) { asoScore += 15; }
    else if (ratings >= 1000) { asoScore += 10; }
    else if (ratings >= 100) { asoScore += 5; }
    else if (ratings > 0) { asoScore += 2; }

    res.json({
      success: true,
      appId,
      asoScore: Math.min(asoScore, 100),
      app: {
        title: appData.title,
        score: score.toFixed(1),
        ratings: ratings.toLocaleString(),
        installs: appData.installs,
        titleLen,
        shortLen,
        descLen,
        genre: appData.genre,
        icon: appData.icon,
      },
      issues
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'تعذر تحليل التطبيق. تأكد من صحة App ID.' });
  }
});

// ─── 4. ترتيب تطبيقك في نتائج كلمة مفتاحية ──────────────────
app.get('/api/rank', async (req, res) => {
  try {
    const { appId, keyword, lang = 'ar' } = req.query;
    if (!appId || !keyword) return res.status(400).json({ success: false, error: 'أدخل appId والكلمة المفتاحية' });

    const results = await cached(`search_${keyword}_${lang}`, () =>
      gplay.search({ term: keyword, lang, country: 'eg', num: 50, fullDetail: false })
    );

    const rank = results.findIndex(a => a.appId === appId);
    res.json({
      success: true,
      keyword,
      appId,
      rank: rank === -1 ? null : rank + 1,
      found: rank !== -1,
      topApps: results.slice(0, 5).map((a, i) => ({
        rank: i + 1,
        appId: a.appId,
        title: a.title,
        score: a.score,
        icon: a.icon,
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'فشل جلب بيانات الترتيب' });
  }
});

// ─── 5. تطبيقات مشابهة (المنافسون) ──────────────────────────
app.get('/api/similar/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const results = await cached(`similar_${appId}`, () =>
      gplay.similar({ appId, lang: 'ar', country: 'eg', num: 10 })
    );
    res.json({
      success: true,
      appId,
      similar: results.map(a => ({
        appId: a.appId,
        title: a.title,
        developer: a.developer,
        score: a.score,
        installs: a.installs,
        icon: a.icon,
      }))
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'تعذر جلب التطبيقات المشابهة' });
  }
});

// ─── 6. أحدث مراجعات التطبيق ──────────────────────────────────
app.get('/api/reviews/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { result } = await cached(`reviews_${appId}`, () =>
      gplay.reviews({ appId, lang: 'ar', country: 'eg', num: 20, sort: gplay.sort.NEWEST })
    );
    res.json({
      success: true,
      appId,
      reviews: result.map(r => ({
        id: r.id,
        userName: r.userName,
        score: r.score,
        text: r.text,
        date: r.date,
        replyText: r.replyText,
      }))
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'تعذر جلب المراجعات' });
  }
});

// ─── تشغيل السيرفر ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ ASO Pro Tool يعمل على: http://localhost:${PORT}`);
});
