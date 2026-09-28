// Split an exported WordPress page into the parts the legacy page template renders.
export function parseLegacy(html) {
  const headStart = html.indexOf('<head>') + '<head>'.length;
  const headEnd = html.indexOf('</head>');
  const bodyTag = html.slice(headEnd).match(/<body([^>]*)>/);
  const bodyStart = headEnd + bodyTag.index + bodyTag[0].length;
  const bodyEnd = html.lastIndexOf('</body>');
  const bodyAttrs = Object.fromEntries([...bodyTag[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  return { head: html.slice(headStart, headEnd), bodyAttrs, body: html.slice(bodyStart, bodyEnd) };
}

// Remove the first <div> whose opening tag contains `marker` (balanced on nested divs).
export function cutDiv(html, marker) {
  const at = html.indexOf(marker);
  if (at < 0) return { html, found: false };
  const start = html.lastIndexOf('<div', at);
  const re = /<\/?div\b/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '<div' ? 1 : -1;
    if (depth === 0) {
      const end = html.indexOf('>', m.index) + 1;
      return { html: html.slice(0, start) + html.slice(end), found: true };
    }
  }
  throw new Error(`unbalanced <div> after ${marker}`);
}

// Drop <link rel=stylesheet> tags by id.
export const dropStyles = (head, ids) =>
  ids.reduce((h, id) => h.replace(new RegExp(`<link rel='stylesheet' id='${id}'[^>]*/>\n?`), ''), head);
