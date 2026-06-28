import React, { useState, useCallback, useEffect } from "react";

const IMGS = {};
let _imgsLoaded = false;
let _imgsCallbacks = [];
function loadIMGS(cb) {
  if (_imgsLoaded) { cb(IMGS); return; }
  _imgsCallbacks.push(cb);
  if (_imgsCallbacks.length > 1) return;
  fetch('./images.json')
    .then(r => r.json())
    .then(data => {
      Object.assign(IMGS, data);
      _imgsLoaded = true;
      _imgsCallbacks.forEach(fn => fn(IMGS));
      _imgsCallbacks = [];
    })
    .catch(err => console.error('Failed to load images:', err));
}

const GRAD = {
  city:["#667eea","#764ba2"], market:["#f093fb","#f5576c"],
  nature:["#4facfe","#00f2fe"], mountain:["#43e97b","#38f9d7"],
  castle:["#fa709a","#fee140"], temple:["#a18cd1","#fbc2eb"],
  beach:["#0093E9","#80D0C7"], waterfall:["#96fbc4","#f9f586"],
  lake:["#89f7fe","#66a6ff"], village:["#fddb92","#d1fdff"],
  festival:["#ff9a9e","#fecfef"], ropeway:["#a1c4fd","#c2e9fb"],
  hotspring:["#ffecd2","#fcb69f"], forest:["#d4fc79","#96e6a1"],
  night:["#30cfd0","#330867"], rafting:["#43e97b","#38f9d7"],
  cliffs:["#c2e9fb","#a1c4fd"], deer:["#ffeaa7","#dfe6e9"],
};
const ICON = {
  city:"🏙️", market:"🛒", nature:"🌿", mountain:"⛰️", castle:"🏯",
  temple:"⛩️", beach:"🏖️", waterfall:"💧", lake:"🏞️", village:"🏘️",
  festival:"🎆", ropeway:"🚡", hotspring:"♨️", forest:"🌲",
  night:"🌃", rafting:"🛶", cliffs:"🌊", deer:"🦌",
};

async function fetchStopImage(stopName) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `You find a single photo URL for a tourist attraction. 
Search for the attraction and return ONLY a raw JSON object with one key "url" containing a direct image URL (jpg/png/webp) from Wikimedia Commons or a major travel site. 
The URL must end with an image extension or contain /photos/. 
Return ONLY valid JSON like: {"url":"https://..."} — no markdown, no explanation.`,
        messages: [{ role: "user", content: `Find one good photo URL for: ${stopName}` }],
      }),
    });
    const data = await res.json();
    const text = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");
    const match = text.match(/\{[^}]*"url"\s*:\s*"([^"]+)"[^}]*\}/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}

// ✅ FIX: Use imgKey (string) instead of img: IMGS.x (evaluated at parse time before IMGS loads)
const days = [
  { date:"2026-07-10", label:"10 יולי", city:"תל אביב ← דובאי ← בנגקוק", country:"🛫", flag:"🇮🇱", gradType:"city", note:"טיסה FZ1082 | יציאה 15:50, הגעה למחרת 11:25", stops:[] },
  { date:"2026-07-11", label:"11 יולי", city:"בנגקוק", country:"תאילנד", flag:"🇹🇭", gradType:"city", hotel:"Asia Hotel Bangkok", stops:[
    { imgKey:"mbk", name:"MBK Center Bangkok", displayName:"קניון MBK Center", note:"קניון ענק עם 7 קומות ואלפי חנויות", imgType:"market" },
    { imgKey:"song_wat", name:"Awakening Song Wat 2026 Bangkok", displayName:"שוק ורחובות בנגקוק", note:"טיול ראשוני בעיר לאחר הנחיתה", imgType:"city" },
  ]},
  // TAIWAN
  { date:"2026-07-12", label:"12 יולי", city:"בנגקוק ← טאיפיי", country:"טיוואן", flag:"🇹🇼", gradType:"city", hotel:"Global Realm Boutique Hotel", note:"טיסה VZ568 | 09:10 ← 13:55", stops:[
    { imgKey:"elephant", name:"Elephant Mountain Taipei 101 view", displayName:"Elephant Mountain — הר הפיל", note:"עלייה 20 דקות, נוף פנורמי על טאיפיי 101", imgType:"mountain" },
    { imgKey:"taipei101", name:"Taipei 101 night skyline Taiwan", displayName:"שקיעה מול Taipei 101", note:"נקודת התצפית האיקונית מהר הפיל", imgType:"night" },
  ]},
  { date:"2026-07-13", label:"13 יולי", city:"טאיפיי", country:"טיוואן", flag:"🇹🇼", gradType:"city", hotel:"Global Realm Boutique Hotel", stops:[
    { imgKey:"dihua", name:"Dihua Street Taipei Taiwan", displayName:"Dihua Street — רחוב דיחואה", note:"רחוב מסחרי היסטורי מהמאה ה-19, עשבי מרפא ואומנות", imgType:"village" },
    { imgKey:"yangming", name:"Yangmingshan National Park Taiwan volcano", displayName:"Yangmingshan — פארק לאומי", note:"פארק עם מעיינות חמים, שבילי הליכה והר הגעש הגדול בטיוואן", imgType:"nature" },
    { imgKey:"qingtiangang", name:"Qingtiangang grassland Yangmingshan Taiwan", displayName:"Qingtiangang — מסלולי הליכה", note:"מדשאות ירוקות ורועי בקר — נוף אירופאי באמצע אסיה", imgType:"nature" },
    { imgKey:"ximending", name:"Ximending shopping district Taipei Taiwan", displayName:"Ximending — קניות ואוכל", note:"רובע הנוער של טאיפיי — שוק הלילה, אנימה ואופנה", imgType:"city" },
    { imgKey:"shilin", name:"Shilin Night Market Taipei Taiwan", displayName:"Shilin — שוק הלילה הגדול", note:"שוק לילה ענק עם מאות דוכני אוכל — חובה בטאיפיי", imgType:"night" },
  ]},
  { date:"2026-07-14", label:"14 יולי", city:"ג׳יאופן ואזור הצפון", country:"טיוואן", flag:"🇹🇼", gradType:"waterfall", hotel:"Global Realm Boutique Hotel (Jiufen)", note:"🚗 איסוף רכב 08:00", stops:[
    { imgKey:"golden_waterfall", name:"Golden Waterfall Jinguashi Taiwan 黃金瀑布", displayName:"Golden Waterfall — מפלי הזהב", note:"מפלים צבעוניים זהובים מאלמנטים מינרליים — נוף ייחודי בעולם", imgType:"waterfall" },
    { imgKey:"yin_yang", name:"Yin Yang Sea Jinguashi Taiwan 陰陽海", displayName:"Yin Yang Sea — ים יין-יאנג", note:"עצירת תצפית על הים הצהוב-כחול הייחודי בגלל הכרייה ההיסטורית", imgType:"beach" },
    { imgKey:"jiufen", name:"Jiufen Old Street lanterns Taiwan 九份老街", displayName:"Jiufen Old Street — ג׳יאופן", note:"העיר הנסתרת בהרים — מדרגות, פנסים אדומים ומסעדות תה עתיקות", imgType:"night" },
  ]},
  { date:"2026-07-15", label:"15 יולי", city:"חוף המזרח — הואליין", country:"טיוואן", flag:"🇹🇼", gradType:"cliffs", hotel:"Harmony Easy Stay", stops:[
    { imgKey:"qingshui", name:"Qingshui Cliffs Suhua Highway Taiwan 清水斷崖", displayName:"Qingshui Cliffs — צוקי צ׳ינגשואי", note:"צוקים אנכיים של 800 מטר הנופלים ישירות לאוקיינוס הפסיפי", imgType:"cliffs" },
    { imgKey:"dongdaemun", name:"Dongdamen Night Market Hualien Taiwan", displayName:"Dongdamen — שוק לילה הואליין", note:"שוק לילה ססגוני עם אוכל ילידי והופעות מוזיקה חי", imgType:"night" },
  ]},
  { date:"2026-07-16", label:"16 יולי", city:"פארק טרוקו + מזרח", country:"טיוואן", flag:"🇹🇼", gradType:"nature", hotel:"Traveller-Inn Tiehua", stops:[
    { imgKey:"taroko", name:"Taroko Gorge National Park Taiwan 太魯閣", displayName:"פארק טרוקו — Taroko Gorge", note:"ביקוע גרניט ירוק-כחול שחצב הנהר במשך מיליוני שנים — אחד מפלאי טיוואן", imgType:"nature" },
    { imgKey:"eternal_spring", name:"Eternal Spring Shrine Taroko Taiwan 長春祠", displayName:"Eternal Spring Shrine + Shakadang Trail", note:"מקדש זרימת מים נצחית בתוך מנהרה", imgType:"temple" },
    { imgKey:"zhiben", name:"Zhiben Hot Spring Taitung Taiwan 知本溫泉", displayName:"Zhiben Hot Springs — ז׳יבן", note:"מעיינות חמים ביערות ירוקים — אחד מאזורי המעיינות הטובים בטיוואן", imgType:"hotspring" },
    { imgKey:"tiehua", name:"Tiehua Music Village Taitung Taiwan 鐵花村", displayName:"Tiehua Music Village", note:"כפר אומנותי קטן עם מוזיקה חיה בשעות הערב", imgType:"village" },
  ]},
  { date:"2026-07-17", label:"17 יולי", city:"צ׳ישאנג + קנטינג", country:"טיוואן", flag:"🇹🇼", gradType:"nature", hotel:"Lang Qin Hai Inn", stops:[
    { imgKey:"mr_brown", name:"Mr Brown Avenue Chishang rice fields Taiwan 伯朗大道", displayName:"Mr. Brown Avenue — שדות האורז", note:"שביל ציורי בין שדות אורז ירוקים עם הרים ברקע", imgType:"nature" },
    { imgKey:"kenting_beach", name:"Kenting beach Taiwan national park 墾丁", displayName:"קנטינג — חוף דרום טיוואן", note:"חופי שחייה, פארק לאומי וחיי לילה קלילים", imgType:"beach" },
    { imgKey:"kenting_night", name:"Kenting Night Market Taiwan street food 墾丁夜市", displayName:"שוק לילה קנטינג", note:"קילומטר שלם של דוכני אוכל פירות ים וקינוחים", imgType:"night" },
  ]},
  { date:"2026-07-18", label:"18 יולי", city:"הדרום — טאינאן", country:"טיוואן", flag:"🇹🇼", gradType:"castle", hotel:"LIHO Hotel Tainan", stops:[
    { imgKey:"eluanbi", name:"Eluanbi Lighthouse Kenting Taiwan 鵝鑾鼻燈塔", displayName:"Eluanbi Lighthouse — נקודה הדרומית", note:"המגדלור הדרומי ביותר בטיוואן", imgType:"beach" },
    { imgKey:"longpan", name:"Longpan Park green cliffs sea Kenting Taiwan", displayName:"Longpan Park — צוקים ירוקים", note:"מדשאה ירוקה על גבי צוקים מעל הים — נוף דרמטי ומרהיב", imgType:"cliffs" },
    { imgKey:"fort_zeelandia", name:"Fort Zeelandia Anping Tainan Taiwan 安平古堡", displayName:"Fort Zeelandia — מצודה הולנדית", note:"מצודה הולנדית משנת 1624 — לב ההיסטוריה הקולוניאלית של טיוואן", imgType:"castle" },
    { imgKey:"chikan", name:"Chihkan Tower Tainan Taiwan 赤崁樓", displayName:"Chihkan Tower — מגדל צ׳יהקאן", note:"מבצר משנת 1653 בלב טאינאן ההיסטורית", imgType:"castle" },
    { imgKey:"shennong", name:"Shennong Street Tainan Taiwan 神農街", displayName:"Shennong Street — רחוב העתיקות", note:"רחוב קטן ורומנטי עם פנסים ותמציות עשבי מרפא", imgType:"village" },
  ]},
  { date:"2026-07-19", label:"19 יולי", city:"אגם השמש והירח", country:"טיוואן", flag:"🇹🇼", gradType:"lake", hotel:"Sun Moon Lake Island Heart", stops:[
    { imgKey:"sun_moon_lake", name:"Sun Moon Lake Taiwan 日月潭", displayName:"Sun Moon Lake — אגם השמש והירח", note:"האגם הגדול ביותר בטיוואן — נופים מיסטיים בבוקר ושלוות ערב", imgType:"lake" },
    { imgKey:"wen_wu", name:"Wenwu Temple Sun Moon Lake Taiwan 文武廟", displayName:"Wen Wu Temple — מקדש ון-וו", note:"מקדש ענק ומרהיב על שפת האגם", imgType:"temple" },
    { imgKey:"ita_thao", name:"Ita Thao village Sun Moon Lake Taiwan 伊達邵", displayName:"כפר Ita Thao — כפר ילידי", note:"כפר של ילידי Thao על שפת האגם — מסורות, אוכל ושוק קטן", imgType:"village" },
    { imgKey:"bike_lake", name:"Sun Moon Lake cycling bike trail Taiwan", displayName:"רכיבה סביב האגם", note:"מסלול אופניים של 33 ק״מ סביב האגם", imgType:"lake" },
  ]},
  { date:"2026-07-20", label:"20 יולי", city:"טאיצ׳ונג", country:"טיוואן", flag:"🇹🇼", gradType:"city", hotel:"Chance Hotel", stops:[
    { imgKey:"rainbow", name:"Rainbow Village Taichung Taiwan 彩虹眷村", displayName:"Rainbow Village — כפר הקשת", note:"כפר צבעוני שצייר חייל קשיש יחידי — אחד מהמקומות הפוטוגנים בטיוואן", imgType:"village" },
    { imgKey:"gaomei", name:"Gaomei Wetlands sunset wind turbines Taichung Taiwan 高美濕地", displayName:"Gaomei Wetlands — שקיעה בשטחי הביצה", note:"טורבינות רוח ענקיות ושמיים כתומים בשקיעה", imgType:"nature" },
  ]},
  { date:"2026-07-21", label:"21 יולי", city:"חזרה לטאיפיי", country:"טיוואן", flag:"🇹🇼", gradType:"night", hotel:"Global Realm Boutique Hotel", note:"🚗 החזרת הרכב 11:00", stops:[
    { imgKey:"ningxia", name:"Ningxia Night Market Taipei Taiwan 寧夏夜市", displayName:"Ningxia Night Market — שוק לילה", note:"שוק לילה קטן ואותנטי של מקומיים — פחות תיירים, יותר טעם", imgType:"night" },
  ]},
  // OSAKA
  { date:"2026-07-22", label:"22 יולי", city:"טיוואן ← אוסקה", country:"יפן", flag:"🇯🇵", gradType:"night", hotel:"Regale Namba Annex", note:"טיסה D7378 | 15:40 ← 19:30", stops:[
    { imgKey:"dotonbori", name:"Dotonbori canal neon Osaka Japan 道頓堀", displayName:"Dotonbori — לב אוסקה", note:"תעלה מוארת בניאון, שלטי ענק, שיפודי תמנון ואיזאקאיה", imgType:"night" },
    { imgKey:"shinsaibashi", name:"Shinsaibashi shopping street Osaka Japan 心斎橋", displayName:"Shinsaibashi — רחוב קניות", note:"הרחוב המסחרי הארוך ביותר באוסקה", imgType:"market" },
  ]},
  { date:"2026-07-23", label:"23 יולי", city:"אוסקה", country:"יפן", flag:"🇯🇵", gradType:"castle", hotel:"Regale Namba Annex", stops:[
    { imgKey:"osaka_castle", name:"Osaka Castle Japan 大阪城", displayName:"Osaka Castle — טירת אוסקה", note:"טירה מפוארת משנת 1597 עם גנים מרהיבים ומוזיאון היסטורי", imgType:"castle" },
    { imgKey:"kuromon", name:"Kuromon Ichiba Market Osaka Japan 黒門市場", displayName:"Kuromon Ichiba Market — שוק קורומון", note:'״המטבח של אוסקה״ — שוק מקורה עם מאכלי ים, ואגיו', imgType:"market" },
    { imgKey:"shinsekai2", name:"Shinsekai Tsutenkaku tower Osaka Japan 新世界", displayName:"Shinsekai + Tsutenkaku", note:"רובע 1912 עם מגדל 103 מטר — ה-DNA האותנטי של אוסקה", imgType:"city" },
    { imgKey:"abeno", name:"Abeno Harukas skyscraper Osaka Japan 天王寺", displayName:"Abeno Harukas — תצפית 300 מ׳", note:"המגדל השני בגובהו ביפן — תצפית בקומה 60", imgType:"city" },
    { imgKey:"hozenji", name:"Hozenji Yokocho alley Osaka Japan 法善寺横丁", displayName:"Hozenji Yokocho — סמטת המקדש", note:"סמטת אבן צרה ורומנטית עם מקדש קטן ומסעדות עתיקות", imgType:"temple" },
  ]},
  { date:"2026-07-24", label:"24 יולי", city:"אוסקה — הרים + עיר", country:"יפן", flag:"🇯🇵", gradType:"mountain", hotel:"Regale Namba Annex", stops:[
    { imgKey:"mount_kongo", name:"Mount Kongo Osaka Nara Japan 金剛山", displayName:"Mount Kongō — הר קונגו", note:"הר 1,125 מטר על גבול נארה-אוסקה — טיפוס עם רכבל ונוף עצום", imgType:"mountain" },
    { imgKey:"usj", name:"Universal Studios Japan Osaka ユニバーサル", displayName:"Universal Studios Japan", note:"פארק שעשועים עולמי עם האריי פוטר ומינאורים", imgType:"festival" },
    { imgKey:"hep_five", name:"HEP Five Ferris Wheel Umeda Osaka Japan", displayName:"HEP Five Ferris Wheel — גלגל ענק", note:"גלגל ענק אדום על גג קניון — תצפית על אוסקה בלילה", imgType:"night" },
    { imgKey:"umeda_sky", name:"Umeda Sky Building observation Osaka Japan 梅田スカイビル", displayName:"Umeda Sky Building — תצפית שמים", note:"שני גורדי שחקים מחוברים בגג — אחת התצפיות הדרמטיות ביפן", imgType:"city" },
  ]},
  { date:"2026-07-25", label:"25 יולי", city:"פסטיבל טנג׳יאין — אוסקה", country:"יפן", flag:"🇯🇵", gradType:"festival", hotel:"Regale Namba Annex", stops:[
    { imgKey:"tenmangu", name:"Osaka Tenmangu Shrine Japan 大阪天満宮", displayName:"Osaka Tenmangu Shrine", note:"מקדש שינטו עתיק — מרכז פסטיבל טנג׳יאין האגדי", imgType:"temple" },
    { imgKey:"kema_park", name:"Tenjin Matsuri festival boats fireworks Osaka Japan 天神祭", displayName:"Kema Sakuranomiya Park ⭐", note:"המקום הטוב ביותר לצפייה! להגיע עד 16:00. סירות מסורתיות + זיקוקים ענקיים", imgType:"festival" },
  ]},
  { date:"2026-07-26", label:"26 יולי", city:"אוסקה — יער + קניות", country:"יפן", flag:"🇯🇵", gradType:"forest", hotel:"Regale Namba Annex", stops:[
    { imgKey:"minoh", name:"Minoh Waterfall Osaka Japan 箕面大滝", displayName:"Minoh Falls — מפלי מינוח", note:"הליכה 3 ק״מ ביער עצים ענקיים למפל של 33 מטר", imgType:"waterfall" },
    { imgKey:"namba_parks", name:"Namba Parks garden Osaka Japan なんばパークス", displayName:"Namba Parks — פארק בתוך קניון", note:"קניון ייחודי עם גנים מדורגים וצמחייה על גגות הקניון", imgType:"nature" },
    { imgKey:"america_mura", name:"America-mura Osaka Japan アメリカ村", displayName:"America-mura — כפר אמריקה", note:"רובע נוער עם בגדי וינטג׳, גרפיטי, בתי קפה ומועדוני היפ-הופ", imgType:"city" },
  ]},
  // KYOTO
  { date:"2026-07-27", label:"27 יולי", city:"אוסקה ← קיוטו", country:"יפן-קיוטו", flag:"🇯🇵", gradType:"market", hotel:"Travelodge Kyoto Shijo-Kawaramachi", note:"רכבת Midosuji → Hankyu Limited Express", stops:[
    { imgKey:"nishiki", name:"Nishiki Market Kyoto Japan 錦市場", displayName:"Nishiki Market — שוק ניישיקי", note:"שוק קיוטו בן 400 שנה — ״המטבח של קיוטו״ עם דוכנים אינסופיים", imgType:"market" },
    { imgKey:"pontocho", name:"Pontocho alley Kyoto Japan night 先斗町", displayName:"Pontocho — סמטת הנהר", note:"סמטה צרה ומאגית לצד נהר קאמו — מסעדות יפניות על יציעי נהר", imgType:"night" },
  ]},
  { date:"2026-07-28", label:"28 יולי", city:"קורמה — הרים וטבע", country:"יפן-קיוטו", flag:"🇯🇵", gradType:"forest", hotel:"Travelodge Kyoto Shijo-Kawaramachi", stops:[
    { imgKey:"kurama", name:"Kurama Temple forest Kyoto Japan 鞍馬寺", displayName:"Kuramadera Temple — מקדש קורמה", note:"הליכה ביער הרים מיסטי למקדש בודהיסטי עתיק", imgType:"forest" },
    { imgKey:"kawadoko", name:"Kawadoko riverside restaurant Kibune Kyoto Japan 川床", displayName:"Kawadoko — מסעדה על הנהר", note:"ארוחה על פלטפורמות עץ מעל מי הנהר הצלולים — חוויית קיץ יפנית", imgType:"nature" },
  ]},
  { date:"2026-07-29", label:"29 יולי", city:"נארה", country:"יפן-קיוטו", flag:"🇯🇵", gradType:"deer", hotel:"Travelodge Kyoto Shijo-Kawaramachi", stops:[
    { imgKey:"nara_park", name:"Nara Park deer Japan 奈良公園", displayName:"Nara Park — פארק הצבאים", note:"מאות צבאים חופשיים מסתובבים ואוכלים מכפות ידיים — חוויה שאין בשום מקום אחר", imgType:"deer" },
    { imgKey:"kasuga", name:"Kasuga Taisha shrine lanterns Nara Japan 春日大社", displayName:"Kasuga Taisha — מקדש קאסוגה", note:"מקדש שינטו משנת 768 עם אלפי פנסי אבן ועמודים אדומים", imgType:"temple" },
    { imgKey:"kinkakuji", name:"Kinkakuji Golden Pavilion Kyoto Japan 金閣寺", displayName:"Kinkaku-ji — מקדש הזהב", note:"מקדש מצופה זהב הנשקף בבריכת ההשתקפות — אחד המקומות הצלומים ביותר בעולם", imgType:"temple" },
  ]},
  { date:"2026-07-30", label:"30 יולי", city:"אראשיאמה + פושימי", country:"יפן-קיוטו", flag:"🇯🇵", gradType:"forest", hotel:"Travelodge Kyoto Shijo-Kawaramachi", stops:[
    { imgKey:"hozugawa", name:"Hozugawa River rafting Arashiyama Kyoto Japan 保津川下り", displayName:"Hozugawa River — רפטינג", note:"יציאה מוקדמת לרפטינג בנהר הוזו — 16 ק״מ בין צוקים ויערות", imgType:"rafting" },
    { imgKey:"arashiyama", name:"Arashiyama Bamboo Grove Kyoto Japan 竹林", displayName:"יער הבמבוק — Arashiyama", note:"מנהרת במבוק ירוקה שמשתנה עם הרוח — תמונה אייקונית של קיוטו", imgType:"forest" },
    { imgKey:"monkey_park", name:"Arashiyama Monkey Park Iwatayama Kyoto Japan", displayName:"Monkey Park Iwatayama", note:"עלייה לפסגת הר אראשיאמה לצפייה בקופי מקוק ונוף על קיוטו", imgType:"mountain" },
    { imgKey:"fushimi", name:"Fushimi Inari Taisha torii gates Kyoto Japan 伏見稲荷大社", displayName:"Fushimi Inari — שערים אדומים", note:"אלפי שערי טורי כתומים-אדומים מטפסים על הר אינארי — חובה בקיוטו", imgType:"temple" },
    { imgKey:"gion", name:"Gion district Kyoto Japan night 祇園", displayName:"Gion — רובע הגישות", note:"רחובות מדינת אדו עם בתי עץ וחנויות תה", imgType:"night" },
  ]},
  { date:"2026-07-31", label:"31 יולי", city:"הר היאיי + אגם ביווה", country:"יפן-קיוטו", flag:"🇯🇵", gradType:"lake", hotel:"Travelodge Kyoto Shijo-Kawaramachi", stops:[
    { imgKey:"sakamoto_cable", name:"Sakamoto Cable Car Lake Biwa Japan 坂本ケーブル", displayName:"Sakamoto Cableway — הרכבל הארוך", note:"הרכבל הארוך ביותר ביפן — נוף פנורמי של אגם ביווה הכחול", imgType:"ropeway" },
    { imgKey:"enryakuji", name:"Enryakuji Temple Mount Hiei Kyoto Japan 延暦寺", displayName:"Enryaku-ji — מקדש ענק ביער", note:"קומפלקס מקדשים עתיק בין ארזים ענקיים בגובה 848 מ׳", imgType:"forest" },
    { imgKey:"sakamoto_town", name:"Sakamoto town stone walls canal Shiga Japan", displayName:"עיירת סאקמוטו", note:"תעלות מים, חומות אבן ומסעדות עם טופו מיוחד לאזור", imgType:"village" },
    { imgKey:"ukimido", name:"Ukimido floating temple Lake Biwa Japan 浮御堂", displayName:"Ukimido Temple — מקדש על המים", note:"מקדש קסום הבנוי על כלונסאות בתוך אגם ביווה", imgType:"lake" },
  ]},
  { date:"2026-08-01", label:"1 אוגוסט", city:"קיוטו — היסטוריה", country:"יפן-קיוטו", flag:"🇯🇵", gradType:"temple", hotel:"Travelodge Kyoto Shijo-Kawaramachi", stops:[
    { imgKey:"kiyomizu", name:"Kiyomizudera Temple wooden stage Kyoto Japan 清水寺", displayName:"Kiyomizu-dera — תצפית קיומיזו", note:"מקדש בודהיסטי על הר אוטובה — המרפסת בגובה 13 מ׳ עם נוף לכל קיוטו", imgType:"temple" },
    { imgKey:"sannenzaka", name:"Sannenzaka Ninenzaka stone path Kyoto Japan 産寧坂", displayName:"Sannenzaka + Ninenzaka", note:"מדרכות אבן ישנות בין בתי עץ — האזור הצלום ביותר בקיוטו", imgType:"village" },
    { name:"Pontocho Gion night lanterns Kyoto Japan", displayName:"Pontocho + Gion בלילה", note:"הערב הכי יפה בקיוטו — סמטאות אדו בתאורת פנסים", imgType:"night" },
  ]},
  // ALPS
  { date:"2026-08-02", label:"2 אוגוסט", city:"קנאזאווה + שיראקאוואגו", country:"אלפים", flag:"🇯🇵", gradType:"village", hotel:"Chisun Grand Takayama", note:"🚗 איסוף רכב קיוטו 08:00", stops:[
    { imgKey:"kenrokuen", name:"Kenrokuen Garden Kanazawa Japan 兼六園", displayName:"גן קנרוקואן + מצודת קנאזאווה", note:"אחד משלושת הגנים הגדולים של יפן — תכנון מדוקדק ועדין", imgType:"nature" },
    { imgKey:"shirakawago", name:"Shirakawago thatched roof village Japan UNESCO 白川郷", displayName:"שיראקאוואגו — כפר גאשו-זוקורי", note:"כפר אונסקו עם בתי קש ישנים בזווית 60° — נוף מהאגדות", imgType:"village" },
    { imgKey:"shiroyama", name:"Shirakawago observation deck viewpoint Japan", displayName:"Shiroyama — מגדל תצפית", note:"עלייה 10 דקות לנוף הקלאסי על גגות הכפר עם ההרים ברקע", imgType:"mountain" },
  ]},
  { date:"2026-08-03", label:"3 אוגוסט", city:"טאקאיאמה", country:"אלפים", flag:"🇯🇵", gradType:"village", hotel:"Chisun Grand Takayama", stops:[
    { imgKey:"jinya_market", name:"Jinya-mae morning market Takayama Japan 陣屋朝市", displayName:"שוק בוקר Jinya-mae", note:"שוק בוקר יומי של חקלאים ואומנים מקומיים מזה 300 שנה", imgType:"market" },
    { imgKey:"takayama_jinya", name:"Takayama Jinya government house Japan 高山陣屋", displayName:"Takayama Jinya — מטה ממשל", note:"המטה הממשלתי היחיד ששרד מתקופת אדו — אוסף ייחודי", imgType:"castle" },
    { imgKey:"sanmachi", name:"Sanmachi Suji old town Takayama Japan 三町筋", displayName:"Sanmachi Suji — רחוב אדו", note:"שלושה רחובות ישנים עם יקבי סאקה, בתי עץ וחנויות קלאסיות", imgType:"village" },
    { imgKey:"hida_folk", name:"Hida Folk Village open air museum Takayama Japan 飛騨の里", displayName:"Hida Folk Village — כפר פתוח", note:"כפר מוזיאוני עם בתי Gassho מקוריים שהועברו ממקומות שונים", imgType:"village" },
  ]},
  { date:"2026-08-04", label:"4 אוגוסט", city:"אוקוהידה + רכבל", country:"אלפים", flag:"🇯🇵", gradType:"hotspring", hotel:"Chisun Grand Takayama", stops:[
    { imgKey:"okuhida", name:"Okuhida Onsen hot spring Japan Alps 奥飛騨温泉郷", displayName:"אוקוהידה — אונסן אלפיני", note:"מעיינות חמים בלב הרי האלפים היפניים — פסגות שלגיות ברקע", imgType:"hotspring" },
    { imgKey:"shinhotaka", name:"Shinhotaka Ropeway Japan Alps panorama 新穂高ロープウェイ", displayName:"Shinhotaka Ropeway — רכבל דו-קומתי", note:"רכבל דו-קומתי עד 2,156 מ׳ — פנורמה 360° על הרי הוטאקה", imgType:"ropeway" },
  ]},
  { date:"2026-08-05", label:"5 אוגוסט", city:"שמורת קאמיקוצ׳י", country:"אלפים", flag:"🇯🇵", gradType:"lake", hotel:"Chisun Grand Takayama", stops:[
    { imgKey:"kamikochi", name:"Kamikochi alpine valley Japan Alps 上高地", displayName:"Kamikochi — שמורת הטבע", note:"אחד מהמקומות הפראיים והיפים ביפן — עמק אלפיני ענק הסגור לרכב פרטי", imgType:"nature" },
    { imgKey:"taisho_pond", name:"Taisho Pond dead trees Kamikochi Japan 大正池", displayName:"Taisho Pond — בריכת טאישו", note:"גזעי עצים מתים שקועים במים וצמרות הרי הוטאקה ברקע", imgType:"lake" },
    { imgKey:"myojin", name:"Myojin Pond Hotaka Shrine Kamikochi Japan 明神池", displayName:"Myojin Pond — בריכת מיוג׳ין", note:"מסלול 3 שעות לאגם מיסטי וצלול עם מקדש שינטו על שפתו", imgType:"lake" },
    { imgKey:"matsumoto2", name:"Matsumoto Castle black Japan 松本城", displayName:"מצודת מאצומוטו", note:"אחת מ-12 מצודות יפן המקוריות — שחורה, ייחודית ושלמה", imgType:"castle" },
  ]},
  { date:"2026-08-06", label:"6 אוגוסט", city:"נוריקורה + מאצומוטו", country:"אלפים", flag:"🇯🇵", gradType:"mountain", hotel:"Hotel Morschein", stops:[
    { imgKey:"norikura", name:"Norikura Kogen highland plateau Japan Alps 乗鞍高原", displayName:"Norikura Kogen — רמת נוריקורה", note:"רמת הרים עם אחו פרחים ענק — אוטובוס ל-Tatamidaira בגובה 2,700 מ׳", imgType:"mountain" },
    { name:"Matsumoto Castle black Japan 松本城", displayName:"מצודת מאצומוטו", note:"מצודת ״עורב שחור״ מהמאה ה-16 — אחת מ-12 המקוריות של יפן", imgType:"castle" },
    { imgKey:"nawate", name:"Nawatedori Nakamachi Matsumoto Japan night 縄手通り", displayName:"Nawate-dori + Nakamachi בלילה", note:"רחובות קסומים לאורך נהר קטן — אומנות, בתי קפה ומסעדות", imgType:"night" },
  ]},
  { date:"2026-08-07", label:"7 אוגוסט", city:"צומאגו + אינויאמה ← אוסקה", country:"אלפים", flag:"🇯🇵", gradType:"village", hotel:"— החזרת רכב אוסקה 17:30", note:"🚗 החזרת רכב Toyota Namba Terminal עד 17:30", stops:[
    { imgKey:"tsumago", name:"Tsumago-juku preserved post town Japan 妻籠宿", displayName:"Tsumago-juku — עיירת אדו", note:"עיירת תחנה ישנה השמורה בצורה מושלמת — כאילו הזמן עצר ב-1600", imgType:"village" },
    { imgKey:"inuyama", name:"Inuyama Castle Japan 犬山城", displayName:"מצודת אינויאמה", note:"אחת ממצודות ה-12 המקוריות — הקדומות ביותר ביפן", imgType:"castle" },
  ]},
  { date:"2026-08-08", label:"8 אוגוסט", city:"אוסקה ← בנגקוק", country:"תאילנד", flag:"🇹🇭", gradType:"city", hotel:"Asia Hotel Bangkok", note:"טיסה VZ821 | 08:55 ← 12:55", stops:[] },
  { date:"2026-08-09", label:"9 אוגוסט", city:"בנגקוק", country:"תאילנד", flag:"🇹🇭", gradType:"city", hotel:"Asia Hotel Bangkok", stops:[
    { name:"Bangkok Thailand skyline Chao Phraya river", displayName:"יום חופשי בבנגקוק", note:"מנוחה, קניות אחרונות ואוכל תאילנדי לפני הטיסה הביתה", imgType:"city" },
  ]},
  { date:"2026-08-10", label:"10 אוגוסט", city:"בנגקוק ← דובאי ← ישראל 🏠", country:"🛬", flag:"🇮🇱", gradType:"city", note:"טיסה FZ1334 | יציאה 23:50, הגעה 08:45", stops:[] },
];

const countryColors = {
  "תאילנד":    {bg:"#fdf4ff",border:"#ec4899",accent:"#db2777"},
  "טיוואן":    {bg:"#ecfdf5",border:"#14b8a6",accent:"#0d9488"},
  "יפן":       {bg:"#fff1f2",border:"#ef4444",accent:"#dc2626"},
  "יפן-קיוטו": {bg:"#fffbeb",border:"#f59e0b",accent:"#d97706"},
  "אלפים":     {bg:"#f0fdf4",border:"#10b981",accent:"#059669"},
  "🛫":        {bg:"#eef2ff",border:"#6366f1",accent:"#4f46e5"},
  "🛬":        {bg:"#eef2ff",border:"#6366f1",accent:"#4f46e5"},
};

const regionGroups = [
  {label:"🇹🇭 בנגקוק",      dates:["2026-07-10","2026-07-11"],color:"#ec4899"},
  {label:"🇹🇼 טיוואן",      dates:["2026-07-12","2026-07-13","2026-07-14","2026-07-15","2026-07-16","2026-07-17","2026-07-18","2026-07-19","2026-07-20","2026-07-21"],color:"#14b8a6"},
  {label:"🇯🇵 אוסקה",       dates:["2026-07-22","2026-07-23","2026-07-24","2026-07-25","2026-07-26"],color:"#ef4444"},
  {label:"🇯🇵 קיוטו",       dates:["2026-07-27","2026-07-28","2026-07-29","2026-07-30","2026-07-31","2026-08-01"],color:"#f59e0b"},
  {label:"🏔️ אלפים יפניים", dates:["2026-08-02","2026-08-03","2026-08-04","2026-08-05","2026-08-06","2026-08-07"],color:"#10b981"},
  {label:"🇹🇭 חזרה",        dates:["2026-08-08","2026-08-09","2026-08-10"],color:"#ec4899"},
];

// ✅ FIX: StopCard now reads IMGS[stop.imgKey] at render time (after IMGS is loaded)
// and uses useEffect (not useState) for the side-effect of fetching the image
function StopCard({ stop }) {
  const [apiImgUrl, setApiImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ✅ FIX 1: useEffect instead of useState for side effects
  useEffect(() => {
    let cancelled = false;
    async function fetchImg() {
      setLoading(true);
      const url = await fetchStopImage(stop.name);
      if (!cancelled) {
        setApiImgUrl(url);
        setLoading(false);
      }
    }
    fetchImg();
    return () => { cancelled = true; };
  }, [stop.name]);

  // ✅ FIX 2: resolve imgKey at render time from the (now-loaded) IMGS object
  const localImg = stop.imgKey ? IMGS[stop.imgKey] : undefined;

  const [g1,g2] = GRAD[stop.imgType||"city"]||GRAD.city;
  const icon = ICON[stop.imgType||"city"]||"📍";

  return (
    <div style={{
      background:"#fff", borderRadius:12, overflow:"hidden",
      boxShadow:"0 2px 8px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0",
      transition:"transform 0.15s,box-shadow 0.15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.13)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}
    >
      <div style={{height:150,position:"relative",overflow:"hidden"}}>
        {/* Priority: local base64 image → API-fetched URL → gradient fallback */}
        {localImg ? (
          <img src={localImg} alt={stop.displayName||stop.name}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
          />
        ) : (
          <>
            <div style={{
              position:"absolute",inset:0,
              background:`linear-gradient(135deg,${g1} 0%,${g2} 100%)`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,
            }}>
              {loading
                ? <div style={{width:32,height:32,border:"3px solid rgba(255,255,255,0.4)",borderTop:"3px solid #fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                : <><span style={{fontSize:38}}>{icon}</span>
                   <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",textAlign:"center",padding:"0 8px",direction:"rtl",textShadow:"0 1px 3px rgba(0,0,0,0.3)",maxWidth:160}}>{stop.displayName||stop.name}</span>
                  </>
              }
            </div>
            {apiImgUrl && !imgError && (
              <img src={apiImgUrl} alt={stop.displayName||stop.name}
                onError={()=>setImgError(true)}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
              />
            )}
          </>
        )}
      </div>
      <div style={{padding:"11px 13px"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#1e293b",marginBottom:3,direction:"rtl",lineHeight:1.4}}>{stop.displayName||stop.name}</div>
        {stop.note && <div style={{fontSize:11,color:"#64748b",lineHeight:1.5,direction:"rtl"}}>{stop.note}</div>}
      </div>
    </div>
  );
}

function DayGradBg({type="city"}) {
  const [g1,g2] = GRAD[type]||GRAD.city;
  return <div style={{position:"absolute",inset:0,zIndex:0,background:`linear-gradient(135deg,${g1}dd 0%,${g2}dd 100%)`}}/>;
}

function DayCard({day,isActive,onClick}) {
  const theme = countryColors[day.country]||{bg:"#f8fafc",border:"#94a3b8",accent:"#64748b"};
  const hasStops = day.stops && day.stops.length > 0;
  return (
    <div style={{marginBottom:12}}>
      <div onClick={onClick} style={{
        border:`2px solid ${isActive?theme.border:theme.border+"77"}`,
        borderRadius:isActive?"14px 14px 0 0":14,
        cursor:"pointer",overflow:"hidden",position:"relative",
        minHeight:70,transition:"border-color 0.2s",
      }}>
        <DayGradBg type={day.gradType||"city"}/>
        <div style={{position:"relative",zIndex:1,padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{day.flag}</span>
            <div>
              <div style={{fontWeight:800,fontSize:11,color:"rgba(255,255,255,0.75)",direction:"rtl",letterSpacing:0.5,textTransform:"uppercase"}}>{day.label}</div>
              <div style={{fontWeight:700,fontSize:15,color:"#fff",direction:"rtl",textShadow:"0 1px 6px rgba(0,0,0,0.5)"}}>{day.city}</div>
              {day.hotel && <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",direction:"rtl"}}>🏨 {day.hotel}</div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {hasStops && <span style={{background:"rgba(255,255,255,0.25)",backdropFilter:"blur(6px)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,border:"1px solid rgba(255,255,255,0.35)"}}>{day.stops.length} עצירות</span>}
            <span style={{color:"#fff",fontSize:20,transform:isActive?"rotate(180deg)":"",transition:"transform 0.25s",textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>▾</span>
          </div>
        </div>
      </div>
      {isActive && (
        <div style={{background:theme.bg,border:`2px solid ${theme.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:14}}>
          {day.note && <div style={{background:"rgba(255,255,255,0.85)",border:`1px solid ${theme.border}`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:theme.accent,fontWeight:600,direction:"rtl"}}>✈️ {day.note}</div>}
          {hasStops
            ? <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:11}}>
                {day.stops.map((stop,i) => <StopCard key={i} stop={stop}/>)}
              </div>
            : <div style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"18px 0",direction:"rtl"}}>יום מעבר / טיסה</div>
          }
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("guide");
  const [imgsReady, setImgsReady] = useState(false);

  // ✅ FIX 3: force re-render after IMGS loads so StopCards pick up localImg
  useEffect(() => {
    loadIMGS(() => setImgsReady(true));
  }, []);

  const [activeDay, setActiveDay] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);
  const [search, setSearch] = useState("");

  const filteredDays = days.filter(d => {
    const regionMatch = activeRegion===null || regionGroups[activeRegion].dates.includes(d.date);
    if (!regionMatch) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return d.city.toLowerCase().includes(q) || (d.country||"").toLowerCase().includes(q) ||
      (d.hotel||"").toLowerCase().includes(q) ||
      (d.stops||[]).some(s => (s.displayName||s.name).toLowerCase().includes(q)||(s.note||"").toLowerCase().includes(q));
  });

  const totalStops = days.reduce((a,d)=>a+(d.stops?.length||0),0);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",fontFamily:"'Segoe UI',Arial,sans-serif",direction:"rtl"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%)",padding:"36px 24px 28px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%,rgba(99,102,241,0.35) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(236,72,153,0.2) 0%,transparent 50%)"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:50,marginBottom:6}}>🌍</div>
          <h1 style={{color:"#fff",fontSize:27,fontWeight:900,margin:"0 0 5px",letterSpacing:-0.5}}>טיול טיוואן + יפן 2026</h1>
          <div style={{color:"#a5b4fc",fontSize:13,marginBottom:18}}>10 ביולי – 10 באוגוסט 2026 · 31 יום</div>

          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:18}}>
            <button onClick={()=>setView("guide")} style={{
              padding:"8px 22px",borderRadius:25,fontWeight:700,fontSize:13,cursor:"pointer",
              border:"2px solid #6366f1",
              background: view==="guide" ? "#6366f1" : "transparent",
              color: view==="guide" ? "#fff" : "#a5b4fc",
              transition:"all 0.2s",
            }}>🖼️ מדריך תמונות</button>
            <button onClick={()=>setView("nav")} style={{
              padding:"8px 22px",borderRadius:25,fontWeight:700,fontSize:13,cursor:"pointer",
              border:"2px solid #10b981",
              background: view==="nav" ? "#10b981" : "transparent",
              color: view==="nav" ? "#fff" : "#6ee7b7",
              transition:"all 0.2s",
            }}>🧭 ניווט מסע</button>
          </div>
          <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
            {["🇹🇭 בנגקוק","🇹🇼 טיוואן","🇯🇵 אוסקה","🇯🇵 קיוטו","🏔️ אלפים"].map((t,i)=>(
              <span key={i} style={{background:"rgba(255,255,255,0.15)",color:"#e2e8f0",borderRadius:20,padding:"4px 11px",fontSize:12,fontWeight:600}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 14px"}}>
        {view==="nav" ? (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:52,marginBottom:16}}>🧭</div>
            <div style={{color:"#e2e8f0",fontSize:18,fontWeight:700,marginBottom:8,direction:"rtl"}}>מסע — אפליקציית הניווט</div>
            <div style={{color:"#94a3b8",fontSize:14,marginBottom:28,direction:"rtl"}}>פתח את PWA הניווט עם מפות, Waze ופירוט עצירות</div>
            <button
               onClick={()=>{
                 try {
                   const backup = `{"trips":[{"id":"mqmf094nh3yg","name":"טיול טיוואן + יפן 2026","dates":"10 ביולי 2026 – 10 באוג׳ 2026","emoji":"🌍","days":[{"id":"mqmqqbgkbirk","date":"2026-07-22","title":"","hotel":"טיפאיי - אוסקה","hotelAddr":"","departTime":"","note":"אוסקה","startType":"flight","startTransitNum":"D7378","startGate":"","startDepTime":"15:40","startArrTime":"19:30","stops":[{"id":"mqmqs49o2pfb","name":"Regale Namba Annex","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"מלון","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmqthpguvqe","name":"Dotonbori","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"דוטונבורי הוא רובע בידור ששוכן לצד התעלה ופופולרי בקרב סטודנטים וקהל בליינים שפוקדים את הברים הקטנים ואת מסבאות האיזאקאיה שבו לאחר שעות העבודה. הסמטאות הצרות מוארות בשלטי ניאון, כמו שלט האיש הרץ המפורסם של גליקו, לאחר שקיעת השמש, ולאורכן ניתן למצוא רוכלים שמוכרים קציצות תמנון טאקויאקי. תיאטרון שוצ'יקוזה מארח מופעי קאבוקי ומוזיקה חיה, ומוזיאון קאמיגאטה אוקיואה מציג הדפסי עץ קלאסיים.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmquekk3nwv","name":"Shinsaibashi","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"רחוב קניות","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmsuhf6vb4w","name":"דברים מיוחדים","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"אוקונומיאקי (Okonomiyaki)\\nהמאכל הכי מזוהה עם אוסקה – סוג של פנקייק יפני עבה, שמכינים מבצק קמח וכרוב, בתוספת בשר, פירות ים או גבינה.\\nטאקויאקי (Takoyaki)\\nכדורי בצק רכים עם חתיכות תמנון, בצל ירוק וג’ינג’ר מוחמץ, שנאפים בתבנית חצי עגולה ומקבלים צורת כדור מושלמת. מגישים אותם חמים עם רוטב טאקויאקי, מיונז, אצות ופתיתי טונה. הם חמים, רכים, נוזליים בפנים ופשוט ממכרים. יש את זה בכל מקום באוסקה.\\nקושיקאטסו (Kushikatsu)\\nשיפודים מטוגנים מכל מה שעולה על הדעת – ירקות, בשרים, ביצים קשות, גבינה ואפילו תותים! הכי מומלץ לטעום את זה בשכונת שינסקאי – הבית של הקושיקאטסו.\\nקיטסונה אודון (Kitsune Udon)\\nמרק אטריות יפני עם אודון עבה, בתוך מרק עדין בטעם סויה, עם חתיכת טופו מטוגן מתוק שנמס בפה. “קיטסונה” זה שועל ביפנית – והיפנים מאמינים שטופו מטוגן הוא האוכל האהוב על שועלים (מכאן השם!).","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmqv4ms11od","date":"2026-07-23","title":"","hotel":"Regale Namba Annex","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmqwgw47vkn","name":"Osaka Castle","type":"place","addr":"","travelTime":null,"time":"08:30","duration":"","note":"טירה פופולרית ומשוחזרת משנת 1597, ובה גנים ומוזיאון עם תערוכות מגוונות.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmqxl2s1udr","name":"Kuromon Ichiba Market","type":"place","addr":"","travelTime":null,"time":"11:30","duration":"","note":"שוק מרווח עם מוכרי אוכל רחוב, תוצרת חקלאית טרייה, רכיכות ומזכרות.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmqz2589o3t","name":"Shinsekai","type":"place","addr":"","travelTime":null,"time":"13:30","duration":"","note":"רובע שוקק וססגוני שנוסד בשנת 1912 ובו מגדל בגובה 103 מטרים, מסעדות וחנויות מזכרות.","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Shinsekai_and_Tsutenkaku_at_night_2019-04-12.jpg/330px-Shinsekai_and_Tsutenkaku_at_night_2019-04-12.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/%E6%96%B0%E4%B8%96%E7%95%8C%EF%BC%881953%E5%B9%B4%EF%BC%891.jpg/500px-%E6%96%B0%E4%B8%96%E7%95%8C%EF%BC%881953%E5%B9%B4%EF%BC%891.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Osaka_Shinsekai_Post_office.jpg/500px-Osaka_Shinsekai_Post_office.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Shinsekai_Asahi_Theater.jpg/500px-Shinsekai_Asahi_Theater.jpg"],"extract":"Shinsekai  is a neighbourhood located next to south Osaka City's downtown \\"Minami\\" area. The neighbourhood was created in 1912 with New York as a model for its southern half and Paris for its northern half. At this location, a Luna Park amusement park operated from 1912 until it closed in 1923. The centrepiece of the neighbourhood was Tsutenkaku Tower.","lang":"en"}},{"id":"mqmr0ihwrozs","name":"Tsutenkaku","type":"place","addr":"","travelTime":null,"time":"13:30","duration":"","note":"רובע שוקק וססגוני שנוסד בשנת 1912 ובו מגדל בגובה 103 מטרים, מסעדות וחנויות מזכרות.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmsnqtu1co7","name":"Abeno Harukas","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"אזור מסחרי מרכזי בדרום-מרכז העיר שנמצא ברובע אבנו, ונחשב לנקודת ציון בולטת באוסקה. המגדל הוא השני בגובהו ביפן (300 מטר) וכולל מרכז קניות יוקרתי, מוזיאון אומנות, מלון ותצפית עוצרת נשימה מקומה 60. המבנה נגיש מאוד – עם מעליות מהירות, שילוט באנגלית ושירותים מודרניים. מתאים גם למשפחות עם ילדים ומומלץ במיוחד בשעת שקיעה.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmr1qloi0iy","name":"Dotonbori","type":"place","addr":"","travelTime":null,"time":"18:00","duration":"","note":"רובע בילויים תוסס ידוע בשלטי חוצות ענקיים, מסעדות ותאטראות.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmr2v38jj19","name":"Hozenji Yokocho","type":"place","addr":"","travelTime":null,"time":"18:30","duration":"","note":"אזור יפה לצילומים","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Sakunosuke_Oda.JPG/330px-Sakunosuke_Oda.JPG","https://upload.wikimedia.org/wikipedia/commons/d/db/Meoto_zenzai_poster.jpg","https://upload.wikimedia.org/wikipedia/commons/b/b5/Wajima_Akiko_a.k.a._Oda_Akiko.JPG","https://upload.wikimedia.org/wikipedia/commons/c/c1/Sakunosuke_Oda.JPG"],"extract":"Sakunosuke Oda  was a Japanese writer. He is often grouped with Osamu Dazai and Ango Sakaguchi as the Buraiha. Literally meaning ruffian or hoodlum faction, this label was not a matter of a stylistic school but one bestowed upon them by conservative critics disparaging the authors' attitudes and subject matter.","lang":"en"}}]},{"id":"mqmr3qk58vru","date":"2026-07-24","title":"","hotel":"Regale Namba Annex","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmr54k4a2sd","name":"Konbini","type":"place","addr":"","travelTime":null,"time":"08:00","duration":"","note":"אזור יפה לארוחת בוקר","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmr7uismtxr","name":"Mount Kongō","type":"place","addr":"","travelTime":null,"time":"09:00","duration":"","note":"טיפוס על הר בשילוב רכבל","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Mount_Kongo%28Kongosanchi%297.jpg/330px-Mount_Kongo%28Kongosanchi%297.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Mount_Kongo%28Kongosanchi%297.jpg/500px-Mount_Kongo%28Kongosanchi%297.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/%E4%B8%89%E5%AE%9D%E5%B1%B1%28%E9%87%91%E5%89%9B%E5%B1%B1%2920190817.jpg/500px-%E4%B8%89%E5%AE%9D%E5%B1%B1%28%E9%87%91%E5%89%9B%E5%B1%B1%2920190817.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/%E4%B8%89%E5%AE%9D%E5%B1%B1%28%E9%87%91%E5%89%9B%E5%B1%B1%2920131231.jpg/500px-%E4%B8%89%E5%AE%9D%E5%B1%B1%28%E9%87%91%E5%89%9B%E5%B1%B1%2920131231.jpg"],"extract":"Mount Kongō  is a 1,125-metre-high (3,691 ft) mountain in the Kongō Range on the border of Nara Prefecture and the Kawachi region of Osaka Prefecture, in Kansai, Japan. The peak itself is in Nara Prefecture. It is near Mount Yamato Katsuragi.","lang":"en"}},{"id":"mqmsjf4q9f1s","name":"Konohana","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"פארק יוניברסל סטודיוס יפן","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmrafr85od0","name":"Grand Front Osaka","type":"place","addr":"","travelTime":null,"time":"15:30","duration":"","note":"הוא קומפלקס ענק, מודרני ומלא חיים הממוקם בצמוד לתחנת הרכבת המרכזית של אוסקה","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Osaka_Umeda_Sky_Building_Panoramablick_05.jpg/330px-Osaka_Umeda_Sky_Building_Panoramablick_05.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Grand_Front_Osaka_and_Grand_Green_Osaka_North_Tower.jpg/500px-Grand_Front_Osaka_and_Grand_Green_Osaka_North_Tower.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Grand_Green_Osaka_North_Tower_20250831.jpg/500px-Grand_Green_Osaka_North_Tower_20250831.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/GRAND_FRONT_OSAKA_QUARTET_TOWER.JPG/500px-GRAND_FRONT_OSAKA_QUARTET_TOWER.JPG"],"extract":"This list of tallest buildings in Osaka ranks buildings in Osaka, Japan by height. As of March 2024, Osaka has 5 skyscrapers above 200 meters and 48 skyscrapers above 150 meters, of which 45 are listed by the Council of Tall Buildings and Urban Habitat.","lang":"en"}},{"id":"mqmrbq5v54hf","name":"HEP FIVE Ferris Wheel","type":"place","addr":"","travelTime":null,"time":"18:00","duration":"","note":"גלגל ענק","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HEP_in_201409.JPG/330px-HEP_in_201409.JPG","https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/The_Billboard_1908-06-06-_Vol_20_Iss_23_%28IA_sim_billboard_1908-06-06_20_23%29.pdf/page1-500px-The_Billboard_1908-06-06-_Vol_20_Iss_23_%28IA_sim_billboard_1908-06-06_20_23%29.pdf.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/The_Billboard_1922-07-22-_Vol_34_Iss_29_%28IA_sim_billboard_1922-07-22_34_29%29.pdf/page1-500px-The_Billboard_1922-07-22-_Vol_34_Iss_29_%28IA_sim_billboard_1922-07-22_34_29%29.pdf.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/HEP_Five_Ferris_wheel%2C_October_2005.jpg/500px-HEP_Five_Ferris_wheel%2C_October_2005.jpg"],"extract":"HEP is a major shopping mall and entertainment center in the Umeda commercial district of Kita-ku, Osaka, Japan. It is a shopping mall consisting of a HEP Five and HEP Navio.","lang":"en"}},{"id":"mqmrcvsrw3sd","name":"Umeda Sky Building","type":"place","addr":"","travelTime":null,"time":"19:30","duration":"","note":"גורדי שחקים מחוברים עם אזור תצפית בגן שעל הגג, וגם מסעדה וטרקלין עם נוף לעיר.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqts7z3v32a3","name":"Shinsaibashi-Suji Shopping Street","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"רחוב לקניות ובילוי בערב","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmrdruzmo53","date":"2026-07-25","title":"","hotel":"Regale Namba Annex","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmred70buev","name":"Osaka Tenmangu Shrine","type":"place","addr":"","travelTime":null,"time":"10:00","duration":"","note":"הגעה לאזור הפסטיבל","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtssunn5mv9","name":"זה המקום הכי טוב לצפות בפסטיבל  KEMA -ציוד מומלץ: הביאו איתכם יריעת פלסטיק/מחצלת קטנה כדי לתפוס שטח ישיבה, מגבת קטנה לזיעה מאוורר","type":"place","addr":"זה המקום הכי טוב לצפות בפסטיבל","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtsh6ejymmo","name":"Kema Sakuranomiya Park","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"שעת הגעה קריטית: התחרות על מקום בגדות הנהר היא פראית. חובה להגיע לפארק עד השעה 16:00 לכל המאוחר. - רצועת פארק ארוכה לאורך הנהר שמציעה נקודות תצפית מעולות על הסירות, והיא קרובה מאוד לאזורי שיגור הזיקוקים.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtslfu36qgw","name":"Tenmabashi Park","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"50% מיקום טוב לסירות פחות רואים את הזיקוקים","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmrfc0zkd8n","date":"2026-07-26","title":"","hotel":"Regale Namba Annex","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmrg70rq30h","name":"Minoh Falls","type":"place","addr":"","travelTime":null,"time":"09:00","duration":"","note":"הליכה ביער ומפלים","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmrhmq4svby","name":"Namba Parks","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"מקום מדהים גם בלילה","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmse2ayz6wn","name":"Kuromon Ichiba Market","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"שוק מקורה ענק המכונה \\"המטבח של אוסקה\\". זהו המקום המושלם לטעום מאכלי ים טריים, בשר וואגיו, שיפודי תמנון ועוד המון מטעמים מקומיים","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmsfc8a8gy3","name":"Shinsaibashi","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"הרחובות המרכזיים לחובבי הקניות והאופנה, שם תמצאו הכל החל מחנויות יוקרה ועד למותגי רחוב יפניים","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmriu971hzy","name":"Nipponbashi Denden Town","type":"place","addr":"","travelTime":null,"time":"16:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmrk1ob5ue5","name":"America-mura","type":"place","addr":"","travelTime":null,"time":"18:30","duration":"","note":"רובע אמריקה-מוּרה הוא מרכז תוסס של תרבות נוער בעלת אופי מערבי, מעין כפר קומפקטי המקיף את אזור הבילוי הפופולרי של פארק סנקאקוקואן המשולש. אפשר למצוא כאן אומנות רחוב ואוכל רחוב לצד גלריות אינדי לאומנות ובתי קפה והתוצאה היא אווירה נינוחה ויצירתית. בחנויות הרטרו אפשר למצוא בגדי וינטג', ספרים ותקליטים ואילו חיי הלילה מרוכזים ברוק-ברים תוססים ומועדונים המשמיעים מוזיקת היפ-הופ בסגנון אמריקאי.","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmrkmrfk094","date":"2026-07-27","title":"","hotel":"Regale Namba Annex","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqtt37i37jru","name":"Namba","type":"train","addr":"","travelTime":null,"time":"09:00","duration":"","note":"ללכת לתחנת Namba.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtt3tl6fozp","name":"לקחת את קו Midosuji Line ל־Umeda (כ־10 דקות).","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtt45oqjvs1","name":"לעבור לתחנת Osaka-Umeda של Hankyu.","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtt4kozfqey","name":"לעלות על רכבת Limited Express ל־Kyoto-Kawaramachi","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqtt4y1e7rf0","name":"לרדת ב־Kyoto-Kawaramachi, ומשם 3–5 דקות הליכה למלון. זו גם התחנה הקרובה ביותר למלון שלכם","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmua9c9kame","date":"2026-07-30","title":"","hotel":"Travelodge Kyoto Shijo-Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmub5pd2jvp","name":"Hozugawa River - רפטינג","type":"place","addr":"","travelTime":null,"time":"07:30","duration":"","note":"יציאה מוקדמת לרפטינג","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuc6v4blga","name":"אראשיאמה - יער הבמבוק","type":"place","addr":"","travelTime":null,"time":"12:00","duration":"","note":"מקום מרהיב עם מגוון קופים, יער במבוק ונוף לנהר","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmug3nkhrx0","name":"Arashiyama Monkey Park Iwatayama-פסגת הר עם קופים","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"פסגת הר ארשיאמה לצפייה בקופי מקוק ולתצפית על נופיה המרהיבים של העיר","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuii7ky0k9","name":"Fushimi Inari Taisha-שערים אדומים","type":"place","addr":"","travelTime":null,"time":"17:30","duration":"","note":"מקדש שינטו משנת 711 לספירה השוכן על צלע הר, ובו שביל עם מאות שערים מסורתיים","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuj5yg98ua","name":"Gion","type":"place","addr":"","travelTime":null,"time":"20:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmuk7h44iqr","date":"2026-07-27","title":"","hotel":"Travelodge Kyoto Shijo-Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmul4wgggrg","name":"Nishiki Market","type":"place","addr":"","travelTime":null,"time":"12:00","duration":"","note":"דוכנים רבים עם אוכל יפני מכל סוג ומין, בשוק מפורסם בן 400 שנה","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmum74pek3i","name":"Kawaramachi - רחוב מרכזי","type":"place","addr":"","travelTime":null,"time":"16:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuncewffdq","name":"Pontocho - אזור הנהר בתים עתקים","type":"place","addr":"","travelTime":null,"time":"18:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuo7fk3my6","name":"Pontocho Park","type":"place","addr":"","travelTime":null,"time":"18:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmupzmwi3jv","date":"2026-07-28","title":"","hotel":"Travelodge Kyoto Shijo-Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmusmw8lobh","name":"Kurama Station","type":"train","addr":"","travelTime":null,"time":"","duration":"","note":"Kurama Kaido","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuvaplqwcv","name":"Kuramadera Temple","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"הליכה ביער","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmuwoi8a1sw","name":"Kawadoko מסעדה על המפל","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmv0jx45yhp","date":"2026-07-29","title":"","hotel":"Travelodge Kyoto Shijo-Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmv174gshwi","name":"Nara Park","type":"train","addr":"","travelTime":null,"time":"08:00","duration":"","note":"פארק הצבאים","transitNum":"","gate":"","depTime":"08:00","arrTime":""},{"id":"mqmv2isou1ra","name":"Kasuga Taisha","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"מקדש שינטו שהוקם במקור בשנת 768 לספירה, עם גג הנתמך באמצעות עמודים בגוון אדום כהה.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmv5vigy05g","name":"המקדש המוזהב","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"מקדש היסטורי שליו עם חזית מצופה זהב, הממוקם בין גנים מטופחים ובריכת השתקפות.","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmv79kg938r","date":"2026-07-31","title":"","hotel":"Travelodge Kyoto Shijo-Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmv7pt4lfc1","name":"Sakamoto Hieizan","type":"train","addr":"","travelTime":null,"time":"08:00","duration":"","note":"רכבל ותצפית","transitNum":"","gate":"","depTime":"08:00","arrTime":""},{"id":"mqmv8wkos0gl","name":"Sakamoto Cableway","type":"place","addr":"","travelTime":null,"time":"09:30","duration":"","note":"עלייה ברכבל הארוך ביותר ביפן. הנסיעה עצמה חווייתית מאוד ומציעה נופים פנורמיים נפתחים של אגם ביווה הכחול מבעד לחלונות","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvsxzjup7e","name":"מקדש אנריאקו-ג'י (Enryaku-ji)","type":"place","addr":"","travelTime":null,"time":"10:30","duration":"","note":"קומפלקס מקדשים רוחני ועצום החבוי בתוך יער עבות של עצי ארז ענקיים. מכיוון שהאתר נמצא גבוה על ההר, הטמפרטורות כאן נוחות וקרירות יותר מאשר בעיר. הליכה רגועה בין המבנים העתיקים והחצרות השלוות של האזור המרכזי","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvubc7ix2l","name":"Sakamoto","type":"place","addr":"","travelTime":null,"time":"12:30","duration":"","note":"ירידה חזרה ברכבל לעיירה הציורית סאקמוטו, המפורסמת בתעלות המים הניגרות ברחובותיה ובחומות האבן הייחודיות שלה","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvuxnj9m0l","name":"מקדש אוקימידו (Ukimidu - Mangetsu-ji)","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"נסיעה קצרה ברכבת/מונית לחלק הצר של האגם כדי לבקר במקדש קטן, ציורי ומקסים הבנוי על כלונסאות ממש בתוך המים של אגם ביווה. מקום מושלם לצילומים ולאתנחתא מול המים הזורמים והרוח.","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqmveisv5q09","date":"2026-08-01","title":"","hotel":"Travelodge Kyoto Shijo Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqmvew1konwm","name":"Kiyomizu-dera - תצפית","type":"place","addr":"","travelTime":null,"time":"09:00","duration":"","note":"מקדש בודהיסטי ידוע על הר אוטובה, המפורסם בזכות הנופים שנשקפים מהמרפסת הגדולה שלו.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvgkj3s6mp","name":"Sannenzaka - מדרחוב","type":"place","addr":"","travelTime":null,"time":"11:31","duration":"","note":"מדרחוב שוקק השוכן על גבעה, ולאורכו דוכני מזכרות ואדריכלות יפנית מסורתית.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvh3lj5g0m","name":"Ninenzaka","type":"place","addr":"","travelTime":null,"time":"11:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvi83z6t8a","name":"Teramachi Shopping Arcade","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmviu9k6vob","name":"Kawaramachi  -קניות","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqmvjhf3dw7n","name":"Pontocho / Gion","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpmjukrjjr3","date":"2026-08-02","title":"","hotel":"Travelodge Kyoto Shijo-Kawaramachi","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqpo7zs2htyi","name":"kyoto station -איסוף רכב","type":"drive","addr":"","travelTime":null,"time":"08:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmmhezw3mi","name":"קנאזאווה - כיוון אלפים","type":"place","addr":"","travelTime":null,"time":"08:30","duration":"","note":"יציאה לשם","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmn8orvnsb","name":"גן קנרוקואן + מצודת קנאזאווה","type":"place","addr":"","travelTime":null,"time":"11:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmng7f1y99","name":"שוק אומיצ'ו","type":"place","addr":"","travelTime":null,"time":"13:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmnzc34oes","name":"שיראקאוואגו","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmqwiry04a","name":"Gassho-zukuri","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"בתי Gassho-zukuri – בתי קש עם גגות תלולים בזווית 60°, בנויים לעמוד בשלג כבד של החורף. חלקם בני 250+ שנה ועדיין מאוכלסים. אפשר להיכנס לכמה מהם כמוזיאון חי ולראות את המבנה הפנימי.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmrzkjtrh3","name":"Shiroyama","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"מגדל תצפית Shiroyama – עולים ברגל ~10 דקות (או שאטל ב-200¥) לנקודת תצפית שמסתכלת על כל הכפר מלמעלה – הנוף הקלאסי של הגגות התלולים עם ההרים ברקע, זה הצילום האייקוני של המקום","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmsuhv457n","name":"Chisun Grand Takayama - מלון","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpmtehnvrs2","date":"2026-08-03","title":"","hotel":"Chisun Grand Takayama","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqpmu09v9oxq","name":"שוק בוקר Jinya-mae","type":"place","addr":"","travelTime":null,"time":"08:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmuewzbn07","name":"Takayama Jinya – מטה ממשל אדו משומר","type":"place","addr":"","travelTime":null,"time":"09:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmv24355t1","name":"סאנמאצ'י סוג'י – רחוב אדו, יקבי סאקה, בתי עץ","type":"place","addr":"","travelTime":null,"time":"10:00","duration":"","note":"ממש קרוב למלון","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmvv6rqh3l","name":"Hida Beef / Mitarashi Dango","type":"place","addr":"","travelTime":null,"time":"12:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmw9x7zyem","name":"Hida Folk Village – כפר פתוח עם בתי Gassho","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpmwv6zndas","name":"Higashiyama Hiking Course – נוף ערב על העיר","type":"place","addr":"","travelTime":null,"time":"17:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpmxi1vxhcb","date":"2026-08-04","title":"","hotel":"Chisun Grand Takayama","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqpn1yffie79","name":"אוקוהידה אונסן","type":"place","addr":"","travelTime":null,"time":"08:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpn1irn5sq6","name":"Shinhotaka Ropeway - רכבל","type":"place","addr":"","travelTime":null,"time":"12:00","duration":"","note":"Shinhotaka Ropeway – כבל דו-קומתי עד 2,156 מ'\\nפתוח 08:30–16:00 · ~3,000¥ · פנורמה 360° על הרי Hotaka","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpn2w6rjst5","name":"טיולי שבילים בפסגה + תצפיות","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpn3xfnqbkf","date":"2026-08-05","title":"","hotel":"Chisun Grand Takayama","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqpn81lnfrpi","name":"Sawando - חניון","type":"place","addr":"","travelTime":null,"time":"07:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpn93l7ahjm","name":"שמורת Kamikochi","type":"place","addr":"","travelTime":null,"time":"08:30","duration":"","note":"נוסעים עם אוטובוס לשמורה","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpng8cyms36","name":"בריכת טאישו (Taisho Pond / Taisho-ike) - מסלול 3 שעות","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"בריכת טאישו (Taisho Pond / Taisho-ike): זוהי הנקודה הראשונה במסלול. זהו אגם מרהיב שנוצר בשנת 1915 כאשר הר הגעש יאקֶדאקֶה התפרץ וחסם את נהר אזוסה. המאפיין הייחודי ביותר של הבריכה הם גזעי העצים המתים והשקועים שנותרו במים, היוצרים השתקפות מדהימה של הרי הוטקה (Hotaka) שברקע.בריכת מיוג'ין (Myojin Pond / Myojin-ike): אגם קטן וציורי הנמצא עמוק יותר בתוך השמורה. הבריכה מורכבת משני חלקים (בריכה אחת ושנייה) ומתאפיינת במים צלולים מאוד, צמחייה עשירה ואווירה שלווה ומיסטית. במקום שוכן גם מקדש מיוג'ין (Hotaka Shrine).מידע על המסלול הכולל:כדי לעבור מבריכת טאישו דרך גשר קאפה (נקודת האמצע) ועד לבריכת מיוג'ין, מדובר בהליכה מישורית ונוחה האורכת לרוב בין שעתיים לשלוש שעות לכל כיוון. שבילי ההליכה עוברים ברובם לאורך נהר אזוסה (Azusa River), דרך יערות עבותים ומספקים תצפיות נוף מדהימות של האלפים היפניים.","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpngw6qe6t1","name":"בריכת מיוג'ין (Myojin Pond / Myojin-ike)-המשך המסלול","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnke62ile4","name":"שמורת Kamikochi ארוחת צהרים","type":"place","addr":"","travelTime":null,"time":"13:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnl96qob0q","name":"Sawando - חזרה לחניון","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnlxqi8kxf","name":"מצודת מצומוטו - פתוח עד 16:30","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpnnekrw0pp","date":"2026-08-06","title":"","hotel":"Hotel Morschein - יציאה מוקדמת","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqpnp2uq1tjj","name":"Norikura Kogen","type":"place","addr":"","travelTime":null,"time":"09:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnqdd60l43","name":"Tatamidaira - אוטובוס לשמורה","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnspjud5tr","name":"מצודת מצומוטו - לפני 16:30","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpntgr65g14","name":"Nawate-dori + Nakamachi - רחובות בערב","type":"place","addr":"","travelTime":null,"time":"17:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpnupaadceu","date":"2026-08-07","title":"","hotel":"Hotel Morschein - יציאה מוקדמת חובה","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqpnw6x6u4y5","name":"Tsumago-juku","type":"place","addr":"","travelTime":null,"time":"09:00","duration":"","note":"עיירת תחנה אדו משומרת","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnypb6yody","name":"נסיעה של שעה וחצי בין כל נקודה","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnxasybaza","name":"מצודת אינויאמה","type":"place","addr":"","travelTime":null,"time":"12:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpnzduii3u1","name":"Inuyama-jokamachi – רחוב אדו + Dengaku מיסו","type":"place","addr":"","travelTime":null,"time":"13:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqpo0evunl5v","name":"Toyota Rent a Car – Namba Terminal - עד 17:30","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqpo41tuwv79","date":"2026-08-08","title":"","hotel":"אוסקה - בנגקוק","hotelAddr":"","departTime":"","note":"","startType":"flight","startTransitNum":"VZ821","startGate":"","startDepTime":"08:55","startArrTime":"12:55","stops":[{"id":"mqr4wdwpehd8","name":"Asia Hotel Bangkok","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr2tcwj4s3k","date":"2026-07-10","title":"","hotel":"תל אביב - דובאי - בנגקוק","hotelAddr":"","departTime":"","note":"מגיעים ב 11/7","startType":"flight","startTransitNum":"FZ1082","startGate":"","startDepTime":"15:50","startArrTime":"11:25","stops":[]},{"id":"mqr2vs83gnze","date":"2026-07-11","title":"","hotel":"Asia Hotel Bangkok","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr2w9yzy452","name":"קניון MDK","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr3190ztvz0","date":"2026-07-12","title":"","hotel":"בנגקוק - טיוואן","hotelAddr":"","departTime":"","note":"","startType":"flight","startTransitNum":"VZ568","startGate":"","startDepTime":"09:10","startArrTime":"13:55","stops":[{"id":"mqr31xm34t07","name":"Global Realm Boutique Hotel","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr32qp7amga","name":"Elephant Mountain (象山) — עלייה 20 דקות, נוף מדהים לטאיפיי","type":"place","addr":"","travelTime":null,"time":"16:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr33fi3gkid","name":"שקיעה מול Taipei 101 מנקודת התצפית","type":"place","addr":"","travelTime":null,"time":"18:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr3417vag7j","date":"2026-07-13","title":"","hotel":"Global Realm Boutique Hotel","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr34w5vgvk5","name":"Dihua Street","type":"place","addr":"","travelTime":null,"time":"08:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Buildings_along_Dihua_Street_07.23_%286%29.jpg/330px-Buildings_along_Dihua_Street_07.23_%286%29.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/2010-02-13_candy_vendor_at_Dihua_Street%2C_Taipei.jpg/500px-2010-02-13_candy_vendor_at_Dihua_Street%2C_Taipei.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Buildings_along_Dihua_Street_07.23_%283%29.jpg/500px-Buildings_along_Dihua_Street_07.23_%283%29.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Dihua_Street_MiNe-5DII_103-2679UG_%288410554064%29.jpg/500px-Dihua_Street_MiNe-5DII_103-2679UG_%288410554064%29.jpg"],"extract":"Dihua Street is a street located in Dadaocheng, Datong District, Taipei, Taiwan, winding from the south of the district to the north near Dalongdong. The street, then known as Centre Street (中街), was constructed during the 1850s, when many commercial entities belonging to Quanzhou-originating owners moved in from Bangka. Since then and throughout the rest of the 19th century, Dihua Street has been an important centre for commerce in Taiwanese products and produce such as Chinese medicinal herbs, fabrics, incense materials, and for the post-processing of Taiwanese tea.","lang":"en"}},{"id":"mqr36hsquxrv","name":"Yangmingshan","type":"place","addr":"","travelTime":null,"time":"10:30","duration":"","note":"יעד עם נוף ציורי הכולל מעיינות חמים ושבילי הליכה והר געש רדום הגדול במדינה.","transitNum":"","gate":"","depTime":"","arrTime":"","info":{"fetched":true,"images":["https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Mount_Qixing_under_clear_sky_on_13th_February_2016.jpg/330px-Mount_Qixing_under_clear_sky_on_13th_February_2016.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Hiking_Yangmingshan_43.jpg/500px-Hiking_Yangmingshan_43.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Hiking_Yangmingshan_36.jpg/500px-Hiking_Yangmingshan_36.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Hiking_Yangmingshan_28.jpg/500px-Hiking_Yangmingshan_28.jpg"],"extract":"Yangmingshan National Park, located in both Taipei and New Taipei City, is one of the nine national parks in Taiwan. The districts that are partially in the park include Taipei's Beitou and Shilin Districts; and New Taipei's Wanli, Jinshan, Sanzhi and Tamsui Districts. The national park is known for its cherry blossoms, hot springs, sulfur deposits, fumaroles, venomous snakes, and hiking trails, including Taiwan's tallest dormant volcano, Qixing Mountain rising to 1,120 m (3,675 ft). In June 2020, Yangmingshan National Park was certified as the world's first Urban Quiet Park Quiet Parks International in recognition of World Environment Day.","lang":"en"}},{"id":"mqr3bc42cz2t","name":"Qingtiangang - מסלולי הליכה","type":"place","addr":"","travelTime":null,"time":"12:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3ckmrtkoq","name":"Ximending - קניות,אוכל","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3dbpe3314","name":"Shilin — שוק הלילה הגדול בטאיפיי","type":"place","addr":"","travelTime":null,"time":"19:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr3f6fu4qso","date":"2026-07-14","title":"","hotel":"איסוף רכב","hotelAddr":"台北市大同區承德路三段276號 No. 276, Section 3, Chengde Road, Bao'an Village, Datong District, Taipei City, Taiwan 103","departTime":"08:00","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr3fqtejtgg","name":"Global Realm Boutique Hotel","type":"place","addr":"","travelTime":null,"time":"07:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3h7tuq6el","name":"Golden Waterfall (黃金瀑布) - מפלים","type":"place","addr":"","travelTime":null,"time":"09:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3i1yqo2m2","name":"Yin Yang Sea  - נקודת תצפית","type":"place","addr":"","travelTime":null,"time":"10:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3ir16wg0d","name":"Global Realm Boutique Hotel (Jiufen)","type":"place","addr":"","travelTime":null,"time":"15:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3jbsaywfx","name":"Jiufen Old Street","type":"place","addr":"","travelTime":null,"time":"17:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr3kbv7mwab","date":"2026-07-15","title":"","hotel":"Global Realm Boutique Hotel (Jiufen)","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr3lo7uqeb9","name":"Qingshui Cliffs - נקודת תצפית","type":"place","addr":"","travelTime":null,"time":"10:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3mg0qzz8j","name":"Harmony Easy Stay - מלון","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3n28y700b","name":"Dongdamen  - שוק לילה","type":"place","addr":"","travelTime":null,"time":"18:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr3nzwjeeso","date":"2026-07-16","title":"","hotel":"Harmony Easy Stay","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr3oq766yx8","name":"פארק טרוקו","type":"place","addr":"","travelTime":null,"time":"08:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3pc1mycti","name":"Eternal Spring Shrine + Shakadang Trail","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"לבדוק איזה שביל פתוח","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3q9q2adku","name":"Shitiping - שדה בזלת על הים","type":"place","addr":"","travelTime":null,"time":"13:00","duration":"","note":"עצירת התרעננות","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3sfrutfn1","name":"Traveller-Inn Tiehua - מלון","type":"place","addr":"","travelTime":null,"time":"18:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3rnoykw4h","name":"ז'יבן  - מעינות חמים","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"להגיע בזמן שלא יסגרו","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqsjavpf1429","name":"Zhiben Hot Spring","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"מקום שאפשר להכנס למעינות בתשלום יומי יש גם נהר למטה","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqsjicaj1iyu","name":"Rainbow Resort 台東知本泓泉溫泉渡假村","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqsjc2gzvecy","name":"Dong Tair Spa Hotel","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"מקום להכנס למעינות חמים בתשלום יומי","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqsjn0te1de0","name":"Tiehua Music Village","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"מקום מאד נחמד בערב","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr3t34jgu7w","date":"2026-07-17","title":"","hotel":"Traveller-Inn Tiehua","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr3u6iis912","name":"Chishang","type":"place","addr":"","travelTime":null,"time":"07:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3uejmvd8w","name":"Mr. Brown Avenue (伯朗大道) - שדות אורז","type":"place","addr":"","travelTime":null,"time":"08:30","duration":"","note":"נופים מדהימים","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3ywaiwvn0","name":"קנטינג","type":"drive","addr":"","travelTime":null,"time":"11:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr41auyeawk","name":"Lang Qin Hai Inn - מלון","type":"place","addr":"","travelTime":null,"time":"13:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr3zk0aahi3","name":"שחיה בחוף הים","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4093668gl","name":"קנטינג - שוק לילה","type":"place","addr":"","travelTime":null,"time":"19:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr435he6mbl","date":"2026-07-18","title":"","hotel":"Lang Qin Hai Inn","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr43taqtg1v","name":"Eluanbi Lighthouse (鵝鑾鼻) - מגדלור","type":"place","addr":"","travelTime":null,"time":"08:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr448qqnuf4","name":"Longpan Park — קרחון דשא ירוק ישר מעל צוקים לים","type":"place","addr":"","travelTime":null,"time":"09:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr44vjet2lh","name":"LIHO Hotel Tainan","type":"place","addr":"","travelTime":null,"time":"13:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr45b42r2xe","name":"Fort Zeelandia — מצודה הולנדית מ-1624","type":"place","addr":"","travelTime":null,"time":"14:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr45rbmtr65","name":"Chihkan Tower","type":"place","addr":"","travelTime":null,"time":"16:00","duration":"","note":"מבצר צבאי לשעבר בעל היסטוריה מרשימה שנבנה במאה ה-17 על ידי מתיישבים הולנדיים","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr478iqimzo","name":"Shennong Street - רחוב העתיקות","type":"place","addr":"","travelTime":null,"time":"19:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr487yyoy5b","date":"2026-07-19","title":"","hotel":"LIHO Hotel Tainan","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr49l0h27dh","name":"אגם השמש העולה","type":"drive","addr":"555, טייוואן, Nantou County, Yuchi Township, 南投日月潭國家風景區","travelTime":null,"time":"11:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4cezml87h","name":"Sun Moon Lake Island Heart - מלון","type":"place","addr":"","travelTime":null,"time":"12:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4a0lu47ou","name":"Wen Wu Temple — מקדש ענק על שפת האגם","type":"place","addr":"","travelTime":null,"time":"12:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4ais9e6jk","name":"שיט לכפר Ita Thao — כפר ילידי, שוק קטן","type":"place","addr":"","travelTime":null,"time":"15:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4bgdmr8r9","name":"רכיבה על אופנים מסביב לאגם","type":"place","addr":"","travelTime":null,"time":"17:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4b14hvaf8","name":"שקיעה על האגם","type":"place","addr":"","travelTime":null,"time":"18:30","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr4dmzl5bht","date":"2026-07-20","title":"","hotel":"Sun Moon Lake Island Heart","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr4eeft0f99","name":"Chance Hotel","type":"drive","addr":"","travelTime":null,"time":"10:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4eu01182b","name":"Rainbow Village — כפר ציורי מוזר ומקסים, כניסה חינם","type":"place","addr":"","travelTime":null,"time":"14:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4fhw95mry","name":"Gaomei Wetlands — שקיעה בשטחי הביצה עם טורבינות רוח","type":"place","addr":"","travelTime":null,"time":"18:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr4gb35cx8n","date":"2026-07-21","title":"","hotel":"Chance Hotel","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr4hcoxmocd","name":"החזרת הרכב","type":"place","addr":"台北市大同區承德路三段276號 No. 276, Section 3, Chengde Road, Bao'an Village, Datong District, Taipei City, Taiwan 103","travelTime":null,"time":"11:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4hrq91j2b","name":"Global Realm Boutique Hotel","type":"place","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""},{"id":"mqr4i98x4dvz","name":"Ningxia Night Market","type":"place","addr":"","travelTime":null,"time":"19:00","duration":"","note":"","transitNum":"","gate":"","depTime":"","arrTime":""}]},{"id":"mqr4wu21aoer","date":"2026-08-09","title":"","hotel":"Asia Hotel Bangkok","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[]},{"id":"mqr4x9g9259h","date":"2026-08-10","title":"","hotel":"Asia Hotel Bangkok","hotelAddr":"","departTime":"","note":"","startType":"hotel","startTransitNum":"","startGate":"","startDepTime":"","startArrTime":"","stops":[{"id":"mqr4z1b5asfv","name":"בנגקוק - דובאי - ישראל","type":"flight","addr":"","travelTime":null,"time":"","duration":"","note":"","transitNum":"FZ1334","gate":"","depTime":"23:50","arrTime":"08:45"}]}]}],"activeTripId":"mqmf094nh3yg"}`;
                   const parsed = JSON.parse(backup);
                   localStorage.setItem("masaa_trips", JSON.stringify(parsed.trips));
                   localStorage.setItem("masaa_activeTripId", parsed.activeTripId);
                 } catch(e) { console.error("Failed to restore data:", e); }
                 window.open("https://yuvalnet2000-hash.github.io/Trip-Planer-2026/masaa-trip-guide.html","_blank");
               }}
               style={{
                 display:"inline-block",padding:"14px 36px",borderRadius:14,
                 background:"linear-gradient(135deg,#10b981,#059669)",
                 color:"#fff",fontWeight:800,fontSize:16,cursor:"pointer",border:"none",
                 boxShadow:"0 4px 20px rgba(16,185,129,0.4)",
               }}>
              פתח מסע 🚀
            </button>
            <div style={{marginTop:20,color:"#64748b",fontSize:12}}>יפתח בלשונית חדשה · נתוני הטיול ישוחזרו אוטומטית</div>
          </div>
        ) : (
          <>
        <input value={search} onChange={e=>{setSearch(e.target.value);setActiveDay(null);}}
          placeholder="🔍 חיפוש מקום, עיר, אטרקציה..."
          style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"2px solid #334155",background:"#1e293b",color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box",direction:"rtl",marginBottom:14}}
        />
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:18}}>
          <button onClick={()=>{setActiveRegion(null);setActiveDay(null);setSearch("");}} style={{padding:"6px 13px",borderRadius:20,border:`2px solid ${activeRegion===null?"#6366f1":"#334155"}`,background:activeRegion===null?"#6366f1":"transparent",color:activeRegion===null?"#fff":"#94a3b8",fontSize:12,fontWeight:700,cursor:"pointer"}}>כל הטיול</button>
          {regionGroups.map((g,i)=>(
            <button key={i} onClick={()=>{setActiveRegion(i===activeRegion?null:i);setActiveDay(null);setSearch("");}} style={{padding:"6px 13px",borderRadius:20,border:`2px solid ${activeRegion===i?g.color:"#334155"}`,background:activeRegion===i?g.color:"transparent",color:activeRegion===i?"#fff":"#94a3b8",fontSize:12,fontWeight:700,cursor:"pointer"}}>{g.label}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11,marginBottom:20}}>
          {[{val:"31",label:"ימי טיול",icon:"📅",color:"#6366f1"},{val:totalStops,label:"אטרקציות",icon:"📍",color:"#14b8a6"},{val:"4",label:"מדינות",icon:"🌏",color:"#f59e0b"}].map((s,i)=>(
            <div key={i} style={{background:"#1e293b",border:`2px solid ${s.color}30`,borderRadius:12,padding:12,textAlign:"center"}}>
              <div style={{fontSize:20}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>
        {filteredDays.length===0
          ? <div style={{textAlign:"center",color:"#64748b",padding:40,direction:"rtl"}}>לא נמצאו תוצאות עבור "{search}"</div>
          : filteredDays.map(day=>(
            <DayCard key={day.date} day={day} isActive={activeDay===day.date}
              onClick={()=>setActiveDay(activeDay===day.date?null:day.date)}/>
          ))
        }
        </>)}
      </div>
    </div>
  );
}
