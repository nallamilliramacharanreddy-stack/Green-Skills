const https = require('https');
const url = "https://rr7---sn-gwpa-itqee.googlevideo.com/videoplayback?expire=1780849834&ei=SkglasWILdfKssUPmKe30QQ&ip=157.50.98.212&id=o-AERYmXdu0aVR2Vt4Q4frmUEm3fam3MdqhtLRFSjq7mhP&itag=18&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&cps=152&met=1780828234%2C&mh=Dk&mm=31%2C29&mn=sn-gwpa-itqee%2Csn-gwpa-h55y&ms=au%2Crdu&mv=m&mvi=7&pl=22&rms=au%2Cau&initcwndbps=762500&bui=ARmQxEXoCDNaF_6ysupjTQDXK_3X_zR1SiRDlAxK4eTuHzlC_WCK8xnbs3_gAyD9wfJri_KeepRDkY10&spc=SQ-umtkxmb4El4NkhrdCaqZnPUkkdPnR7Q84zbC9BshtUIFrk9qn&vprv=1&svpuc=1&mime=video%2Fmp4&rqh=1&cnr=14&ratebypass=yes&dur=2759.854&lmt=1778000378502871&mt=1780827917&fvip=8&fexp=51565115%2C51565682&c=ANDROID_VR&txp=5309224&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Crqh%2Ccnr%2Cratebypass%2Cdur%2Clmt&sig=AHEqNM4wRgIhAKmYByLawwWvtAnasdXaPLLNJNH8lT0yTodWxo9rtNmaAiEA5y7ovyFwDwy1UyO8188SBvkU5L2lNmcF-gCQzYWRJ9Q%3D&lsparams=cps%2Cmet%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Crms%2Cinitcwndbps&lsig=APaTxxMwRgIhANDwomvWHBP_nRdiJwM47ON3gSevleH1iY1tdX2Pn6RxAiEA2jO_tFsQKzWi5rgr3Qq-lZKq8hOvfI8DdCs2hrxxhco%3D";
https.get(url, { rejectUnauthorized: false }, (res) => {
    console.log("STATUS:", res.statusCode);
    console.log("HEADERS:", res.headers);
    process.exit();
}).on('error', (e) => {
    console.log("ERR:", e);
});
