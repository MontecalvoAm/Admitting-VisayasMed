const birthday = "2000-01-19";
const dateObj = new Date(birthday);
console.log("Date Object:", dateObj);
console.log("JSON Stringify:", JSON.stringify(dateObj));
const jsonStr = JSON.stringify(dateObj).replace(/"/g, '');
console.log("Substring(0,10):", jsonStr.substring(0, 10));
console.log("toLocaleDateString(en-CA):", dateObj.toLocaleDateString('en-CA'));
