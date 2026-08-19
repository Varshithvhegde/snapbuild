/** Click-to-select elements in the live preview and reference them in chat. */

export interface PreviewElementSelection {
  id: string;
  tag: string;
  selector: string;
  classes: string[];
  text?: string;
  idAttr?: string;
  href?: string;
  src?: string;
}

export const PICKER_MESSAGE = {
  ready: "snapbuild:picker-ready",
  setEnabled: "snapbuild:picker-set-enabled",
  selected: "snapbuild:element-selected",
} as const;

/** Inline script injected into preview HTML (preview-only, never saved to project files). */
export const PREVIEW_PICKER_SCRIPT = `(function(){
if(window.__snapbuildPicker)return;
window.__snapbuildPicker=true;
var enabled=false,hoverEl=null,selectedEl=null,SID="snapbuild-picker-style";
function esc(v){return window.CSS&&CSS.escape?CSS.escape(v):String(v).replace(/[^a-zA-Z0-9_-]/g,"\\\\$&");}
function ensureStyle(){
if(document.getElementById(SID))return;
var s=document.createElement("style");s.id=SID;
s.textContent=".snapbuild-picker-hover{outline:2px solid #6366f1!important;outline-offset:2px!important;cursor:crosshair!important}.snapbuild-picker-selected{outline:2px solid #8b5cf6!important;outline-offset:2px!important}";
(document.head||document.documentElement).appendChild(s);
}
function selector(el){
if(!el||el===document.body)return"body";
if(el.id)return"#"+esc(el.id);
var parts=[],cur=el;
while(cur&&cur!==document.body&&parts.length<5){
var part=cur.tagName.toLowerCase();
if(cur.id){parts.unshift("#"+esc(cur.id));break;}
var cls=Array.from(cur.classList||[]).filter(function(c){return c.indexOf("snapbuild-")!==0;}).slice(0,2);
if(cls.length)part+="."+cls.map(esc).join(".");
var par=cur.parentElement;
if(par){
var sibs=Array.from(par.children).filter(function(c){return c.tagName===cur.tagName;});
if(sibs.length>1)part+=":nth-of-type("+(sibs.indexOf(cur)+1)+")";
}
parts.unshift(part);cur=par;
}
return parts.join(" > ");
}
function snippet(el){
var t=(el.innerText||el.textContent||"").trim().replace(/\\s+/g," ");
return t.length>120?t.slice(0,120)+"…":t;
}
function payload(el){
return{
tag:el.tagName.toLowerCase(),
id:el.id||undefined,
classes:Array.from(el.classList||[]).filter(function(c){return c.indexOf("snapbuild-")!==0;}),
selector:selector(el),
text:snippet(el),
href:el.tagName==="A"?el.getAttribute("href"):undefined,
src:el.tagName==="IMG"?el.getAttribute("src"):undefined
};
}
function setHover(el){
if(hoverEl&&hoverEl!==el)hoverEl.classList.remove("snapbuild-picker-hover");
hoverEl=el;
if(el&&enabled)el.classList.add("snapbuild-picker-hover");
}
document.addEventListener("mouseover",function(e){
if(!enabled)return;
var t=e.target;
if(!(t instanceof Element))return;
setHover(t);
},true);
document.addEventListener("mouseout",function(){
if(hoverEl){hoverEl.classList.remove("snapbuild-picker-hover");hoverEl=null;}
},true);
document.addEventListener("click",function(e){
if(!enabled)return;
e.preventDefault();e.stopPropagation();
var t=e.target;
if(!(t instanceof Element))return;
if(selectedEl)selectedEl.classList.remove("snapbuild-picker-selected");
selectedEl=t;t.classList.add("snapbuild-picker-selected");
window.parent.postMessage({type:"${PICKER_MESSAGE.selected}",payload:payload(t)},"*");
},true);
window.addEventListener("message",function(e){
if(e.data&&e.data.type==="${PICKER_MESSAGE.setEnabled}")enabled=!!e.data.enabled;
if(!enabled){setHover(null);if(selectedEl){selectedEl.classList.remove("snapbuild-picker-selected");selectedEl=null;}}
});
ensureStyle();
window.parent.postMessage({type:"${PICKER_MESSAGE.ready}"},"*");
})();`;

export function injectPreviewPickerScript(html: string): string {
  if (html.includes("data-snapbuild-picker")) return html;
  const script = `<script data-snapbuild-picker="true">${PREVIEW_PICKER_SCRIPT}</script>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}\n</body>`);
  }
  return `${html}\n${script}`;
}

export function injectPreviewPickerIntoDocument(doc: Document): void {
  if (doc.querySelector("[data-snapbuild-picker]")) return;
  const script = doc.createElement("script");
  script.setAttribute("data-snapbuild-picker", "true");
  script.textContent = PREVIEW_PICKER_SCRIPT;
  (doc.body ?? doc.documentElement).appendChild(script);
}

export function selectionLabel(sel: PreviewElementSelection): string {
  const hint =
    sel.text?.trim() ||
    sel.idAttr ||
    (sel.classes.length > 0 ? `.${sel.classes[0]}` : sel.tag);
  return `${sel.tag}${hint ? `: ${hint.slice(0, 40)}` : ""}`;
}

export function createPreviewElementSelection(
  payload: Omit<PreviewElementSelection, "id"> & { id?: string },
): PreviewElementSelection {
  return {
    id: payload.id ?? `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tag: payload.tag,
    selector: payload.selector,
    classes: payload.classes ?? [],
    text: payload.text,
    idAttr: payload.idAttr,
    href: payload.href,
    src: payload.src,
  };
}

export function formatSelectedElementsForPrompt(
  selections: PreviewElementSelection[],
  userPrompt: string,
): string {
  if (selections.length === 0) return userPrompt;

  const blocks = selections.map((sel, i) => {
    const lines = [
      `${i + 1}. **${selectionLabel(sel)}**`,
      `   - CSS selector: \`${sel.selector}\``,
      `   - Tag: \`${sel.tag}\``,
    ];
    if (sel.classes.length > 0) {
      lines.push(`   - Classes: \`${sel.classes.join(" ")}\``);
    }
    if (sel.text) lines.push(`   - Current text: "${sel.text}"`);
    if (sel.href) lines.push(`   - Link href: ${sel.href}`);
    if (sel.src) lines.push(`   - Image src: ${sel.src}`);
    return lines.join("\n");
  });

  return `[Preview element selection — edit ONLY these element(s) unless the user asks otherwise]

${blocks.join("\n\n")}

User request: ${userPrompt.trim() || "Update the selected element(s)."}`
}

/** Hidden metadata in stored messages — shown as chips in chat UI, expanded for the API. */
export const SELECTED_ELEMENT_MARKER = "[SelectedElement:";

export type StoredElementSelection = Omit<PreviewElementSelection, "id">;

export function serializeSelectedElement(
  el: StoredElementSelection,
): string {
  const payload = {
    tag: el.tag,
    selector: el.selector,
    classes: el.classes,
    text: el.text,
    idAttr: el.idAttr,
    href: el.href,
    src: el.src,
  };
  return `${SELECTED_ELEMENT_MARKER} ${JSON.stringify(payload)}]`;
}

export function parseSelectedElementPart(
  text: string,
): StoredElementSelection | null {
  const match = /^\[SelectedElement:\s*(\{[\s\S]*\})\]$/.exec(text.trim());
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]) as StoredElementSelection;
    if (!parsed.tag || !parsed.selector) return null;
    return {
      tag: parsed.tag,
      selector: parsed.selector,
      classes: parsed.classes ?? [],
      text: parsed.text,
      idAttr: parsed.idAttr,
      href: parsed.href,
      src: parsed.src,
    };
  } catch {
    return null;
  }
}

export function defaultDisplayTextForElements(
  prompt: string,
  elementCount: number,
): string {
  if (prompt.trim()) return prompt.trim();
  if (elementCount === 1) return "Edit selected element";
  return `Edit ${elementCount} selected elements`;
}
