const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=` + encodeURIComponent("The students welcome the first lecture of the course Sol energy engineering and technology. So, today we will be discussing about energy scenario.");
fetch(url).then(r=>r.json()).then(d=>console.log(JSON.stringify(d[0], null, 2)));
