/**
 * 设置页样式：桃汐的奶油底和粉色点缀，对话区做成一张铺满主栏的卡片。
 *
 * 变量名仍是 `--dsw-*`。对话面板的样式只认这些名字，改值就能一起换色，不必改面板选择器。
 * 不内联样式、不引 CDN：页面 CSP 是 default-src 'none'。
 * @module taoxi-pet/src/standalone/settings-page/style
 */
import { PANEL_CSS } from '../../client/chat/panel-css.ts';

/** 设置页样式表。 */
export const settingsStyle = `:root{
  color-scheme:light;
  --dsw-static-neutral-bluish-00:#fffdfb;--dsw-static-neutral-bluish-50:#fbf4ef;--dsw-static-neutral-bluish-75:#f6eee8;
  --dsw-static-neutral-bluish-100:#f8e4eb;--dsw-static-neutral-bluish-200:#ead8df;--dsw-static-neutral-bluish-300:#d9c2cb;
  --dsw-static-neutral-bluish-600:#9a7d86;--dsw-static-neutral-bluish-700:#6e5560;--dsw-static-neutral-bluish-1000:#3a2a30;
  --dsw-static-blue-500:#e07a98;--dsw-static-red-500:#d4536a;--dsw-static-green-600:#2f8f62;
  --dsw-alias-bg-base:var(--dsw-static-neutral-bluish-50);--dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-label-primary:var(--dsw-static-neutral-bluish-1000);--dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-700);
  --dsw-alias-label-tertiary:var(--dsw-static-neutral-bluish-600);
  --dsw-alias-border-l1:#0000000a;--dsw-alias-border-l2:#0000001a;--dsw-alias-border-l3:#0000001f;--dsw-alias-border-l4:#00000029;
  --dsw-alias-interactive-bg-hover:#e07a9814;--dsw-alias-interactive-bg-active:#e07a9826;
  --dsw-alias-settings-card-fill:var(--dsw-alias-bg-layer-2);--dsw-alias-settings-card-stroke:var(--dsw-alias-border-l4);
  --dsw-specific-sidebar-nav-item-active:var(--dsw-static-neutral-bluish-100);
  --dsw-elevation-prominent:0 0 0 1px #ead8df,0 12px 32px #3a2a3012;
  --dsw-alias-bg-mask-1:#0000003d;
  --dsw-radius-xs:4px;--dsw-radius-sm:8px;--dsw-radius-md:12px;--dsw-radius-lg:16px;--dsw-radius-panel:28px;
  --dsw-font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei UI",sans-serif;
  --dsh-scrollbar-thumb:var(--dsw-alias-border-l4);--dsh-scrollbar-thumb-hover:var(--dsw-alias-border-l3);
  --dsh-sidebar-width:232px;--dsh-content-width:760px;
  --dsw-static-neutral-00:#fff;--dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-00);
  --dsw-font-s-14:14px/1.55 var(--dsw-font-family);--dsw-font-xxs-12:12px/1.55 var(--dsw-font-family);
  --dsw-font-xxxs-11:11px/1.45 var(--dsw-font-family);
  --dsw-radius-xl:20px;
  --dsw-specific-bubble:#fde8ef;--dsw-specific-input-major:#fffdfb;
  --dsw-alias-bg-module-platform:var(--dsw-static-neutral-bluish-75);  --dsw-alias-bg-multi-select:#e07a981c;
  --dsw-alias-button-info-fill:#e07a98;--dsw-alias-button-info-hover:#d26586;
  --dsw-alias-interactive-bg-hover-danger:#ef44441a;
  --dsw-alias-label-caption:var(--dsw-static-neutral-bluish-600);
  --dsw-alias-label-primary-foreground:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-state-business-primary:#d26586;
  --dsw-alias-state-error-primary:var(--dsw-static-red-500);--dsw-alias-state-error-secondary:var(--dsw-static-red-500);
  --dsw-alias-tooltip-bg:#4a333c;
  --ds-ease-in-out:cubic-bezier(.4,0,.2,1);--ds-transition-duration-fast:.12s;
}
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{height:100%}
body{margin:0;background:radial-gradient(980px 460px at 0% -8%,#fde8ef 0%,transparent 58%),radial-gradient(760px 420px at 100% 0%,#fff1e4 0%,transparent 52%),var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:14px/1.55 var(--dsw-font-family);-webkit-font-smoothing:antialiased}
a{color:var(--dsw-static-blue-500)}
::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:var(--dsh-scrollbar-thumb);border-radius:99px;border:3px solid transparent;background-clip:content-box}::-webkit-scrollbar-thumb:hover{background:var(--dsh-scrollbar-thumb-hover);background-clip:content-box}
.shell{display:grid;grid-template-columns:calc(var(--dsh-sidebar-width) + 12px) minmax(0,1fr);width:100vw;height:100vh;overflow:hidden;background:transparent}
.side{display:flex;flex-direction:column;min-width:0;min-height:0;margin:12px 0 12px 12px;padding:18px 12px 14px;background:#fffdfb;border:1px solid #f0e2e7;border-radius:22px;box-shadow:0 12px 32px #3a2a300c}
.brand{display:flex;align-items:center;gap:12px;padding:2px 8px 16px}
.brandLogo{flex:none;width:44px;height:44px;border-radius:16px;object-fit:cover;background:#fde8ef;box-shadow:0 0 0 1px #f0e2e7}
.brandText{display:flex;flex-direction:column;min-width:0}
.brandName{font-size:16px;font-weight:700;line-height:1.3;letter-spacing:.04em;color:var(--dsw-alias-label-primary)}
.brandSub{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-tertiary)}
.nav{display:flex;flex:1;flex-direction:column;min-width:0;min-height:0}
.navList{display:flex;flex-direction:column;gap:2px;min-height:0;overflow-y:auto}
.navCell{display:flex;align-items:center;gap:9px;height:40px;padding:0 12px;border:0;border-radius:12px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}
.navCell:hover{background:var(--dsw-alias-interactive-bg-hover)}
.navCell[aria-selected=true]{background:#fde8ef;color:#a84b68;font-weight:600}
.navGlyph{flex:none;width:16px;height:16px;display:block}
.navLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sideFoot{flex:none;margin-top:10px;padding:10px 12px;border-radius:12px;background:#fbf3f6;font-size:11px;line-height:1.5;color:#8a6572}
.main{display:flex;flex-direction:column;min-width:0;min-height:0;padding:12px 16px 12px 8px}
.topbar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;height:48px;padding:0 18px;background:transparent}
.pageTitle{margin:0;font-size:18px;font-weight:700;line-height:24px;letter-spacing:.02em;color:var(--dsw-alias-label-primary)}
.dirty{padding:4px 10px;border-radius:999px;background:#fff1e0;font-size:12px;color:#a86a32}
.options{display:flex;flex:1;flex-direction:column;min-width:0;min-height:0}
.panel{display:flex;flex:1;flex-direction:column;min-height:0;overflow:hidden}
.scroll{flex:1;min-height:0;overflow-y:auto;padding:6px 18px 12px}
.scroll>*{width:100%;max-width:var(--dsh-content-width);margin-left:auto;margin-right:auto}
/* 对话面板自己管内边距与滚动，这里只负责给它一个确定高度的容器；宽度与配置页对齐。 */
.pet-chat-host{display:flex;flex:1;flex-direction:column;min-height:0;overflow:hidden;width:min(960px,100%);max-width:none;margin:0 auto;padding:8px 8px 4px;background:#fffdfb;border:1px solid #f0e2e7;border-radius:24px;box-shadow:0 16px 40px #3a2a300c}
.card{background:#fffdfb;border:1px solid #f0e2e7;border-radius:18px;box-shadow:0 8px 24px #3a2a3008;padding:20px 22px;margin-bottom:14px}
.card:first-child{margin-top:2px}
.cardHead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 4px}
.cardTitle{margin:0;font-size:15px;font-weight:600;line-height:22px}
.cardHint{margin:0 0 12px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}
.field{margin:12px 0 0}
.field>label,.fieldLabel{display:block;margin:0 0 6px;font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.fieldHint{margin:6px 0 0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}
input[type=text],input[type=url],input[type=password],input[type=number],select,textarea{display:block;width:100%;min-height:38px;padding:8px 12px;border:1px solid #ead8df;border-radius:12px;background:#fff;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}
textarea{min-height:72px;resize:vertical;line-height:1.6}
input:hover,select:hover,textarea:hover{border-color:var(--dsw-static-neutral-bluish-300)}
/* :where() 把元素选择器权重降到 0：对话面板用「外层容器 focus-within 变色」代替逐控件焦点环，
   保持 input:focus-visible 的 (0,1,1) 会压过面板里的 .pet-chat-input{outline:none}，把焦点环画进输入框。 */
:where(input,select,textarea,button):focus-visible,.navCell:focus-visible{outline:2px solid var(--dsw-static-blue-500);outline-offset:1px}
input:disabled,select:disabled,textarea:disabled{background:var(--dsw-static-neutral-bluish-50);color:var(--dsw-alias-label-tertiary);cursor:not-allowed}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rowCheck{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-top:1px solid var(--dsw-alias-border-l1);cursor:pointer}
.rowCheck:first-of-type{border-top:0}
.rowCheck input{width:16px;height:16px;margin:3px 0 0;accent-color:var(--dsw-static-blue-500);flex:none}
.rowCheckText{min-width:0}
.rowCheckTitle{display:block;font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary);line-height:1.5}
.rowCheckHint{display:block;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-tertiary)}
.btn{height:34px;padding:0 14px;border:1px solid #ead8df;border-radius:999px;background:#fff;color:var(--dsw-alias-label-primary);font:600 13px/1 var(--dsw-font-family);cursor:pointer;white-space:nowrap}
.btn:hover{background:#fde8ef;border-color:#f3c6d4}
.btn:active{background:#f8d5e2}
.btn.primary{background:#e07a98;border-color:transparent;color:#fff}
.btn.primary:hover{background:#d26586;opacity:1}
.btn.ghost{border-color:transparent;color:var(--dsw-alias-label-secondary)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.tabs{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 12px}
.tab{height:32px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:600 13px/1 var(--dsw-font-family);cursor:pointer}
.tab:hover{background:var(--dsw-alias-interactive-bg-hover)}
.tab[aria-selected=true]{background:var(--dsw-specific-sidebar-nav-item-active);color:var(--dsw-alias-label-primary)}
.footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:4px;padding:14px 2px 6px;border-top:1px solid #f3e4ea}
.status{margin:0;min-height:20px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}
.status[data-error=true]{color:var(--dsw-static-red-500)}
.status[data-ok=true]{color:var(--dsw-static-green-600)}
.pathRow{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--dsw-alias-border-l1)}
.pathRow:first-child{border-top:0}
.pathKey{flex:none;width:80px;color:var(--dsw-alias-label-tertiary)}
.pathValue{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,"SF Mono",Consolas,monospace;font-size:11.5px}
.hintInline{font-weight:400;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.testRow{display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap}
.combo{position:relative;display:flex;align-items:center}
.combo input{padding-right:40px}
.comboToggle{position:absolute;right:4px;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:var(--dsw-radius-xs);background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.comboToggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.comboToggle:disabled{opacity:.45;cursor:not-allowed}
.keyActions{display:flex;justify-content:flex-end;margin-top:8px}
.keyActions .btn{height:26px;padding:0 10px;font-size:12px}
.avatarRow{display:flex;align-items:center;gap:12px;margin:0 0 14px}
.avatarImg{flex:none;width:56px;height:56px;border-radius:var(--dsw-radius-md);border:1px solid var(--dsw-alias-border-l2);object-fit:cover;background:var(--dsw-alias-bg-layer-1)}
.avatarBox{display:flex;flex-direction:column;gap:6px;min-width:0;align-items:flex-start}
.avatarBox .fieldHint{margin:0}
.avatarBox .status{margin:0;min-height:0}
.gridTight{margin-top:14px}
.fieldTight{margin:0}
.fineprint{margin:8px 0 0;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.configHead{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:2px auto 8px;padding:2px 2px 0}
.configLead{margin:0;max-width:36em;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}
.advancedBtn{display:inline-flex;flex:none;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1px solid #ead8df;border-radius:14px;background:#fff;color:#a84b68;cursor:pointer}
.advancedBtn:hover{background:#fde8ef;border-color:#f3c6d4}
.advancedBtn.is-on{background:#e07a98;border-color:transparent;color:#fff}
.advancedGlyph{width:18px;height:18px;display:block}
.sectionTitle{margin:8px 2px 12px;font-size:12px;font-weight:700;letter-spacing:.12em;color:#a84b68}
.petBar{display:flex;align-items:center;gap:8px;margin:0 0 10px}
.select{position:relative}
.selectTrigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:38px;padding:8px 12px;border:1px solid #ead8df;border-radius:12px;background:#fff;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;text-align:left;cursor:pointer}
.selectTrigger:hover:not(:disabled){border-color:var(--dsw-static-neutral-bluish-300)}
.selectTrigger:disabled{background:var(--dsw-static-neutral-bluish-50);color:var(--dsw-alias-label-tertiary);cursor:not-allowed}
.selectValue{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.selectChevron{flex:none;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);transition:transform .1s ease}
.selectTrigger[aria-expanded=true] .selectChevron{transform:rotate(180deg)}
.selectMenu{position:fixed;z-index:60;margin:0;padding:4px;list-style:none;overflow-y:auto;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);box-shadow:var(--dsw-elevation-prominent)}
.selectItem{padding:7px 10px;border-radius:var(--dsw-radius-sm);font-size:14px;line-height:20px;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.selectItem:hover,.selectItem.active{background:var(--dsw-alias-interactive-bg-hover)}
.selectItem[aria-selected=true]{background:var(--dsw-specific-sidebar-nav-item-active);font-weight:500}
.dialogMask{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--dsw-alias-bg-mask-1)}
.dialog{width:min(420px,100%);padding:20px 22px 16px;border-radius:20px;background:#fffdfb;box-shadow:var(--dsw-elevation-prominent)}
.dialogTitle{margin:0 0 8px;font-size:15px;font-weight:600;line-height:22px}
.dialogText{margin:0;font-size:13px;line-height:1.65;color:var(--dsw-alias-label-secondary);white-space:pre-line;word-break:break-word}
.dialogActions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
.personaWrap{position:relative}
.personaCount{position:absolute;right:10px;bottom:8px;padding:2px 5px;border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-layer-2);font-size:11px;line-height:1.2;color:var(--dsw-alias-label-tertiary);pointer-events:none}
.btn.danger{background:var(--dsw-static-red-500);border-color:transparent;color:#fff}
.btn.danger:hover{opacity:.9}
.petBar .select{flex:1;min-width:0}
.empty{padding:16px 0;font-size:13px;color:var(--dsw-alias-label-tertiary)}
@media(max-width:767px){
  .shell{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}
  .side{margin:8px 8px 0;padding:12px 10px 10px;border-radius:18px}
  .brand{padding:0 6px 10px}
  .brandLogo{width:36px;height:36px;border-radius:12px}
  .nav{flex:none}
  .navList{flex-direction:row;gap:4px;padding-bottom:2px;overflow-x:auto;overflow-y:hidden}
  .navCell{flex:0 0 auto;padding:0 12px}
  .navLabel{flex:none}
  .sideFoot{display:none}
  .main{padding:4px 8px 8px}
  .topbar{height:44px;padding:0 8px}
  .scroll{padding:4px 4px 8px}
  .pet-chat-host{border-radius:18px}
  .grid2,.grid3{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:no-preference){.navCell,.btn,.tab{transition:background-color .1s ease}}
${PANEL_CSS}
.pet-chat-host .pet-chat{padding:6px 8px 8px;gap:12px}
.pet-chat-host .pet-chat-tools{width:fit-content;margin-left:auto;padding:3px;background:#fff7fa;border:1px solid #f3e4ea;border-radius:999px}
.pet-chat-host .pet-chat-tool{border:0;border-radius:999px;background:transparent}
.pet-chat-host .pet-chat-tool:hover:not(:disabled){background:#fff}
.pet-chat-host .pet-chat-tool[aria-pressed=true]{background:#fff;box-shadow:0 1px 4px #3a2a3014}
.pet-chat-host .pet-chat-list>.pet-chat-hint:only-child{margin:auto;max-width:16em;padding:28px 12px;border-radius:18px;background:#fff7fa;text-align:center;font-size:14px;line-height:1.7}
.pet-chat-host .pet-chat-composer{border-color:#f0e2e7;border-radius:20px;background:#fff;box-shadow:0 8px 24px #3a2a300c}
.pet-chat-host .pet-chat-composer:focus-within{border-color:#e07a98;box-shadow:0 8px 24px #e07a9824}
.pet-chat-host .pet-chat-attach{border-color:#f0e2e7;background:#fff7fa}
.pet-chat-host .pet-chat-msg.is-pet .pet-chat-bubble{background:#fff7fa}
`;
