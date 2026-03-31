const dateObj = new Date(2000, 0, 19); // Jan 19, 2000 Local
console.log("Date Object:", dateObj);
console.log("JSON Stringify:", JSON.stringify(dateObj));
const jsonStr = JSON.stringify(dateObj).replace(/"/g, '');
console.log("Substring(0,10):", jsonStr.substring(0, 10));
console.log("toLocaleDateString(en-CA):", dateObj.toLocaleDateString('en-CA'));
