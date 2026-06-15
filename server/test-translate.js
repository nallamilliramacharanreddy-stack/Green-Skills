const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=Hello+world`;
fetch(url).then(r=>r.json()).then(d=>console.log(d[0][0][0]));
