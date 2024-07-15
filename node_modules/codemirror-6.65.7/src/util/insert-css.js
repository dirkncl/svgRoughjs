export function insertCSSStyleSheet(cssStyleSheet) {
  var rules = [];
  for(var key of cssStyleSheet.rules) {
    rules.push(key.cssText)
  }
  var css = rules.join('\n');
  var sty = document.createElement('style')
  sty.textContent = css
  document.head.appendChild(sty)
}

export function insertCSSStyleLink(cssStyleSheet) {
  var rules = [];
  for(var key of cssStyleSheet.rules) {
    rules.push(key.cssText)
  }
  var css = rules.join('\n');
  var blob = new Blob([css], { type: "text/css" }); 
  var link = document.createElement('link')
  link.type = "text/css"
  link.rel = 'stylesheet'
  link.href = URL.createObjectURL(blob); 
  document.head.appendChild(link)
}
