/* =========================================================================
 * 对白美化 · 全局 CSS 注入器  v2.3.4
 * -------------------------------------------------------------------------
 * 【为什么需要它 / v2.0.0 的由来】
 *   酒馆会把消息里的所有 class 改名：nvn-dialogue → custom-nvn-dialogue
 *   （见酒馆本体 public/scripts/chats.js 的 addDOMPurifyHooks()）。
 *   消息自带的 <style> 也会被同步改写成 .mes_text .custom-nvn-*，
 *   所以「把原样 CSS 挂到 <head>」匹配不到任何元素。
 *   本脚本里的 CSS 是用酒馆自己的 decodeStyleTags() 跑出来的结果，实测生效。
 *
 *   另外：旧版把约 22 万字符 CSS 写进正则替换文本，每条对白复制一份，
 *   而且酒馆每次渲染都要 css.parse()+css.stringify() 一遍这段 CSS
 *   （13 句对白 = 每次渲染解析 13 次 22 万字符），流式每个 token 再来一轮。
 *   现在消息里 0 字节 CSS，以上开销全部归零。
 *
 * 【v2.1.0 变化】
 *   1) 中文版与中日双语版合并成一份 light：实测「用双语CSS渲染中文消息」
 *      与中文CSS的计算样式差异为 0 处，而反过来会坏（ruby 注音行高全错）。
 *      所以 light 一份同时管中文与双语 —— 你只切正则，不用碰脚本。
 *   2) 新增 NEW_CHARACTERS 表：以后加角色只改那一处，脚本自动生成规则。
 *
 * 【v2.2.0 修复「玩家行（user 模式）不对」】
 *   原卡写的是「.is_user .nvn-dialogue { flex-direction: row-reverse }」，
 *   但酒馆的 is_user 是 **属性** 不是 class（见 index.html 的
 *   <div class="mes" is_user="true">），酒馆自己的样式表里根本没有 .is_user
 *   这个类 —— 所以这套「玩家行」规则从来没生效过：玩家那一行的头像会跑到
 *   左边、名牌也翻不过去，玩家名一旦和角色名重名就彻底崩。
 *   现在改成 [is_user="true"]，玩家行才真正右对齐。
 *
 *   另外顺手修了两处：
 *     · 原卡 [data-player] 分支里 .nvn-name-plate .nvn-name-plate 这类
 *       重复类名（漏了 5 处），导致即使命中也不会翻名牌；
 *     · 选择器不再统一加 .mes_text 前缀 —— 加了会让 [is_user] /
 *       :is(.dark,.theme-dark) 这类「祖先在消息之外」的规则失效。
 *       需要收窄的 .mes_text 规则改用 :has(.custom-nvn-dialogue) 限定。
 *
 * 【v2.3.0】中日双语字号加大：日语 0.98em → 1.15em；
 *   中文小字 11.5px → 0.8em（em 相对 ruby 基准，故恒为日语的 80%）。
 *
 * 【v2.5.1】星号包裹（*…*）单独走「内心思绪」：标签文案换成「内心思绪」、
 *   引号图标换成 *，且不套心灵感应那套淡紫配色（与普通行同色）。
 *   不带引号也没星号的仍走「心灵感应」。两条兜底正则按此顺序排列。
 *
 * 【v2.6.1】修 NEW_CHARACTERS 的两个「只有新角色才会中」的问题：
 *   1) 颜色不生效：基础 CSS 的「译名首字色池」用 :not() 链把权重堆到 (0,7,1)，
 *      生成的选择器只有 (0,3,1)，同 !important 时输给它 → 「欧里丝」这类
 *      名字首字撞上色池的角色，头像框/引号/动作描写是色池的灰紫色。
 *      现在生成的选择器统一加 :not(#nvn-char-color-override) 提权。
 *   2) 头像多一圈细框：基础 CSS 只对「旧名单以外」的角色画 .custom-nvn-avatar-img::after
 *      的 4px 内嵌细框；新角色不在旧名单里，于是有立绘也被套上这圈框。
 *      现在凡是有 avatar 的角色都把 ::after 关掉，和盖欧这类老角色一致（整块填满）。
 *
 * 【v2.6.2】热更新「先正常、加载完又变回去」的根因与对策：
 *   远端拿到的还是旧版脚本时，它会把卡内已经生效的新版 CSS 整个替换掉。
 *   现在 boot() 会把真正生效的版本写到宿主 window.__NVN_DLG_VERSION__，
 *   加载器据此做三道闸（见 dialogue-loader.template.js）：
 *     ① 远端 version 更旧 → 不执行；② 清单 version 与脚本内 VERSION 不符 → 不执行；
 *     ③ 执行完回读版本，不符就在控制台报警。
 *
 * 【发布 2.3.0（2026-11-10）· 全角色主题色 / 头像 / 差分 / 立绘】
 *   数据来源：
 *     · 角色发色一览.txt（136 条发色）→ 每个角色的 --main
 *     · 合集200x250_URL对照表.txt（8 部作品 / 123 角色 / 882 张图）→ 头像 / 差分 / 立绘
 *   匹配规则：
 *     1) data-char 必须【完全等于】姓名 —— 多一字少一字都不出图。
 *        例：写「川内野优美」出图，写「川内野优」不出（回落普通 NPC 玻璃名片）。
 *     2) 欧美名只登记「名」：布琉艾特·妮科莱特·普朗凯特 → 布琉艾特。
 *     3) 全名 / 短名并存时（稻羽结衣 / 结衣），短名仅在「全表唯一」时才作为别名。
 *   立绘优先级：校园制服 → 衣装① → 衣装② → 衣装③ → 衣装④ → 大立绘。
 *   主题色：发色 → 色相 → HSL 明度夹到 0.45~0.70（深发色也能当强调色）。
 *   没有发色资料的 12 人沿用默认灰，可在 _build_cast.py 里补。
 *
 * 【发布 2.3.1（2026-11-10）· 三个修补】
 *   1) 头像贴顶：原来整行 align-items:center，长台词时头像漂到中间、再长就贴到
 *      上边。现在顶对齐 —— 纵向偏移恒为 0，是硬上限。
 *   2) 「脸红」兜底：data-action 以「脸红」开头但没有精确差分（如「脸红慌张」）时，
 *      回落到「脸红通常」（没有则任取一张脸红差分，再没有就通常）。该通用规则排在
 *      所有精确差分之前，同权重下后者覆盖，所以「脸红高兴」等精确差分仍优先。
 *   3) 名字：首字放大 + 交替上色。splitNames() 拆成逐字 span，
 *      奇数位取 --main、偶数位取默认色（1 染色 / 2 不染色 / 3 染色…）。
 *      v2.3.2 起：字体换黑体（Noto Sans SC → 苹方 → 雅黑），
 *      首字 1.25em、其余 1.02em（= 首字的 82%，满足「小字 ≥ 80%」）。
 *      v2.3.3：去掉名字发光（原来叠了 .mes_text 继承的 0 0 2px 黑 + 首字 10px 光晕）。
 *      v2.3.4：名字字体样式完全对齐 regex-对话渲染v7_1 ——
 *        font-family "Noto Serif SC","Source Han Serif SC","Songti SC",serif；
 *        font-weight 800；letter-spacing 1.5px；line-height 1；text-shadow 全去掉。
 *        字号仍按上一轮：首字 1.25em、其余 1.02em（82%）。
 *
 * 【发布 2.2.6（2026-11-10）· 神态/动作的玻璃与头像卡同档】
 *   把神态 / 动作的玻璃数值直接对齐头像卡（NPC 名片）那一组：
 *     暗色：background-color rgba(var(--rgb), .24) + 平铺 rgba(9,11,15,.56)
 *     亮色：background-color rgba(var(--rgb), .14) + 平铺 rgba(255,255,255,.76)
 *     磨砂：blur(14px) saturate(1.35)（和头像卡一致）
 *   这样同一行里「动作条」和「头像卡」的材质是同一块玻璃，不会一个深一个浅。
 *
 * 【发布 2.2.5（2026-11-10）· 动作框竖条跟着行走】
 *   角色行的动作条竖条 → 左侧（和角色头像卡的左竖条同侧）；
 *   user 行的动作条竖条 → 右侧（和 user 头像卡的右竖条同侧）。
 *   左右内边距与圆角一起镜像：3px 3px 9px 9px → 9px 3px 3px 9px。
 *   （上一版把两边都放在右侧，角色行看着别拗。）
 *
 * 【发布 2.2.4（2026-11-10）· 玻璃底改成「均匀」的，不再斜向渐变】
 *   现象：装进酒馆后，神态 / 动作 / NPC 名片的底「左亮右暗」，渐变很生硬。
 *   根因：160deg 的斜向渐变在窄长条上就是从左到右铺开 —— 条越宽，左右差越大。
 *   改法：两层叠出均匀玻璃，全程不做方向性渐变：
 *        · background-color: rgba(var(--rgb), .16)      → 一点点主题色染色
 *        · background-image: linear-gradient(同色, 同色) → 一层平铺的深玻璃
 *     两个色标同色 = 均匀，任何宽度都不会左右分色；也不依赖 color-mix。
 *   顺带：主题色染色从 30% 降到 16%、深玻璃 52% → 58%，底更干净，
 *        主题色只留在边框和文字上（原来 30% 金 + 52% 黑会发土）。
 *   亮色主题同理：14%~18% 主题色 + 一层平铺白玻璃。
 *
 * 【发布 2.2.3（2026-11-10）· 玻璃底不能再只靠 backdrop-filter】
 *   现象：v1.0.5 装进酒馆后，神态 / 动作只剩「外框 + 文字」，没有那层半透明底。
 *   根因：那版只写了 `background: transparent` + `backdrop-filter: blur()`，
 *        底子完全交给 backdrop-filter；部分酒馆内核 / WebView 不支持（或被打断），
 *        于是连底都没了，退化成空框。我这边 Chrome 支持，所以示例图正常 —— 是
 *        环境差异，不是样式写错。
 *   改法：跟头像卡彻底统一成同一套「玻璃」配方 ——
 *        · 先给一层真正的半透明底色（background-color，暗色 rgba(10,12,18,.42)）；
 *        · 再叠一层主题色渐变（160deg，主题色 → 深玻璃）；
 *        · backdrop-filter 只当加分项，不支持也不影响观感。
 *   顺带把 NPC 玻璃名片的底色也提亮了（原来越依靠 blur 越像空框）。
 *   验收方式：在本地酒馆里跑真脚本，另跑一遍「强制关掉 backdrop-filter」，
 *   两种情况下都有可见的半透明底。
 *
 * 【发布 2.2.2（2026-11-10）· 神态/动作改成「只有边框」的玻璃】
 *   1) 名字行的「小字」偏小（0.76em）→ 0.88em；首字 1.46em → 1.38em，整行更匀。
 *   2) 神态 / 动作不再铺 40% 主题色底，改成跟头像卡同一路子：
 *      只有一层主题色细边框，里面是透明的磨砂玻璃（backdrop-filter blur），
 *      文字用纯 var(--main)，阴影与正文 .custom-nvn-primary 完全一致
 *      （0 1px 3px rgba(0,0,0,.8)）—— 之前那圈多向描边太像黑轮廓了。
 *      动作底板右侧仍保留 3px 主题色竖条。
 *   3) 有头像的角色不再显示竖排名字兜底（原来只对克蕾雅 / 玛丽·安关闭，
 *      上传头像的角色会「图 + 竖排名字」叠在一起）。判定同样走 markAvatars 的
 *      data-nvn-has-avatar，规则放进 LAYOUT_PATCH_CSS，亮暗共用。
 *
 * 【发布 2.2.1（2026-11-10）· 头像判定 + 底框收尾】
 *   1) 「有没有头像」不再靠名字猜：玩家头像脚本（玩家头像·悬浮球）会给任意角色
 *      行内塞 background-image，正则 / 别家美化也可能塞图，于是有头像的角色仍被
 *      套上 NPC 的玻璃名片 + 左侧竖条（就是那条「蓝边」）。现在三重守卫：
 *        · 脚本 markAvatars() 看 computed background-image 里有没有 url( ，
 *          有就打 data-nvn-has-avatar="1"（图没了会自动摘掉）；
 *        · :not([style*="background-image"]) 兜住行内图（脚本还没跑时也不闪）；
 *        · :not([data-wn-ua-applied="1"]) 兜住玩家头像脚本自己的标记。
 *   2) 头像描边统一走主题色：基础规则直接画 1.5px rgba(--rgb,.78) + 内发光，
 *      不再只对克蕾雅 / 玛丽·安生效（否则上传头像的角色又变回一圈黑边）。
 *   3) 神态 / 动作底：从「渐变到近黑」改成均匀的 rgba(--rgb,.40) 淡主题色；
 *      文字仍是主题色，但往同色系压深约三成，才压得住 40% 同色底
 *      （想回到纯主题色字：删掉那条 color-mix 即可）。
 *   4) 动作底板的竖条从左移到右侧（border-right 3px，浅一档的同类色），
 *      圆角同步改成 9px 3px 3px 9px。
 *   5) user 行「竖条改右侧」那条规则的权重跟着提上来，否则会被 NPC 左边条压住。
 *
 * 【发布 2.2.0（2026-11-10）· A + 方案1 定稿】
 *   1) 名字行改「大首字」：首字 1.46em、其余 0.76em，字距 0.10em。
 *   2) 神态/动作改成角色主题色的半透明玻璃：主题色→深玻璃的渐变底 + 主题色实字；
 *      动作左侧保留 2px 主题色竖条。为了让主题色字在亮背景上仍能读，渐变底部压到
 *      近黑（rgba(6,8,12,.86)），主题色只留边光；纯主题色透明底会让金字糊在金底上。
 *   3) 无头像 NPC 换成磨砂玻璃名片：均匀玻璃 + 白色细边 + 顶部主题色小点，
 *      去掉旧版 4px 内框；左侧加 3px 主题色竖条。
 *   4) 玩家行（user）没有头像时竖条自动换到右侧，和角色行左右对称。
 *   5) 亮色主题单独一套：白玻璃 + 压深的主题色字（color-mix，老内核回退纯主题色）。
 *
 * 【发布 2.1.5（2026-11-10）· 本地酒馆实测补刀】
 *   在 D:\HGame\SillyTavern-1.18.0（实际 1.14.0）里用真实消息结构跑了一遍：
 *   ① 点头像打开立绘后，点遮罩虽然命中 <summary>，但原生 details 开关不触发 / 或被回弹，
 *      v1.0.1 的 click 兜底会出现「先关掉、又被原生开关打开」。现在改成 pointerdown：
 *      先把弹层关掉，遮罩随之消失，后面的 click 落不到 summary 上，不会回弹。
 *   ② Esc 在酒馆里会被自家快捷键先截走，所以 keydown 同时挂 window + document。
 *   ③ 实测点头像关、点正文关、点空白关、Esc 关，四种都通过。
 *
 * 【发布 2.1.4（2026-11-10）· 两个回归】
 *   ① 头像框变黑：暗色主题里 .custom-nvn-avatar-img 的描边用的是 --halo2
 *      （暗色下是 rgba(0,0,0,.55)），于是整圈发黑。现在有头像的角色改用
 *      --rgb 画 1.5px 主题色细边 + 内发光（克蕾雅琥珀金 / 玛丽·安翠绿），
 *      NEW_CHARACTERS 里带 avatar 的角色也自动带上。
 *   ② 立绘打开后点哪都关不掉：模板里 <summary> 自己就带 .custom-nvn-avatar-img，
 *      而「抹掉旧版装饰」那条 `.custom-nvn-avatar-img:not(#…)::before{content:none}`
 *      把 `[open] summary::before` 的全屏透明遮罩一起打掉了（权重 (1,1,1) 压过 (0,3,1)）。
 *      现在遮罩选择器补 :not(#nvn-modern-boost) 提权到 (1,4,1)；
 *      另加 wirePopoverDismiss()：点空白 / 点大立绘 / Esc 都能关，别处样式再压掉也有兜底。
 * 【发布 2.1.3（2026-11-07）】
 *   修「user 行台词下方多出一个空尾巴（空引号加竖线）」：
 *   user 行的 display:flex 与空尾段隐藏规则同为 (0,3,0) 权重但排在后面，把 display:none 盖掉了；
 *   现在给隐藏规则加 div.custom-nvn-dialogue 前缀提高权重，并同时覆盖两种尾段文本类名。
 * 【发布 2.1.2（2026-11-07）】
 *   修「user 模式台词不靠右」：亮色主题的 .nvn-text 只写了 justify-content:flex-end，
 *   而 v2.1.0 已把 .nvn-text 改成 display:block，该属性失效；暗色主题当时补过
 *   text-align:right，亮色漏了。现在两边一致。
 * 【发布 2.1.1（2026-11-07）】
 *   1) 修「双语格式下台词下方多出一条竖线尾巴」：空 .nvn-text-tail 容器没被隐藏。
 *      根因是隐藏规则只认 .nvn-primary，而双语模板用的是 .nvn-quote-val。
 *   2) 新增 .nvn-ja-fallback 规则：供「纯中文」正则使用——日文默认隐藏，
 *      仅当对应中文为空时回退显示原文，避免纯日文台词变成空白。
 * 【发布 2.1.0（2026-11-06）】
 *   1) 补齐勇战/MGQ 角色立绘：151 张点击展开的大立绘（小头像保持原样）+ 优依/尤克夏/戴安娜/琪琪露/米娜/莉莉/菲玖/贞德 8 张大立绘。
 *   2) 修「右引号停在第一行行尾」：.custom-nvn-text 由 flex 改为 block，右引号跟随最后一个字。
 *   3) NEW_CHARACTERS 带 portrait 的角色自动放开弹层（基础 CSS 原本对非名单角色 pointer-events:none）。
 *
 * 【2026-11-09 · 现代世界观改造（第一步：外部图链只留两个人）】
 *   新坑是现代世界观，原来那套西幻 / 黑魂 / 摇篮 / 勇战的角色都用不上了。
 *     · 图床直链 origin.picgo.net：2126 条 → 50 条，只剩两个人的整套规则 ——
 *         克蕾雅：23 条头像规则（默认 + 22 种神态差分）+ 1 张大立绘 + 深色主题同名规则
 *         玛丽·安：小头像 + 深色主题同名规则（原与莉耶芙共用一张图，已拆开）
 *       这两套留给以后照着抄格式；换图只改 url(...) 里的地址即可。
 *     · 勇战 / MGQ 151 张大立绘、8 名大立绘角色、全体旧角色表情差分：整块删。
 *     · NEW_CHARACTERS 表清空（原 197 条），以后加人再往里写。
 *     · 深色主题里重抄一遍的「摇篮 / 爱丽丝系」空壳块：整块删。
 *     · apply() 里那段 12.6 万字符、只服务旧角色名单的内联 CSS：删（生成器已覆盖）。
 *
 * 【2026-11-09 · 第二步：名字名单 + 个性配色也收口到两个人】
 *   为什么上一步之后「莉莉娅」还在：外链删了，但各条规则里的旧角色名字名单没删。
 *   她仍被当成「有大立绘的角色」→ 给手型指针 + 放开头像弹层；可图已经没了，
 *   于是头像框空着、还能点、点开是一张裂图。现在把名单一起裁掉：
 *     · 6 组名单规则（非立绘 NPC 暗夜微光排除表 / 手型指针 / 弹层禁用 / 花朵名牌 /
 *       隐藏 fallback 文字框 / BS2 贴图定位），亮+暗各一份，全部裁到只剩
 *       克蕾雅、卢克蕾齐雅（她的别名）、玛丽·安。
 *       新角色因此一律落到「普通 NPC」默认样式：头像框有暗夜微光底纹 + 名字兜底，
 *       点不开、也不会出现裂图。
 *     · 译名首字色池（西/艾/安/阿… 那一大段莫兰迪自动配色）整段删 —— 那是给西幻
 *       译名准备的，现代世界观用不上。
 *     · 角色专属配色只留两条作格式参考：克蕾雅（琥珀金）、玛丽·安（翠草清绿）。
 *       其余（爱丽丝家族白金、摇篮、BS2、勇战那一堆）全删。没配色的角色走默认
 *       --main（#8896a5）。
 *     · 摇篮那一段配色、BS2 爱丽丝·利德尔短名绑定：删。
 *   结果：整份 CSS 里 [data-char] 只剩这三个名字，其余角色一律走默认。
 *
 * 【2026-11-09 · 第三步：外观改成现代版（无气泡 + 角色主色下划线）】
 *   奇幻那套外观（斜切金框、蔷薇纹、菱形端点、衬线字、暗夜微光底纹、渐变竖条）
 *   全部拆掉，按你选的「聊天气泡」方向重画，但把气泡框也去掉了：
 *     · 头像 100×125 尺寸不变，只换 12px 圆角 + 细描边 + 柔和投影；
 *     · 头像框底一根角色主色下划线（带辉光）；
 *     · 名字行 = 角色色圆点 + 名字（首字用角色色）+ 动作徽章（一根细下划线）；
 *     · 台词不再有任何框 / 竖条 / 引号装饰，只有极淡的「」；
 *     · 动作描写在文字宽度上压一根角色主色下划线（渐变收尾）；
 *     · 玩家行整行镜像靠右，主色换成冰蓝；
 *     · 字体由衬线换成思源黑体 / 微软雅黑。
 *   保留不动：立绘弹层、双语 ruby、尾段隐藏、日文兜底、克蕾雅 / 玛丽·安 的图与配色。
 *
 * 【2026-11-09 · 第四步：B 版排布 + 主题色文字 + ☀/☾ 亮暗切换】
 *   1) 头像框底那根横线去掉了（只剩动作描写那根）。
 *   2) 排布改成 B：整行内容垂直居中。头像固定 125 高，而 1 行台词只有 83 高，
 *      原来顶部对齐时底下会空出 42px；居中后空白上下对半分，长台词自动撑开。
 *   3) 神态徽章（慌张 / 脸红通常…）和动作描写从灰字改成角色主题色：
 *      color-mix(main 70%, --fx)，亮色主题再压深一档（56% / 58%）保对比度。
 *   4) 名字行最右加一个纯 CSS 画的 ☀ / ☾ 按钮（每条消息一个）：
 *      显示的是「点了会变成什么」——深色里显示太阳，浅色里显示月亮。
 *      点击 → setTheme() → 写 localStorage('nvn-dlg-mode') → 立刻换样式表；
 *      reconcile() 里 userTheme 优先于「按卡名猜主题」，所以两秒一次的自动
 *      重算不会把手动选择冲掉。关掉脚本时会把手上的按钮一起清掉。
 *
 * 【2026-11-09 · 第五步：跟卡里的旧版 v2.4.0 打架 → 隔离 + 加固】
 *   症状：导入后金框、金线、胶囊徽章又回来了，只有那个 ☀ 变成一个小灰方块。
 *   根因：这张卡自己还挂着一份「对白美化·CSS注入器 v2.4.0」（启用中，49 万字符），
 *        它用的是同一个 STYLE_ID = 'nvn-dialogue-theme-css'，每次 reconcile 都会
 *        querySelectorAll('#'+STYLE_ID) 然后 remove —— 把我们刚注入的样式整套删掉，
 *        再塞它自己那份奇幻 CSS。所以「我们的 JS 在跑（按钮被插进去了），但 CSS 没了」。
 *   三处加固：
 *     1) STYLE_ID 改成 nvn-dialogue-theme-modern，SLOT 也改名 → 两个脚本互不覆盖；
 *     2) 视觉层每个选择器补 :not(#nvn-modern-boost)，白送 1 个 ID 权重
 *        （旧版有一堆 (0,3,1) 的高权重规则，普通类选择器压不住）；
 *     3) 专门清掉旧版的装饰：.custom-nvn-content::before/::after 的上下金线、
 *        内容栏 1px 边框、name-plate / avatar-img / motion 上的蔷薇与内嵌细框。
 *   另外：台词的小括号「」也改成跟角色主题色走了（之前是死灰）。
 *   ⚠ 治本还是去「酒馆助手 → 脚本」把那张卡里的旧版 v2.4.0 停用或删掉：
 *     留着它还会每两秒重算一次 24 万字符 CSS，纯属白烧。
 *
 * 【2026-11-09 · 第六步：TauriTavern 上的两个 bug】
 *   ① 多出一对空「」：模板里第二段台词是 `<div class="nvn-text nvn-text-tail">`，
 *      酒馆改名后它同时带 `.custom-nvn-text`。上一轮为了压旧版脚本给所有选择器加了
 *      :not(#…) 权重，于是 `.custom-nvn-text { display:block !important }`（1,1,0）
 *      反过来压过了原来那条隐藏规则（0,3,1）→ 空尾段被撑开，只剩一对空引号。
 *      修法：① 再写一条同样带权重的隐藏规则；② 脚本 sweepEmptyTails() 用行内
 *      `display:none !important` 兜底——行内权重最高，且不依赖 :has()（老内核也能用）。
 *   ② 点 ☀ 没反应：原来靠内存变量 `current` 判断当前主题，宿主重渲染后可能对不上。
 *      现在改成直接读 `<style data-nvn-theme>`；click / pointerup 双通道（capture）+
 *      250ms 去重；顺手回收上一版脚本遗留、没有监听器的按钮；注入被吞就绕过 apply()
 *      硬塞一次；按钮补 pointer-events:auto。另留 __NVN_SET_THEME__ / __NVN_DIAG__ 后门。
 *
 * 【依赖】酒馆助手。关掉它对白会失去样式；此时可把同目录的
 *         「对白美化-自定义CSS版-中文与双语通用.css」整段粘进
 *         酒馆「用户设置 → 自定义CSS」。
 * ========================================================================= */
(async function () {
  'use strict';

  const VERSION  = '2.4.18';
  /* ⚠ 卡里还挂着「对白美化·CSS注入器 v2.4.0」时，它也用 nvn-dialogue-theme-css 这个 id，
   两边会互相删掉对方的 <style>（谁后跑谁赢，两秒一换）。所以这里改名，互不干扰。 */
  const STYLE_ID = 'nvn-dialogue-theme-modern';
  const SLOT     = '__NVN_DLG_CSS_MODERN__';

  /* =========================================================================
   * ★★★ 新增角色 —— 只改这里 ★★★
   * -------------------------------------------------------------------------
   * 往下面数组里加一条就行，脚本会自动生成酒馆改名后的选择器，无需手写 CSS。
   *
   *   chars    : 对白里的角色名，可写多个别名（全名 / 短名 / 异体字），必须精确
   *   main     : 主色（名牌、引号、边框）        sub  : 副色（动作描写）
   *   rgb      : main 的 "R, G, B" 十进制写法（三个数字间用逗号+空格）
   *   motion   : 动作描写颜色，省略则用 main
   *   avatar   : 100×125 小头像图片地址
   *   portrait : 点开头像看的大立绘地址（可选）
   *   rose     : true  → 显示蔷薇花名牌（建议给主要角色开）
   *   big      : true  → 手型指针 + 隐藏字母兜底（有大立绘时开）
   *
   * 示例（把 // 去掉即可）：
   *   { chars: ['新角色', '新角色·全名'], main: '#c9a227', sub: '#fffdf5',
   *     rgb: '201, 162, 39', motion: '#e0c060', rose: true, big: true,
   *     avatar:   'https://origin.picgo.net/2026/10/09/xxxx.png',
   *     portrait: 'https://origin.picgo.net/2026/10/09/yyyy.png' },
   * ========================================================================= */
  const NEW_CHARACTERS = [];
  /* ↑ 2026-11-09 现代世界观新坑：原表里 197 条旧角色（西幻 / 勇战·MGQ / 黑魂系）已全部清空。
     以后加人照上面「★★★ 新增角色 ★★★」的示例往数组里追加一条就行：
       { chars: ['角色名', '角色名·全名'], main: '#c9a227', sub: '#fffdf5',
         rgb: '201, 162, 39', motion: '#e0c060', rose: true, big: true,
         avatar: 'https://图床/xxx.png', portrait: 'https://图床/yyy.png' },
     想直接抄现成的格式，看下面 CSS 里保留的「克蕾雅 / 玛丽·安」两套规则。 */

  /* 由 NEW_CHARACTERS 生成 CSS：放在基础 CSS 之后，同优先级下后者胜。
     现在表是空的；往里加角色后，它会自动生成配色 / 头像 / 立绘 / 弹层 / 花朵名牌，
     选择器统一带 :not(#nvn-char-color-override) 提权，压得住基础 CSS 的同名规则。 */
  /* 通用布局补丁（右引号悬挂 / 玩家行 flex）—— 这常量原来叫 MGQ_ART，
     151 张勇战立绘删掉后只剩这两段，改名免得以后看着误会。 */
  /* =========================================================================
   * 全角色名单（__CAST_IS__ 占位替换用）+ 主题色 / 头像 / 差分 / 立绘
   * 由 _build_cast.py 生成，勿手改。
   * ========================================================================= */
  const CAST_IS = '[data-char="MAXX"], [data-char="八重野萤"], [data-char="白鹭茉百合"], [data-char="茉百合"], [data-char="冰川京一郎"], [data-char="稻羽结衣"], [data-char="结衣"], [data-char="电堂明"], [data-char="抚子"], [data-char="光"], [data-char="皇千羽耶"], [data-char="皇天音"], [data-char="天音"], [data-char="皇奏龙"], [data-char="九条玖琉璃"], [data-char="玖琉璃"], [data-char="水无濑樱子"], [data-char="丝茉茉"], [data-char="死神老师"], [data-char="小雪"], [data-char="雪代铃乃"], [data-char="铃乃"], [data-char="早河惠"], [data-char="冰堂芹香"], [data-char="朝仓千弘"], [data-char="菱川琴枝"], [data-char="牧濑皋月"], [data-char="千原乃亚"], [data-char="天城咲夜"], [data-char="天道八云"], [data-char="夏目朱里"], [data-char="一之濑舞织"], [data-char="安娜塔西亚"], [data-char="凤怜奈"], [data-char="凤一朗"], [data-char="猫西昭江"], [data-char="乾幸"], [data-char="瑞木杷虎"], [data-char="深山瑞希"], [data-char="狮子堂千晴"], [data-char="沃尔夫冈"], [data-char="乌丸铁子"], [data-char="乌丸紫月"], [data-char="佐藤洋"], [data-char="八十岛壹与"], [data-char="布琉艾特"], [data-char="枞山红叶"], [data-char="大藏安东尼"], [data-char="大藏骏我"], [data-char="大藏里想奈"], [data-char="大藏衣远"], [data-char="迪特琳德"], [data-char="花之宫瑞穗"], [data-char="华花"], [data-char="莉莉安奴"], [data-char="柳之濑凑"], [data-char="梅丽尔"], [data-char="名波七爱"], [data-char="让·皮埃尔"], [data-char="萨莎"], [data-char="山吹八千代"], [data-char="杉村北斗"], [data-char="瓦莲莉娅"], [data-char="小仓朝日"], [data-char="樱小路露娜"], [data-char="尤希尔"], [data-char="不知火怜"], [data-char="江利原美月"], [data-char="堺浩一"], [data-char="门胁樱"], [data-char="双叶沙那子"], [data-char="天司凉香"], [data-char="小峰真奈美"], [data-char="小石川珠音"], [data-char="新垣若菜"], [data-char="真原葵"], [data-char="真原祐里"], [data-char="佐佐原亮子"], [data-char="不二卫哉"], [data-char="茶园那优花"], [data-char="岛越月望"], [data-char="二见原莉莉子"], [data-char="砾川杰"], [data-char="砾川美玖"], [data-char="砾川雄真"], [data-char="阳见惠凪"], [data-char="隐杏珠"], [data-char="仲原大梦"], [data-char="莲华"], [data-char="铃森伊千果"], [data-char="藤堂咲"], [data-char="觋礼次郎"], [data-char="觋夕莉"], [data-char="觋夕摩"], [data-char="御殿场镜子"], [data-char="本间丽华"], [data-char="冰川里奈"], [data-char="冰川露莉莴"], [data-char="伯奇"], [data-char="草薙健一郎"], [data-char="草薙直哉"], [data-char="川内野铃菜"], [data-char="川内野优美"], [data-char="吹"], [data-char="东浪见"], [data-char="恩田宁"], [data-char="栗山奈津子"], [data-char="泷泽托马斯"], [data-char="麦提弗里曼"], [data-char="明石亘"], [data-char="明石小牧"], [data-char="明石小沙智"], [data-char="鸟谷纱希"], [data-char="鸟谷真琴"], [data-char="片贝巧实"], [data-char="若田清二郎"], [data-char="夏目圭"], [data-char="夏目蓝"], [data-char="夏目雫"], [data-char="咲崎樱子"], [data-char="一宫"], [data-char="御樱稟"], [data-char="御樱雄三"], [data-char="长山香奈"], [data-char="中村水菜"], [data-char="中村义贞"], [data-char="中村章一"], [data-char="柊乃乃未"], [data-char="克蕾雅"], [data-char="卢克蕾齐雅"], [data-char="玛丽·安"], [data-char="成濑沙月"], [data-char="九条都"], [data-char="高峰莲夜"], [data-char="苏菲缇雅"], [data-char="结城希亚"], [data-char="香坂春风"], [data-char="新海天"], [data-char="新海霞"], [data-char="新海翔"], [data-char="幽灵"], [data-char="深泽与一"], [data-char="草薙直绪"], [data-char="花子"], [data-char="大垣日向"], [data-char="飞鸟凑"], [data-char="贵船柚子"], [data-char="皆见美结"], [data-char="那波七海"], [data-char="西园寺风莉"]';
  const CAST_CSS = `


/* ===================== 全角色：主题色 / 头像 / 差分 / 立绘 =====================
   角色发色一览.txt → 主题色；合集200x250_URL对照表.txt → 图
   data-char 必须与姓名完全相等；欧美名只登记「名」；
   立绘：校园制服 → 衣装① → 衣装② → 衣装③ → 衣装④ → 大立绘
   由 _build_cast.py 生成，勿手改。
   ========================================================================== */

/* MAXX（飞翔心） */
[data-char="MAXX"] {
  --main: #83cfb4 !important;
  --sub: #aee0ce !important;
  --rgb: 131, 207, 180 !important;
  --motion-color: #73b69e !important;}
[data-char="MAXX"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/-MAXX-76d9f7f42a7dbcf7.png") !important;
  cursor: pointer !important;}
[data-char="MAXX"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="MAXX"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="MAXX"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/-MAXX-76d9f7f42a7dbcf7.png") !important;}
[data-char="MAXX"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/-MAXX-76d9f7f42a7dbcf7.png") !important;}
[data-char="MAXX"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/-MAXX-dde77116815f4792.png") !important;}

/* 八重野萤（飞翔心） */
[data-char="八重野萤"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="八重野萤"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--81747ef3c1267501.png") !important;
  cursor: pointer !important;}
[data-char="八重野萤"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="八重野萤"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="八重野萤"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--81747ef3c1267501.png") !important;}
[data-char="八重野萤"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--81747ef3c1267501.png") !important;}
[data-char="八重野萤"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5c4b9c74318ff3a3.png") !important;}

/* 白鹭茉百合（飞翔心） */
[data-char="白鹭茉百合"], [data-char="茉百合"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="白鹭茉百合"] .custom-nvn-avatar-img, [data-char="茉百合"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--a27b92f0a5bd4aba.png") !important;
  cursor: pointer !important;}
[data-char="白鹭茉百合"] .custom-nvn-avatar-popover, [data-char="茉百合"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="白鹭茉百合"] .custom-nvn-avatar-img::after, [data-char="茉百合"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="白鹭茉百合"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5d68ac3bf15e7362.png") !important;}
[data-char="白鹭茉百合"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f1d6128b793d2d8f.png") !important;}
[data-char="白鹭茉百合"][data-action="害羞"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8157282087351610.png") !important;}
[data-char="白鹭茉百合"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1c47a8019066ba29.png") !important;}
[data-char="白鹭茉百合"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--25b52212ec842bfc.png") !important;}
[data-char="白鹭茉百合"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--dd0ddf2501851ac2.png") !important;}
[data-char="白鹭茉百合"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5e7badf7b8f5126e.png") !important;}
[data-char="白鹭茉百合"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5d68ac3bf15e7362.png") !important;}
[data-char="白鹭茉百合"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b71d927b620d0e74.png") !important;}
[data-char="白鹭茉百合"][data-action="难过"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e929682797968132.png") !important;}
[data-char="白鹭茉百合"][data-action="生气"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f789286039744e3f.png") !important;}
[data-char="白鹭茉百合"][data-action="通常"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a27b92f0a5bd4aba.png") !important;}
[data-char="白鹭茉百合"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ff009efa71fa00c2.png") !important;}
[data-char="白鹭茉百合"] .custom-nvn-portrait-full, [data-char="茉百合"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--14b337cfc4a7dca9.png") !important;}

/* 冰川京一郎（飞翔心） */
[data-char="冰川京一郎"] {
  --main: #69717c !important;
  --sub: #9ea3aa !important;
  --rgb: 105, 113, 124 !important;
  --motion-color: #5c636d !important;}
[data-char="冰川京一郎"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8cead9d7ab5551e5.png") !important;}
[data-char="冰川京一郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰川京一郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8cead9d7ab5551e5.png") !important;}
[data-char="冰川京一郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8cead9d7ab5551e5.png") !important;}

/* 稻羽结衣（飞翔心） */
[data-char="稻羽结衣"], [data-char="结衣"] {
  --main: #b89271 !important;
  --sub: #d1b8a3 !important;
  --rgb: 184, 146, 113 !important;
  --motion-color: #a28063 !important;}
[data-char="稻羽结衣"] .custom-nvn-avatar-img, [data-char="结衣"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--6c5493a013652a6f.png") !important;
  cursor: pointer !important;}
[data-char="稻羽结衣"] .custom-nvn-avatar-popover, [data-char="结衣"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="稻羽结衣"] .custom-nvn-avatar-img::after, [data-char="结衣"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="稻羽结衣"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="结衣"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cc5f50a524f65ac0.png") !important;}
[data-char="稻羽结衣"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f7f970f509901fb0.png") !important;}
[data-char="稻羽结衣"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5d2b5557a519fab4.png") !important;}
[data-char="稻羽结衣"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--26881b8bd4a6e468.png") !important;}
[data-char="稻羽结衣"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c29e0eb9715ecfba.png") !important;}
[data-char="稻羽结衣"][data-action="脸红难过"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--07d49639df181b3c.png") !important;}
[data-char="稻羽结衣"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--183477cbab6bf87b.png") !important;}
[data-char="稻羽结衣"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cc5f50a524f65ac0.png") !important;}
[data-char="稻羽结衣"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--22de4ff9a880ff8d.png") !important;}
[data-char="稻羽结衣"][data-action="难过"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bd1f87841b0236d1.png") !important;}
[data-char="稻羽结衣"][data-action="生气"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3d5ce9b43823718d.png") !important;}
[data-char="稻羽结衣"][data-action="通常"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6c5493a013652a6f.png") !important;}
[data-char="稻羽结衣"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1e0fe30ed747131c.png") !important;}
[data-char="稻羽结衣"] .custom-nvn-portrait-full, [data-char="结衣"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--4fcc1c039adffec9.png") !important;}

/* 电堂明（飞翔心） */
[data-char="电堂明"] {
  --main: #83cfb4 !important;
  --sub: #aee0ce !important;
  --rgb: 131, 207, 180 !important;
  --motion-color: #73b69e !important;}
[data-char="电堂明"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--75e3afb5ee80d256.png") !important;
  cursor: pointer !important;}
[data-char="电堂明"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="电堂明"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="电堂明"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--75e3afb5ee80d256.png") !important;}
[data-char="电堂明"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--75e3afb5ee80d256.png") !important;}
[data-char="电堂明"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5faa4e295c8ddaba.png") !important;}

/* 抚子（飞翔心） */
[data-char="抚子"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="抚子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--be781711019dc991.png") !important;
  cursor: pointer !important;}
[data-char="抚子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="抚子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="抚子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--be781711019dc991.png") !important;}
[data-char="抚子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--be781711019dc991.png") !important;}
[data-char="抚子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--640342f3c772050b.png") !important;}

/* 光（飞翔心） */
[data-char="光"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="光"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--c657d513459fd3be.png") !important;
  cursor: pointer !important;}
[data-char="光"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="光"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="光"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c657d513459fd3be.png") !important;}
[data-char="光"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c657d513459fd3be.png") !important;}
[data-char="光"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--55b779d9737219e6.png") !important;}

/* 皇千羽耶（飞翔心） */
[data-char="皇千羽耶"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="皇千羽耶"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3860c953b54f0a34.png") !important;
  cursor: pointer !important;}
[data-char="皇千羽耶"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皇千羽耶"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皇千羽耶"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3860c953b54f0a34.png") !important;}
[data-char="皇千羽耶"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3860c953b54f0a34.png") !important;}
[data-char="皇千羽耶"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5a0c07566af3c0f7.png") !important;}

/* 皇天音（飞翔心） */
[data-char="皇天音"], [data-char="天音"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="皇天音"] .custom-nvn-avatar-img, [data-char="天音"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--aae5980bde7c50d1.png") !important;
  cursor: pointer !important;}
[data-char="皇天音"] .custom-nvn-avatar-popover, [data-char="天音"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皇天音"] .custom-nvn-avatar-img::after, [data-char="天音"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皇天音"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="天音"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f5ca8bf1430d6147.png") !important;}
[data-char="皇天音"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="天音"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce9fd9dd44821062.png") !important;}
[data-char="皇天音"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="天音"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--54d6aa51b9451e85.png") !important;}
[data-char="皇天音"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--eb25e30ef38d2883.png") !important;}
[data-char="皇天音"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0fff87060e884cae.png") !important;}
[data-char="皇天音"][data-action="脸红难过"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bbf9de6fb9e1935a.png") !important;}
[data-char="皇天音"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9b0db7c9fe5ddad1.png") !important;}
[data-char="皇天音"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f5ca8bf1430d6147.png") !important;}
[data-char="皇天音"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--368f6d306f893882.png") !important;}
[data-char="皇天音"][data-action="难过"] .custom-nvn-avatar-img, [data-char="天音"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--07e14a389628abbd.png") !important;}
[data-char="皇天音"][data-action="生气"] .custom-nvn-avatar-img, [data-char="天音"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0feb2290ef442668.png") !important;}
[data-char="皇天音"][data-action="通常"] .custom-nvn-avatar-img, [data-char="天音"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aae5980bde7c50d1.png") !important;}
[data-char="皇天音"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="天音"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--dcbbc01ad533ceb6.png") !important;}
[data-char="皇天音"] .custom-nvn-portrait-full, [data-char="天音"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--1154d53ba280985f.png") !important;}

/* 皇奏龙（飞翔心） */
[data-char="皇奏龙"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="皇奏龙"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--0fb3fd8019ef9e05.png") !important;
  cursor: pointer !important;}
[data-char="皇奏龙"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皇奏龙"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皇奏龙"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0fb3fd8019ef9e05.png") !important;}
[data-char="皇奏龙"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0fb3fd8019ef9e05.png") !important;}
[data-char="皇奏龙"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--e8c05d085d837df1.png") !important;}

/* 九条玖琉璃（飞翔心） */
[data-char="九条玖琉璃"], [data-char="玖琉璃"] {
  --main: #7ca3d8 !important;
  --sub: #aac3e6 !important;
  --rgb: 124, 163, 216 !important;
  --motion-color: #6d8fbe !important;}
[data-char="九条玖琉璃"] .custom-nvn-avatar-img, [data-char="玖琉璃"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--69f500047ee50659.png") !important;
  cursor: pointer !important;}
[data-char="九条玖琉璃"] .custom-nvn-avatar-popover, [data-char="玖琉璃"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="九条玖琉璃"] .custom-nvn-avatar-img::after, [data-char="玖琉璃"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="九条玖琉璃"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="玖琉璃"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--69f500047ee50659.png") !important;}
[data-char="九条玖琉璃"][data-action="通常"] .custom-nvn-avatar-img, [data-char="玖琉璃"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--69f500047ee50659.png") !important;}
[data-char="九条玖琉璃"] .custom-nvn-portrait-full, [data-char="玖琉璃"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--010c4e51c894e031.png") !important;}

/* 水无濑樱子（飞翔心） */
[data-char="水无濑樱子"] {
  --main: #dd88a4 !important;
  --sub: #e9b2c4 !important;
  --rgb: 221, 136, 164 !important;
  --motion-color: #c27890 !important;}
[data-char="水无濑樱子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--cbe9719abaee30c4.png") !important;
  cursor: pointer !important;}
[data-char="水无濑樱子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="水无濑樱子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="水无濑樱子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6c35a387de06cd6f.png") !important;}
[data-char="水无濑樱子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cdfc0c3f0f260608.png") !important;}
[data-char="水无濑樱子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--911d76c11e670b82.png") !important;}
[data-char="水无濑樱子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1c05c29da7362613.png") !important;}
[data-char="水无濑樱子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7c8042775752243e.png") !important;}
[data-char="水无濑樱子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3cf066e7dde8d509.png") !important;}
[data-char="水无濑樱子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--06afaf0c8aec1611.png") !important;}
[data-char="水无濑樱子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6c35a387de06cd6f.png") !important;}
[data-char="水无濑樱子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c677e02e053e6a38.png") !important;}
[data-char="水无濑樱子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6fcd0544841a543f.png") !important;}
[data-char="水无濑樱子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--44fb251516592af5.png") !important;}
[data-char="水无濑樱子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cbe9719abaee30c4.png") !important;}
[data-char="水无濑樱子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4f3030955cd23be3.png") !important;}
[data-char="水无濑樱子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--4650c012d35106af.png") !important;}

/* 丝茉茉（飞翔心） */
[data-char="丝茉茉"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="丝茉茉"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f035f45f46079fcb.png") !important;
  cursor: pointer !important;}
[data-char="丝茉茉"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="丝茉茉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="丝茉茉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f035f45f46079fcb.png") !important;}
[data-char="丝茉茉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f035f45f46079fcb.png") !important;}
[data-char="丝茉茉"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--860c70a1f6162739.png") !important;}

/* 死神老师（飞翔心） */
[data-char="死神老师"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="死神老师"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--19ff3e3c0ffb11d1.png") !important;
  cursor: pointer !important;}
[data-char="死神老师"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="死神老师"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="死神老师"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--19ff3e3c0ffb11d1.png") !important;}
[data-char="死神老师"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--19ff3e3c0ffb11d1.png") !important;}
[data-char="死神老师"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--881e041503a294a9.png") !important;}

/* 小雪（飞翔心） */
[data-char="小雪"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="小雪"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--9db67e88eba351d6.png") !important;
  cursor: pointer !important;}
[data-char="小雪"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小雪"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小雪"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9db67e88eba351d6.png") !important;}
[data-char="小雪"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9db67e88eba351d6.png") !important;}
[data-char="小雪"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--6c093e6fed749bdf.png") !important;}

/* 雪代铃乃（飞翔心） */
[data-char="雪代铃乃"], [data-char="铃乃"] {
  --main: #acacb9 !important;
  --sub: #c9c9d2 !important;
  --rgb: 172, 172, 185 !important;
  --motion-color: #9797a3 !important;}
[data-char="雪代铃乃"] .custom-nvn-avatar-img, [data-char="铃乃"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d9f51c9b83025311.png") !important;
  cursor: pointer !important;}
[data-char="雪代铃乃"] .custom-nvn-avatar-popover, [data-char="铃乃"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="雪代铃乃"] .custom-nvn-avatar-img::after, [data-char="铃乃"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="雪代铃乃"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f907d039d7c582c5.png") !important;}
[data-char="雪代铃乃"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--768ce31ccac89122.png") !important;}
[data-char="雪代铃乃"][data-action="害羞"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b285571e1e5e06c0.png") !important;}
[data-char="雪代铃乃"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e354c0f58ff55010.png") !important;}
[data-char="雪代铃乃"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0c491f7cfc6dd1b8.png") !important;}
[data-char="雪代铃乃"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6c6c1569033354f5.png") !important;}
[data-char="雪代铃乃"][data-action="脸红难过"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2617862d56f73f96.png") !important;}
[data-char="雪代铃乃"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--568e37c490e28051.png") !important;}
[data-char="雪代铃乃"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f907d039d7c582c5.png") !important;}
[data-char="雪代铃乃"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--899f762b87a4e078.png") !important;}
[data-char="雪代铃乃"][data-action="难过"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3a5108a225dba5c2.png") !important;}
[data-char="雪代铃乃"][data-action="生气"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b3ba7f8630307d99.png") !important;}
[data-char="雪代铃乃"][data-action="通常"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d9f51c9b83025311.png") !important;}
[data-char="雪代铃乃"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--be2a7afefc789f36.png") !important;}
[data-char="雪代铃乃"] .custom-nvn-portrait-full, [data-char="铃乃"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--22341338598a048f.png") !important;}

/* 早河惠（飞翔心） */
[data-char="早河惠"] {
  --main: #8a6fb8 !important;
  --sub: #b3a1d1 !important;
  --rgb: 138, 111, 184 !important;
  --motion-color: #7962a2 !important;}
[data-char="早河惠"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--e99e811ca6c3bd0b.png") !important;
  cursor: pointer !important;}
[data-char="早河惠"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="早河惠"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="早河惠"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e99e811ca6c3bd0b.png") !important;}
[data-char="早河惠"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e99e811ca6c3bd0b.png") !important;}
[data-char="早河惠"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--3c7c371ef0932efb.png") !important;}

/* 冰堂芹香（芬芳） */
[data-char="冰堂芹香"] {
  --main: #d3b892 !important;
  --sub: #e2d1b8 !important;
  --rgb: 211, 184, 146 !important;
  --motion-color: #baa280 !important;}
[data-char="冰堂芹香"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--df4f5b7f9d43180d.png") !important;
  cursor: pointer !important;}
[data-char="冰堂芹香"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="冰堂芹香"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰堂芹香"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--936734450ea5a05d.png") !important;}
[data-char="冰堂芹香"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0dab4b4a63b3f2bc.png") !important;}
[data-char="冰堂芹香"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5e978b803656b9b9.png") !important;}
[data-char="冰堂芹香"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ba9aa98927a613a5.png") !important;}
[data-char="冰堂芹香"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--573431176342ba13.png") !important;}
[data-char="冰堂芹香"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--12621d0cd896a259.png") !important;}
[data-char="冰堂芹香"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cfb23ec2be7e0f22.png") !important;}
[data-char="冰堂芹香"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--936734450ea5a05d.png") !important;}
[data-char="冰堂芹香"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0f4b1f3e362ebf64.png") !important;}
[data-char="冰堂芹香"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c51bf7b52b2fd504.png") !important;}
[data-char="冰堂芹香"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3bf0a682af390ae2.png") !important;}
[data-char="冰堂芹香"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--df4f5b7f9d43180d.png") !important;}
[data-char="冰堂芹香"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d1c511f6e0e97355.png") !important;}
[data-char="冰堂芹香"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--95178cbf5b25349f.png") !important;}

/* 朝仓千弘（芬芳） */
[data-char="朝仓千弘"] {
  --main: #9e6747 !important;
  --sub: #c09c87 !important;
  --rgb: 158, 103, 71 !important;
  --motion-color: #8b5b3e !important;}
[data-char="朝仓千弘"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--7dd11b16024f5f30.png") !important;
  cursor: pointer !important;}
[data-char="朝仓千弘"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="朝仓千弘"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="朝仓千弘"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f5af9bf7707f95fc.png") !important;}
[data-char="朝仓千弘"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a2b809504f7e7393.png") !important;}
[data-char="朝仓千弘"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--13b9e803d5476688.png") !important;}
[data-char="朝仓千弘"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aada3e6cc7e340b8.png") !important;}
[data-char="朝仓千弘"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f362f8f4aa1924e4.png") !important;}
[data-char="朝仓千弘"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2a56ba9cf93a4f33.png") !important;}
[data-char="朝仓千弘"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f5af9bf7707f95fc.png") !important;}
[data-char="朝仓千弘"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6fad96dea79bf45c.png") !important;}
[data-char="朝仓千弘"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7a7d5e71ce2dd140.png") !important;}
[data-char="朝仓千弘"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--19be33eccc156c52.png") !important;}
[data-char="朝仓千弘"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7dd11b16024f5f30.png") !important;}
[data-char="朝仓千弘"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3be0113443514278.png") !important;}
[data-char="朝仓千弘"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--bf36df2a3f822f44.png") !important;}

/* 菱川琴枝（芬芳） */
[data-char="菱川琴枝"] {
  --main: #9e6747 !important;
  --sub: #c09c87 !important;
  --rgb: 158, 103, 71 !important;
  --motion-color: #8b5b3e !important;}
[data-char="菱川琴枝"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--dd2befb1b87fde4a.png") !important;
  cursor: pointer !important;}
[data-char="菱川琴枝"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="菱川琴枝"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="菱川琴枝"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--dd2befb1b87fde4a.png") !important;}
[data-char="菱川琴枝"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--dd2befb1b87fde4a.png") !important;}
[data-char="菱川琴枝"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--ab6a4a39d2c65234.png") !important;}

/* 牧濑皋月（芬芳） */
[data-char="牧濑皋月"] {
  --main: #5078af !important;
  --sub: #8da7cb !important;
  --rgb: 80, 120, 175 !important;
  --motion-color: #466a9a !important;}
[data-char="牧濑皋月"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8012393a4d343e0f.png") !important;
  cursor: pointer !important;}
[data-char="牧濑皋月"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="牧濑皋月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="牧濑皋月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2e2460f72935b16f.png") !important;}
[data-char="牧濑皋月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--69e00f9357304c0a.png") !important;}
[data-char="牧濑皋月"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a229e89eadce87c8.png") !important;}
[data-char="牧濑皋月"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6ead16b279b331b5.png") !important;}
[data-char="牧濑皋月"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fe1d23dadf88ca4a.png") !important;}
[data-char="牧濑皋月"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e09c966ce2db8062.png") !important;}
[data-char="牧濑皋月"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9261740381fc781b.png") !important;}
[data-char="牧濑皋月"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2e2460f72935b16f.png") !important;}
[data-char="牧濑皋月"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--81243abc08877aef.png") !important;}
[data-char="牧濑皋月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5839658b4849a38c.png") !important;}
[data-char="牧濑皋月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9c885bf5f6fe7f24.png") !important;}
[data-char="牧濑皋月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8012393a4d343e0f.png") !important;}
[data-char="牧濑皋月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--67397aeda93153b3.png") !important;}
[data-char="牧濑皋月"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--e95e68291330ae72.png") !important;}

/* 千原乃亚（芬芳） */
[data-char="千原乃亚"] {
  --main: #7a568f !important;
  --sub: #a991b6 !important;
  --rgb: 122, 86, 143 !important;
  --motion-color: #6b4c7e !important;}
[data-char="千原乃亚"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--4da5388be869ddcb.png") !important;
  cursor: pointer !important;}
[data-char="千原乃亚"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="千原乃亚"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="千原乃亚"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f760c3b17ef7966c.png") !important;}
[data-char="千原乃亚"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--86e5f2fa4dbb18df.png") !important;}
[data-char="千原乃亚"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a1bd83c382d59b93.png") !important;}
[data-char="千原乃亚"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9f6807a1825ed96c.png") !important;}
[data-char="千原乃亚"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f4c9f8938af20980.png") !important;}
[data-char="千原乃亚"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1d9bf3118d753a2b.png") !important;}
[data-char="千原乃亚"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3602b3af333c0d41.png") !important;}
[data-char="千原乃亚"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f760c3b17ef7966c.png") !important;}
[data-char="千原乃亚"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f259d08906d30cc8.png") !important;}
[data-char="千原乃亚"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--21ad3b7e7ef32400.png") !important;}
[data-char="千原乃亚"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d88d1626a420b3d2.png") !important;}
[data-char="千原乃亚"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4da5388be869ddcb.png") !important;}
[data-char="千原乃亚"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--05ed991eb8f1a54e.png") !important;}
[data-char="千原乃亚"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--eb2795948548570a.png") !important;}

/* 天城咲夜（芬芳） */
[data-char="天城咲夜"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="天城咲夜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8a27d536a7089457.png") !important;
  cursor: pointer !important;}
[data-char="天城咲夜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="天城咲夜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="天城咲夜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9587aa135cbe2aa7.png") !important;}
[data-char="天城咲夜"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--29afc13864e80021.png") !important;}
[data-char="天城咲夜"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--efc4a3cfc15137ad.png") !important;}
[data-char="天城咲夜"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9163cd76cfda2962.png") !important;}
[data-char="天城咲夜"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ba55820060a0c6b2.png") !important;}
[data-char="天城咲夜"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2be068bc43202992.png") !important;}
[data-char="天城咲夜"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--635b37a7f21c32c5.png") !important;}
[data-char="天城咲夜"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9587aa135cbe2aa7.png") !important;}
[data-char="天城咲夜"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--07d9390c56b21919.png") !important;}
[data-char="天城咲夜"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--469a2026d1194b60.png") !important;}
[data-char="天城咲夜"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a640a64748e795b8.png") !important;}
[data-char="天城咲夜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8a27d536a7089457.png") !important;}
[data-char="天城咲夜"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--044801152cf28e13.png") !important;}
[data-char="天城咲夜"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--501c662b8d22b3ca.png") !important;}

/* 天道八云（芬芳） */
[data-char="天道八云"] {
  --main: #9e6747 !important;
  --sub: #c09c87 !important;
  --rgb: 158, 103, 71 !important;
  --motion-color: #8b5b3e !important;}
[data-char="天道八云"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--a953b676b5dd2a97.png") !important;
  cursor: pointer !important;}
[data-char="天道八云"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="天道八云"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="天道八云"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a953b676b5dd2a97.png") !important;}
[data-char="天道八云"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a953b676b5dd2a97.png") !important;}
[data-char="天道八云"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--d274a21a19485d46.png") !important;}

/* 夏目朱里（芬芳） */
[data-char="夏目朱里"] {
  --main: #e8799f !important;
  --sub: #f0a8c1 !important;
  --rgb: 232, 121, 159 !important;
  --motion-color: #cc6a8c !important;}
[data-char="夏目朱里"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--895e3e04c5b496f9.png") !important;
  cursor: pointer !important;}
[data-char="夏目朱里"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目朱里"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目朱里"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cafe43c950cbd681.png") !important;}
[data-char="夏目朱里"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f4fec1b43137e873.png") !important;}
[data-char="夏目朱里"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1e1ffaf92f77a6e2.png") !important;}
[data-char="夏目朱里"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e31732690e1c2940.png") !important;}
[data-char="夏目朱里"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce227265052b1a29.png") !important;}
[data-char="夏目朱里"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--70e407cd2240533d.png") !important;}
[data-char="夏目朱里"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cafe43c950cbd681.png") !important;}
[data-char="夏目朱里"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b9c262c106e288ba.png") !important;}
[data-char="夏目朱里"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0084c60669aa54be.png") !important;}
[data-char="夏目朱里"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4129404a67165a5e.png") !important;}
[data-char="夏目朱里"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4a7f1b4bedfbf867.png") !important;}
[data-char="夏目朱里"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--895e3e04c5b496f9.png") !important;}
[data-char="夏目朱里"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7f775bb537c0ba7e.png") !important;}
[data-char="夏目朱里"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--a3a5ba6d03a90837.png") !important;}

/* 一之濑舞织（芬芳） */
[data-char="一之濑舞织"] {
  --main: #684f96 !important;
  --sub: #9d8dbb !important;
  --rgb: 104, 79, 150 !important;
  --motion-color: #5c4684 !important;}
[data-char="一之濑舞织"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--921511b16c4df204.png") !important;
  cursor: pointer !important;}
[data-char="一之濑舞织"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="一之濑舞织"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="一之濑舞织"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--921511b16c4df204.png") !important;}
[data-char="一之濑舞织"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--921511b16c4df204.png") !important;}
[data-char="一之濑舞织"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--982bca7f2f51ef09.png") !important;}

/* 安娜塔西亚（画布） */
[data-char="安娜塔西亚"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="安娜塔西亚"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--9cec81ebcb330f91.png") !important;
  cursor: pointer !important;}
[data-char="安娜塔西亚"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="安娜塔西亚"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="安娜塔西亚"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1929c657e4a1e28b.png") !important;}
[data-char="安娜塔西亚"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce789617f2705af2.png") !important;}
[data-char="安娜塔西亚"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b3a071d65933528a.png") !important;}
[data-char="安娜塔西亚"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--20fbcb618c24f793.png") !important;}
[data-char="安娜塔西亚"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2e5d1ee404548d60.png") !important;}
[data-char="安娜塔西亚"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c63f7d9820d286a9.png") !important;}
[data-char="安娜塔西亚"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c4ac97604225768b.png") !important;}
[data-char="安娜塔西亚"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1929c657e4a1e28b.png") !important;}
[data-char="安娜塔西亚"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--48713e9b814bea11.png") !important;}
[data-char="安娜塔西亚"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--19efd622fb1bd151.png") !important;}
[data-char="安娜塔西亚"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--384eb47306d77bb0.png") !important;}
[data-char="安娜塔西亚"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9cec81ebcb330f91.png") !important;}
[data-char="安娜塔西亚"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e39c8e9d9ebde501.png") !important;}
[data-char="安娜塔西亚"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--a43e8e086e84ee4f.png") !important;}

/* 凤怜奈（画布） */
[data-char="凤怜奈"] {
  --main: #ae4756 !important;
  --sub: #ca8791 !important;
  --rgb: 174, 71, 86 !important;
  --motion-color: #993e4c !important;}
[data-char="凤怜奈"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8cfd64c920a42a7e.png") !important;
  cursor: pointer !important;}
[data-char="凤怜奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="凤怜奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="凤怜奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d6a19f3c5d62f352.png") !important;}
[data-char="凤怜奈"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a7d18715629fa4dd.png") !important;}
[data-char="凤怜奈"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3a855c45bd274bec.png") !important;}
[data-char="凤怜奈"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--debd1fa0dff25fb2.png") !important;}
[data-char="凤怜奈"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c6f778d7f94b6416.png") !important;}
[data-char="凤怜奈"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--78ff21f4bc8575a2.png") !important;}
[data-char="凤怜奈"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--262ca33252cd6ab5.png") !important;}
[data-char="凤怜奈"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d6a19f3c5d62f352.png") !important;}
[data-char="凤怜奈"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8e895792d70477bd.png") !important;}
[data-char="凤怜奈"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4315cb6abf798597.png") !important;}
[data-char="凤怜奈"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b155f6c5c37b0f1a.png") !important;}
[data-char="凤怜奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8cfd64c920a42a7e.png") !important;}
[data-char="凤怜奈"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7eda9c80e54a0017.png") !important;}
[data-char="凤怜奈"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--e5848274209dafb8.png") !important;}

/* 凤一朗（画布） */
[data-char="凤一朗"] {
  --main: #9e6847 !important;
  --sub: #c09d87 !important;
  --rgb: 158, 104, 71 !important;
  --motion-color: #8b5c3e !important;}
[data-char="凤一朗"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--db1a0e7eb6ade387.png") !important;
  cursor: pointer !important;}
[data-char="凤一朗"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="凤一朗"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="凤一朗"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--db1a0e7eb6ade387.png") !important;}
[data-char="凤一朗"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--db1a0e7eb6ade387.png") !important;}
[data-char="凤一朗"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--ea92c8caddc9b16f.png") !important;}

/* 猫西昭江（画布） */
[data-char="猫西昭江"] {
  --main: #5da1a5 !important;
  --sub: #96c2c4 !important;
  --rgb: 93, 161, 165 !important;
  --motion-color: #528e91 !important;}
[data-char="猫西昭江"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--1ae124b758a26580.png") !important;
  cursor: pointer !important;}
[data-char="猫西昭江"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="猫西昭江"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="猫西昭江"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1ae124b758a26580.png") !important;}
[data-char="猫西昭江"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1ae124b758a26580.png") !important;}
[data-char="猫西昭江"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--f13a7437b6e83ae7.png") !important;}

/* 乾幸（画布） */
[data-char="乾幸"] {
  --main: #b89271 !important;
  --sub: #d1b8a3 !important;
  --rgb: 184, 146, 113 !important;
  --motion-color: #a28063 !important;}
[data-char="乾幸"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2e61f764be0e941a.png") !important;
  cursor: pointer !important;}
[data-char="乾幸"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="乾幸"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="乾幸"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6ca6817079c7ffbd.png") !important;}
[data-char="乾幸"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--085f86be3b4db1d7.png") !important;}
[data-char="乾幸"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b1b60703c5643469.png") !important;}
[data-char="乾幸"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0f60c2aa6380ae67.png") !important;}
[data-char="乾幸"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6f8cc353db220ba5.png") !important;}
[data-char="乾幸"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--073c4dfcb1c4173c.png") !important;}
[data-char="乾幸"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4cf4aed71f659c3e.png") !important;}
[data-char="乾幸"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6ca6817079c7ffbd.png") !important;}
[data-char="乾幸"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--29a2301dd6720615.png") !important;}
[data-char="乾幸"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--87d18cbf94612111.png") !important;}
[data-char="乾幸"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bc27fcaf640b27d1.png") !important;}
[data-char="乾幸"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2e61f764be0e941a.png") !important;}
[data-char="乾幸"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--25fd220ddde02864.png") !important;}
[data-char="乾幸"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--b1f2c005b7e1ed52.png") !important;}

/* 瑞木杷虎（画布） */
[data-char="瑞木杷虎"] {
  --main: #a26944 !important;
  --sub: #c39e85 !important;
  --rgb: 162, 105, 68 !important;
  --motion-color: #8f5c3c !important;}
[data-char="瑞木杷虎"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8bdcd76dfb146555.png") !important;
  cursor: pointer !important;}
[data-char="瑞木杷虎"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="瑞木杷虎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="瑞木杷虎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8bdcd76dfb146555.png") !important;}
[data-char="瑞木杷虎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8bdcd76dfb146555.png") !important;}
[data-char="瑞木杷虎"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--61bf3676689443f1.png") !important;}

/* 深山瑞希（画布） */
[data-char="深山瑞希"] {
  --main: #9e6747 !important;
  --sub: #c09c87 !important;
  --rgb: 158, 103, 71 !important;
  --motion-color: #8b5b3e !important;}
[data-char="深山瑞希"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--021a34721bcb1f68.png") !important;
  cursor: pointer !important;}
[data-char="深山瑞希"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="深山瑞希"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="深山瑞希"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c430c36104cd787b.png") !important;}
[data-char="深山瑞希"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c2b6b4042b843684.png") !important;}
[data-char="深山瑞希"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--519e544160a3a4e3.png") !important;}
[data-char="深山瑞希"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b60da60c4fda7580.png") !important;}
[data-char="深山瑞希"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f146215b9d55d189.png") !important;}
[data-char="深山瑞希"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--62ac599d16d2f752.png") !important;}
[data-char="深山瑞希"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e0a57890f5460b6c.png") !important;}
[data-char="深山瑞希"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c430c36104cd787b.png") !important;}
[data-char="深山瑞希"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6d291ae97cba9acc.png") !important;}
[data-char="深山瑞希"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0e6c203aae7cbe51.png") !important;}
[data-char="深山瑞希"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d0d7cd9d17b2c5c5.png") !important;}
[data-char="深山瑞希"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--021a34721bcb1f68.png") !important;}
[data-char="深山瑞希"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6dce6b64936b59d7.png") !important;}
[data-char="深山瑞希"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--b5fa2f5f33909cde.png") !important;}

/* 狮子堂千晴（画布） */
[data-char="狮子堂千晴"] {
  --main: #dfc069 !important;
  --sub: #ead69e !important;
  --rgb: 223, 192, 105 !important;
  --motion-color: #c4a95c !important;}
[data-char="狮子堂千晴"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--73f1c8e7892a743e.png") !important;
  cursor: pointer !important;}
[data-char="狮子堂千晴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="狮子堂千晴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="狮子堂千晴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--29c5bab1f6034332.png") !important;}
[data-char="狮子堂千晴"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1b0f80e724e07ddb.png") !important;}
[data-char="狮子堂千晴"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--41d9a5237521dad4.png") !important;}
[data-char="狮子堂千晴"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c26a2ac6bec11f2e.png") !important;}
[data-char="狮子堂千晴"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--65aafcd8c557ef57.png") !important;}
[data-char="狮子堂千晴"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--29c5bab1f6034332.png") !important;}
[data-char="狮子堂千晴"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9472261006f6052a.png") !important;}
[data-char="狮子堂千晴"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ff68947a1b996609.png") !important;}
[data-char="狮子堂千晴"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3da7d30aee7f2709.png") !important;}
[data-char="狮子堂千晴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--73f1c8e7892a743e.png") !important;}
[data-char="狮子堂千晴"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e1dd3f6ef0237a85.png") !important;}
[data-char="狮子堂千晴"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--09a96134a2092c21.png") !important;}

/* 沃尔夫冈（画布） */
[data-char="沃尔夫冈"] {
  --main: #9a8577 !important;
  --sub: #bdb0a7 !important;
  --rgb: 154, 133, 119 !important;
  --motion-color: #887569 !important;}
[data-char="沃尔夫冈"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d6b66412fb80634f.png") !important;}
[data-char="沃尔夫冈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="沃尔夫冈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d6b66412fb80634f.png") !important;}
[data-char="沃尔夫冈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d6b66412fb80634f.png") !important;}

/* 乌丸铁子（画布） */
[data-char="乌丸铁子"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="乌丸铁子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--578c196434d05dd4.png") !important;
  cursor: pointer !important;}
[data-char="乌丸铁子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="乌丸铁子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="乌丸铁子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--578c196434d05dd4.png") !important;}
[data-char="乌丸铁子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--578c196434d05dd4.png") !important;}
[data-char="乌丸铁子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--ba375b59efdd9642.png") !important;}

/* 乌丸紫月（画布） */
[data-char="乌丸紫月"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="乌丸紫月"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d10b82a7e44a3bea.png") !important;
  cursor: pointer !important;}
[data-char="乌丸紫月"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="乌丸紫月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="乌丸紫月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--01a6766c2b0b110c.png") !important;}
[data-char="乌丸紫月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--65724fdb90916cc2.png") !important;}
[data-char="乌丸紫月"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2d508c846cf1682d.png") !important;}
[data-char="乌丸紫月"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--181ed60b4fb9db2a.png") !important;}
[data-char="乌丸紫月"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e8868b11d7cd7a19.png") !important;}
[data-char="乌丸紫月"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--545fe36d6622e6b6.png") !important;}
[data-char="乌丸紫月"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c97d9e2764d73675.png") !important;}
[data-char="乌丸紫月"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--01a6766c2b0b110c.png") !important;}
[data-char="乌丸紫月"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--13b40c1c648f3fe4.png") !important;}
[data-char="乌丸紫月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1ec343b714d064d0.png") !important;}
[data-char="乌丸紫月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cc678bdc9556fda6.png") !important;}
[data-char="乌丸紫月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d10b82a7e44a3bea.png") !important;}
[data-char="乌丸紫月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--11e8ffcd544918a2.png") !important;}
[data-char="乌丸紫月"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--f28b96fa50fbfbed.png") !important;}

/* 佐藤洋（画布） */
[data-char="佐藤洋"] {
  --main: #9f785d !important;
  --sub: #c1a796 !important;
  --rgb: 159, 120, 93 !important;
  --motion-color: #8c6a52 !important;}
[data-char="佐藤洋"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3feeb8c01fe5d5e5.png") !important;
  cursor: pointer !important;}
[data-char="佐藤洋"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="佐藤洋"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="佐藤洋"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3feeb8c01fe5d5e5.png") !important;}
[data-char="佐藤洋"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3feeb8c01fe5d5e5.png") !important;}
[data-char="佐藤洋"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--36645f8b8db67739.png") !important;}

/* 八十岛壹与（近月） */
[data-char="八十岛壹与"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="八十岛壹与"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--a88b63a721e3f142.png") !important;}
[data-char="八十岛壹与"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="八十岛壹与"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a88b63a721e3f142.png") !important;}
[data-char="八十岛壹与"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a88b63a721e3f142.png") !important;}

/* 布琉艾特（近月） */
[data-char="布琉艾特"] {
  --main: #9f785d !important;
  --sub: #c1a796 !important;
  --rgb: 159, 120, 93 !important;
  --motion-color: #8c6a52 !important;}
[data-char="布琉艾特"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--ca927c2e7784f7f4.png") !important;
  cursor: pointer !important;}
[data-char="布琉艾特"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="布琉艾特"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="布琉艾特"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8ee6493ab96ad3c3.png") !important;}
[data-char="布琉艾特"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--448ea06fade80acc.png") !important;}
[data-char="布琉艾特"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--382c0be30e769630.png") !important;}
[data-char="布琉艾特"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3fd204e33dddf06d.png") !important;}
[data-char="布琉艾特"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--289a97c7b9f850c6.png") !important;}
[data-char="布琉艾特"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1c4c2e0b9d45b5ea.png") !important;}
[data-char="布琉艾特"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--89bcd508be2aef64.png") !important;}
[data-char="布琉艾特"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4452f284df0adb53.png") !important;}
[data-char="布琉艾特"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--df070fb3ae23e1b8.png") !important;}
[data-char="布琉艾特"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8ee6493ab96ad3c3.png") !important;}
[data-char="布琉艾特"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4006d8dcefdfd8d3.png") !important;}
[data-char="布琉艾特"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8a40a67711dfc4d4.png") !important;}
[data-char="布琉艾特"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4f8d47432ff79787.png") !important;}
[data-char="布琉艾特"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ca927c2e7784f7f4.png") !important;}
[data-char="布琉艾特"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9ca25e288a1f0849.png") !important;}
[data-char="布琉艾特"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--3af331839ab2ffd5.png") !important;}

/* 枞山红叶（近月） */
[data-char="枞山红叶"] {
  --main: #a97a52 !important;
  --sub: #c7a98f !important;
  --rgb: 169, 122, 82 !important;
  --motion-color: #956b48 !important;}
[data-char="枞山红叶"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--bebdc4e4c89363d5.png") !important;
  cursor: pointer !important;}
[data-char="枞山红叶"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="枞山红叶"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="枞山红叶"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bebdc4e4c89363d5.png") !important;}
[data-char="枞山红叶"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bebdc4e4c89363d5.png") !important;}
[data-char="枞山红叶"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--1e54b00b3168c363.png") !important;}

/* 大藏安东尼（近月） */
[data-char="大藏安东尼"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="大藏安东尼"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--72dcdd77dc7167f9.png") !important;}
[data-char="大藏安东尼"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏安东尼"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--72dcdd77dc7167f9.png") !important;}
[data-char="大藏安东尼"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--72dcdd77dc7167f9.png") !important;}

/* 大藏骏我（近月） */
[data-char="大藏骏我"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="大藏骏我"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--36a501901d4c8282.png") !important;}
[data-char="大藏骏我"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏骏我"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--36a501901d4c8282.png") !important;}
[data-char="大藏骏我"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--36a501901d4c8282.png") !important;}

/* 大藏里想奈（近月） */
[data-char="大藏里想奈"] {
  --main: #6a5591 !important;
  --sub: #9e90b8 !important;
  --rgb: 106, 85, 145 !important;
  --motion-color: #5d4b80 !important;}
[data-char="大藏里想奈"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--4c47fbb3c9254fa5.png") !important;
  cursor: pointer !important;}
[data-char="大藏里想奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="大藏里想奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏里想奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--033dea30014db9a8.png") !important;}
[data-char="大藏里想奈"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9c7d60fefa8e0215.png") !important;}
[data-char="大藏里想奈"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a046305d40c545dc.png") !important;}
[data-char="大藏里想奈"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7a34c058c10dffe3.png") !important;}
[data-char="大藏里想奈"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ec8ad8fec953144d.png") !important;}
[data-char="大藏里想奈"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--01ba0ae36bcd3925.png") !important;}
[data-char="大藏里想奈"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aa009a4d22fb6181.png") !important;}
[data-char="大藏里想奈"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--edc1b9eb4af76310.png") !important;}
[data-char="大藏里想奈"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--033dea30014db9a8.png") !important;}
[data-char="大藏里想奈"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--31afdb762eb28d8d.png") !important;}
[data-char="大藏里想奈"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6afa71a435e6a4ef.png") !important;}
[data-char="大藏里想奈"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b77aedb191a53b52.png") !important;}
[data-char="大藏里想奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4c47fbb3c9254fa5.png") !important;}
[data-char="大藏里想奈"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0240c162d75dcb14.png") !important;}
[data-char="大藏里想奈"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--534b9c191a34b8e4.png") !important;}

/* 大藏衣远（近月） */
[data-char="大藏衣远"] {
  --main: #6a5591 !important;
  --sub: #9e90b8 !important;
  --rgb: 106, 85, 145 !important;
  --motion-color: #5d4b80 !important;}
[data-char="大藏衣远"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d7ed59b49f330af9.png") !important;
  cursor: pointer !important;}
[data-char="大藏衣远"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="大藏衣远"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏衣远"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d7ed59b49f330af9.png") !important;}
[data-char="大藏衣远"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d7ed59b49f330af9.png") !important;}
[data-char="大藏衣远"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--68d7cc69d088b726.png") !important;}

/* 迪特琳德（近月） */
[data-char="迪特琳德"] {
  --main: #acacb3 !important;
  --sub: #c9c9ce !important;
  --rgb: 172, 172, 179 !important;
  --motion-color: #97979e !important;}
[data-char="迪特琳德"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--de762f2d755cad71.png") !important;
  cursor: pointer !important;}
[data-char="迪特琳德"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="迪特琳德"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="迪特琳德"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--de762f2d755cad71.png") !important;}
[data-char="迪特琳德"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--de762f2d755cad71.png") !important;}
[data-char="迪特琳德"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--47456b299fda69ac.png") !important;}

/* 花之宫瑞穗（近月） */
[data-char="花之宫瑞穗"] {
  --main: #a98e66 !important;
  --sub: #c7b69c !important;
  --rgb: 169, 142, 102 !important;
  --motion-color: #957d5a !important;}
[data-char="花之宫瑞穗"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--098fd0f2c7b14b24.png") !important;
  cursor: pointer !important;}
[data-char="花之宫瑞穗"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="花之宫瑞穗"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="花之宫瑞穗"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--10daa3e41c7fe2e2.png") !important;}
[data-char="花之宫瑞穗"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6930fb6103d53f50.png") !important;}
[data-char="花之宫瑞穗"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0b55ecaf633226c8.png") !important;}
[data-char="花之宫瑞穗"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--743380c5d0dfd1a8.png") !important;}
[data-char="花之宫瑞穗"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b9ff504db71ddfbe.png") !important;}
[data-char="花之宫瑞穗"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b42c5255c085b467.png") !important;}
[data-char="花之宫瑞穗"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--10daa3e41c7fe2e2.png") !important;}
[data-char="花之宫瑞穗"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ee836d06d47096c1.png") !important;}
[data-char="花之宫瑞穗"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--92be549690aa8dc2.png") !important;}
[data-char="花之宫瑞穗"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--80bdab86c3d77361.png") !important;}
[data-char="花之宫瑞穗"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--098fd0f2c7b14b24.png") !important;}
[data-char="花之宫瑞穗"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0f77fdc4aa0af853.png") !important;}
[data-char="花之宫瑞穗"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--efe9cce668b2f59b.png") !important;}

/* 华花（近月） */
[data-char="华花"] {
  --main: #598d78 !important;
  --sub: #93b5a7 !important;
  --rgb: 89, 141, 120 !important;
  --motion-color: #4e7c6a !important;}
[data-char="华花"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--37ab1f99bbd4759e.png") !important;
  cursor: pointer !important;}
[data-char="华花"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="华花"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="华花"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--37ab1f99bbd4759e.png") !important;}
[data-char="华花"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--37ab1f99bbd4759e.png") !important;}
[data-char="华花"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--0aa1444efe4e5405.png") !important;}

/* 莉莉安奴（近月） */
[data-char="莉莉安奴"] {
  --main: #d87482 !important;
  --sub: #e6a5ae !important;
  --rgb: 216, 116, 130 !important;
  --motion-color: #be6672 !important;}
[data-char="莉莉安奴"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8bdaa9c52399c31e.png") !important;
  cursor: pointer !important;}
[data-char="莉莉安奴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="莉莉安奴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="莉莉安奴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8bdaa9c52399c31e.png") !important;}
[data-char="莉莉安奴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8bdaa9c52399c31e.png") !important;}
[data-char="莉莉安奴"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5e820ffaae34df92.png") !important;}

/* 柳之濑凑（近月） */
[data-char="柳之濑凑"] {
  --main: #dd88a2 !important;
  --sub: #e9b2c3 !important;
  --rgb: 221, 136, 162 !important;
  --motion-color: #c2788f !important;}
[data-char="柳之濑凑"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2fb6c225e40826d6.png") !important;
  cursor: pointer !important;}
[data-char="柳之濑凑"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="柳之濑凑"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="柳之濑凑"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ea70291373008042.png") !important;}
[data-char="柳之濑凑"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--79da661d6bad38f7.png") !important;}
[data-char="柳之濑凑"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3bf59ce06959536f.png") !important;}
[data-char="柳之濑凑"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--06ea297831c1ebca.png") !important;}
[data-char="柳之濑凑"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--85d2cf735428b664.png") !important;}
[data-char="柳之濑凑"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--580aaa7dd5481e3b.png") !important;}
[data-char="柳之濑凑"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--abeb54c5cd82c988.png") !important;}
[data-char="柳之濑凑"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ea70291373008042.png") !important;}
[data-char="柳之濑凑"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a3b72b3b3f0ac3e8.png") !important;}
[data-char="柳之濑凑"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e164be36cb7f93ca.png") !important;}
[data-char="柳之濑凑"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--121e5c24963755d1.png") !important;}
[data-char="柳之濑凑"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2fb6c225e40826d6.png") !important;}
[data-char="柳之濑凑"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9bf0ce40934e52d3.png") !important;}
[data-char="柳之濑凑"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--a9b97af1ce89c818.png") !important;}

/* 梅丽尔（近月） */
[data-char="梅丽尔"] {
  --main: #d3b892 !important;
  --sub: #e2d1b8 !important;
  --rgb: 211, 184, 146 !important;
  --motion-color: #baa280 !important;}
[data-char="梅丽尔"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2f090a5934dc1242.png") !important;
  cursor: pointer !important;}
[data-char="梅丽尔"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="梅丽尔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="梅丽尔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c38fb0bcce28fd4b.png") !important;}
[data-char="梅丽尔"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--352bc0db72a2ab69.png") !important;}
[data-char="梅丽尔"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cb8f4e866e380409.png") !important;}
[data-char="梅丽尔"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8bab6a7530edd178.png") !important;}
[data-char="梅丽尔"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--98f146af8698b684.png") !important;}
[data-char="梅丽尔"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fdb00494f431fde4.png") !important;}
[data-char="梅丽尔"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c19de44d795e8493.png") !important;}
[data-char="梅丽尔"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c38fb0bcce28fd4b.png") !important;}
[data-char="梅丽尔"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--86eef952f9675a81.png") !important;}
[data-char="梅丽尔"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a76c3936825a6c07.png") !important;}
[data-char="梅丽尔"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--386b4b5a2898e29e.png") !important;}
[data-char="梅丽尔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2f090a5934dc1242.png") !important;}
[data-char="梅丽尔"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a73401c6a363990f.png") !important;}
[data-char="梅丽尔"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--48c5466aff37cfa5.png") !important;}

/* 名波七爱（近月） */
[data-char="名波七爱"] {
  --main: #d3b892 !important;
  --sub: #e2d1b8 !important;
  --rgb: 211, 184, 146 !important;
  --motion-color: #baa280 !important;}
[data-char="名波七爱"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d7da97b877c3a1b2.png") !important;
  cursor: pointer !important;}
[data-char="名波七爱"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="名波七爱"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="名波七爱"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d7da97b877c3a1b2.png") !important;}
[data-char="名波七爱"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d7da97b877c3a1b2.png") !important;}
[data-char="名波七爱"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--16326501810c467c.png") !important;}

/* 让·皮埃尔（近月） */
[data-char="让·皮埃尔"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="让·皮埃尔"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3deb8e14d2382498.png") !important;}
[data-char="让·皮埃尔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="让·皮埃尔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3deb8e14d2382498.png") !important;}
[data-char="让·皮埃尔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3deb8e14d2382498.png") !important;}

/* 萨莎（近月） */
[data-char="萨莎"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="萨莎"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--a9c0672534db4435.png") !important;
  cursor: pointer !important;}
[data-char="萨莎"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="萨莎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="萨莎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a9c0672534db4435.png") !important;}
[data-char="萨莎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a9c0672534db4435.png") !important;}
[data-char="萨莎"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--9e53c48116c0a3fc.png") !important;}

/* 山吹八千代（近月） */
[data-char="山吹八千代"] {
  --main: #9e6747 !important;
  --sub: #c09c87 !important;
  --rgb: 158, 103, 71 !important;
  --motion-color: #8b5b3e !important;}
[data-char="山吹八千代"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--003b9a21123530f7.png") !important;
  cursor: pointer !important;}
[data-char="山吹八千代"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="山吹八千代"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="山吹八千代"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--003b9a21123530f7.png") !important;}
[data-char="山吹八千代"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--003b9a21123530f7.png") !important;}
[data-char="山吹八千代"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--34313893262729e5.png") !important;}

/* 杉村北斗（近月） */
[data-char="杉村北斗"] {
  --main: #8dc29d !important;
  --sub: #b5d7bf !important;
  --rgb: 141, 194, 157 !important;
  --motion-color: #7cab8a !important;}
[data-char="杉村北斗"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--42bf9e6a83b9466d.png") !important;
  cursor: pointer !important;}
[data-char="杉村北斗"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="杉村北斗"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="杉村北斗"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--42bf9e6a83b9466d.png") !important;}
[data-char="杉村北斗"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--42bf9e6a83b9466d.png") !important;}
[data-char="杉村北斗"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--b6f25f7de803ac05.png") !important;}

/* 瓦莲莉娅（近月） */
[data-char="瓦莲莉娅"] {
  --main: #acacb9 !important;
  --sub: #c9c9d2 !important;
  --rgb: 172, 172, 185 !important;
  --motion-color: #9797a3 !important;}
[data-char="瓦莲莉娅"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--60ecbd7fd8a1a88f.png") !important;
  cursor: pointer !important;}
[data-char="瓦莲莉娅"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="瓦莲莉娅"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="瓦莲莉娅"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--60ecbd7fd8a1a88f.png") !important;}
[data-char="瓦莲莉娅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--60ecbd7fd8a1a88f.png") !important;}
[data-char="瓦莲莉娅"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--d20dd80cee7cc62c.png") !important;}

/* 小仓朝日（近月） */
[data-char="小仓朝日"] {
  --main: #745d9b !important;
  --sub: #a596be !important;
  --rgb: 116, 93, 155 !important;
  --motion-color: #665288 !important;}
[data-char="小仓朝日"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--85d3177552e21c35.png") !important;
  cursor: pointer !important;}
[data-char="小仓朝日"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小仓朝日"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小仓朝日"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a3893873f93b5c0a.png") !important;}
[data-char="小仓朝日"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--44868d47b42a0153.png") !important;}
[data-char="小仓朝日"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3aa265182db6aaa4.png") !important;}
[data-char="小仓朝日"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9f09de7f42367aaa.png") !important;}
[data-char="小仓朝日"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f06e5df5db823c10.png") !important;}
[data-char="小仓朝日"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7c639b20ee90acbc.png") !important;}
[data-char="小仓朝日"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0b94f59a7b096755.png") !important;}
[data-char="小仓朝日"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a3893873f93b5c0a.png") !important;}
[data-char="小仓朝日"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5fbe7a1ce248ea4f.png") !important;}
[data-char="小仓朝日"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a676a5246f34eb81.png") !important;}
[data-char="小仓朝日"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--02fcee14e4d4793d.png") !important;}
[data-char="小仓朝日"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--85d3177552e21c35.png") !important;}
[data-char="小仓朝日"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--47bbee67e77cbcb7.png") !important;}
[data-char="小仓朝日"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--8afce5d44077b05f.png") !important;}

/* 樱小路露娜（近月） */
[data-char="樱小路露娜"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="樱小路露娜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f33b36910183ef0a.png") !important;
  cursor: pointer !important;}
[data-char="樱小路露娜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="樱小路露娜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="樱小路露娜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--584d530f9e8d1eba.png") !important;}
[data-char="樱小路露娜"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e6faf21f7f4f5392.png") !important;}
[data-char="樱小路露娜"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--14d63ce9e4d62466.png") !important;}
[data-char="樱小路露娜"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c8f84c4d1d20cebf.png") !important;}
[data-char="樱小路露娜"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1528225e6ec9866f.png") !important;}
[data-char="樱小路露娜"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8cb04955382d66d7.png") !important;}
[data-char="樱小路露娜"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--81316bfe896663bf.png") !important;}
[data-char="樱小路露娜"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--30491510bac3c850.png") !important;}
[data-char="樱小路露娜"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d96e1bc30865f32a.png") !important;}
[data-char="樱小路露娜"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--386ea77f01dc6665.png") !important;}
[data-char="樱小路露娜"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a9854950576a7f89.png") !important;}
[data-char="樱小路露娜"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--584d530f9e8d1eba.png") !important;}
[data-char="樱小路露娜"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--05d2f7dfd0e67ea6.png") !important;}
[data-char="樱小路露娜"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a3094aa63e043861.png") !important;}
[data-char="樱小路露娜"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d48e48f5704c3c8c.png") !important;}
[data-char="樱小路露娜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f33b36910183ef0a.png") !important;}
[data-char="樱小路露娜"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0ceac66c8ab2833f.png") !important;}
[data-char="樱小路露娜"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--7368fa3bcf2fa32a.png") !important;}

/* 尤希尔（近月） */
[data-char="尤希尔"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="尤希尔"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d2a805366492526b.png") !important;
  cursor: pointer !important;}
[data-char="尤希尔"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="尤希尔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="尤希尔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--71543a3e2bd91a1d.png") !important;}
[data-char="尤希尔"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f7a90173834e5548.png") !important;}
[data-char="尤希尔"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f6ef889ec580adde.png") !important;}
[data-char="尤希尔"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8d21545843afbf7c.png") !important;}
[data-char="尤希尔"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0fd85db4d6fc9842.png") !important;}
[data-char="尤希尔"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cbf70b72704f1b60.png") !important;}
[data-char="尤希尔"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b203c6eeb4ffef68.png") !important;}
[data-char="尤希尔"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--71543a3e2bd91a1d.png") !important;}
[data-char="尤希尔"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--19bf65d577521c2a.png") !important;}
[data-char="尤希尔"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e6aac1dc27543e0d.png") !important;}
[data-char="尤希尔"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ec22149e8dd49d96.png") !important;}
[data-char="尤希尔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d2a805366492526b.png") !important;}
[data-char="尤希尔"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--85c1dc65198734ad.png") !important;}
[data-char="尤希尔"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--0aecfc4d88982244.png") !important;}

/* 不知火怜（轮舞曲） */
[data-char="不知火怜"] {
  --main: #586a8d !important;
  --sub: #929eb5 !important;
  --rgb: 88, 106, 141 !important;
  --motion-color: #4d5d7c !important;}
[data-char="不知火怜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3fd5ee830f49591f.png") !important;}
[data-char="不知火怜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="不知火怜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3fd5ee830f49591f.png") !important;}
[data-char="不知火怜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3fd5ee830f49591f.png") !important;}

/* 江利原美月（轮舞曲） */
[data-char="江利原美月"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="江利原美月"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--1e2c3f9a49cfad5d.png") !important;
  cursor: pointer !important;}
[data-char="江利原美月"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="江利原美月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="江利原美月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4407867eb0445aea.png") !important;}
[data-char="江利原美月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4108ee8974bd2f94.png") !important;}
[data-char="江利原美月"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2e354437188724da.png") !important;}
[data-char="江利原美月"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--695846d727e0f03b.png") !important;}
[data-char="江利原美月"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--12ca47c72100227a.png") !important;}
[data-char="江利原美月"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4407867eb0445aea.png") !important;}
[data-char="江利原美月"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0802b146fa666209.png") !important;}
[data-char="江利原美月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--59461a247110fd75.png") !important;}
[data-char="江利原美月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--34028043afed8372.png") !important;}
[data-char="江利原美月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1e2c3f9a49cfad5d.png") !important;}
[data-char="江利原美月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1df4e5285f5122b5.png") !important;}
[data-char="江利原美月"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--cef2aad6499ca465.png") !important;}

/* 堺浩一（轮舞曲） */
[data-char="堺浩一"] {
  --main: #a97a52 !important;
  --sub: #c7a98f !important;
  --rgb: 169, 122, 82 !important;
  --motion-color: #956b48 !important;}
[data-char="堺浩一"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--86bba89cbc2217ea.png") !important;}
[data-char="堺浩一"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="堺浩一"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--86bba89cbc2217ea.png") !important;}
[data-char="堺浩一"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--86bba89cbc2217ea.png") !important;}

/* 门胁樱（轮舞曲） */
[data-char="门胁樱"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="门胁樱"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--ce417cd3bac90f54.png") !important;
  cursor: pointer !important;}
[data-char="门胁樱"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="门胁樱"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="门胁樱"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--334a984cc58e376b.png") !important;}
[data-char="门胁樱"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0b1b9b4e35b0d92e.png") !important;}
[data-char="门胁樱"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--07023fe4a5fd703b.png") !important;}
[data-char="门胁樱"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5a54d6b5fb4d338e.png") !important;}
[data-char="门胁樱"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--301df9f0002c0e09.png") !important;}
[data-char="门胁樱"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--247a8414ece87031.png") !important;}
[data-char="门胁樱"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f6c5ccfc9f8666b4.png") !important;}
[data-char="门胁樱"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--334a984cc58e376b.png") !important;}
[data-char="门胁樱"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--65243f1bca9ea48b.png") !important;}
[data-char="门胁樱"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2145e203f94406d6.png") !important;}
[data-char="门胁樱"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3eca914564bf924e.png") !important;}
[data-char="门胁樱"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce417cd3bac90f54.png") !important;}
[data-char="门胁樱"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f0fc5bfa9cbd9023.png") !important;}
[data-char="门胁樱"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--d004b44dfc873f71.png") !important;}

/* 双叶沙那子（轮舞曲） */
[data-char="双叶沙那子"] {
  --main: #a98e66 !important;
  --sub: #c7b69c !important;
  --rgb: 169, 142, 102 !important;
  --motion-color: #957d5a !important;}
[data-char="双叶沙那子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3a1cbf810704689d.png") !important;
  cursor: pointer !important;}
[data-char="双叶沙那子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="双叶沙那子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="双叶沙那子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3a1cbf810704689d.png") !important;}
[data-char="双叶沙那子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3a1cbf810704689d.png") !important;}
[data-char="双叶沙那子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--890638ec4bb4561d.png") !important;}

/* 天司凉香（轮舞曲） */
[data-char="天司凉香"] {
  --main: #7a568f !important;
  --sub: #a991b6 !important;
  --rgb: 122, 86, 143 !important;
  --motion-color: #6b4c7e !important;}
[data-char="天司凉香"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2ca24b939ce3147b.png") !important;
  cursor: pointer !important;}
[data-char="天司凉香"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="天司凉香"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="天司凉香"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c040abcbb26a4276.png") !important;}
[data-char="天司凉香"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--370f2cffd6a5d6b8.png") !important;}
[data-char="天司凉香"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ec2e8263099e38f5.png") !important;}
[data-char="天司凉香"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ffc55032c5fa2f6d.png") !important;}
[data-char="天司凉香"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cf31384060153526.png") !important;}
[data-char="天司凉香"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--54dde465371798fd.png") !important;}
[data-char="天司凉香"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--daef6e9cf7a53555.png") !important;}
[data-char="天司凉香"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c040abcbb26a4276.png") !important;}
[data-char="天司凉香"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--453fa5e8f0aaecc9.png") !important;}
[data-char="天司凉香"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3d2979e7b6ae271f.png") !important;}
[data-char="天司凉香"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6be10a0877e5df5d.png") !important;}
[data-char="天司凉香"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2ca24b939ce3147b.png") !important;}
[data-char="天司凉香"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b07feecca4fa9f04.png") !important;}
[data-char="天司凉香"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--726f125dd09ba1a8.png") !important;}

/* 小峰真奈美（轮舞曲） */
[data-char="小峰真奈美"] {
  --main: #dd88a1 !important;
  --sub: #e9b2c2 !important;
  --rgb: 221, 136, 161 !important;
  --motion-color: #c2788e !important;}
[data-char="小峰真奈美"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--24d0cb08475393f3.png") !important;
  cursor: pointer !important;}
[data-char="小峰真奈美"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小峰真奈美"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小峰真奈美"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--87551538c1df3cb9.png") !important;}
[data-char="小峰真奈美"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5346151138e492bf.png") !important;}
[data-char="小峰真奈美"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9c58e6691a4c6eac.png") !important;}
[data-char="小峰真奈美"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--86e9a9fdf8779bae.png") !important;}
[data-char="小峰真奈美"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fed6753ece28bdab.png") !important;}
[data-char="小峰真奈美"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8fd5167b12fed41c.png") !important;}
[data-char="小峰真奈美"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--11f0df5408d83622.png") !important;}
[data-char="小峰真奈美"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--87551538c1df3cb9.png") !important;}
[data-char="小峰真奈美"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8cd4480ba621e8a8.png") !important;}
[data-char="小峰真奈美"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4f4593fda2b862db.png") !important;}
[data-char="小峰真奈美"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a37f866d2c152f73.png") !important;}
[data-char="小峰真奈美"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--24d0cb08475393f3.png") !important;}
[data-char="小峰真奈美"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4cb983a00606e95e.png") !important;}
[data-char="小峰真奈美"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--e6f94ce1ee49f326.png") !important;}

/* 小石川珠音（轮舞曲） */
[data-char="小石川珠音"] {
  --main: #c9a97a !important;
  --sub: #dcc7a9 !important;
  --rgb: 201, 169, 122 !important;
  --motion-color: #b1956b !important;}
[data-char="小石川珠音"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--07b4b150a8ff4094.png") !important;
  cursor: pointer !important;}
[data-char="小石川珠音"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小石川珠音"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小石川珠音"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--07b4b150a8ff4094.png") !important;}
[data-char="小石川珠音"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--07b4b150a8ff4094.png") !important;}
[data-char="小石川珠音"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--71605b036d1f706d.png") !important;}

/* 新垣若菜（轮舞曲） */
[data-char="新垣若菜"] {
  --main: #e5aa5a !important;
  --sub: #eec894 !important;
  --rgb: 229, 170, 90 !important;
  --motion-color: #ca964f !important;}
[data-char="新垣若菜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--bdd4578cca495812.png") !important;
  cursor: pointer !important;}
[data-char="新垣若菜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="新垣若菜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新垣若菜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce16485ec390d470.png") !important;}
[data-char="新垣若菜"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c432838e2b3d97c8.png") !important;}
[data-char="新垣若菜"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--72259e1856a531c8.png") !important;}
[data-char="新垣若菜"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ea2e145fa81abc17.png") !important;}
[data-char="新垣若菜"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a3373ef398a6ae3b.png") !important;}
[data-char="新垣若菜"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bc734dcb37436c16.png") !important;}
[data-char="新垣若菜"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fb2904a1c45ccc16.png") !important;}
[data-char="新垣若菜"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce16485ec390d470.png") !important;}
[data-char="新垣若菜"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1f7ea73b5e8b7d57.png") !important;}
[data-char="新垣若菜"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--79f1e654ac673a4e.png") !important;}
[data-char="新垣若菜"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4debd82a3bca0579.png") !important;}
[data-char="新垣若菜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bdd4578cca495812.png") !important;}
[data-char="新垣若菜"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d2e1439553a808c3.png") !important;}
[data-char="新垣若菜"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--68708fd4bb5cf3df.png") !important;}

/* 真原葵（轮舞曲） */
[data-char="真原葵"] {
  --main: #9e6747 !important;
  --sub: #c09c87 !important;
  --rgb: 158, 103, 71 !important;
  --motion-color: #8b5b3e !important;}
[data-char="真原葵"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--492a55e82a412ae9.png") !important;
  cursor: pointer !important;}
[data-char="真原葵"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="真原葵"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="真原葵"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8beb33086750b81b.png") !important;}
[data-char="真原葵"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8e7f83d0b60f17ce.png") !important;}
[data-char="真原葵"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a1e26f9de75b03c0.png") !important;}
[data-char="真原葵"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5aef578c5f024241.png") !important;}
[data-char="真原葵"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6e5f9cd48b3fb436.png") !important;}
[data-char="真原葵"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--39f4088db83bcede.png") !important;}
[data-char="真原葵"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ce5cc49008da4df9.png") !important;}
[data-char="真原葵"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8beb33086750b81b.png") !important;}
[data-char="真原葵"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bfa59fced3d21c9f.png") !important;}
[data-char="真原葵"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--90cde5003ff51d32.png") !important;}
[data-char="真原葵"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--431750d5889b911b.png") !important;}
[data-char="真原葵"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--492a55e82a412ae9.png") !important;}
[data-char="真原葵"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bc20b28f7983430c.png") !important;}
[data-char="真原葵"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--e9db54583a5d023d.png") !important;}

/* 真原祐里（轮舞曲） */
[data-char="真原祐里"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="真原祐里"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--23ec968a2eabbdfd.png") !important;
  cursor: pointer !important;}
[data-char="真原祐里"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="真原祐里"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="真原祐里"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a18911f9a3236033.png") !important;}
[data-char="真原祐里"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d0dd3bddbf779d05.png") !important;}
[data-char="真原祐里"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--291b80581479cc3f.png") !important;}
[data-char="真原祐里"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0838858a21374920.png") !important;}
[data-char="真原祐里"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9d274745180a6020.png") !important;}
[data-char="真原祐里"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7a4ab801631aa5dc.png") !important;}
[data-char="真原祐里"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--186034efb52184ab.png") !important;}
[data-char="真原祐里"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a18911f9a3236033.png") !important;}
[data-char="真原祐里"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--43709c83485d4dcd.png") !important;}
[data-char="真原祐里"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ba5275ad1f02c05b.png") !important;}
[data-char="真原祐里"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e60f3970c2133fd4.png") !important;}
[data-char="真原祐里"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--23ec968a2eabbdfd.png") !important;}
[data-char="真原祐里"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5723d93a35b7fa40.png") !important;}
[data-char="真原祐里"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--ae667f59f3f3dcb2.png") !important;}

/* 佐佐原亮子（轮舞曲） */
[data-char="佐佐原亮子"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="佐佐原亮子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--77a96e1085df6d2f.png") !important;
  cursor: pointer !important;}
[data-char="佐佐原亮子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="佐佐原亮子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="佐佐原亮子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--77a96e1085df6d2f.png") !important;}
[data-char="佐佐原亮子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--77a96e1085df6d2f.png") !important;}
[data-char="佐佐原亮子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--9599d8eec278cb5f.png") !important;}

/* 不二卫哉（柠水） */
[data-char="不二卫哉"] {
  --main: #dfc069 !important;
  --sub: #ead69e !important;
  --rgb: 223, 192, 105 !important;
  --motion-color: #c4a95c !important;}
[data-char="不二卫哉"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--bd19bb94342e7161.png") !important;}
[data-char="不二卫哉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="不二卫哉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bd19bb94342e7161.png") !important;}
[data-char="不二卫哉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bd19bb94342e7161.png") !important;}

/* 茶园那优花（柠水） */
[data-char="茶园那优花"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="茶园那优花"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--e1e92048c9563987.png") !important;
  cursor: pointer !important;}
[data-char="茶园那优花"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="茶园那优花"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="茶园那优花"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--de250dff4a0d5eb0.png") !important;}
[data-char="茶园那优花"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--60a8d02686adc0ea.png") !important;}
[data-char="茶园那优花"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fd4364652b6bb7aa.png") !important;}
[data-char="茶园那优花"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5398c972e35d4b0a.png") !important;}
[data-char="茶园那优花"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0c5fdbca899ab1f4.png") !important;}
[data-char="茶园那优花"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--48719e6a75732572.png") !important;}
[data-char="茶园那优花"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5868c2427bf617ab.png") !important;}
[data-char="茶园那优花"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bee8dfa352cd2cc6.png") !important;}
[data-char="茶园那优花"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6a79cfa5b8669172.png") !important;}
[data-char="茶园那优花"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--de250dff4a0d5eb0.png") !important;}
[data-char="茶园那优花"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c7eb0b01562b7f96.png") !important;}
[data-char="茶园那优花"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5ad171673435f104.png") !important;}
[data-char="茶园那优花"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cca205180b9fc042.png") !important;}
[data-char="茶园那优花"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e1e92048c9563987.png") !important;}
[data-char="茶园那优花"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b349bf823b5fa7c8.png") !important;}
[data-char="茶园那优花"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5ccfa48cd9d4d3ab.png") !important;}

/* 岛越月望（柠水） */
[data-char="岛越月望"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="岛越月望"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--66cd1a7b49851997.png") !important;
  cursor: pointer !important;}
[data-char="岛越月望"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="岛越月望"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="岛越月望"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2ac7ffc56783a240.png") !important;}
[data-char="岛越月望"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0bb0b720cbb6fab4.png") !important;}
[data-char="岛越月望"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--620a33d006470123.png") !important;}
[data-char="岛越月望"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--620dfe117780aaaa.png") !important;}
[data-char="岛越月望"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c141e3dfab4f9c27.png") !important;}
[data-char="岛越月望"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a2aa5858ecec0be3.png") !important;}
[data-char="岛越月望"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b3323772ba0e1369.png") !important;}
[data-char="岛越月望"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7d13fbd0f8e85456.png") !important;}
[data-char="岛越月望"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ae7a770bb899ab7a.png") !important;}
[data-char="岛越月望"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0f40493ea37f308a.png") !important;}
[data-char="岛越月望"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fd376798f797f3c9.png") !important;}
[data-char="岛越月望"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2ac7ffc56783a240.png") !important;}
[data-char="岛越月望"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--33c71256f64fccbd.png") !important;}
[data-char="岛越月望"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e637536f4936348b.png") !important;}
[data-char="岛越月望"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aed5ec142b33c361.png") !important;}
[data-char="岛越月望"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--66cd1a7b49851997.png") !important;}
[data-char="岛越月望"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1787bcd37599f51f.png") !important;}
[data-char="岛越月望"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--dc0cc720524462d5.png") !important;}

/* 二见原莉莉子（柠水） */
[data-char="二见原莉莉子"] {
  --main: #ca92a3 !important;
  --sub: #ddb8c3 !important;
  --rgb: 202, 146, 163 !important;
  --motion-color: #b2808f !important;}
[data-char="二见原莉莉子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--a4dcefed03ba40b5.png") !important;
  cursor: pointer !important;}
[data-char="二见原莉莉子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="二见原莉莉子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="二见原莉莉子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fc4060dfd87f6b74.png") !important;}
[data-char="二见原莉莉子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d68dbeb4d4d473a0.png") !important;}
[data-char="二见原莉莉子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bdf5348c2188f4f1.png") !important;}
[data-char="二见原莉莉子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--918f1ffa490891d2.png") !important;}
[data-char="二见原莉莉子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--72c4e62f02495935.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e10048560a2b25ae.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--67d3a0a73f5bb27f.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0b3b5fc89c9a09c2.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8595b41e9f14d797.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0dc5a044f0c4a57c.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3f75e3ca5f5917c7.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f58c5db78150838d.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fc4060dfd87f6b74.png") !important;}
[data-char="二见原莉莉子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5f68f569ade665b5.png") !important;}
[data-char="二见原莉莉子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0be0b8d7b452f5f7.png") !important;}
[data-char="二见原莉莉子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e12983fb89c19837.png") !important;}
[data-char="二见原莉莉子"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ddbaecd4493708de.png") !important;}
[data-char="二见原莉莉子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a4dcefed03ba40b5.png") !important;}
[data-char="二见原莉莉子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cd9817857776794a.png") !important;}
[data-char="二见原莉莉子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--45d6b7af98087092.png") !important;}

/* 砾川杰（柠水） */
[data-char="砾川杰"] {
  --main: #9a9aa2 !important;
  --sub: #bdbdc3 !important;
  --rgb: 154, 154, 162 !important;
  --motion-color: #88888f !important;}
[data-char="砾川杰"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--b067843043fc1fc6.png") !important;}
[data-char="砾川杰"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="砾川杰"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b067843043fc1fc6.png") !important;}
[data-char="砾川杰"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b067843043fc1fc6.png") !important;}

/* 砾川美玖（柠水） */
[data-char="砾川美玖"] {
  --main: #a6a6bf !important;
  --sub: #c5c5d5 !important;
  --rgb: 166, 166, 191 !important;
  --motion-color: #9292a8 !important;}
[data-char="砾川美玖"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--286edf32e8db6a61.png") !important;
  cursor: pointer !important;}
[data-char="砾川美玖"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="砾川美玖"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="砾川美玖"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e5ba66a8a906a542.png") !important;}
[data-char="砾川美玖"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--783e6bd184f967ce.png") !important;}
[data-char="砾川美玖"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a5ef9809ff4e80a6.png") !important;}
[data-char="砾川美玖"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0883ed4f6b0b7846.png") !important;}
[data-char="砾川美玖"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8c0164de666d1be0.png") !important;}
[data-char="砾川美玖"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ba7187b22b1d197b.png") !important;}
[data-char="砾川美玖"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--67fd334d1af7303e.png") !important;}
[data-char="砾川美玖"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e5ba66a8a906a542.png") !important;}
[data-char="砾川美玖"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--28fd14ffa16dc24c.png") !important;}
[data-char="砾川美玖"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b7c1932ed97934f8.png") !important;}
[data-char="砾川美玖"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--debc7e69c29807c6.png") !important;}
[data-char="砾川美玖"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--286edf32e8db6a61.png") !important;}
[data-char="砾川美玖"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d94a1e15e7f0c807.png") !important;}
[data-char="砾川美玖"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5dbf9001228f02bf.png") !important;}

/* 砾川雄真（柠水） */
[data-char="砾川雄真"] {
  --main: #9a9aa2 !important;
  --sub: #bdbdc3 !important;
  --rgb: 154, 154, 162 !important;
  --motion-color: #88888f !important;}
[data-char="砾川雄真"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--a5d64df580095ac2.png") !important;}
[data-char="砾川雄真"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="砾川雄真"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a5d64df580095ac2.png") !important;}
[data-char="砾川雄真"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a5d64df580095ac2.png") !important;}

/* 阳见惠凪（柠水） */
[data-char="阳见惠凪"] {
  --main: #dd88a1 !important;
  --sub: #e9b2c2 !important;
  --rgb: 221, 136, 161 !important;
  --motion-color: #c2788e !important;}
[data-char="阳见惠凪"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f18a3bc312267368.png") !important;
  cursor: pointer !important;}
[data-char="阳见惠凪"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="阳见惠凪"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="阳见惠凪"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c99fd81a3d1072a4.png") !important;}
[data-char="阳见惠凪"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e1fa71bffb0573b4.png") !important;}
[data-char="阳见惠凪"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4b7379d11ec64d59.png") !important;}
[data-char="阳见惠凪"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3026400b4eba28c5.png") !important;}
[data-char="阳见惠凪"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d9b7e0e47603976e.png") !important;}
[data-char="阳见惠凪"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d0a04707f3f328eb.png") !important;}
[data-char="阳见惠凪"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0d3a29c912181d93.png") !important;}
[data-char="阳见惠凪"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c99fd81a3d1072a4.png") !important;}
[data-char="阳见惠凪"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4e90fb9b233db50c.png") !important;}
[data-char="阳见惠凪"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4311bd1115b940cc.png") !important;}
[data-char="阳见惠凪"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--80ddc4e60b6f4e80.png") !important;}
[data-char="阳见惠凪"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f18a3bc312267368.png") !important;}
[data-char="阳见惠凪"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6dd1ef621c616fcb.png") !important;}
[data-char="阳见惠凪"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--9b3ec8837691c1cd.png") !important;}

/* 隐杏珠（柠水） */
[data-char="隐杏珠"] {
  --main: #7a568f !important;
  --sub: #a991b6 !important;
  --rgb: 122, 86, 143 !important;
  --motion-color: #6b4c7e !important;}
[data-char="隐杏珠"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d1d88f3507010700.png") !important;
  cursor: pointer !important;}
[data-char="隐杏珠"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="隐杏珠"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="隐杏珠"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cf11a45e8f731954.png") !important;}
[data-char="隐杏珠"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b0f786a33ed50406.png") !important;}
[data-char="隐杏珠"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--03574908b8c6361e.png") !important;}
[data-char="隐杏珠"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e6d41fde6c02015b.png") !important;}
[data-char="隐杏珠"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--290331c951ec4ce8.png") !important;}
[data-char="隐杏珠"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d48b53a3c9f3ec65.png") !important;}
[data-char="隐杏珠"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5ed4b5c317bfd449.png") !important;}
[data-char="隐杏珠"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--250b7e3f9bab37a9.png") !important;}
[data-char="隐杏珠"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f3ce60243eeffebb.png") !important;}
[data-char="隐杏珠"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cf11a45e8f731954.png") !important;}
[data-char="隐杏珠"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fc430e1cbffef3c1.png") !important;}
[data-char="隐杏珠"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b883b86bbc45039d.png") !important;}
[data-char="隐杏珠"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--91d7818e590c4236.png") !important;}
[data-char="隐杏珠"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d1d88f3507010700.png") !important;}
[data-char="隐杏珠"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--488844b5bed45c07.png") !important;}
[data-char="隐杏珠"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--b3e3a4d156248c91.png") !important;}

/* 仲原大梦（柠水） */
[data-char="仲原大梦"] {
  --main: #a16a44 !important;
  --sub: #c29e85 !important;
  --rgb: 161, 106, 68 !important;
  --motion-color: #8e5d3c !important;}
[data-char="仲原大梦"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d15b0a002510bd96.png") !important;}
[data-char="仲原大梦"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="仲原大梦"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d15b0a002510bd96.png") !important;}
[data-char="仲原大梦"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d15b0a002510bd96.png") !important;}

/* 莲华（万华镜） */
[data-char="莲华"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="莲华"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--03a246ddb10517f8.png") !important;
  cursor: pointer !important;}
[data-char="莲华"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="莲华"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="莲华"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--03a246ddb10517f8.png") !important;}
[data-char="莲华"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--03a246ddb10517f8.png") !important;}
[data-char="莲华"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5950e7f860429458.png") !important;}

/* 铃森伊千果（万华镜） */
[data-char="铃森伊千果"] {
  --main: #d3b892 !important;
  --sub: #e2d1b8 !important;
  --rgb: 211, 184, 146 !important;
  --motion-color: #baa280 !important;}
[data-char="铃森伊千果"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--bbefaa813a59241f.png") !important;
  cursor: pointer !important;}
[data-char="铃森伊千果"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="铃森伊千果"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="铃森伊千果"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--071cbdcb981d3c1c.png") !important;}
[data-char="铃森伊千果"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f24bc55555b591cc.png") !important;}
[data-char="铃森伊千果"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f8c45a4af429854f.png") !important;}
[data-char="铃森伊千果"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bd5ded1720a3da0b.png") !important;}
[data-char="铃森伊千果"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--413f8448e0da8193.png") !important;}
[data-char="铃森伊千果"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--663b39fcf3ed162d.png") !important;}
[data-char="铃森伊千果"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--429c4fcd76dd77b4.png") !important;}
[data-char="铃森伊千果"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--071cbdcb981d3c1c.png") !important;}
[data-char="铃森伊千果"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--649c8559b72db503.png") !important;}
[data-char="铃森伊千果"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--80a5e0f39c711202.png") !important;}
[data-char="铃森伊千果"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d2dfb956fd3cebbf.png") !important;}
[data-char="铃森伊千果"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bbefaa813a59241f.png") !important;}
[data-char="铃森伊千果"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0bd1c1e6481e2705.png") !important;}
[data-char="铃森伊千果"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--a28b799007f5a35a.png") !important;}

/* 藤堂咲（万华镜） */
[data-char="藤堂咲"] {
  --main: #ead87b !important;
  --sub: #f1e6a9 !important;
  --rgb: 234, 216, 123 !important;
  --motion-color: #cebe6c !important;}
[data-char="藤堂咲"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--928fb3031dc70b9e.png") !important;
  cursor: pointer !important;}
[data-char="藤堂咲"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="藤堂咲"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="藤堂咲"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--928fb3031dc70b9e.png") !important;}
[data-char="藤堂咲"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--928fb3031dc70b9e.png") !important;}
[data-char="藤堂咲"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--df149f61aa45a905.png") !important;}

/* 觋礼次郎（万华镜） */
[data-char="觋礼次郎"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="觋礼次郎"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--e06c3858ea39b8ca.png") !important;}
[data-char="觋礼次郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="觋礼次郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e06c3858ea39b8ca.png") !important;}
[data-char="觋礼次郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e06c3858ea39b8ca.png") !important;}

/* 觋夕莉（万华镜） */
[data-char="觋夕莉"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="觋夕莉"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--cfcbd58db3f96a60.png") !important;
  cursor: pointer !important;}
[data-char="觋夕莉"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="觋夕莉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="觋夕莉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cc3663ece45137c4.png") !important;}
[data-char="觋夕莉"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--821f52f297b10d4c.png") !important;}
[data-char="觋夕莉"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4c240fd5c2d9819a.png") !important;}
[data-char="觋夕莉"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5fbddd9ae9a52e3a.png") !important;}
[data-char="觋夕莉"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--78080ab0f9f33f37.png") !important;}
[data-char="觋夕莉"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6b24706719ae073f.png") !important;}
[data-char="觋夕莉"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fbb5b11d8943e431.png") !important;}
[data-char="觋夕莉"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--027404f1a7d12b7e.png") !important;}
[data-char="觋夕莉"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a98d5ff0f675b78e.png") !important;}
[data-char="觋夕莉"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cc3663ece45137c4.png") !important;}
[data-char="觋夕莉"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--9a07c35c71c6526f.png") !important;}
[data-char="觋夕莉"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b75912eb2044d5d7.png") !important;}
[data-char="觋夕莉"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d3c1fa9ccbfabb14.png") !important;}
[data-char="觋夕莉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cfcbd58db3f96a60.png") !important;}
[data-char="觋夕莉"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--af9e42e0c4e68d61.png") !important;}
[data-char="觋夕莉"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--80b8216824a9f5d4.png") !important;}

/* 觋夕摩（万华镜） */
[data-char="觋夕摩"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="觋夕摩"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d8e9f756dab64ef1.png") !important;
  cursor: pointer !important;}
[data-char="觋夕摩"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="觋夕摩"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="觋夕摩"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--96e5a98606296be8.png") !important;}
[data-char="觋夕摩"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--958555e7391b92cc.png") !important;}
[data-char="觋夕摩"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--96e5a98606296be8.png") !important;}
[data-char="觋夕摩"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b5624723944927d3.png") !important;}
[data-char="觋夕摩"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d8e9f756dab64ef1.png") !important;}
[data-char="觋夕摩"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--8df830180d6dbfd3.png") !important;}

/* 御殿场镜子（万华镜） */
[data-char="御殿场镜子"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="御殿场镜子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3659841d09174d71.png") !important;
  cursor: pointer !important;}
[data-char="御殿场镜子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="御殿场镜子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="御殿场镜子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c62de72c5d23e799.png") !important;}
[data-char="御殿场镜子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3f91877fbafc77ba.png") !important;}
[data-char="御殿场镜子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d7b15b1d59110778.png") !important;}
[data-char="御殿场镜子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ed85112ae9175090.png") !important;}
[data-char="御殿场镜子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2a09b4aa3f386457.png") !important;}
[data-char="御殿场镜子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b5729c6bb9164d1c.png") !important;}
[data-char="御殿场镜子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cc75322666c7fd81.png") !important;}
[data-char="御殿场镜子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0bf348eadabc3f11.png") !important;}
[data-char="御殿场镜子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--63807e573c626f0b.png") !important;}
[data-char="御殿场镜子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a1d8143a3e611e3a.png") !important;}
[data-char="御殿场镜子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3fbd7c90bbf8b68e.png") !important;}
[data-char="御殿场镜子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c62de72c5d23e799.png") !important;}
[data-char="御殿场镜子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--79a16c7b5b3521da.png") !important;}
[data-char="御殿场镜子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b7ac05e4994016f3.png") !important;}
[data-char="御殿场镜子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b4e08a6902798944.png") !important;}
[data-char="御殿场镜子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3659841d09174d71.png") !important;}
[data-char="御殿场镜子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--71776b42c2567e33.png") !important;}
[data-char="御殿场镜子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--a8adb2d4acf8c140.png") !important;}

/* 本间丽华（樱之诗） */
[data-char="本间丽华"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="本间丽华"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f82b7bc3c3191c15.png") !important;
  cursor: pointer !important;}
[data-char="本间丽华"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="本间丽华"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="本间丽华"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f82b7bc3c3191c15.png") !important;}
[data-char="本间丽华"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f82b7bc3c3191c15.png") !important;}
[data-char="本间丽华"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--2be4614914d07a71.png") !important;}

/* 冰川里奈（樱之诗） */
[data-char="冰川里奈"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="冰川里奈"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--ffe908a4554c8903.png") !important;
  cursor: pointer !important;}
[data-char="冰川里奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="冰川里奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰川里奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e76bc10477d8fe68.png") !important;}
[data-char="冰川里奈"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--388ec9c750f2ac6c.png") !important;}
[data-char="冰川里奈"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--99e79d3a5c2d0e4c.png") !important;}
[data-char="冰川里奈"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7558b86c9cd985a1.png") !important;}
[data-char="冰川里奈"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e41ab72c9c42d26d.png") !important;}
[data-char="冰川里奈"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--16062f7640abee3f.png") !important;}
[data-char="冰川里奈"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--be6880f9e5f74c31.png") !important;}
[data-char="冰川里奈"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1c6d6505a847dc4d.png") !important;}
[data-char="冰川里奈"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4b74c26a1cca1acd.png") !important;}
[data-char="冰川里奈"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e76bc10477d8fe68.png") !important;}
[data-char="冰川里奈"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b94ce727fe56e193.png") !important;}
[data-char="冰川里奈"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--256b8aa69efd5a6d.png") !important;}
[data-char="冰川里奈"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--abad38963c0a0883.png") !important;}
[data-char="冰川里奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ffe908a4554c8903.png") !important;}
[data-char="冰川里奈"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--68607d6b7b103b33.png") !important;}
[data-char="冰川里奈"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--f2255e79670b6e6f.png") !important;}

/* 冰川露莉莴（樱之诗） */
[data-char="冰川露莉莴"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="冰川露莉莴"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f62bad390ef20357.png") !important;
  cursor: pointer !important;}
[data-char="冰川露莉莴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="冰川露莉莴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰川露莉莴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f62bad390ef20357.png") !important;}
[data-char="冰川露莉莴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f62bad390ef20357.png") !important;}
[data-char="冰川露莉莴"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--76667a482926454b.png") !important;}

/* 伯奇（樱之诗） */
[data-char="伯奇"] {
  --main: #a16a44 !important;
  --sub: #c29e85 !important;
  --rgb: 161, 106, 68 !important;
  --motion-color: #8e5d3c !important;}
[data-char="伯奇"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--376ec5a47fb39f29.png") !important;
  cursor: pointer !important;}
[data-char="伯奇"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="伯奇"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="伯奇"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--376ec5a47fb39f29.png") !important;}
[data-char="伯奇"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--376ec5a47fb39f29.png") !important;}
[data-char="伯奇"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--cc27cd0250b1853b.png") !important;}

/* 草薙健一郎（樱之诗） */
[data-char="草薙健一郎"] {
  --main: #c3b8a2 !important;
  --sub: #d8d1c3 !important;
  --rgb: 195, 184, 162 !important;
  --motion-color: #aca28f !important;}
[data-char="草薙健一郎"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--48e2b10639040406.png") !important;}
[data-char="草薙健一郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="草薙健一郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--48e2b10639040406.png") !important;}
[data-char="草薙健一郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--48e2b10639040406.png") !important;}

/* 草薙直哉（樱之诗） */
[data-char="草薙直哉"] {
  --main: #a8abb4 !important;
  --sub: #c6c8ce !important;
  --rgb: 168, 171, 180 !important;
  --motion-color: #94969e !important;}
[data-char="草薙直哉"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/c3180da89e62f2278b1dd0ff5912e3742aa694adaf5a4ab4.png") !important;}
div.custom-nvn-dialogue[data-char="草薙直哉"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="草薙直哉"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="草薙直哉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="草薙直哉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/c3180da89e62f2278b1dd0ff5912e3742aa694adaf5a4ab4.png") !important;}
[data-char="草薙直哉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/c3180da89e62f2278b1dd0ff5912e3742aa694adaf5a4ab4.png") !important;}

/* 川内野铃菜（樱之诗） */
[data-char="川内野铃菜"] {
  --main: #9a6f4b !important;
  --sub: #bda18a !important;
  --rgb: 154, 111, 75 !important;
  --motion-color: #886242 !important;}
[data-char="川内野铃菜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--68a1f0be41ce9f73.png") !important;
  cursor: pointer !important;}
[data-char="川内野铃菜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="川内野铃菜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="川内野铃菜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--68a1f0be41ce9f73.png") !important;}
[data-char="川内野铃菜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--68a1f0be41ce9f73.png") !important;}
[data-char="川内野铃菜"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--90b07adb77b006e4.png") !important;}

/* 川内野优美（樱之诗） */
[data-char="川内野优美"] {
  --main: #7a568f !important;
  --sub: #a991b6 !important;
  --rgb: 122, 86, 143 !important;
  --motion-color: #6b4c7e !important;}
[data-char="川内野优美"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--3397e5253ea4d089.png") !important;
  cursor: pointer !important;}
[data-char="川内野优美"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="川内野优美"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="川内野优美"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--132dfbf6185d1a56.png") !important;}
[data-char="川内野优美"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--56106e27cb47651a.png") !important;}
[data-char="川内野优美"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3d91cf03dfd58a33.png") !important;}
[data-char="川内野优美"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aedaa4ff9f08b3ad.png") !important;}
[data-char="川内野优美"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ae5d38f2a5284333.png") !important;}
[data-char="川内野优美"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e63b3ba8ea79fd18.png") !important;}
[data-char="川内野优美"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bc4623ea43bca138.png") !important;}
[data-char="川内野优美"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8d06cec5d389a89a.png") !important;}
[data-char="川内野优美"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--009252ac630d6750.png") !important;}
[data-char="川内野优美"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--132dfbf6185d1a56.png") !important;}
[data-char="川内野优美"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--11d3fc612abf9ffc.png") !important;}
[data-char="川内野优美"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--554035042715ab16.png") !important;}
[data-char="川内野优美"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--71ba12038a16f4f0.png") !important;}
[data-char="川内野优美"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--3397e5253ea4d089.png") !important;}
[data-char="川内野优美"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--67be24f5148cd48f.png") !important;}
[data-char="川内野优美"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--0c7225b1d6d3f2b3.png") !important;}

/* 吹（樱之诗） */
[data-char="吹"] {
  --main: #9285a4 !important;
  --sub: #b8b0c4 !important;
  --rgb: 146, 133, 164 !important;
  --motion-color: #807590 !important;}
[data-char="吹"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--04c022404d102d0c.png") !important;
  cursor: pointer !important;}
[data-char="吹"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="吹"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="吹"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--04c022404d102d0c.png") !important;}
[data-char="吹"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--04c022404d102d0c.png") !important;}
[data-char="吹"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--5b7ab4b3d3b40efd.png") !important;}

/* 东浪见（樱之诗） */
[data-char="东浪见"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="东浪见"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--d0c02f8aa9629c9a.png") !important;}
[data-char="东浪见"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="东浪见"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d0c02f8aa9629c9a.png") !important;}
[data-char="东浪见"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d0c02f8aa9629c9a.png") !important;}

/* 恩田宁（樱之诗） */
[data-char="恩田宁"] {
  --main: #cdb198 !important;
  --sub: #deccbc !important;
  --rgb: 205, 177, 152 !important;
  --motion-color: #b49c86 !important;}
[data-char="恩田宁"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--55785aab403c9446.png") !important;
  cursor: pointer !important;}
[data-char="恩田宁"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="恩田宁"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="恩田宁"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--55785aab403c9446.png") !important;}
[data-char="恩田宁"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--55785aab403c9446.png") !important;}
[data-char="恩田宁"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--adc5ad12cffd35c6.png") !important;}

/* 栗山奈津子（樱之诗） */
[data-char="栗山奈津子"] {
  --main: #6a5591 !important;
  --sub: #9e90b8 !important;
  --rgb: 106, 85, 145 !important;
  --motion-color: #5d4b80 !important;}
[data-char="栗山奈津子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--37796b18b948d46f.png") !important;
  cursor: pointer !important;}
[data-char="栗山奈津子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="栗山奈津子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="栗山奈津子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--37796b18b948d46f.png") !important;}
[data-char="栗山奈津子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--37796b18b948d46f.png") !important;}
[data-char="栗山奈津子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--2624104eae73372a.png") !important;}

/* 泷泽托马斯（樱之诗） */
[data-char="泷泽托马斯"] {
  --main: #ddc688 !important;
  --sub: #e9dab2 !important;
  --rgb: 221, 198, 136 !important;
  --motion-color: #c2ae78 !important;}
[data-char="泷泽托马斯"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f97383e04729dcce.png") !important;}
[data-char="泷泽托马斯"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="泷泽托马斯"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f97383e04729dcce.png") !important;}
[data-char="泷泽托马斯"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f97383e04729dcce.png") !important;}

/* 麦提弗里曼（樱之诗） */
[data-char="麦提弗里曼"] {
  --main: #d3b892 !important;
  --sub: #e2d1b8 !important;
  --rgb: 211, 184, 146 !important;
  --motion-color: #baa280 !important;}
[data-char="麦提弗里曼"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--403403f707328d34.png") !important;}
[data-char="麦提弗里曼"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="麦提弗里曼"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--403403f707328d34.png") !important;}
[data-char="麦提弗里曼"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--403403f707328d34.png") !important;}

/* 明石亘（樱之诗） */
[data-char="明石亘"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="明石亘"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8d80bde2d7894d4a.png") !important;
  cursor: pointer !important;}
[data-char="明石亘"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="明石亘"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="明石亘"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8d80bde2d7894d4a.png") !important;}
[data-char="明石亘"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8d80bde2d7894d4a.png") !important;}
[data-char="明石亘"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--d5392f3fe1ee1745.png") !important;}

/* 明石小牧（樱之诗） */
[data-char="明石小牧"] {
  --main: #a98e66 !important;
  --sub: #c7b69c !important;
  --rgb: 169, 142, 102 !important;
  --motion-color: #957d5a !important;}
[data-char="明石小牧"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--6af96e23d0091621.png") !important;
  cursor: pointer !important;}
[data-char="明石小牧"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="明石小牧"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="明石小牧"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6af96e23d0091621.png") !important;}
[data-char="明石小牧"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6af96e23d0091621.png") !important;}
[data-char="明石小牧"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--8aab97613ee90c83.png") !important;}

/* 明石小沙智（樱之诗） */
[data-char="明石小沙智"] {
  --main: #a16a44 !important;
  --sub: #c29e85 !important;
  --rgb: 161, 106, 68 !important;
  --motion-color: #8e5d3c !important;}
[data-char="明石小沙智"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--321901ffd86ad740.png") !important;
  cursor: pointer !important;}
[data-char="明石小沙智"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="明石小沙智"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="明石小沙智"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--321901ffd86ad740.png") !important;}
[data-char="明石小沙智"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--321901ffd86ad740.png") !important;}
[data-char="明石小沙智"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--c4a2ba33ad3201d7.png") !important;}

/* 鸟谷纱希（樱之诗） */
[data-char="鸟谷纱希"] {
  --main: #9a9aa2 !important;
  --sub: #bdbdc3 !important;
  --rgb: 154, 154, 162 !important;
  --motion-color: #88888f !important;}
[data-char="鸟谷纱希"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--0ffee73fc2816a0d.png") !important;
  cursor: pointer !important;}
[data-char="鸟谷纱希"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="鸟谷纱希"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="鸟谷纱希"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0ffee73fc2816a0d.png") !important;}
[data-char="鸟谷纱希"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--0ffee73fc2816a0d.png") !important;}
[data-char="鸟谷纱希"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--32a4ed523f9f2bb6.png") !important;}

/* 鸟谷真琴（樱之诗） */
[data-char="鸟谷真琴"] {
  --main: #ae94d1 !important;
  --sub: #cab9e1 !important;
  --rgb: 174, 148, 209 !important;
  --motion-color: #9982b8 !important;}
[data-char="鸟谷真琴"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--8d8c8db832d09cc9.png") !important;
  cursor: pointer !important;}
[data-char="鸟谷真琴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="鸟谷真琴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="鸟谷真琴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bf3705b3ff7d16ed.png") !important;}
[data-char="鸟谷真琴"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--24f2a95939e4a0be.png") !important;}
[data-char="鸟谷真琴"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4f347680041ff894.png") !important;}
[data-char="鸟谷真琴"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--77199e40bedb30aa.png") !important;}
[data-char="鸟谷真琴"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--fc8ec1dd22e022ae.png") !important;}
[data-char="鸟谷真琴"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--af0a6c8e44cc9b24.png") !important;}
[data-char="鸟谷真琴"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--d9c2becc81834312.png") !important;}
[data-char="鸟谷真琴"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bf3705b3ff7d16ed.png") !important;}
[data-char="鸟谷真琴"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b69b82524dd867ce.png") !important;}
[data-char="鸟谷真琴"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f10c11b915e2e8b3.png") !important;}
[data-char="鸟谷真琴"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--87152f4384e83d68.png") !important;}
[data-char="鸟谷真琴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--8d8c8db832d09cc9.png") !important;}
[data-char="鸟谷真琴"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--00a60643c0e90ff4.png") !important;}
[data-char="鸟谷真琴"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--209e975a8c3b2499.png") !important;}

/* 片贝巧实（樱之诗） */
[data-char="片贝巧实"] {
  --main: #c9a97a !important;
  --sub: #dcc7a9 !important;
  --rgb: 201, 169, 122 !important;
  --motion-color: #b1956b !important;}
[data-char="片贝巧实"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--c87b2fe2770f54bb.png") !important;}
[data-char="片贝巧实"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="片贝巧实"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c87b2fe2770f54bb.png") !important;}
[data-char="片贝巧实"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c87b2fe2770f54bb.png") !important;}

/* 若田清二郎（樱之诗） */
[data-char="若田清二郎"] {
  --main: #9a9aa2 !important;
  --sub: #bdbdc3 !important;
  --rgb: 154, 154, 162 !important;
  --motion-color: #88888f !important;}
[data-char="若田清二郎"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--6102d8ce40c1ba75.png") !important;}
[data-char="若田清二郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="若田清二郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6102d8ce40c1ba75.png") !important;}
[data-char="若田清二郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6102d8ce40c1ba75.png") !important;}

/* 夏目圭（樱之诗） */
[data-char="夏目圭"] {
  --main: #a6a6bf !important;
  --sub: #c5c5d5 !important;
  --rgb: 166, 166, 191 !important;
  --motion-color: #9292a8 !important;}
[data-char="夏目圭"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--f31f0380248839ca.png") !important;
  cursor: pointer !important;}
[data-char="夏目圭"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目圭"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目圭"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f31f0380248839ca.png") !important;}
[data-char="夏目圭"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f31f0380248839ca.png") !important;}
[data-char="夏目圭"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--6ab8231aa7fe1509.png") !important;}

/* 夏目蓝（樱之诗） */
[data-char="夏目蓝"] {
  --main: #6a6a7b !important;
  --sub: #9e9ea9 !important;
  --rgb: 106, 106, 123 !important;
  --motion-color: #5d5d6c !important;}
[data-char="夏目蓝"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--71bdf6952ba35608.png") !important;
  cursor: pointer !important;}
[data-char="夏目蓝"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目蓝"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目蓝"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--17a9f5b04ae1fc76.png") !important;}
[data-char="夏目蓝"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f1bb858950556610.png") !important;}
[data-char="夏目蓝"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--62857c3d4259b928.png") !important;}
[data-char="夏目蓝"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--60d1ee682cfe61fe.png") !important;}
[data-char="夏目蓝"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a8d401eb0d6d9dc7.png") !important;}
[data-char="夏目蓝"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--93a561517de375b6.png") !important;}
[data-char="夏目蓝"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a81850137a7b16b1.png") !important;}
[data-char="夏目蓝"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cb66fecafc62262e.png") !important;}
[data-char="夏目蓝"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e5dc71a38f4e4943.png") !important;}
[data-char="夏目蓝"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--17a9f5b04ae1fc76.png") !important;}
[data-char="夏目蓝"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--14b58a5a01fb43cd.png") !important;}
[data-char="夏目蓝"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--c6c0f7f69ce35bec.png") !important;}
[data-char="夏目蓝"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7a750b41610b5c85.png") !important;}
[data-char="夏目蓝"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--71bdf6952ba35608.png") !important;}
[data-char="夏目蓝"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a3f910612e01167d.png") !important;}
[data-char="夏目蓝"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--f2dde0704970c7fe.png") !important;}

/* 夏目雫（樱之诗） */
[data-char="夏目雫"] {
  --main: #dd88a2 !important;
  --sub: #e9b2c3 !important;
  --rgb: 221, 136, 162 !important;
  --motion-color: #c2788f !important;}
[data-char="夏目雫"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--81ea234c315fe848.png") !important;
  cursor: pointer !important;}
[data-char="夏目雫"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目雫"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目雫"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6ac3d0178a3f98cc.png") !important;}
[data-char="夏目雫"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--1876eacbe6a7ff97.png") !important;}
[data-char="夏目雫"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4179771acc036d3b.png") !important;}
[data-char="夏目雫"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4a56f4f306f73d60.png") !important;}
[data-char="夏目雫"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--cd700668491204ec.png") !important;}
[data-char="夏目雫"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--62f006650870a9ca.png") !important;}
[data-char="夏目雫"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--e684b36f4084dedd.png") !important;}
[data-char="夏目雫"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--bf9b8a9cccfdcece.png") !important;}
[data-char="夏目雫"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f78f453e20390b88.png") !important;}
[data-char="夏目雫"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6ac3d0178a3f98cc.png") !important;}
[data-char="夏目雫"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--81b594b707a58711.png") !important;}
[data-char="夏目雫"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--122d2c509e4b3a30.png") !important;}
[data-char="夏目雫"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--b5abd3d1c9a11a67.png") !important;}
[data-char="夏目雫"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--81ea234c315fe848.png") !important;}
[data-char="夏目雫"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--09868216854ac3af.png") !important;}
[data-char="夏目雫"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--53e06023349a686b.png") !important;}

/* 咲崎樱子（樱之诗） */
[data-char="咲崎樱子"] {
  --main: #dd88a2 !important;
  --sub: #e9b2c3 !important;
  --rgb: 221, 136, 162 !important;
  --motion-color: #c2788f !important;}
[data-char="咲崎樱子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--6313a183ad941670.png") !important;
  cursor: pointer !important;}
[data-char="咲崎樱子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="咲崎樱子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="咲崎樱子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6313a183ad941670.png") !important;}
[data-char="咲崎樱子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6313a183ad941670.png") !important;}
[data-char="咲崎樱子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--ad57ae2c680f34fa.png") !important;}

/* 一宫（樱之诗） */
[data-char="一宫"] {
  --main: #8c9aab !important;
  --sub: #b4bdc8 !important;
  --rgb: 140, 154, 171 !important;
  --motion-color: #7b8896 !important;}
[data-char="一宫"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--699ce4aa42062891.png") !important;}
[data-char="一宫"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="一宫"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--699ce4aa42062891.png") !important;}
[data-char="一宫"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--699ce4aa42062891.png") !important;}

/* 御樱稟（樱之诗） */
[data-char="御樱稟"] {
  --main: #a16a44 !important;
  --sub: #c29e85 !important;
  --rgb: 161, 106, 68 !important;
  --motion-color: #8e5d3c !important;}
[data-char="御樱稟"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--54f5072aaf8eb4cd.png") !important;
  cursor: pointer !important;}
[data-char="御樱稟"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="御樱稟"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="御樱稟"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f1ec4ee79b0678f0.png") !important;}
[data-char="御樱稟"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--66e157baeb29a6dc.png") !important;}
[data-char="御樱稟"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2f87bf3e22df26a6.png") !important;}
[data-char="御樱稟"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--510d814801c9a565.png") !important;}
[data-char="御樱稟"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--63c0346847bb2a1d.png") !important;}
[data-char="御樱稟"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--ab4d9259f190610b.png") !important;}
[data-char="御樱稟"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--a56f1bf40b58eb1d.png") !important;}
[data-char="御樱稟"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--26e495e0817ba33a.png") !important;}
[data-char="御樱稟"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--6a26ca15c80f14fe.png") !important;}
[data-char="御樱稟"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f1ec4ee79b0678f0.png") !important;}
[data-char="御樱稟"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--f6bed320e152bd28.png") !important;}
[data-char="御樱稟"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--4ae75d50097a298d.png") !important;}
[data-char="御樱稟"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--54f5072aaf8eb4cd.png") !important;}
[data-char="御樱稟"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--7f4ac5a6226f7ebb.png") !important;}
[data-char="御樱稟"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--8f5763e09606369a.png") !important;}

/* 御樱雄三（樱之诗） */
[data-char="御樱雄三"] {
  --main: #c3b8a2 !important;
  --sub: #d8d1c3 !important;
  --rgb: 195, 184, 162 !important;
  --motion-color: #aca28f !important;}
[data-char="御樱雄三"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2f4be6fa068afc5d.png") !important;}
[data-char="御樱雄三"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="御樱雄三"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2f4be6fa068afc5d.png") !important;}
[data-char="御樱雄三"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2f4be6fa068afc5d.png") !important;}

/* 长山香奈（樱之诗） */
[data-char="长山香奈"] {
  --main: #b89271 !important;
  --sub: #d1b8a3 !important;
  --rgb: 184, 146, 113 !important;
  --motion-color: #a28063 !important;}
[data-char="长山香奈"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--39004e100809d5ef.png") !important;
  cursor: pointer !important;}
[data-char="长山香奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="长山香奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="长山香奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--39004e100809d5ef.png") !important;}
[data-char="长山香奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--39004e100809d5ef.png") !important;}
[data-char="长山香奈"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--ae6907e93a8272e6.png") !important;}

/* 中村水菜（樱之诗） */
[data-char="中村水菜"] {
  --main: #7a568f !important;
  --sub: #a991b6 !important;
  --rgb: 122, 86, 143 !important;
  --motion-color: #6b4c7e !important;}
[data-char="中村水菜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2ec668fe44f8a84c.png") !important;
  cursor: pointer !important;}
[data-char="中村水菜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="中村水菜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="中村水菜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2ec668fe44f8a84c.png") !important;}
[data-char="中村水菜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2ec668fe44f8a84c.png") !important;}
[data-char="中村水菜"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--288d5082706b58ff.png") !important;}

/* 中村义贞（樱之诗） */
[data-char="中村义贞"] {
  --main: #6a707b !important;
  --sub: #9ea2a9 !important;
  --rgb: 106, 112, 123 !important;
  --motion-color: #5d636c !important;}
[data-char="中村义贞"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--2a90a3418ba79eec.png") !important;}
[data-char="中村义贞"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="中村义贞"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2a90a3418ba79eec.png") !important;}
[data-char="中村义贞"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--2a90a3418ba79eec.png") !important;}

/* 中村章一（樱之诗） */
[data-char="中村章一"] {
  --main: #c3b8a2 !important;
  --sub: #d8d1c3 !important;
  --rgb: 195, 184, 162 !important;
  --motion-color: #aca28f !important;}
[data-char="中村章一"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--5c73081c244c4917.png") !important;}
[data-char="中村章一"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="中村章一"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5c73081c244c4917.png") !important;}
[data-char="中村章一"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--5c73081c244c4917.png") !important;}

/* 柊乃乃未（樱之诗） */
[data-char="柊乃乃未"] {
  --main: #dd88a2 !important;
  --sub: #e9b2c3 !important;
  --rgb: 221, 136, 162 !important;
  --motion-color: #c2788f !important;}
[data-char="柊乃乃未"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/10/--aa7f44567b915017.png") !important;
  cursor: pointer !important;}
[data-char="柊乃乃未"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="柊乃乃未"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="柊乃乃未"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aa7f44567b915017.png") !important;}
[data-char="柊乃乃未"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/10/--aa7f44567b915017.png") !important;}
[data-char="柊乃乃未"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/10/--c7b5a426ff89b24c.png") !important;}

/* 成濑沙月（9nine） */
[data-char="成濑沙月"] {
  --main: #754d96 !important;
  --sub: #a58bbb !important;
  --rgb: 117, 77, 150 !important;
  --motion-color: #674484 !important;}
[data-char="成濑沙月"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--1c09ee8d9d4135f9.png") !important;}
div.custom-nvn-dialogue[data-char="成濑沙月"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="成濑沙月"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="成濑沙月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="成濑沙月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--1c09ee8d9d4135f9.png") !important;}
[data-char="成濑沙月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--b6834e4c3b93f6c3.png") !important;}
[data-char="成濑沙月"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--ab7a38113583e672.png") !important;}
[data-char="成濑沙月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--1aab9ffd21e04d98.png") !important;}
[data-char="成濑沙月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--ede685ba9a665229.png") !important;}
[data-char="成濑沙月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--1c09ee8d9d4135f9.png") !important;}
[data-char="成濑沙月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--fac8fce2b8721a97.png") !important;}

/* 九条都（9nine） */
[data-char="九条都"] {
  --main: #c6a577 !important;
  --sub: #dac5a7 !important;
  --rgb: 198, 165, 119 !important;
  --motion-color: #ae9169 !important;}
[data-char="九条都"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--dd04dc09ffa93abe.png") !important;
  cursor: pointer !important;}
[data-char="九条都"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="九条都"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="九条都"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--aee82179fe8a4bb6.png") !important;}
[data-char="九条都"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--795e50ee6e96ed67.png") !important;}
[data-char="九条都"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--b0bf0630e591438d.png") !important;}
[data-char="九条都"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--65d758d0f43f5747.png") !important;}
[data-char="九条都"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--a5823a178bc4a2c7.png") !important;}
[data-char="九条都"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--5418b0f9ba74c83a.png") !important;}
[data-char="九条都"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--23dc04510bfe1bfd.png") !important;}
[data-char="九条都"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--aee82179fe8a4bb6.png") !important;}
[data-char="九条都"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--afaf6f2da850aa45.png") !important;}
[data-char="九条都"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--bebdc18aba8e6d78.png") !important;}
[data-char="九条都"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--e91698be0416eb20.png") !important;}
[data-char="九条都"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--dd04dc09ffa93abe.png") !important;}
[data-char="九条都"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--cf405619a2d335a8.png") !important;}
[data-char="九条都"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/13/9nine--b551af98d82b8785.png") !important;}

/* 高峰莲夜（9nine） */
[data-char="高峰莲夜"] {
  --main: #c94a53 !important;
  --sub: #dc898f !important;
  --rgb: 201, 74, 83 !important;
  --motion-color: #b14149 !important;}
[data-char="高峰莲夜"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--2968e5d6bc31a6d6.png") !important;}
div.custom-nvn-dialogue[data-char="高峰莲夜"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="高峰莲夜"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="高峰莲夜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="高峰莲夜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--2968e5d6bc31a6d6.png") !important;}
[data-char="高峰莲夜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--2968e5d6bc31a6d6.png") !important;}

/* 苏菲缇雅（9nine） */
[data-char="苏菲缇雅"] {
  --main: #b3b1ac !important;
  --sub: #ceccc9 !important;
  --rgb: 179, 177, 172 !important;
  --motion-color: #9e9c97 !important;}
[data-char="苏菲缇雅"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--7c5bfe1e8b17138c.png") !important;}
div.custom-nvn-dialogue[data-char="苏菲缇雅"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="苏菲缇雅"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="苏菲缇雅"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="苏菲缇雅"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--7c5bfe1e8b17138c.png") !important;}
[data-char="苏菲缇雅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--7c5bfe1e8b17138c.png") !important;}

/* 结城希亚（9nine） */
[data-char="结城希亚"] {
  --main: #a85c48 !important;
  --sub: #c69588 !important;
  --rgb: 168, 92, 72 !important;
  --motion-color: #94513f !important;}
[data-char="结城希亚"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--5b04b43746bb590f.png") !important;
  cursor: pointer !important;}
[data-char="结城希亚"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="结城希亚"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="结城希亚"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--69cecb02b5a639c2.png") !important;}
[data-char="结城希亚"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--9102eb206ea17abd.png") !important;}
[data-char="结城希亚"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--b4a0b5f7db8559d8.png") !important;}
[data-char="结城希亚"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--0b82e1941ff286ee.png") !important;}
[data-char="结城希亚"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--98af5acefa77225e.png") !important;}
[data-char="结城希亚"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--69cecb02b5a639c2.png") !important;}
[data-char="结城希亚"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--b188d751e307bcf5.png") !important;}
[data-char="结城希亚"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--e90e24940decfc4e.png") !important;}
[data-char="结城希亚"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--2cb4ab66730b31ed.png") !important;}
[data-char="结城希亚"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--5b04b43746bb590f.png") !important;}
[data-char="结城希亚"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--be097a49e3a37288.png") !important;}
[data-char="结城希亚"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/13/9nine--89445fcc32a2743c.png") !important;}

/* 香坂春风（9nine） */
[data-char="香坂春风"] {
  --main: #9c78c8 !important;
  --sub: #bfa7db !important;
  --rgb: 156, 120, 200 !important;
  --motion-color: #896ab0 !important;}
[data-char="香坂春风"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--2b4f0417d2413490.png") !important;
  cursor: pointer !important;}
[data-char="香坂春风"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="香坂春风"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="香坂春风"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--d602f6816ea9965e.png") !important;}
[data-char="香坂春风"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--c334c2aed15b7031.png") !important;}
[data-char="香坂春风"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--d72036e574ebc9a5.png") !important;}
[data-char="香坂春风"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--3f27921418bf07d2.png") !important;}
[data-char="香坂春风"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--91722ffddf19de80.png") !important;}
[data-char="香坂春风"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--ccdb114b7d66242e.png") !important;}
[data-char="香坂春风"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--cccdc563bef83c7b.png") !important;}
[data-char="香坂春风"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--f57719b4342ae842.png") !important;}
[data-char="香坂春风"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--e3ca5cc0d28a2b88.png") !important;}
[data-char="香坂春风"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--00466e84b3f87b73.png") !important;}
[data-char="香坂春风"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--4f8b0d5349038a52.png") !important;}
[data-char="香坂春风"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--d602f6816ea9965e.png") !important;}
[data-char="香坂春风"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--5be5999178709fd8.png") !important;}
[data-char="香坂春风"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--182552e76504eedf.png") !important;}
[data-char="香坂春风"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--40456dbbbc5a53ce.png") !important;}
[data-char="香坂春风"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--2b4f0417d2413490.png") !important;}
[data-char="香坂春风"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--836150ffd3d63250.png") !important;}
[data-char="香坂春风"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/13/9nine--edd8d0987197930d.png") !important;}

/* 新海天（9nine） */
[data-char="新海天"] {
  --main: #a6adbc !important;
  --sub: #c5cad3 !important;
  --rgb: 166, 173, 188 !important;
  --motion-color: #9298a5 !important;}
[data-char="新海天"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--3631f76f77f67946.png") !important;
  cursor: pointer !important;}
[data-char="新海天"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="新海天"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新海天"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--7090614a822b40cb.png") !important;}
[data-char="新海天"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--67aa904c1291a7bd.png") !important;}
[data-char="新海天"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--f7e0c358ba923184.png") !important;}
[data-char="新海天"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--fa55a63c66f143cd.png") !important;}
[data-char="新海天"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--564e7b5f5a238e6c.png") !important;}
[data-char="新海天"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--15ee39b60e14f706.png") !important;}
[data-char="新海天"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--f4f359a6a494e61f.png") !important;}
[data-char="新海天"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--aec8b3d008e3e4a4.png") !important;}
[data-char="新海天"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--1c1e105fc548e847.png") !important;}
[data-char="新海天"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--bfc402adf3ae85d4.png") !important;}
[data-char="新海天"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--7090614a822b40cb.png") !important;}
[data-char="新海天"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--11e6d194a5b28c79.png") !important;}
[data-char="新海天"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--9f9358b41b753a1a.png") !important;}
[data-char="新海天"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--6281ee103a354fa0.png") !important;}
[data-char="新海天"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--f6a6a95ec4c00b85.png") !important;}
[data-char="新海天"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--3631f76f77f67946.png") !important;}
[data-char="新海天"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--447adf053d024cc1.png") !important;}
[data-char="新海天"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/13/9nine--a78b4a39491377d8.png") !important;}

/* 新海霞（9nine） */
[data-char="新海霞"] {
  --main: #4b8f68 !important;
  --sub: #8ab69d !important;
  --rgb: 75, 143, 104 !important;
  --motion-color: #427e5c !important;}
[data-char="新海霞"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/-bf18ec2611d45652.png") !important;
  cursor: pointer !important;}
[data-char="新海霞"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="新海霞"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新海霞"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/-bf18ec2611d45652.png") !important;}
[data-char="新海霞"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/-bf18ec2611d45652.png") !important;}
[data-char="新海霞"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/13/9nine--4d3211356a286721.png") !important;}

/* 新海翔（9nine） */
[data-char="新海翔"] {
  --main: #4b8f68 !important;
  --sub: #8ab69d !important;
  --rgb: 75, 143, 104 !important;
  --motion-color: #427e5c !important;}
[data-char="新海翔"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--2345425a242b24c6.png") !important;}
div.custom-nvn-dialogue[data-char="新海翔"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="新海翔"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="新海翔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新海翔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--2345425a242b24c6.png") !important;}
[data-char="新海翔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--2345425a242b24c6.png") !important;}

/* 幽灵（9nine） */
[data-char="幽灵"] {
  --main: #d9c177 !important;
  --sub: #e6d7a7 !important;
  --rgb: 217, 193, 119 !important;
  --motion-color: #bfaa69 !important;}
[data-char="幽灵"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--17108378886aab77.png") !important;}
div.custom-nvn-dialogue[data-char="幽灵"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="幽灵"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="幽灵"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="幽灵"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--17108378886aab77.png") !important;}
[data-char="幽灵"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--d2d5e4d4c28e0dbe.png") !important;}
[data-char="幽灵"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--17108378886aab77.png") !important;}

/* 深泽与一（9nine） */
[data-char="深泽与一"] {
  --main: #5b84c4 !important;
  --sub: #94afd9 !important;
  --rgb: 91, 132, 196 !important;
  --motion-color: #5074ac !important;}
[data-char="深泽与一"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/9nine--b4f97811312c1ea6.png") !important;}
div.custom-nvn-dialogue[data-char="深泽与一"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="深泽与一"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="深泽与一"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="深泽与一"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--b4f97811312c1ea6.png") !important;}
[data-char="深泽与一"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/9nine--b4f97811312c1ea6.png") !important;}

/* 草薙直绪（樱之诗） */
[data-char="草薙直绪"] {
  --main: #a8abb4 !important;
  --sub: #c6c8ce !important;
  --rgb: 168, 171, 180 !important;
  --motion-color: #94969e !important;}
[data-char="草薙直绪"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/-593ffa9a7cd24bb7.png") !important;}
div.custom-nvn-dialogue[data-char="草薙直绪"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="草薙直绪"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="草薙直绪"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="草薙直绪"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/-593ffa9a7cd24bb7.png") !important;}
[data-char="草薙直绪"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/-593ffa9a7cd24bb7.png") !important;}

/* 花子（花子） */
[data-char="花子"] {
  --main: #de7880 !important;
  --sub: #eaa7ac !important;
  --rgb: 222, 120, 128 !important;
  --motion-color: #c36a71 !important;}
[data-char="花子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/13/--f37feb32b757c189.png") !important;
  cursor: pointer !important;}
[data-char="花子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="花子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="花子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--05f2519c9acb5bd9.png") !important;}
[data-char="花子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--819ae197ed6fd0bf.png") !important;}
[data-char="花子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--ca5374dba7fcc5f5.png") !important;}
[data-char="花子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--4b96f5c975d9339c.png") !important;}
[data-char="花子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--180206ff774aa573.png") !important;}
[data-char="花子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--0949f0481e2ebb61.png") !important;}
[data-char="花子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--41f65ad54e858b69.png") !important;}
[data-char="花子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--457074954b2aec3e.png") !important;}
[data-char="花子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--e8687113c98fc2fb.png") !important;}
[data-char="花子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--21eff53eb012f4a7.png") !important;}
[data-char="花子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--931663541225217c.png") !important;}
[data-char="花子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--05f2519c9acb5bd9.png") !important;}
[data-char="花子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--a760cae8c42e6ad2.png") !important;}
[data-char="花子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--e4b589562752e47e.png") !important;}
[data-char="花子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--ffd39236b67f4e3c.png") !important;}
[data-char="花子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--f37feb32b757c189.png") !important;}
[data-char="花子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/13/--4d2d052a095711b4.png") !important;}
[data-char="花子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/13/--3400219468506b6a.png") !important;}

/* 大垣日向（少女领域） */
[data-char="大垣日向"] {
  --main: #e6c86a !important;
  --sub: #efdb9e !important;
  --rgb: 230, 200, 106 !important;
  --motion-color: #cab05d !important;}
[data-char="大垣日向"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/14/--96aa4e71003773d2.png") !important;
  cursor: pointer !important;}
[data-char="大垣日向"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="大垣日向"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大垣日向"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--85555f073553bcd7.png") !important;}
[data-char="大垣日向"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--893e59179d3bd744.png") !important;}
[data-char="大垣日向"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--22a403d0a51bda99.png") !important;}
[data-char="大垣日向"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--fb89df5b6caea366.png") !important;}
[data-char="大垣日向"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--71bfc89fccd41c32.png") !important;}
[data-char="大垣日向"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--31403c27544e5761.png") !important;}
[data-char="大垣日向"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--76839c88b356fee4.png") !important;}
[data-char="大垣日向"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--f12c86a594409fa7.png") !important;}
[data-char="大垣日向"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--b668d707113556fd.png") !important;}
[data-char="大垣日向"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--85555f073553bcd7.png") !important;}
[data-char="大垣日向"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--226e785f2eaae1dd.png") !important;}
[data-char="大垣日向"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--bf64a0e26a94ff6e.png") !important;}
[data-char="大垣日向"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--290e018e528a2250.png") !important;}
[data-char="大垣日向"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--96aa4e71003773d2.png") !important;}
[data-char="大垣日向"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--af502c122fabea0d.png") !important;}
[data-char="大垣日向"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/14/--6d02b26185dd69fe.png") !important;}

/* 飞鸟凑（少女领域） */
[data-char="飞鸟凑"] {
  --main: #aa9cc6 !important;
  --sub: #c8bfda !important;
  --rgb: 170, 156, 198 !important;
  --motion-color: #9689ae !important;}
[data-char="飞鸟凑"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/14/--4b669db2bc7ccd64.png") !important;
  cursor: pointer !important;}
[data-char="飞鸟凑"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="飞鸟凑"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="飞鸟凑"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--e9749ca98c5313c7.png") !important;}
[data-char="飞鸟凑"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--c14e4c3ba720fcf0.png") !important;}
[data-char="飞鸟凑"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--fda1aa5e8f74f393.png") !important;}
[data-char="飞鸟凑"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--13058f68a5250e9c.png") !important;}
[data-char="飞鸟凑"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--6f0877ba1d48c9d0.png") !important;}
[data-char="飞鸟凑"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--4eb92e1dd6f2566d.png") !important;}
[data-char="飞鸟凑"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--9436be22dd3a6040.png") !important;}
[data-char="飞鸟凑"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--0e52935efe2cd4da.png") !important;}
[data-char="飞鸟凑"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--e9749ca98c5313c7.png") !important;}
[data-char="飞鸟凑"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--7a0d7c3b553d5e76.png") !important;}
[data-char="飞鸟凑"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--5650f3f726630fcc.png") !important;}
[data-char="飞鸟凑"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--414b766a455fb50a.png") !important;}
[data-char="飞鸟凑"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--7e914104e7205076.png") !important;}
[data-char="飞鸟凑"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--4b669db2bc7ccd64.png") !important;}
[data-char="飞鸟凑"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--9a0830e957464b05.png") !important;}
[data-char="飞鸟凑"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/14/--53434e0e7fb2e28d.png") !important;}

/* 贵船柚子（少女领域） */
[data-char="贵船柚子"] {
  --main: #6f7178 !important;
  --sub: #a1a3a7 !important;
  --rgb: 111, 113, 120 !important;
  --motion-color: #62636a !important;}
[data-char="贵船柚子"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/14/--58ba66fa6ab85b67.png") !important;
  cursor: pointer !important;}
[data-char="贵船柚子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="贵船柚子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="贵船柚子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--8065217f2fd2bbbe.png") !important;}
[data-char="贵船柚子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--7c8243a91f5c6d4a.png") !important;}
[data-char="贵船柚子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--599b6b659ff7af63.png") !important;}
[data-char="贵船柚子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--571d549aebe4cb45.png") !important;}
[data-char="贵船柚子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--7b26b8e353f0d49a.png") !important;}
[data-char="贵船柚子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--0d0e926170349c42.png") !important;}
[data-char="贵船柚子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--7ad9308220ca06e3.png") !important;}
[data-char="贵船柚子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--da572d317c54f665.png") !important;}
[data-char="贵船柚子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--b125d271d0b2a129.png") !important;}
[data-char="贵船柚子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--d5075cc0800cb295.png") !important;}
[data-char="贵船柚子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--f10bc6a4b0243fca.png") !important;}
[data-char="贵船柚子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--8065217f2fd2bbbe.png") !important;}
[data-char="贵船柚子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--666fb7d060da387a.png") !important;}
[data-char="贵船柚子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--e616b794f44975d8.png") !important;}
[data-char="贵船柚子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--662cd71401de7f86.png") !important;}
[data-char="贵船柚子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--58ba66fa6ab85b67.png") !important;}
[data-char="贵船柚子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--4e6065f11f472389.png") !important;}
[data-char="贵船柚子"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/14/--74f43ccf68584ebc.png") !important;}

/* 皆见美结（少女领域） */
[data-char="皆见美结"] {
  --main: #92c462 !important;
  --sub: #b8d999 !important;
  --rgb: 146, 196, 98 !important;
  --motion-color: #80ac56 !important;}
[data-char="皆见美结"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/14/--5e649b16d21a802a.png") !important;
  cursor: pointer !important;}
[data-char="皆见美结"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皆见美结"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皆见美结"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--d39fc5ae8d1675c1.png") !important;}
[data-char="皆见美结"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--24d197489b3b5dbf.png") !important;}
[data-char="皆见美结"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--9ed478d2f8745bd9.png") !important;}
[data-char="皆见美结"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--4449d7ac99fc238a.png") !important;}
[data-char="皆见美结"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--575e8e001c351370.png") !important;}
[data-char="皆见美结"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--96daaf5ffc417152.png") !important;}
[data-char="皆见美结"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--c411e590e66b9070.png") !important;}
[data-char="皆见美结"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--10f4287abcbda3d0.png") !important;}
[data-char="皆见美结"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--5df03c4b215f48d6.png") !important;}
[data-char="皆见美结"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--dd656de5e7dfc0b7.png") !important;}
[data-char="皆见美结"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--d39fc5ae8d1675c1.png") !important;}
[data-char="皆见美结"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--84b8c5a82faf63fa.png") !important;}
[data-char="皆见美结"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--a61c7e156af9774b.png") !important;}
[data-char="皆见美结"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--35ac6bbb42f57345.png") !important;}
[data-char="皆见美结"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--ecd32522a49bf12d.png") !important;}
[data-char="皆见美结"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--5e649b16d21a802a.png") !important;}
[data-char="皆见美结"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--914f4be748764397.png") !important;}
[data-char="皆见美结"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/14/--aa49c63f8b4a3229.png") !important;}

/* 那波七海（少女领域） */
[data-char="那波七海"] {
  --main: #ba6b5a !important;
  --sub: #d29f94 !important;
  --rgb: 186, 107, 90 !important;
  --motion-color: #a45e4f !important;}
[data-char="那波七海"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/14/--0f7b23716f746540.png") !important;
  cursor: pointer !important;}
[data-char="那波七海"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="那波七海"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="那波七海"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--0f7b23716f746540.png") !important;}
[data-char="那波七海"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--0f7b23716f746540.png") !important;}
[data-char="那波七海"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/14/--07b695b0c3d54b3a.png") !important;}

/* 西园寺风莉（少女领域） */
[data-char="西园寺风莉"] {
  --main: #cfa694 !important;
  --sub: #e0c5b9 !important;
  --rgb: 207, 166, 148 !important;
  --motion-color: #b69282 !important;}
[data-char="西园寺风莉"] .custom-nvn-avatar-img {
  background-image: url("https://origin.picgo.net/2026/11/14/--e1042745e3c0a593.png") !important;
  cursor: pointer !important;}
[data-char="西园寺风莉"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="西园寺风莉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="西园寺风莉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--c2dcf78bdcd7fc43.png") !important;}
[data-char="西园寺风莉"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--d8705d46cb169df5.png") !important;}
[data-char="西园寺风莉"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--b7381b693d9c798f.png") !important;}
[data-char="西园寺风莉"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--c97ec6817b2c12f0.png") !important;}
[data-char="西园寺风莉"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--dd5c6eea96087609.png") !important;}
[data-char="西园寺风莉"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--59fd3518c596d634.png") !important;}
[data-char="西园寺风莉"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--2e0822be5dcafd6c.png") !important;}
[data-char="西园寺风莉"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--ddaa355d4e5d9302.png") !important;}
[data-char="西园寺风莉"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--4cdeb94643f7f489.png") !important;}
[data-char="西园寺风莉"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--c2dcf78bdcd7fc43.png") !important;}
[data-char="西园寺风莉"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--177f6f3ab8d55f37.png") !important;}
[data-char="西园寺风莉"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--87cec44170d8bf85.png") !important;}
[data-char="西园寺风莉"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--f78b5e6ccdba7f4d.png") !important;}
[data-char="西园寺风莉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--e1042745e3c0a593.png") !important;}
[data-char="西园寺风莉"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/14/--d4804603caeb69fe.png") !important;}
[data-char="西园寺风莉"] .custom-nvn-portrait-full {
  content: url("https://origin.picgo.net/2026/11/14/--42cfd74bd9ebf68e.png") !important;}

`;

  const LAYOUT_PATCH_CSS = `

/* =========================================================================
 * 有头像就不显示竖排名字兜底
 *  「有头像」由脚本 markAvatars() 打在头像视窗上的 data-nvn-has-avatar 判定，
 *  不管图是角色卡 CSS 给的、正则塞的，还是「玩家头像·悬浮球」行内塞的。
 *  放在 LAYOUT_PATCH_CSS 里 → 亮 / 暗两套主题共用一份。
 * ========================================================================= */
.custom-nvn-avatar-img[data-nvn-has-avatar="1"] .custom-nvn-avatar-fallback-box:not(#nvn-modern-boost),
.custom-nvn-avatar-img[data-nvn-has-avatar="1"] .custom-nvn-avatar-fallback:not(#nvn-modern-boost) {
  display: none !important;}

/* =========================================================================
 * 名字：首字放大 + 交替上色
 * 由 splitNames() 把名字拆成逐字 span：
 *   奇数位（1/3/5…）→ 主题色；偶数位（2/4/6…）→ 不染色，用名字默认色。
 * 字体用黑体（思源黑体 → 苹方 → 雅黑），字号：首字 1.25em、其余 1.02em（82%）。
 * 想改成「每三字一色」：把下面 2n+1 / 2n 换成 3n+1 与其余两档即可。
 * ========================================================================= */
/* =========================================================================
 * 名字：完全照 regex-对话渲染v7_1 的字体样式
 *   font-family  : Noto Serif SC → Source Han Serif SC → 宋体
 *   font-weight  : 800（和他一致，厚重一点的宋体标题感）
 *   letter-spacing: 1.5px；line-height: 1
 *   没有任何 text-shadow（v7_1 也没有，之前那层黑雾是 .mes_text 继承来的）
 * 上色：奇数位（1/3/5…）主题色，偶数位（2/4/6…）默认色
 * 字号：首字 1.25em、其余 1.02em（= 首字的 82%）
 * ========================================================================= */
.custom-nvn-name-box:not(#nvn-modern-boost) {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", serif !important;
  font-weight: 800 !important;
  letter-spacing: 1.5px !important;
  align-items: baseline !important;}
.custom-nvn-name-box .nvn-ch {
  display: inline-block !important;
  font-size: 1.02em !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  letter-spacing: 1.5px !important;
  opacity: 1 !important;
  color: var(--name) !important;
  text-shadow: none !important;}
.custom-nvn-name-box .nvn-ch:nth-child(2n+1) {
  color: var(--main) !important;}
.custom-nvn-name-box .nvn-ch:first-child {
  font-size: 1.25em !important;
  font-weight: 800 !important;
  line-height: 0.95 !important;
  margin-right: 0 !important;
  text-shadow: none !important;}

/* =========================================================================
 * 右引号悬挂修复（2026-11-06）
 *  .custom-nvn-text 改成 block 后，右引号若仍按普通行内元素排版，
 *  遇到「最后一行刚好排满」就会整体掉到下一行。这里把它做成 0 宽的
 *  inline-block：不占行宽、永远能挂在最后一个字后面（像标点悬挂）。
 *  玩家行（is_user / data-player）保持原来的 flex 布局不动。
 * ========================================================================= */
.custom-nvn-text .custom-nvn-quote-mark.custom-right {
  display: inline-block !important;
  width: 0 !important;
  margin: 0 !important;
  overflow: visible !important;
}
.custom-nvn-text .custom-nvn-quote-mark.custom-right::before {
  position: relative;
  left: 4px;
}

/* 玩家行恢复 flex + 正常右引号 */
[is_user="true"] .custom-nvn-dialogue .custom-nvn-text,
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-text {
  display: flex !important;
}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-text .custom-nvn-quote-mark.custom-right,
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-text .custom-nvn-quote-mark.custom-right {
  display: inline !important;
  width: auto !important;
  margin-left: 6px !important;
  margin-right: 0 !important;
}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-text .custom-nvn-quote-mark.custom-right::before,
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-text .custom-nvn-quote-mark.custom-right::before {
  position: static !important;
  left: auto !important;
}

/* =========================================================================
 * （原「勇战 / MGQ 立绘补充」151 张大立绘 + 8 名大立绘角色，共 151 条外链，
 *   2026-11-09 现代世界观清理时整块删除。上面那段「右引号悬挂修复 / 玩家行恢复 flex」
 *   是通用布局规则，保留。）
 * ========================================================================= */
`;

  function buildNewCharacterCss() {
    if (!NEW_CHARACTERS.length) return '';
    const B = '.mes_text div.custom-nvn-dialogue:is(';
    const BOOST = '):not(#nvn-char-color-override)';
    let out = '\n\n/* ================= 新增角色（由 NEW_CHARACTERS 自动生成） ================= */\n';
    for (const c of NEW_CHARACTERS) {
      if (!c || !Array.isArray(c.chars) || !c.chars.length) continue;
      const sel = c.chars.map(function (n) { return '[data-char="' + n + '"], [data-char^="' + n + '·"]'; }).join(', ');
      const head = B + sel + BOOST;
      out += '\n/* ' + c.chars.join(' / ') + ' */\n';
      out += head + ' {\n'
           + '  --main: ' + (c.main || '#8896a5') + ' !important;\n'
           + '  --sub: ' + (c.sub || '#b2becb') + ' !important;\n'
           + '  --rgb: ' + (c.rgb || '136, 150, 165') + ' !important;\n'
           + '  --motion-color: ' + (c.motion || c.main || '#a8b5c2') + ' !important;\n'
           + '}\n';
      if (c.avatar) {
        out += head + ' .custom-nvn-avatar-img {\n'
             + '  background-image: url("' + c.avatar + '") !important;\n'
             + '  border: 1.5px solid rgba(var(--rgb), 0.78) !important;\n'
             + '  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;\n'
             + (c.big ? '  cursor: pointer !important;\n' : '')
             + '}\n';
        /* 有立绘的角色不要 NPC 那圈 4px 内嵌细框（基础 CSS 用
           `:not(:is(旧名单)) .custom-nvn-avatar-img::after` 加的；新角色不在那份旧名单里，
           就会被套上 → 看上去像「图没填满 + 里面多了一圈细框」）。 */
        out += head + ' .custom-nvn-avatar-img::after { display: none !important; }\n';
      } else if (c.big) {
        out += head + ' .custom-nvn-avatar-img { cursor: pointer !important; }\n';
      }
      out += head + '::before, ' + head + '::after { display: none !important; }\n';
      if (c.portrait) {
        out += head + ' .custom-nvn-portrait-full {\n  content: url("' + c.portrait + '") !important;\n}\n';
        out += head + ' .custom-nvn-avatar-popover { pointer-events: auto !important; }\n';
      }
      if (c.big) {
        out += head + ' .custom-nvn-avatar-fallback-box { display: none !important; }\n';
      }
      if (c.rose) {
        out += head + ' .custom-nvn-rose-crest {\n'
             + '  display: flex !important;\n  align-items: center;\n  justify-content: center;\n'
             + '  width: 20px;\n  height: 20px;\n  color: var(--main);\n'
             + '  filter: drop-shadow(0 0 4px rgba(var(--rgb), 0.6));\n  flex-shrink: 0;\n}\n';
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------
   * 两份主题样式（由酒馆自己的 decodeStyleTags() 生成，选择器形如
   * .mes_text .custom-nvn-dialogue；属性选择器保持原样，酒馆只改 class）。
   * light 同时覆盖「中文」和「中日双语」；dark 是深色框那套。
   * 每条选择器都带 .mes_text 前缀 → 只作用在消息正文，不会外溢。
   * --------------------------------------------------------------- */
  const CSS = {
    light: `
/* =========================================================================
 * 现代对白样式 · 无气泡 + 角色主色下划线
 * -------------------------------------------------------------------------
 *  · 头像视窗 100×125 不变，只换圆角 / 描边 / 阴影；
 *  · 名字行 = 角色色圆点 + 名字（首字角色色）+ 动作徽章（细下划线）；
 *  · 台词不加任何框；动作描写下面一根角色主色下划线；
 *  · 头像框底一根角色主色下划线（带辉光），和动作描写呼应；
 *  · 玩家行整行镜像，靠右。
 * ========================================================================= */

/* ====== 消除原生气泡样式 ====== */
.mes_text:has(.custom-nvn-dialogue) blockquote:not(#nvn-modern-boost),
.mes_text:has(.custom-nvn-dialogue) > p:has(> .custom-nvn-dialogue):not(#nvn-modern-boost),
.custom-nvn-dialogue:not(#nvn-modern-boost) {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;}

/* ====== 基础容器 ====== */
.custom-nvn-dialogue:not(#nvn-modern-boost) {
  --main: #6d7b8c;
  --sub: #a9b4c0;
  --rgb: 109, 123, 140;
  --motion-color: #8b97a6;
  --stage-text: #2c3238;
  --cmt: rgba(32, 38, 48, 0.42);
  --quote: rgba(32, 38, 48, 0.24);
  --halo: rgba(20, 24, 32, 0.10);
  --halo2: rgba(20, 24, 32, 0.14);
  --name: rgba(28, 32, 40, 0.90);
  --fb: rgba(40, 46, 56, 0.62);
  --npc-bg: rgba(250, 248, 244, 0.96);
  --fx: #23272e;
  display: flex !important;
  /* 头像贴顶：原来整体垂直居中，长台词时头像会被拉到中间、再长就贴到上边，
     观感很怪。改成顶对齐 —— 头像纵向偏移恒为 0，等于硬上限。 */
  align-items: flex-start !important;
  align-self: flex-start !important;
  gap: 16px !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 14px 0 16px !important;
  padding: 0 !important;
  color: var(--stage-text) !important;
  /* 字体与旧版一致：思源宋体 → 苹方 → 雅黑，衬线兜底 */
  font-family: "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif !important;
  clear: both !important;}
.custom-nvn-dialogue *:not(#nvn-modern-boost) { box-sizing: border-box !important;}

/* ====== 抹掉旧版奇幻装饰（卡里还挂着旧版美化时的兜底） ======
   旧脚本在 .custom-nvn-content::before / ::after 上画上下两条金线，还给内容栏加了
   1px 边框；name-plate / avatar-img / motion 上也挂着蔷薇、内嵌细框、菱形端点。
   这些我们一个都不要，统一清掉（选择器带 :not(#…) 权重，压得住旧版的 !important）。 */
.custom-nvn-dialogue:not(#nvn-modern-boost)::before,
.custom-nvn-dialogue:not(#nvn-modern-boost)::after,
.custom-nvn-content:not(#nvn-modern-boost)::before,
.custom-nvn-content:not(#nvn-modern-boost)::after,
.custom-nvn-name-plate:not(#nvn-modern-boost)::after,
.custom-nvn-avatar-side:not(#nvn-modern-boost)::before,
.custom-nvn-avatar-side:not(#nvn-modern-boost)::after,
.custom-nvn-avatar-img:not(#nvn-modern-boost)::before,
.custom-nvn-avatar-img:not(#nvn-modern-boost)::after,
.custom-nvn-motion:not(#nvn-modern-boost)::before,
.custom-nvn-motion:not(#nvn-modern-boost)::after,
.custom-nvn-text:not(#nvn-modern-boost)::before,
.custom-nvn-text:not(#nvn-modern-boost)::after {
  content: none !important;
  display: none !important;
  border: 0 !important;
  background: none !important;}
.custom-nvn-content:not(#nvn-modern-boost) {
  border: 0 !important;
  background: none !important;
  box-shadow: none !important;}

/* ====== 头像视窗（100 × 125） ====== */
.custom-nvn-avatar-side:not(#nvn-modern-boost) {
  flex: 0 0 100px !important;
  width: 100px !important;
  position: relative !important;
  align-self: flex-start !important;}
.custom-nvn-avatar-img:not(#nvn-modern-boost) {
  width: 100px !important;
  height: 125px !important;
  min-height: 125px !important;
  border-radius: 12px !important;
  /* 描边跟角色主题色：暗色主题里 --halo2 是黑的，只看它就会是一圈黑框。
     这里先给「凡是有图」的默认主题色边，没头像的 NPC 由下面带守卫的规则覆盖。 */
  border: 1.5px solid rgba(var(--rgb), 0.78) !important;
  background-size: cover !important;
  background-position: center top !important;
  background-repeat: no-repeat !important;
  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;
  overflow: hidden !important;
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;}
/* 有头像的角色：描边跟着角色主题色走（暗色主题里 --halo2 是黑的，
   整圈看上去就是「黑框」；这里用 --rgb 画角色色细边 + 内发光，和旧版观感一致） */
div.custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-avatar-img:not(#nvn-modern-boost) {
  border: 1.5px solid rgba(var(--rgb), 0.78) !important;
  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;}

/* 没有头像的普通 NPC：磨砂玻璃名片 + 侧边主题色竖条
   ⚠ 「有没有头像」不能只看名字：玩家头像脚本 / 正则 / 别家美化都可能给
   非克蕾雅的角色塞图。所以这里三重守卫：脚本打的 data-nvn-has-avatar、
   行内 style 里的 background-image、以及玩家头像脚本的 data-wn-ua-applied。
   任一命中就当「有头像」，不走下面这套 NPC 外观。 */
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"]) {
  background-color: rgba(var(--rgb), 0.14) !important;
  background-image: linear-gradient(rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.76)) !important;
  border: 1px solid rgba(255, 255, 255, 0.80) !important;
  border-left: 3px solid rgba(var(--rgb), 0.95) !important;
  border-radius: 16px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 12px 28px rgba(30, 40, 60, 0.18) !important;
  -webkit-backdrop-filter: blur(14px) saturate(1.35);
  backdrop-filter: blur(14px) saturate(1.35);}
/* 顶部主题色小圆点 */
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"])::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  top: 12px !important;
  left: 50% !important;
  width: 4px !important;
  height: 4px !important;
  margin-left: -2px !important;
  border-radius: 50% !important;
  background: rgba(var(--rgb), 0.95) !important;
  box-shadow: 0 0 8px rgba(var(--rgb), 0.85) !important;
  pointer-events: none !important;}
/* 旧的内框不要了 */
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"])::after {
  content: none !important;
  display: none !important;}
/* 玩家行（user）没有头像时：竖条换到右侧，与角色行左右对称 */
[is_user="true"] div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"]),
div.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]):not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"]) {
  border-left: 1px solid rgba(255, 255, 255, 0.80) !important;
  border-right: 3px solid rgba(var(--rgb), 0.95) !important;}
/* 有立绘的角色：手型指针（玛丽·安 只有小头像，不放开弹层） */
div.custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-avatar-img:not(#nvn-modern-boost) {
  cursor: pointer !important;}
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-popover:not(#nvn-modern-boost) {
  pointer-events: none !important;}

/* 立绘弹层：本身不占位、不显示默认小三角 */
.custom-nvn-avatar-popover:not(#nvn-modern-boost) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;}
.custom-nvn-avatar-popover summary:not(#nvn-modern-boost) {
  list-style: none !important;
  outline: none !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;}
.custom-nvn-avatar-popover summary:not(#nvn-modern-boost)::-webkit-details-marker,
.custom-nvn-avatar-popover summary:not(#nvn-modern-boost)::marker {
  display: none !important;}

/* 竖排名字兜底 */
.custom-nvn-avatar-fallback-box:not(#nvn-modern-boost) {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2 !important;}
.custom-nvn-avatar-fallback:not(#nvn-modern-boost) {
  /* 竖排名字：字号/字距与旧版一致；并把「竖直」钉死，免得被别的脚本/CSS 转歪 */
  writing-mode: vertical-rl !important;
  text-orientation: upright !important;
  transform: none !important;
  rotate: none !important;
  display: block !important;
  max-width: 2.3em !important;
  max-height: 100% !important;
  margin: 0 auto !important;
  font-size: 1.22em !important;
  font-weight: 700 !important;
  line-height: 1.32 !important;
  letter-spacing: 0.1em !important;
  text-align: center !important;
  word-break: break-all !important;
  color: var(--fb) !important;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;}
/* 有图的角色不再显示兜底字 */
div.custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-avatar-fallback-box:not(#nvn-modern-boost) {
  display: none !important;}

/* ====== 内容栏 ====== */
.custom-nvn-content:not(#nvn-modern-boost) {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 0 !important;
  min-width: 0 !important;
  padding-top: 1px !important;}

/* ====== 名字行：圆点 + 名字 + 动作徽章 ====== */
.custom-nvn-name-plate:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  align-self: flex-start !important;
  min-height: 0 !important;
  margin: 0 0 6px !important;
  padding: 0 !important;
  background: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;}
.custom-nvn-name-plate:not(#nvn-modern-boost)::before {
  content: "" !important;
  flex: 0 0 auto !important;
  width: 6px !important;
  height: 6px !important;
  border-radius: 50% !important;
  background: var(--main) !important;
  box-shadow: 0 0 8px rgba(var(--rgb), 0.8) !important;}
.custom-nvn-rose-crest:not(#nvn-modern-boost) { display: none !important;}
.custom-nvn-name-box:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: baseline !important;
  color: var(--name) !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important;
  text-shadow: none !important;}
.custom-nvn-name-initial:not(#nvn-modern-boost) {
  color: var(--main) !important;
  /* 首字大、其余小（名字行的「大首字」版式） */
  font-size: 1.38em !important;
  font-weight: 700 !important;
  line-height: 0.86 !important;
  margin-right: 1px !important;
  text-shadow: none !important;}
.custom-nvn-name-rest:not(#nvn-modern-boost) {
  color: inherit !important;
  /* 小字原先 0.76em 太小，放到 0.88em：仍比首字小一档，但正常可读 */
  font-size: 0.88em !important;
  letter-spacing: 0.08em !important;
  margin-left: 3px !important;
  opacity: 0.96 !important;}
.custom-nvn-action:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: center !important;
  margin-left: 2px !important;
  padding: 1px 9px 2px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em !important;
  /* 跟头像卡一个路子：只有主题色细边框，里面是透明磨砂玻璃；
     字是纯主题色，靠阴影从背景里托起来 */
  color: var(--main) !important;
  /* 亮色版均匀玻璃：淡主题色 + 白色玻璃层（同上，不做斜向渐变）。 */
  background-color: rgba(var(--rgb), 0.14) !important;
  background-image: linear-gradient(rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.76)) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  border: 1px solid rgba(var(--rgb), 0.72) !important;
  border-radius: 999px !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;   /* 与正文（.custom-nvn-primary）一致 */
  -webkit-backdrop-filter: blur(14px) saturate(1.35);
  backdrop-filter: blur(14px) saturate(1.35);}
.custom-nvn-action:empty:not(#nvn-modern-boost) { display: none !important;}
.custom-nvn-telepathy-tag:not(#nvn-modern-boost) { display: none !important;}

/* ====== 台词（无框） ====== */
.custom-nvn-text:not(#nvn-modern-boost) {
  display: block !important;
  position: relative !important;
  margin: 0 !important;
  padding: 0 !important;
  background: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  text-align: left !important;}
.custom-nvn-text:not(#nvn-modern-boost)::before { display: none !important;}
.custom-nvn-primary:not(#nvn-modern-boost) {
  display: inline !important;
  color: var(--stage-text) !important;
  /* 旧版是 1.05em，这里按你说的再小 0.05 → 1.00em；字距/阴影照旧版 */
  font-size: 1.00em !important;
  line-height: 1.8 !important;
  letter-spacing: 0.05em !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
  word-break: break-word !important;}
.custom-nvn-quote-mark:not(#nvn-modern-boost) {
  /* 旧版：角色主色、1.15em、700、85% 不透明 */
  color: var(--main) !important;
  font-weight: 700 !important;
  font-size: 1.15em !important;
  opacity: 0.85 !important;
  flex-shrink: 0 !important;
  user-select: none !important;}
.custom-nvn-quote-mark.custom-left:not(#nvn-modern-boost) { margin-right: 4px !important;}
.custom-nvn-quote-mark.custom-right:not(#nvn-modern-boost) { margin-left: 4px !important;}
.custom-nvn-quote-mark.custom-left:not(#nvn-modern-boost)::before { content: "「" !important;}
.custom-nvn-quote-mark.custom-right:not(#nvn-modern-boost)::before { content: "」" !important;}

/* ====== 动作描写：文字宽度的一根角色主色下划线 ====== */
.custom-nvn-motion:not(#nvn-modern-boost) {
  align-self: flex-start !important;
  width: fit-content !important;
  max-width: 100% !important;
  display: block !important;
  margin-top: 6px !important;
  padding: 3px 11px 4px 10px !important;
  font-size: 12px !important;
  line-height: 1.6 !important;
  letter-spacing: 0.03em !important;
  /* 同上：透明磨砂 + 主题色细边框；右侧一根 3px 主题色竖条 */
  color: var(--main) !important;
  /* 亮色版均匀玻璃：淡主题色 + 白色玻璃层（同上，不做斜向渐变）。 */
  background-color: rgba(var(--rgb), 0.14) !important;
  background-image: linear-gradient(rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.76)) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  /* 竖条默认在左侧 —— 角色行的头像卡也在左边，两边同侧才顺 */
  border: 1px solid rgba(var(--rgb), 0.62) !important;
  border-left: 3px solid rgba(var(--rgb), 1) !important;
  border-radius: 3px 9px 9px 3px !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;   /* 与正文（.custom-nvn-primary）一致 */
  word-break: break-word !important;
  -webkit-backdrop-filter: blur(14px) saturate(1.35);
  backdrop-filter: blur(14px) saturate(1.35);}
.custom-nvn-motion:empty:not(#nvn-modern-boost) {
  display: none !important;
  background: none !important;}

/* ====== 第二段台词（.text-tail）：空的时候整段（连那两个空引号）一起藏掉 ======
   模板里第二段是「<div class="nvn-text nvn-text-tail"> 左引号 + 空 primary + 右引号」，
   没有第二句时 primary 是空的，但两个引号是 ::before 生成的，不藏就会多出一对空「」。
   这里两条：结构上先用 :has() 藏；再靠脚本 sweepEmptyTails() 兜底（:has() 老内核不支持时）。 */
.custom-nvn-text-tail:not(#nvn-modern-boost) {
  display: block !important;}
.custom-nvn-text-tail:has(.custom-nvn-primary:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))):not(#nvn-modern-boost),
.custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))):not(#nvn-modern-boost),
.custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-quote-val:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))):not(#nvn-modern-boost) {
  display: none !important;}

/* ====== 玩家行：整行镜像 ====== */
[is_user="true"] .custom-nvn-dialogue:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]):not(#nvn-modern-boost) {
  --main: #4a7fd6;
  --sub: #b8d2ff;
  --rgb: 74, 127, 214;
  --motion-color: #6d9ce6;
  flex-direction: row-reverse !important;
  align-self: flex-end !important;
  margin-left: auto !important;}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-name-plate:not(#nvn-modern-boost) {
  align-self: flex-end !important;
  flex-direction: row-reverse !important;}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-text:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-text:not(#nvn-modern-boost) {
  text-align: right !important;}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-motion:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-motion:not(#nvn-modern-boost) {
  align-self: flex-end !important;
  /* user 行整行镜像：竖条换到右侧，和 user 头像卡那根同侧 */
  padding: 3px 10px 4px 11px !important;
  border-left: 1px solid rgba(var(--rgb), 0.62) !important;
  border-right: 3px solid rgba(var(--rgb), 1) !important;
  border-radius: 9px 3px 3px 9px !important;
  /* 亮色版均匀玻璃：淡主题色 + 白色玻璃层（同上，不做斜向渐变）。 */
  background-color: rgba(var(--rgb), 0.14) !important;
  background-image: linear-gradient(rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.76)) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;}

/* ====== 亮 / 暗切换按钮（☀ / ☾ 纯 CSS 绘制） ======
   · 位置：名字行最右侧（神态徽章后面），JS 插进 .custom-nvn-name-plate
   · 图标语义：显示「点了会变成什么」——当前深色就显示太阳，反之显示月亮
   · data-nvn-next 由脚本写入，用户点过之后会记在 localStorage 里 */
.custom-nvn-theme-toggle:not(#nvn-modern-boost) {
  flex: 0 0 auto !important;
  align-self: center !important;
  width: 15px !important;
  height: 15px !important;
  margin: 0 0 0 6px !important;
  padding: 0 !important;
  border: 0 !important;
  background: none !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--main) !important;
  opacity: 0.5 !important;
  pointer-events: auto !important;
  transition: opacity 0.15s ease, transform 0.15s ease !important;
  -webkit-tap-highlight-color: transparent !important;}
.custom-nvn-theme-toggle:hover:not(#nvn-modern-boost) { opacity: 1 !important; transform: scale(1.14) !important;}
.custom-nvn-theme-toggle:active:not(#nvn-modern-boost) { transform: scale(0.9) !important;}
.custom-nvn-theme-toggle:not(#nvn-modern-boost)::before,
.custom-nvn-theme-toggle:not(#nvn-modern-boost)::after {
  content: "" !important;
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;}
/* 太阳 = 亮色：中心圆点 + 四道光芒 */
.custom-nvn-theme-toggle[data-nvn-next="light"]:not(#nvn-modern-boost)::before {
  width: 5.5px !important;
  height: 5.5px !important;
  border-radius: 50% !important;
  background: currentColor !important;
  transform: translate(-50%, -50%) !important;
  box-shadow: 0 0 6px rgba(var(--rgb), 0.5) !important;}
.custom-nvn-theme-toggle[data-nvn-next="light"]:not(#nvn-modern-boost)::after {
  width: 15px !important;
  height: 15px !important;
  transform: translate(-50%, -50%) !important;
  background:
    linear-gradient(currentColor, currentColor) 50% 0 / 1.4px 2.4px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 100% / 1.4px 2.4px no-repeat,
    linear-gradient(currentColor, currentColor) 0 50% / 2.4px 1.4px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 50% / 2.4px 1.4px no-repeat !important;}
/* 月亮 = 暗色：把错位圆的投影裁掉一块，留下月牙 */
.custom-nvn-theme-toggle[data-nvn-next="dark"]:not(#nvn-modern-boost)::before {
  width: 9.5px !important;
  height: 9.5px !important;
  border-radius: 50% !important;
  transform: translate(-50%, -50%) !important;
  box-shadow: 2.6px -1.2px 0 0 currentColor !important;}

/* ====== 移动端 ====== */
@media (max-width: 560px) {
  .custom-nvn-dialogue:not(#nvn-modern-boost) { gap: 12px !important; margin: 10px 0 12px !important;}
  .custom-nvn-avatar-side:not(#nvn-modern-boost) { flex: 0 0 75px !important; width: 75px !important;}
  .custom-nvn-avatar-img:not(#nvn-modern-boost) { width: 75px !important; height: 95px !important; min-height: 95px !important; border-radius: 10px !important;}
  .custom-nvn-name-box:not(#nvn-modern-boost) { font-size: 13px !important;}
  .custom-nvn-action:not(#nvn-modern-boost) { font-size: 10px !important;}
  .custom-nvn-theme-toggle:not(#nvn-modern-boost) { width: 14px !important; height: 14px !important; margin-left: 4px !important;}
  .custom-nvn-theme-toggle[data-nvn-next="light"]:not(#nvn-modern-boost)::after { width: 13px !important; height: 13px !important;}
  .custom-nvn-motion:not(#nvn-modern-boost) { font-size: 11.5px !important;}
  .custom-nvn-avatar-fallback:not(#nvn-modern-boost) { font-size: 14px !important;}
}

/* 亮色主题不再单独压深：文字颜色与旧版保持一致 */


/* ====== 角色配色（格式参考） ====== */
div.custom-nvn-dialogue[data-char*="克蕾雅"] { --main: #e6b85c !important; --sub: #ffe89e !important; --rgb: 230, 184, 92 !important; --motion-color: #dfc698 !important; } /* 克蕾雅 · 琥珀金 */
div.custom-nvn-dialogue[data-char*="玛丽·安"] { --main: #2ed573 !important; --sub: #e0f9ec !important; --rgb: 46, 213, 115 !important; --motion-color: #65e199 !important; } /* 玛丽·安 · 翠草清绿 */

/* ====== 角色头像 / 表情差分 / 大立绘 ====== */
div.custom-nvn-dialogue[data-char*="玛丽·安"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/10/08/68208d56a291c30f7e89bc8a5fa6fd13e1aed1c696238752.png") !important; }
[data-char*="克蕾雅"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/1409d4e13ab7c1ad7e96924a36bdd9a3482303ab0ef221c1.png") !important; }
[data-char*="克蕾雅"][data-action*="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/fc2183f6475eb6ee573dd4db16b3ec9f48c2cb75b49e78e4.png") !important; }
[data-char*="克蕾雅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/1409d4e13ab7c1ad7e96924a36bdd9a3482303ab0ef221c1.png") !important; }
[data-char*="克蕾雅"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/fc2183f6475eb6ee573dd4db16b3ec9f48c2cb75b49e78e4.png") !important; }
[data-char*="克蕾雅"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/1f27d649bd5f1a9ddb35bfefea4ed3f04683fd73356f1699.png") !important; }
[data-char*="克蕾雅"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/bc29db1fa53036376ad890acbf993fda57275798edb08f16.png") !important; }
[data-char*="克蕾雅"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/5f4e05c1af887f84f81b6389692ef9af103738822016d420.png") !important; }
[data-char*="克蕾雅"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/2d53ef3ea50d7e218f439e2fac5683be6c93ddb9aacfbb81.png") !important; }
[data-char*="克蕾雅"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/68033e2d6a21b8051c9508ff0755bddbed247c407040b4bb.png") !important; }
[data-char*="克蕾雅"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/7794ef980f5bc34e787a3995b6b0b4b7745084898eb659ed.png") !important; }
[data-char*="克蕾雅"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/baa11b8602a9f6449cf68eed348d25580c136419c3adba4f.png") !important; }
[data-char*="克蕾雅"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/d8a041121401ef923bac3be73db4bf7b0d8a40a14a7ca628.png") !important; }
[data-char*="克蕾雅"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/57581a2f8d7520b05fc6b4faac3a7d06100aa17811a87dd5.png") !important; }
[data-char*="克蕾雅"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/f65ef8265d29273d9253d211fc1e1e1fb7179c9a6778d8b2.png") !important; }
[data-char*="克蕾雅"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/3befe4267924d76dbc662ecae1807ed7f63377ed996d0970.png") !important; }
[data-char*="克蕾雅"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/b0b4fdd77f7292caf2f58b6edff0f66b237500ffb5fb3610.png") !important; }
[data-char*="克蕾雅"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/f03cbb5d81bb016bac835a74dfd51176f02cbb804c65fe98.png") !important; }
[data-char*="克蕾雅"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/3b2308cdc7cf17a9cbdcc5e19940c31ec7d54698b268f4f5.png") !important; }
[data-char*="克蕾雅"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/44ce1289e408ff31326c15854d2dd52400d534ac1dcbd11f.png") !important; }
[data-char*="克蕾雅"][data-action="皱眉"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/2a1abab328580412da62f64cc99df487554518f75d7f6560.png") !important; }
[data-char*="克蕾雅"][data-action="脸红皱眉"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/c1f238456163127c71dad05c1ff273da1cf2136d8b8580ee.png") !important; }
[data-char*="克蕾雅"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/d0e17c88434483f1d7a56d38338f6d23aea4606b985fee04.png") !important; }
[data-char*="克蕾雅"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/c9a1f8b8fc602d1a851b83c15311e7b05e5f33868d44dde8.png") !important; }

/* =========================================================================
 * 🌟 纯透明全屏居中大立绘映射
 * ========================================================================= */
.custom-nvn-avatar-popover .custom-nvn-modal-content { display: none !important; }

/* ⚠ 这里的 :not(#nvn-modern-boost) 不是为了「隔离旧版」，是为了压过上面那条
   .custom-nvn-avatar-img:not(#…)::before { content:none !important }：
   模板里 <summary> 本身就带 .custom-nvn-avatar-img（头像 = summary），
   那条击杀规则会连全屏遮罩一起打掉 → 立绘打开后点哪都关不掉。
   带上同名 ID 提权后 (1,4,1) > (1,1,1)，遮罩才真正生成。*/
.custom-nvn-avatar-popover[open] summary:not(#nvn-modern-boost)::before {
  content: "" !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483640 !important;
  background: transparent !important;
  cursor: pointer !important;
  display: block !important;
}

.custom-nvn-avatar-popover[open] .custom-nvn-modal-content {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483641 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: none !important;
}

.custom-nvn-portrait-full {
  max-width: 88vw !important;
  max-height: 88vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.85)) !important;
  user-select: none !important;
  -webkit-user-drag: none !important;
  pointer-events: none !important;
}

/* 大立绘（格式参考：克蕾雅；卢克蕾齐雅是她的别名，一并留着） */
div.custom-nvn-dialogue:is([data-char*="克蕾雅"], [data-char*="卢克蕾齐雅"]) .custom-nvn-portrait-full { content: url("https://origin.picgo.net/2026/09/17/ac92bf314de5fc2fb6488b395a70a66e25515781bb8ce916.png") !important; }

/* 消除 Markdown 斜体污染 */
.custom-nvn-dialogue em, .custom-nvn-dialogue i,
.custom-nvn-primary em, .custom-nvn-primary i,
.custom-nvn-motion em, .custom-nvn-motion i,
.custom-nvn-text em, .custom-nvn-text i,
.custom-nvn-name-box em, .custom-nvn-name-box i {
  font-style: normal !important;
  font-weight: inherit !important;
  font-size: inherit !important;
  color: inherit !important;
  background: none !important;
  border: none !important;
  letter-spacing: inherit !important;
  text-shadow: inherit !important;
  line-height: inherit !important;
}

/* ⭐ 隐藏空的尾部对话容器
   — 三种模板的尾段文本类名不同（.nvn-primary / .nvn-quote-val），两种都覆盖。
   — 权重问题（v2.1.3）：user 行那条 [is_user] .nvn-text 的 display:flex 与旧隐藏规则
     同为 (0,3,0)，但它在样式表里排在后面，直接把 display:none 盖掉，
     所以只有 user 行会露出一个空引号加竖线的尾巴。这里加 div.custom-nvn-dialogue
     前缀把权重提到 (0,4,1)，稳压 user 行那条。
   — 再排除「纯中文」模板里日文兜底有内容的尾段，避免把该显示的回退台词藏掉。 */
div.custom-nvn-dialogue .custom-nvn-text-tail:has(.custom-nvn-primary:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))),
div.custom-nvn-dialogue .custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))) {
  display: none !important;
}
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-text-tail:not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-quote-val:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))) {
  display: none !important;
}

/* ⭐ 纯中文版：日文兜底默认隐藏，仅当对应中文为空时才显示原文 */
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-ja-fallback {
  display: none !important;
}
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-zh:empty + .custom-nvn-ja-fallback {
  display: inline !important;
}

/* ====== 修复第二段对白变色与双重括号问题 ====== */
.custom-nvn-text-tail .custom-nvn-quote-mark {
  display: inline !important;
}

.custom-nvn-text-tail .custom-nvn-primary,
.custom-nvn-text-tail .custom-nvn-primary * {
  color: var(--stage-text) !important;
  background: transparent !important;
  border: none !important;
  font-family: inherit !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
}
.custom-nvn-text-tail .custom-nvn-primary * {
  font-size: inherit !important;
}

/* =========================================================================
 * BS2 角色贴图（原图底部有留白，背景图贴底）
 * ========================================================================= */
div.custom-nvn-dialogue:is([data-char*="玛丽·安"]) .custom-nvn-avatar-img {
  background-size: cover !important;
  background-position: center 3px !important;
  transform: none !important;
}
/* ====== 心灵感应 & 特殊括号 ====== */
[data-quote="*"] .custom-nvn-telepathy-tag,
[data-quote="〈"] .custom-nvn-telepathy-tag,
[data-quote="《"] .custom-nvn-telepathy-tag,
[data-quote="‹"] .custom-nvn-telepathy-tag,
[data-quote="『"] .custom-nvn-telepathy-tag {
  display: inline-flex !important;
  align-items: center !important;
  margin-left: 2px !important;
  padding: 1px 7px !important;
  border-radius: 6px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: .08em !important;
  background: rgba(var(--rgb), 0.14) !important;
  border: 1px solid rgba(var(--rgb), 0.34) !important;
  color: var(--main) !important;
}
[data-quote="〈"] .custom-nvn-quote-mark.custom-left::before,
[data-quote="‹"] .custom-nvn-quote-mark.custom-left::before { content: "〈" !important; }
[data-quote="〈"] .custom-nvn-quote-mark.custom-right::before,
[data-quote="‹"] .custom-nvn-quote-mark.custom-right::before { content: "〉" !important; }
[data-quote="《"] .custom-nvn-quote-mark.custom-left::before { content: "《" !important; }
[data-quote="《"] .custom-nvn-quote-mark.custom-right::before { content: "》" !important; }
[data-quote="『"] .custom-nvn-quote-mark.custom-left::before { content: "『" !important; }
[data-quote="『"] .custom-nvn-quote-mark.custom-right::before { content: "』" !important; }
/* =========================================================================
 * 星号包裹的「内心思绪」：引号换成 *
 * ========================================================================= */
[data-quote="*"] .custom-nvn-quote-mark.custom-left::before { content: "*" !important; }
[data-quote="*"] .custom-nvn-quote-mark.custom-right::before { content: "*" !important; }
/* ==========================================================================
 * 中日双语模式补丁
 * 中文版与双语版的差异只在日文字体栈；这里按 data-mode 覆盖，
 * 所以同一份 CSS 同时支持两种模式。
 * ========================================================================== */
div.custom-nvn-dialogue[data-mode^="bilingual"],
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-text,
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-motion {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Hiragino Mincho ProN", "Yu Mincho", serif !important;
}

/* ==== 双语专属：ruby 注音与译文标记 ==== */
[data-quote="〈"] .custom-nvn-bilingual-ruby{color: #e8dcff !important; text-shadow: 0 0 8px rgba(var(--rgb), .45), 0 1px 3px rgba(0,0,0,.85) !important;}
.custom-nvn-bilingual-ruby{font-size: 1.10em !important; line-height: 2.3 !important;}
.custom-nvn-bilingual-ruby rt{font-size: 0.75em !important; transform: translateY(-3px) !important;}
.custom-nvn-trans-rt:not(:empty)::before{content: "“"; font-family: "Noto Serif SC", "Source Han Serif SC", serif; font-size: 0.88em; color: var(--main); opacity: 0.8; margin-right: 2px; vertical-align: baseline;}
.custom-nvn-trans-rt:not(:empty)::after{content: "”"; font-family: "Noto Serif SC", "Source Han Serif SC", serif; font-size: 0.88em; color: var(--main); opacity: 0.8; margin-left: 2px; vertical-align: baseline;}
.custom-nvn-bilingual-ruby rt:empty{display: none !important;}
.custom-nvn-dialogue em, .custom-nvn-dialogue i, .custom-nvn-bilingual-ruby em, .custom-nvn-bilingual-ruby i, .custom-nvn-motion em, .custom-nvn-motion i, .custom-nvn-text em, .custom-nvn-text i, .custom-nvn-name-box em, .custom-nvn-name-box i{font-style: normal !important; font-weight: inherit !important; font-size: inherit !important; color: inherit !important; background: none !important; border: none !important; letter-spacing: inherit !important; text-shadow: inherit !important; line-height: inherit !important;}


/* ====== 双语变体补充 ====== */
/* 「ruby · 中文在下」：把注音/日文挂到基文下方 */
.custom-nvn-bilingual-ruby.custom-nvn-ruby-flip { ruby-position: under; }
.custom-nvn-ruby-flip .custom-nvn-ja-rt,
.custom-nvn-ruby-flip rt { font-size: 0.75em !important; opacity: 0.92; }
/* 「纯中文 · 去除日语」：中文为主，日文走 ja-fallback（默认隐藏） */
.custom-nvn-zh-only .custom-nvn-zh { display: inline; }
.custom-nvn-zh-only .custom-nvn-ja-fallback { display: none; }
.custom-nvn-zh-only .custom-nvn-zh:empty + .custom-nvn-ja-fallback { display: inline !important; }

`,
    dark: `
/* =========================================================================
 * 现代对白样式 · 无气泡 + 角色主色下划线
 * -------------------------------------------------------------------------
 *  · 头像视窗 100×125 不变，只换圆角 / 描边 / 阴影；
 *  · 名字行 = 角色色圆点 + 名字（首字角色色）+ 动作徽章（细下划线）；
 *  · 台词不加任何框；动作描写下面一根角色主色下划线；
 *  · 头像框底一根角色主色下划线（带辉光），和动作描写呼应；
 *  · 玩家行整行镜像，靠右。
 * ========================================================================= */

/* ====== 消除原生气泡样式 ====== */
.mes_text:has(.custom-nvn-dialogue) blockquote:not(#nvn-modern-boost),
.mes_text:has(.custom-nvn-dialogue) > p:has(> .custom-nvn-dialogue):not(#nvn-modern-boost),
.custom-nvn-dialogue:not(#nvn-modern-boost) {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;}

/* ====== 基础容器 ====== */
.custom-nvn-dialogue:not(#nvn-modern-boost) {
  --main: #8c9aab;
  --sub: #b7c1cc;
  --rgb: 140, 154, 171;
  --motion-color: #a8b5c2;
  --stage-text: #eee7dc;
  --cmt: rgba(255, 255, 255, 0.46);
  --quote: rgba(255, 255, 255, 0.26);
  --halo: rgba(0, 0, 0, 0.45);
  --halo2: rgba(0, 0, 0, 0.55);
  --name: rgba(255, 255, 255, 0.92);
  --fb: rgba(255, 255, 255, 0.72);
  --npc-bg: rgba(14, 16, 20, 0.94);
  --fx: #ffffff;
  display: flex !important;
  /* 头像贴顶：原来整体垂直居中，长台词时头像会被拉到中间、再长就贴到上边，
     观感很怪。改成顶对齐 —— 头像纵向偏移恒为 0，等于硬上限。 */
  align-items: flex-start !important;
  align-self: flex-start !important;
  gap: 16px !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 14px 0 16px !important;
  padding: 0 !important;
  color: var(--stage-text) !important;
  /* 字体与旧版一致：思源宋体 → 苹方 → 雅黑，衬线兜底 */
  font-family: "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif !important;
  clear: both !important;}
.custom-nvn-dialogue *:not(#nvn-modern-boost) { box-sizing: border-box !important;}

/* ====== 抹掉旧版奇幻装饰（卡里还挂着旧版美化时的兜底） ======
   旧脚本在 .custom-nvn-content::before / ::after 上画上下两条金线，还给内容栏加了
   1px 边框；name-plate / avatar-img / motion 上也挂着蔷薇、内嵌细框、菱形端点。
   这些我们一个都不要，统一清掉（选择器带 :not(#…) 权重，压得住旧版的 !important）。 */
.custom-nvn-dialogue:not(#nvn-modern-boost)::before,
.custom-nvn-dialogue:not(#nvn-modern-boost)::after,
.custom-nvn-content:not(#nvn-modern-boost)::before,
.custom-nvn-content:not(#nvn-modern-boost)::after,
.custom-nvn-name-plate:not(#nvn-modern-boost)::after,
.custom-nvn-avatar-side:not(#nvn-modern-boost)::before,
.custom-nvn-avatar-side:not(#nvn-modern-boost)::after,
.custom-nvn-avatar-img:not(#nvn-modern-boost)::before,
.custom-nvn-avatar-img:not(#nvn-modern-boost)::after,
.custom-nvn-motion:not(#nvn-modern-boost)::before,
.custom-nvn-motion:not(#nvn-modern-boost)::after,
.custom-nvn-text:not(#nvn-modern-boost)::before,
.custom-nvn-text:not(#nvn-modern-boost)::after {
  content: none !important;
  display: none !important;
  border: 0 !important;
  background: none !important;}
.custom-nvn-content:not(#nvn-modern-boost) {
  border: 0 !important;
  background: none !important;
  box-shadow: none !important;}

/* ====== 头像视窗（100 × 125） ====== */
.custom-nvn-avatar-side:not(#nvn-modern-boost) {
  flex: 0 0 100px !important;
  width: 100px !important;
  position: relative !important;
  align-self: flex-start !important;}
.custom-nvn-avatar-img:not(#nvn-modern-boost) {
  width: 100px !important;
  height: 125px !important;
  min-height: 125px !important;
  border-radius: 12px !important;
  /* 描边跟角色主题色：暗色主题里 --halo2 是黑的，只看它就会是一圈黑框。
     这里先给「凡是有图」的默认主题色边，没头像的 NPC 由下面带守卫的规则覆盖。 */
  border: 1.5px solid rgba(var(--rgb), 0.78) !important;
  background-size: cover !important;
  background-position: center top !important;
  background-repeat: no-repeat !important;
  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;
  overflow: hidden !important;
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;}
/* 有头像的角色：描边跟着角色主题色走（暗色主题里 --halo2 是黑的，
   整圈看上去就是「黑框」；这里用 --rgb 画角色色细边 + 内发光，和旧版观感一致） */
div.custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-avatar-img:not(#nvn-modern-boost) {
  border: 1.5px solid rgba(var(--rgb), 0.78) !important;
  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;}

/* 没有头像的普通 NPC：磨砂玻璃名片 + 侧边主题色竖条
   ⚠ 「有没有头像」不能只看名字：玩家头像脚本 / 正则 / 别家美化都可能给
   非克蕾雅的角色塞图。所以这里三重守卫：脚本打的 data-nvn-has-avatar、
   行内 style 里的 background-image、以及玩家头像脚本的 data-wn-ua-applied。
   任一命中就当「有头像」，不走下面这套 NPC 外观。 */
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"]) {
  background-color: rgba(var(--rgb), 0.24) !important;
  background-image: linear-gradient(rgba(9, 11, 15, 0.56), rgba(9, 11, 15, 0.56)) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  border-left: 3px solid rgba(var(--rgb), 0.95) !important;
  border-radius: 16px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 12px 28px rgba(0, 0, 0, 0.30) !important;
  -webkit-backdrop-filter: blur(14px) saturate(1.35);
  backdrop-filter: blur(14px) saturate(1.35);}
/* 顶部主题色小圆点 */
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"])::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  top: 12px !important;
  left: 50% !important;
  width: 4px !important;
  height: 4px !important;
  margin-left: -2px !important;
  border-radius: 50% !important;
  background: rgba(var(--rgb), 0.95) !important;
  box-shadow: 0 0 8px rgba(var(--rgb), 0.85) !important;
  pointer-events: none !important;}
/* 旧的内框不要了 */
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"])::after {
  content: none !important;
  display: none !important;}
/* 玩家行（user）没有头像时：竖条换到右侧，与角色行左右对称 */
[is_user="true"] div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"]),
div.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]):not(:is(__CAST_IS__)) .custom-nvn-avatar-img:not(#nvn-modern-boost):not([data-nvn-has-avatar="1"]):not([style*="background-image"]):not([data-wn-ua-applied="1"]) {
  border-left: 1px solid rgba(255, 255, 255, 0.22) !important;
  border-right: 3px solid rgba(var(--rgb), 0.95) !important;}
/* 有立绘的角色：手型指针（玛丽·安 只有小头像，不放开弹层） */
div.custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-avatar-img:not(#nvn-modern-boost) {
  cursor: pointer !important;}
div.custom-nvn-dialogue:not(:is(__CAST_IS__)) .custom-nvn-avatar-popover:not(#nvn-modern-boost) {
  pointer-events: none !important;}

/* 立绘弹层：本身不占位、不显示默认小三角 */
.custom-nvn-avatar-popover:not(#nvn-modern-boost) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;}
.custom-nvn-avatar-popover summary:not(#nvn-modern-boost) {
  list-style: none !important;
  outline: none !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;}
.custom-nvn-avatar-popover summary:not(#nvn-modern-boost)::-webkit-details-marker,
.custom-nvn-avatar-popover summary:not(#nvn-modern-boost)::marker {
  display: none !important;}

/* 竖排名字兜底 */
.custom-nvn-avatar-fallback-box:not(#nvn-modern-boost) {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2 !important;}
.custom-nvn-avatar-fallback:not(#nvn-modern-boost) {
  /* 竖排名字：字号/字距与旧版一致；并把「竖直」钉死，免得被别的脚本/CSS 转歪 */
  writing-mode: vertical-rl !important;
  text-orientation: upright !important;
  transform: none !important;
  rotate: none !important;
  display: block !important;
  max-width: 2.3em !important;
  max-height: 100% !important;
  margin: 0 auto !important;
  font-size: 1.22em !important;
  font-weight: 700 !important;
  line-height: 1.32 !important;
  letter-spacing: 0.1em !important;
  text-align: center !important;
  word-break: break-all !important;
  color: var(--fb) !important;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;}
/* 有图的角色不再显示兜底字 */
div.custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-avatar-fallback-box:not(#nvn-modern-boost) {
  display: none !important;}

/* ====== 内容栏 ====== */
.custom-nvn-content:not(#nvn-modern-boost) {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 0 !important;
  min-width: 0 !important;
  padding-top: 1px !important;}

/* ====== 名字行：圆点 + 名字 + 动作徽章 ====== */
.custom-nvn-name-plate:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  align-self: flex-start !important;
  min-height: 0 !important;
  margin: 0 0 6px !important;
  padding: 0 !important;
  background: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;}
.custom-nvn-name-plate:not(#nvn-modern-boost)::before {
  content: "" !important;
  flex: 0 0 auto !important;
  width: 6px !important;
  height: 6px !important;
  border-radius: 50% !important;
  background: var(--main) !important;
  box-shadow: 0 0 8px rgba(var(--rgb), 0.8) !important;}
.custom-nvn-rose-crest:not(#nvn-modern-boost) { display: none !important;}
.custom-nvn-name-box:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: baseline !important;
  color: var(--name) !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important;
  text-shadow: none !important;}
.custom-nvn-name-initial:not(#nvn-modern-boost) {
  color: var(--main) !important;
  /* 首字大、其余小（名字行的「大首字」版式） */
  font-size: 1.38em !important;
  font-weight: 700 !important;
  line-height: 0.86 !important;
  margin-right: 1px !important;
  text-shadow: none !important;}
.custom-nvn-name-rest:not(#nvn-modern-boost) {
  color: inherit !important;
  /* 小字原先 0.76em 太小，放到 0.88em：仍比首字小一档，但正常可读 */
  font-size: 0.88em !important;
  letter-spacing: 0.08em !important;
  margin-left: 3px !important;
  opacity: 0.96 !important;}
.custom-nvn-action:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: center !important;
  margin-left: 2px !important;
  padding: 1px 9px 2px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em !important;
  /* 跟头像卡一个路子：只有主题色细边框，里面是透明磨砂玻璃；
     字是纯主题色，靠阴影从背景里托起来 */
  color: var(--main) !important;
  /* 暗色版均匀玻璃：主题色底 + 深玻璃层（同上，不做斜向渐变）。 */
  background-color: rgba(var(--rgb), 0.24) !important;
  background-image: linear-gradient(rgba(9, 11, 15, 0.56), rgba(9, 11, 15, 0.56)) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  border: 1px solid rgba(var(--rgb), 0.72) !important;
  border-radius: 999px !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;   /* 与正文（.custom-nvn-primary）一致 */
  -webkit-backdrop-filter: blur(14px) saturate(1.35);
  backdrop-filter: blur(14px) saturate(1.35);}
.custom-nvn-action:empty:not(#nvn-modern-boost) { display: none !important;}
.custom-nvn-telepathy-tag:not(#nvn-modern-boost) { display: none !important;}

/* ====== 台词（无框） ====== */
.custom-nvn-text:not(#nvn-modern-boost) {
  display: block !important;
  position: relative !important;
  margin: 0 !important;
  padding: 0 !important;
  background: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  text-align: left !important;}
.custom-nvn-text:not(#nvn-modern-boost)::before { display: none !important;}
.custom-nvn-primary:not(#nvn-modern-boost) {
  display: inline !important;
  color: var(--stage-text) !important;
  /* 旧版是 1.05em，这里按你说的再小 0.05 → 1.00em；字距/阴影照旧版 */
  font-size: 1.00em !important;
  line-height: 1.8 !important;
  letter-spacing: 0.05em !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
  word-break: break-word !important;}
.custom-nvn-quote-mark:not(#nvn-modern-boost) {
  /* 旧版：角色主色、1.15em、700、85% 不透明 */
  color: var(--main) !important;
  font-weight: 700 !important;
  font-size: 1.15em !important;
  opacity: 0.85 !important;
  flex-shrink: 0 !important;
  user-select: none !important;}
.custom-nvn-quote-mark.custom-left:not(#nvn-modern-boost) { margin-right: 4px !important;}
.custom-nvn-quote-mark.custom-right:not(#nvn-modern-boost) { margin-left: 4px !important;}
.custom-nvn-quote-mark.custom-left:not(#nvn-modern-boost)::before { content: "「" !important;}
.custom-nvn-quote-mark.custom-right:not(#nvn-modern-boost)::before { content: "」" !important;}

/* ====== 动作描写：文字宽度的一根角色主色下划线 ====== */
.custom-nvn-motion:not(#nvn-modern-boost) {
  align-self: flex-start !important;
  width: fit-content !important;
  max-width: 100% !important;
  display: block !important;
  margin-top: 6px !important;
  padding: 3px 11px 4px 10px !important;
  font-size: 12px !important;
  line-height: 1.6 !important;
  letter-spacing: 0.03em !important;
  /* 同上：透明磨砂 + 主题色细边框；右侧一根 3px 主题色竖条 */
  color: var(--main) !important;
  /* 暗色版均匀玻璃：主题色底 + 深玻璃层（同上，不做斜向渐变）。 */
  background-color: rgba(var(--rgb), 0.24) !important;
  background-image: linear-gradient(rgba(9, 11, 15, 0.56), rgba(9, 11, 15, 0.56)) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  /* 竖条默认在左侧 —— 角色行的头像卡也在左边，两边同侧才顺 */
  border: 1px solid rgba(var(--rgb), 0.62) !important;
  border-left: 3px solid rgba(var(--rgb), 1) !important;
  border-radius: 3px 9px 9px 3px !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;   /* 与正文（.custom-nvn-primary）一致 */
  word-break: break-word !important;
  -webkit-backdrop-filter: blur(14px) saturate(1.35);
  backdrop-filter: blur(14px) saturate(1.35);}
.custom-nvn-motion:empty:not(#nvn-modern-boost) {
  display: none !important;
  background: none !important;}

/* ====== 第二段台词（.text-tail）：空的时候整段（连那两个空引号）一起藏掉 ======
   模板里第二段是「<div class="nvn-text nvn-text-tail"> 左引号 + 空 primary + 右引号」，
   没有第二句时 primary 是空的，但两个引号是 ::before 生成的，不藏就会多出一对空「」。
   这里两条：结构上先用 :has() 藏；再靠脚本 sweepEmptyTails() 兜底（:has() 老内核不支持时）。 */
.custom-nvn-text-tail:not(#nvn-modern-boost) {
  display: block !important;}
.custom-nvn-text-tail:has(.custom-nvn-primary:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))):not(#nvn-modern-boost),
.custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))):not(#nvn-modern-boost),
.custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-quote-val:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))):not(#nvn-modern-boost) {
  display: none !important;}

/* ====== 玩家行：整行镜像 ====== */
[is_user="true"] .custom-nvn-dialogue:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]):not(#nvn-modern-boost) {
  --main: #7fc4ff;
  --sub: #cfe4ff;
  --rgb: 127, 196, 255;
  --motion-color: #a9cfff;
  flex-direction: row-reverse !important;
  align-self: flex-end !important;
  margin-left: auto !important;}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-name-plate:not(#nvn-modern-boost) {
  align-self: flex-end !important;
  flex-direction: row-reverse !important;}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-text:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-text:not(#nvn-modern-boost) {
  text-align: right !important;}
[is_user="true"] .custom-nvn-dialogue .custom-nvn-motion:not(#nvn-modern-boost),
.custom-nvn-dialogue:is([data-player^="user"], [data-player="true"]) .custom-nvn-motion:not(#nvn-modern-boost) {
  align-self: flex-end !important;
  /* user 行整行镜像：竖条换到右侧，和 user 头像卡那根同侧 */
  padding: 3px 10px 4px 11px !important;
  border-left: 1px solid rgba(var(--rgb), 0.62) !important;
  border-right: 3px solid rgba(var(--rgb), 1) !important;
  border-radius: 9px 3px 3px 9px !important;
  /* 暗色版均匀玻璃：主题色底 + 深玻璃层（同上，不做斜向渐变）。 */
  background-color: rgba(var(--rgb), 0.24) !important;
  background-image: linear-gradient(rgba(9, 11, 15, 0.56), rgba(9, 11, 15, 0.56)) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;}

/* ====== 亮 / 暗切换按钮（☀ / ☾ 纯 CSS 绘制） ======
   · 位置：名字行最右侧（神态徽章后面），JS 插进 .custom-nvn-name-plate
   · 图标语义：显示「点了会变成什么」——当前深色就显示太阳，反之显示月亮
   · data-nvn-next 由脚本写入，用户点过之后会记在 localStorage 里 */
.custom-nvn-theme-toggle:not(#nvn-modern-boost) {
  flex: 0 0 auto !important;
  align-self: center !important;
  width: 15px !important;
  height: 15px !important;
  margin: 0 0 0 6px !important;
  padding: 0 !important;
  border: 0 !important;
  background: none !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--main) !important;
  opacity: 0.5 !important;
  pointer-events: auto !important;
  transition: opacity 0.15s ease, transform 0.15s ease !important;
  -webkit-tap-highlight-color: transparent !important;}
.custom-nvn-theme-toggle:hover:not(#nvn-modern-boost) { opacity: 1 !important; transform: scale(1.14) !important;}
.custom-nvn-theme-toggle:active:not(#nvn-modern-boost) { transform: scale(0.9) !important;}
.custom-nvn-theme-toggle:not(#nvn-modern-boost)::before,
.custom-nvn-theme-toggle:not(#nvn-modern-boost)::after {
  content: "" !important;
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;}
/* 太阳 = 亮色：中心圆点 + 四道光芒 */
.custom-nvn-theme-toggle[data-nvn-next="light"]:not(#nvn-modern-boost)::before {
  width: 5.5px !important;
  height: 5.5px !important;
  border-radius: 50% !important;
  background: currentColor !important;
  transform: translate(-50%, -50%) !important;
  box-shadow: 0 0 6px rgba(var(--rgb), 0.5) !important;}
.custom-nvn-theme-toggle[data-nvn-next="light"]:not(#nvn-modern-boost)::after {
  width: 15px !important;
  height: 15px !important;
  transform: translate(-50%, -50%) !important;
  background:
    linear-gradient(currentColor, currentColor) 50% 0 / 1.4px 2.4px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 100% / 1.4px 2.4px no-repeat,
    linear-gradient(currentColor, currentColor) 0 50% / 2.4px 1.4px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 50% / 2.4px 1.4px no-repeat !important;}
/* 月亮 = 暗色：把错位圆的投影裁掉一块，留下月牙 */
.custom-nvn-theme-toggle[data-nvn-next="dark"]:not(#nvn-modern-boost)::before {
  width: 9.5px !important;
  height: 9.5px !important;
  border-radius: 50% !important;
  transform: translate(-50%, -50%) !important;
  box-shadow: 2.6px -1.2px 0 0 currentColor !important;}

/* ====== 移动端 ====== */
@media (max-width: 560px) {
  .custom-nvn-dialogue:not(#nvn-modern-boost) { gap: 12px !important; margin: 10px 0 12px !important;}
  .custom-nvn-avatar-side:not(#nvn-modern-boost) { flex: 0 0 75px !important; width: 75px !important;}
  .custom-nvn-avatar-img:not(#nvn-modern-boost) { width: 75px !important; height: 95px !important; min-height: 95px !important; border-radius: 10px !important;}
  .custom-nvn-name-box:not(#nvn-modern-boost) { font-size: 13px !important;}
  .custom-nvn-action:not(#nvn-modern-boost) { font-size: 10px !important;}
  .custom-nvn-theme-toggle:not(#nvn-modern-boost) { width: 14px !important; height: 14px !important; margin-left: 4px !important;}
  .custom-nvn-theme-toggle[data-nvn-next="light"]:not(#nvn-modern-boost)::after { width: 13px !important; height: 13px !important;}
  .custom-nvn-motion:not(#nvn-modern-boost) { font-size: 11.5px !important;}
  .custom-nvn-avatar-fallback:not(#nvn-modern-boost) { font-size: 14px !important;}
}

/* ====== 角色配色（格式参考） ====== */
div.custom-nvn-dialogue[data-char*="克蕾雅"] { --main: #e6b85c !important; --sub: #ffe89e !important; --rgb: 230, 184, 92 !important; --motion-color: #dfc698 !important; } /* 克蕾雅 · 琥珀金 */
div.custom-nvn-dialogue[data-char*="玛丽·安"] { --main: #2ed573 !important; --sub: #e0f9ec !important; --rgb: 46, 213, 115 !important; --motion-color: #65e199 !important; } /* 玛丽·安 · 翠草清绿 */

/* ====== 角色头像 / 表情差分 / 大立绘 ====== */
div.custom-nvn-dialogue[data-char*="玛丽·安"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/10/08/68208d56a291c30f7e89bc8a5fa6fd13e1aed1c696238752.png") !important; }
[data-char*="克蕾雅"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/1409d4e13ab7c1ad7e96924a36bdd9a3482303ab0ef221c1.png") !important; }
[data-char*="克蕾雅"][data-action*="脸红"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/fc2183f6475eb6ee573dd4db16b3ec9f48c2cb75b49e78e4.png") !important; }
[data-char*="克蕾雅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/1409d4e13ab7c1ad7e96924a36bdd9a3482303ab0ef221c1.png") !important; }
[data-char*="克蕾雅"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/fc2183f6475eb6ee573dd4db16b3ec9f48c2cb75b49e78e4.png") !important; }
[data-char*="克蕾雅"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/1f27d649bd5f1a9ddb35bfefea4ed3f04683fd73356f1699.png") !important; }
[data-char*="克蕾雅"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/bc29db1fa53036376ad890acbf993fda57275798edb08f16.png") !important; }
[data-char*="克蕾雅"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/5f4e05c1af887f84f81b6389692ef9af103738822016d420.png") !important; }
[data-char*="克蕾雅"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/2d53ef3ea50d7e218f439e2fac5683be6c93ddb9aacfbb81.png") !important; }
[data-char*="克蕾雅"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/68033e2d6a21b8051c9508ff0755bddbed247c407040b4bb.png") !important; }
[data-char*="克蕾雅"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/7794ef980f5bc34e787a3995b6b0b4b7745084898eb659ed.png") !important; }
[data-char*="克蕾雅"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/baa11b8602a9f6449cf68eed348d25580c136419c3adba4f.png") !important; }
[data-char*="克蕾雅"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/d8a041121401ef923bac3be73db4bf7b0d8a40a14a7ca628.png") !important; }
[data-char*="克蕾雅"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/57581a2f8d7520b05fc6b4faac3a7d06100aa17811a87dd5.png") !important; }
[data-char*="克蕾雅"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/f65ef8265d29273d9253d211fc1e1e1fb7179c9a6778d8b2.png") !important; }
[data-char*="克蕾雅"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/3befe4267924d76dbc662ecae1807ed7f63377ed996d0970.png") !important; }
[data-char*="克蕾雅"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/b0b4fdd77f7292caf2f58b6edff0f66b237500ffb5fb3610.png") !important; }
[data-char*="克蕾雅"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/f03cbb5d81bb016bac835a74dfd51176f02cbb804c65fe98.png") !important; }
[data-char*="克蕾雅"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/3b2308cdc7cf17a9cbdcc5e19940c31ec7d54698b268f4f5.png") !important; }
[data-char*="克蕾雅"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/44ce1289e408ff31326c15854d2dd52400d534ac1dcbd11f.png") !important; }
[data-char*="克蕾雅"][data-action="皱眉"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/2a1abab328580412da62f64cc99df487554518f75d7f6560.png") !important; }
[data-char*="克蕾雅"][data-action="脸红皱眉"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/c1f238456163127c71dad05c1ff273da1cf2136d8b8580ee.png") !important; }
[data-char*="克蕾雅"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/d0e17c88434483f1d7a56d38338f6d23aea4606b985fee04.png") !important; }
[data-char*="克蕾雅"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/09/16/c9a1f8b8fc602d1a851b83c15311e7b05e5f33868d44dde8.png") !important; }

/* =========================================================================
 * 🌟 纯透明全屏居中大立绘映射
 * ========================================================================= */
.custom-nvn-avatar-popover .custom-nvn-modal-content { display: none !important; }

/* ⚠ 这里的 :not(#nvn-modern-boost) 不是为了「隔离旧版」，是为了压过上面那条
   .custom-nvn-avatar-img:not(#…)::before { content:none !important }：
   模板里 <summary> 本身就带 .custom-nvn-avatar-img（头像 = summary），
   那条击杀规则会连全屏遮罩一起打掉 → 立绘打开后点哪都关不掉。
   带上同名 ID 提权后 (1,4,1) > (1,1,1)，遮罩才真正生成。*/
.custom-nvn-avatar-popover[open] summary:not(#nvn-modern-boost)::before {
  content: "" !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483640 !important;
  background: transparent !important;
  cursor: pointer !important;
  display: block !important;
}

.custom-nvn-avatar-popover[open] .custom-nvn-modal-content {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483641 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: none !important;
}

.custom-nvn-portrait-full {
  max-width: 88vw !important;
  max-height: 88vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.85)) !important;
  user-select: none !important;
  -webkit-user-drag: none !important;
  pointer-events: none !important;
}

/* 大立绘（格式参考：克蕾雅；卢克蕾齐雅是她的别名，一并留着） */
div.custom-nvn-dialogue:is([data-char*="克蕾雅"], [data-char*="卢克蕾齐雅"]) .custom-nvn-portrait-full { content: url("https://origin.picgo.net/2026/09/17/ac92bf314de5fc2fb6488b395a70a66e25515781bb8ce916.png") !important; }

/* 消除 Markdown 斜体污染 */
.custom-nvn-dialogue em, .custom-nvn-dialogue i,
.custom-nvn-primary em, .custom-nvn-primary i,
.custom-nvn-motion em, .custom-nvn-motion i,
.custom-nvn-text em, .custom-nvn-text i,
.custom-nvn-name-box em, .custom-nvn-name-box i {
  font-style: normal !important;
  font-weight: inherit !important;
  font-size: inherit !important;
  color: inherit !important;
  background: none !important;
  border: none !important;
  letter-spacing: inherit !important;
  text-shadow: inherit !important;
  line-height: inherit !important;
}

/* ⭐ 隐藏空的尾部对话容器
   — 三种模板的尾段文本类名不同（.nvn-primary / .nvn-quote-val），两种都覆盖。
   — 权重问题（v2.1.3）：user 行那条 [is_user] .nvn-text 的 display:flex 与旧隐藏规则
     同为 (0,3,0)，但它在样式表里排在后面，直接把 display:none 盖掉，
     所以只有 user 行会露出一个空引号加竖线的尾巴。这里加 div.custom-nvn-dialogue
     前缀把权重提到 (0,4,1)，稳压 user 行那条。
   — 再排除「纯中文」模板里日文兜底有内容的尾段，避免把该显示的回退台词藏掉。 */
div.custom-nvn-dialogue .custom-nvn-text-tail:has(.custom-nvn-primary:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))),
div.custom-nvn-dialogue .custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))) {
  display: none !important;
}
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-text-tail:not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-quote-val:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))) {
  display: none !important;
}

/* ⭐ 纯中文版：日文兜底默认隐藏，仅当对应中文为空时才显示原文 */
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-ja-fallback {
  display: none !important;
}
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-zh:empty + .custom-nvn-ja-fallback {
  display: inline !important;
}

/* ====== 修复第二段对白变色与双重括号问题 ====== */
.custom-nvn-text-tail .custom-nvn-quote-mark {
  display: inline !important;
}

.custom-nvn-text-tail .custom-nvn-primary,
.custom-nvn-text-tail .custom-nvn-primary * {
  color: var(--stage-text) !important;
  background: transparent !important;
  border: none !important;
  font-family: inherit !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
}
.custom-nvn-text-tail .custom-nvn-primary * {
  font-size: inherit !important;
}

/* =========================================================================
 * BS2 角色贴图（原图底部有留白，背景图贴底）
 * ========================================================================= */
div.custom-nvn-dialogue:is([data-char*="玛丽·安"]) .custom-nvn-avatar-img {
  background-size: cover !important;
  background-position: center 3px !important;
  transform: none !important;
}
/* ====== 心灵感应 & 特殊括号 ====== */
[data-quote="*"] .custom-nvn-telepathy-tag,
[data-quote="〈"] .custom-nvn-telepathy-tag,
[data-quote="《"] .custom-nvn-telepathy-tag,
[data-quote="‹"] .custom-nvn-telepathy-tag,
[data-quote="『"] .custom-nvn-telepathy-tag {
  display: inline-flex !important;
  align-items: center !important;
  margin-left: 2px !important;
  padding: 1px 7px !important;
  border-radius: 6px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: .08em !important;
  background: rgba(var(--rgb), 0.14) !important;
  border: 1px solid rgba(var(--rgb), 0.34) !important;
  color: var(--main) !important;
}
[data-quote="〈"] .custom-nvn-quote-mark.custom-left::before,
[data-quote="‹"] .custom-nvn-quote-mark.custom-left::before { content: "〈" !important; }
[data-quote="〈"] .custom-nvn-quote-mark.custom-right::before,
[data-quote="‹"] .custom-nvn-quote-mark.custom-right::before { content: "〉" !important; }
[data-quote="《"] .custom-nvn-quote-mark.custom-left::before { content: "《" !important; }
[data-quote="《"] .custom-nvn-quote-mark.custom-right::before { content: "》" !important; }
[data-quote="『"] .custom-nvn-quote-mark.custom-left::before { content: "『" !important; }
[data-quote="『"] .custom-nvn-quote-mark.custom-right::before { content: "』" !important; }
/* =========================================================================
 * 星号包裹的「内心思绪」：引号换成 *
 * ========================================================================= */
[data-quote="*"] .custom-nvn-quote-mark.custom-left::before { content: "*" !important; }
[data-quote="*"] .custom-nvn-quote-mark.custom-right::before { content: "*" !important; }
/* ==========================================================================
 * 中日双语模式补丁
 * 中文版与双语版的差异只在日文字体栈；这里按 data-mode 覆盖，
 * 所以同一份 CSS 同时支持两种模式。
 * ========================================================================== */
div.custom-nvn-dialogue[data-mode^="bilingual"],
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-text,
div.custom-nvn-dialogue[data-mode^="bilingual"] .custom-nvn-motion {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Hiragino Mincho ProN", "Yu Mincho", serif !important;
}

/* ==== 双语专属：ruby 注音与译文标记 ==== */
[data-quote="〈"] .custom-nvn-bilingual-ruby{color: #e8dcff !important; text-shadow: 0 0 8px rgba(var(--rgb), .45), 0 1px 3px rgba(0,0,0,.85) !important;}
.custom-nvn-bilingual-ruby{font-size: 1.10em !important; line-height: 2.3 !important;}
.custom-nvn-bilingual-ruby rt{font-size: 0.75em !important; transform: translateY(-3px) !important;}
.custom-nvn-trans-rt:not(:empty)::before{content: "“"; font-family: "Noto Serif SC", "Source Han Serif SC", serif; font-size: 0.88em; color: var(--main); opacity: 0.8; margin-right: 2px; vertical-align: baseline;}
.custom-nvn-trans-rt:not(:empty)::after{content: "”"; font-family: "Noto Serif SC", "Source Han Serif SC", serif; font-size: 0.88em; color: var(--main); opacity: 0.8; margin-left: 2px; vertical-align: baseline;}
.custom-nvn-bilingual-ruby rt:empty{display: none !important;}
.custom-nvn-dialogue em, .custom-nvn-dialogue i, .custom-nvn-bilingual-ruby em, .custom-nvn-bilingual-ruby i, .custom-nvn-motion em, .custom-nvn-motion i, .custom-nvn-text em, .custom-nvn-text i, .custom-nvn-name-box em, .custom-nvn-name-box i{font-style: normal !important; font-weight: inherit !important; font-size: inherit !important; color: inherit !important; background: none !important; border: none !important; letter-spacing: inherit !important; text-shadow: inherit !important; line-height: inherit !important;}


/* ====== 双语变体补充 ====== */
/* 「ruby · 中文在下」：把注音/日文挂到基文下方 */
.custom-nvn-bilingual-ruby.custom-nvn-ruby-flip { ruby-position: under; }
.custom-nvn-ruby-flip .custom-nvn-ja-rt,
.custom-nvn-ruby-flip rt { font-size: 0.75em !important; opacity: 0.92; }
/* 「纯中文 · 去除日语」：中文为主，日文走 ja-fallback（默认隐藏） */
.custom-nvn-zh-only .custom-nvn-zh { display: inline; }
.custom-nvn-zh-only .custom-nvn-ja-fallback { display: none; }
.custom-nvn-zh-only .custom-nvn-zh:empty + .custom-nvn-ja-fallback { display: inline !important; }

`,
  };

  /* ---------------- 宿主窗口 / 文档 ---------------- */
  function getHostWin() {
    try { if (window.parent && window.parent !== window) return window.parent; } catch (_) {}
    return window;
  }
  function getHostDoc() {
    try {
      if (window.parent && window.parent !== window && window.parent.document) {
        return window.parent.document;
      }
    } catch (_) {}
    return document;
  }
  const HW = getHostWin();
  let HD = getHostDoc();

  function fn(name) {
    const scopes = [window, window.TavernHelper, HW, HW.TavernHelper];
    for (const s of scopes) {
      try { if (s && typeof s[name] === 'function') return s[name].bind(s); } catch (_) {}
    }
    return null;
  }

  /* ---------------- 主题判定：只有「深色框」需要单独一份 ---------------- */
  const ROW_SEL = '[class*="nvn-dialogue"][data-mode]';   /* class 会被改名，用 [class*=] */

  function themeFromDom() {
    try {
      const rows = HD.querySelectorAll(ROW_SEL);
      if (!rows.length) return null;
      let sawPlain = false;
      for (const el of rows) {
        const m = String(el.getAttribute('data-mode') || '');
        if (m === 'dark') return 'dark';
        if (m === 'light') sawPlain = true;
      }
      return sawPlain ? 'light' : null;
    } catch (_) { return null; }
  }

  function themeFromConfig() {
    try {
      const ctx = HW.SillyTavern && HW.SillyTavern.getContext && HW.SillyTavern.getContext();
      if (!ctx || !Array.isArray(ctx.characters)) return null;
      const pick = function (ch) {
        let list = null;
        try { list = ch && ch.data && ch.data.extensions && ch.data.extensions.regex_scripts; } catch (_) {}
        if (!Array.isArray(list)) return null;
        for (const r of list) {
          if (!r || r.disabled) continue;
          const n = String(r.scriptName || '');
          if (n.indexOf('对白美化') === -1) continue;
          /* 「【中文 - 深色框对白美化v2.6】」含「中文」也含「深色」，所以先判深色 */
          return n.indexOf('深色') !== -1 ? 'dark' : 'light';
        }
        return null;
      };
      const id = ctx.characterId;
      if (id !== undefined && id !== null && ctx.characters[id]) {
        const t = pick(ctx.characters[id]);
        if (t) return t;
      }
      for (const ch of ctx.characters) { const t = pick(ch); if (t) return t; }
    } catch (_) {}
    return null;
  }

  /* ---------------- 注入 / 切换 ---------------- */
  let styleEl = null;
  let current = null;
  let cache = null;   /* 主题 -> 完整 CSS，避免每次重建字符串 */
  /* 手动切换的亮 / 暗：非空时优先于「按卡名猜主题」 */
  const MODE_KEY = 'nvn-dlg-mode';
  let alive = true;
  /* 这份美化只属于「装它时的那张卡」：换卡 / 换人后自动撤掉，不跟去别的卡 */
  function currentCharName() {
    try {
      const ctx = HW.SillyTavern && HW.SillyTavern.getContext && HW.SillyTavern.getContext();
      if (ctx) {
        if (ctx.name) return String(ctx.name);
        const id = ctx.characterId;
        if (id !== undefined && id !== null && ctx.characters && ctx.characters[id]) {
          return String(ctx.characters[id].name || '');
        }
      }
    } catch (_) {}
    try {
      const el = HD.querySelector('#character_name_pole') || HD.querySelector('.character_name');
      if (el && el.textContent) return el.textContent.trim();
    } catch (_) {}
    return '';
  }
  const BOUND_NAME = currentCharName();
  let userTheme = null;
  try {
    const ls = HW.localStorage;
    const v = ls && ls.getItem(MODE_KEY);
    if (v === 'light' || v === 'dark') userTheme = v;
  } catch (_) {}


  /* ---- 方案 D 定稿版：线框排版 + 主要角色星徽 + 亮/暗切换 ---- */
  const D_LAYOUT_CSS = {
    light: `#chat .custom-nvn-dialogue{
  --nvn-ink: #1f242b;
  --nvn-ink-soft: rgba(31,36,43,.92);
  --nvn-muted: rgba(31,36,43,.55);
  --nvn-faint: rgba(31,36,43,.32);
  --nvn-line: rgba(31,36,43,.20);
  --nvn-line-soft: rgba(31,36,43,.12);
  --nvn-ts: 0 1px 0 rgba(255,255,255,.45);
  display: grid !important; grid-template-columns: 112px minmax(0,1fr) !important;
  column-gap: 2px !important; align-items: start !important;
  margin: 16px 0 !important; padding: 0 !important; border: 0 !important;
}#chat .custom-nvn-dialogue::before, #chat .custom-nvn-dialogue::after, #chat .custom-nvn-content::before, #chat .custom-nvn-content::after, #chat .custom-nvn-name-plate::before, #chat .custom-nvn-name-plate::after, #chat .custom-nvn-text::before, #chat .custom-nvn-text::after, #chat .custom-nvn-motion::before, #chat .custom-nvn-motion::after{ content: none !important; display: none !important; border: 0 !important; background: none !important; }#chat .custom-nvn-avatar-side{ grid-column: 1 !important; width: 112px !important; min-width: 112px !important; }#chat .custom-nvn-avatar-img{
  width: 112px !important; height: 140px !important; min-height: 140px !important;
  border-radius: 12px !important; border: 1.5px solid rgba(var(--rgb), .78) !important;
  background-size: cover !important; background-position: center top !important; background-repeat: no-repeat !important;
  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), .12) !important;
  image-rendering: -webkit-optimize-contrast !important;
  overflow: hidden !important;
}#chat .custom-nvn-vline{
  position: absolute !important; top: 14px !important; bottom: 6px !important;
  left: 0 !important; width: 1px !important;
  background: rgba(var(--rgb), .50) !important; pointer-events: none !important;
}#chat [data-nvn-user="1"] .custom-nvn-vline{ left: auto !important; right: 0 !important; }#chat .custom-nvn-content{
  grid-column: 2 !important; min-width: 0 !important;
  padding: 14px 0 0 10px !important;
  border-left: 0 !important;
  position: relative !important;
  background: none !important; box-shadow: none !important;
}#chat .custom-nvn-content::before{
  content: "" !important; display: block !important;
  position: absolute !important; left: 0 !important; top: 14px !important; bottom: 6px !important;
  width: 1px !important; background: rgba(var(--rgb), .50) !important;
}#chat .custom-nvn-name-plate{
  display: flex !important; align-items: center !important; gap: 0 !important;
  position: relative !important;
  margin: 0 0 4px !important; padding: 0 !important; min-height: 0 !important; width: 100% !important;
  background: none !important; border: 0 !important; box-shadow: none !important; align-self: stretch !important;
}#chat .custom-nvn-rule{
  flex: 1 1 auto !important; min-width: 0 !important; overflow: hidden !important;
  display: flex !important; align-items: center !important; gap: 8px !important;
  margin-left: 8px !important;
}#chat .custom-nvn-rule-line{
  flex: 0 0 auto !important; width: var(--nvn-line-first-w, 100%) !important; height: 1px !important;
  background: linear-gradient(90deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) !important;
}#chat .custom-nvn-name-plate::before{
  content: "" !important; display: block !important; flex: 0 0 6px !important;
  width: 6px !important; height: 6px !important; margin-right: 9px !important; border: 1px solid var(--main) !important;
  background: transparent !important; transform: rotate(45deg) !important; opacity: .9 !important;
}#chat .custom-nvn-dialogue:has(.custom-nvn-avatar-img[data-nvn-has-avatar="1"]) .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-rose-crest{
  display: none !important;
  flex: 0 0 13px !important; width: 13px !important; height: 13px !important; margin-right: 9px !important;
  align-items: center !important; justify-content: center !important;
  background: none !important; border: 0 !important; box-shadow: none !important;
  position: relative !important;
}#chat .custom-nvn-dialogue:has(.custom-nvn-avatar-img[data-nvn-has-avatar="1"]) .custom-nvn-rose-crest, #chat .custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-rose-crest{ display: inline-flex !important; }#chat .custom-nvn-dialogue:not([data-nvn-user="1"]):not([data-player^="user"]):not([data-player="true"]) .custom-nvn-rose-crest{ display: inline-flex !important; }#chat .custom-nvn-dialogue:not([data-nvn-user="1"]):not([data-player^="user"]):not([data-player="true"]) .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-dialogue[data-nvn-main="1"] .custom-nvn-rose-crest{ display: inline-flex !important; }#chat .custom-nvn-dialogue[data-nvn-main="1"] .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-dialogue[data-nvn-main="1"] .custom-nvn-name-plate, #chat .custom-nvn-dialogue[data-nvn-user="1"] .custom-nvn-name-plate{ width: 100% !important; align-self: stretch !important; }#chat .custom-nvn-rose-crest svg{ display: none !important; }#chat .custom-nvn-rose-crest::before{
  content: "" !important; display: block !important;
  width: 11px !important; height: 11px !important;
  background: var(--main) !important;
  -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.6c.95 6.5 3.95 9.5 10.4 10.4-6.45.9-9.45 3.9-10.4 10.4-.95-6.5-3.95-9.5-10.4-10.4C8.05 11.1 11.05 8.1 12 1.6z'/%3E%3C/svg%3E") center / contain no-repeat !important;
  mask: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.6c.95 6.5 3.95 9.5 10.4 10.4-6.45.9-9.45 3.9-10.4 10.4-.95-6.5-3.95-9.5-10.4-10.4C8.05 11.1 11.05 8.1 12 1.6z'/%3E%3C/svg%3E") center / contain no-repeat !important;
  filter: drop-shadow(0 0 4px rgba(var(--rgb), .55)) !important;
}#chat .custom-nvn-name-box{
  display: inline-flex !important; align-items: baseline !important;
  font-family: "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important;
  font-size: 13.5px !important; font-weight: 600 !important; letter-spacing: .18em !important;
  color: var(--nvn-ink) !important; text-shadow: none !important;
}#chat .custom-nvn-name-initial{ font-size: 1em !important; color: var(--main) !important; line-height: 1 !important; }#chat .custom-nvn-name-rest{ font-size: 1em !important; color: var(--nvn-ink) !important; margin-left: 1px !important; opacity: .92 !important; }#chat .custom-nvn-name-box .nvn-ch{ font-size: 1em !important; font-weight: 600 !important; letter-spacing: .18em !important; line-height: 1 !important; }#chat .custom-nvn-name-box .nvn-ch:first-child{ font-size: 1.1em !important; font-weight: 600 !important; }#chat .custom-nvn-name-box .nvn-ch:last-child{ margin-right: -0.18em !important; }#chat .custom-nvn-name-box .nvn-ch:nth-child(2n+1){ color: var(--main) !important; }#chat .custom-nvn-action{
  margin-left: 6px !important; flex: 0 0 auto !important;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", "Noto Sans Mono CJK SC", monospace !important;
  font-size: 11px !important; font-weight: 500 !important; letter-spacing: .1em !important;
  color: var(--main) !important; background: none !important; border: 0 !important;
  padding: 0 !important; border-radius: 0 !important; text-shadow: none !important;
}#chat .custom-nvn-action::before{ content: "[" !important; color: var(--nvn-faint) !important; }#chat .custom-nvn-action::after{ content: "]" !important; color: var(--nvn-faint) !important; }#chat .custom-nvn-action:empty{ display: none !important; }#chat .custom-nvn-theme-toggle{
  position: relative !important; flex: 0 0 auto !important;
  width: 15px !important; height: 15px !important;
  margin: 0 !important; padding: 0 !important; border: 0 !important;
  background: none !important; border-radius: 50% !important;
  cursor: pointer !important; position: absolute !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  color: var(--main) !important; opacity: .8 !important; pointer-events: auto !important;
  transition: opacity .15s ease, transform .15s ease !important;
  -webkit-tap-highlight-color: transparent !important;
}#chat .custom-nvn-theme-toggle:hover{ opacity: 1 !important; transform: scale(1.12) !important; }#chat .custom-nvn-theme-toggle:active{ transform: scale(.9) !important; }#chat .custom-nvn-theme-toggle::before, #chat .custom-nvn-theme-toggle::after{
  content: "" !important; position: absolute !important; left: 50% !important; top: 50% !important;
}#chat .custom-nvn-theme-toggle[data-nvn-next="light"]::before{
  width: 6.5px !important; height: 6.5px !important; border-radius: 50% !important;
  background: currentColor !important; transform: translate(-50%, -50%) !important;
  box-shadow: 0 0 6px rgba(var(--rgb), .45) !important;
}#chat .custom-nvn-theme-toggle[data-nvn-next="light"]::after{
  width: 14px !important; height: 14px !important; transform: translate(-50%, -50%) !important;
  background:
    linear-gradient(currentColor, currentColor) 50% 0 / 1.3px 2.2px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 100% / 1.3px 2.2px no-repeat,
    linear-gradient(currentColor, currentColor) 0 50% / 2.2px 1.3px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 50% / 2.2px 1.3px no-repeat !important;
}#chat .custom-nvn-theme-toggle[data-nvn-next="dark"]::before{
  width: 9px !important; height: 9px !important; border-radius: 50% !important;
  transform: translate(-50%, -50%) !important;
  box-shadow: 2.4px -1.1px 0 0 currentColor !important;
}#chat .custom-nvn-text{
  display: block !important; margin: 0 !important; padding: 0 !important;
  background: none !important; border: 0 !important; box-shadow: none !important; text-align: left !important;
}#chat .custom-nvn-primary{
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important;
  font-size: 16px !important; line-height: 1.95 !important; letter-spacing: .03em !important;
  color: var(--nvn-ink-soft) !important; text-shadow: var(--nvn-ts) !important;
}#chat .custom-nvn-quote-mark{ display: inline !important; color: var(--main) !important; opacity: 1 !important; font-weight: 400 !important; font-size: 1.25em !important; line-height: 1 !important; }#chat .custom-nvn-quote-mark.custom-left::before{ content: "「" !important; }#chat .custom-nvn-quote-mark.custom-right::before{ content: "」" !important; }#chat .custom-nvn-motion{
  display: block !important; margin: 9px 0 0 !important; padding: 0 !important;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace !important;
  font-size: 12.5px !important; line-height: 1.65 !important; letter-spacing: .01em !important;
  color: rgba(var(--rgb), .88) !important; background: none !important; border: 0 !important; box-shadow: none !important;
  text-shadow: none !important;
}#chat .custom-nvn-motion::before{ content: "// " !important; display: inline !important; color: rgba(var(--rgb),.85) !important; }#chat .custom-nvn-motion:empty{ display: none !important; }#chat [is_user="true"] .custom-nvn-dialogue, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]){ grid-template-columns: minmax(0,1fr) 112px !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-avatar-side, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-avatar-side{ grid-column: 2 !important; grid-row: 1 !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-content, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-content{
  grid-column: 1 !important; grid-row: 1 !important;
  padding: 14px 10px 0 0 !important;
  border-left: 0 !important; border-right: 0 !important;
  text-align: right !important;
}#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-name-plate{ flex-direction: row-reverse !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate::before, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-name-plate::before{ display: none !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate::after, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-name-plate::after{
  background: linear-gradient(270deg,
    rgba(var(--rgb), .62) 0, rgba(var(--rgb), .62) 16px,
    rgba(var(--rgb), 0) 16px, rgba(var(--rgb), 0) 32px,
    rgba(var(--rgb), .42) 32px, rgba(var(--rgb), .10) 100%) !important;
}#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-theme-toggle, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-theme-toggle{ left: auto !important; right: 16px !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-action, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-action{ margin-left: 0 !important; margin-right: 6px !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-text, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-text{ text-align: right !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-motion, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-motion{
  text-align: right !important;
  background: none !important; background-color: transparent !important; background-image: none !important;
  border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
  padding: 0 !important; text-shadow: none !important;
}#chat [data-nvn-user="1"]{ grid-template-columns: minmax(0,1fr) 112px !important; }#chat [data-nvn-user="1"] .custom-nvn-avatar-side{ display: block !important; grid-column: 2 !important; grid-row: 1 !important; }#chat [data-nvn-user="1"] .custom-nvn-avatar-img{ display: flex !important; }#chat [data-nvn-user="1"] .custom-nvn-content{
  grid-column: 1 !important; grid-row: 1 !important;
  padding: 1px 16px 0 0 !important;
  border-left: 0 !important; border-right: 1px solid rgba(var(--rgb), .50) !important;
  text-align: right !important;
}#chat [data-nvn-user="1"] .custom-nvn-content::before{ left: auto !important; right: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-text, #chat [data-nvn-user="1"] .custom-nvn-text .custom-nvn-primary{ text-align: right !important; background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-name-plate{ display: grid !important; grid-template-columns: minmax(0,1fr) auto auto !important; align-items: center !important; }#chat [data-nvn-user="1"] .custom-nvn-rule{ order: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-action{ order: 1 !important; margin-left: 0 !important; margin-right: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-name-box{ order: 2 !important; }#chat [data-nvn-user="1"] .custom-nvn-name-plate::before{ display: none !important; }#chat [data-nvn-user="1"] .custom-nvn-rule{ flex-direction: row-reverse !important; margin-left: 0 !important; margin-right: 8px !important; }#chat [data-nvn-user="1"] .custom-nvn-rule-line{ flex: 1 1 auto !important; width: auto !important; background: linear-gradient(270deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) !important; }#chat [data-nvn-user="1"] .custom-nvn-motion{
  text-align: right !important; width: auto !important; align-self: stretch !important;
  background: none !important; background-color: transparent !important; background-image: none !important;
  border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
  padding: 0 !important; text-shadow: none !important;
}#chat [data-nvn-user="1"] .custom-nvn-rose-crest{ display: none !important; }@media (max-width: 560px){#chat .custom-nvn-dialogue{ grid-template-columns: 75px minmax(0,1fr) !important; column-gap: 12px !important; margin: 12px 0 !important; }#chat .custom-nvn-avatar-side{ width: 75px !important; min-width: 75px !important; }#chat .custom-nvn-avatar-img{ width: 75px !important; height: 95px !important; min-height: 95px !important; border-radius: 10px !important; }#chat .custom-nvn-content{ padding-left: 12px !important; }#chat .custom-nvn-primary{ font-size: 15px !important; }#chat .custom-nvn-rose-crest{ flex-basis: 16px !important; width: 16px !important; height: 16px !important; border-radius: 5px !important; }#chat .custom-nvn-theme-toggle{ width: 15px !important; height: 15px !important; }}#chat .custom-nvn-text-tail:has(.custom-nvn-primary:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))), #chat .custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))){
  display: none !important;
}#chat body.nvn-streaming .custom-nvn-rule, #chat body.nvn-streaming .custom-nvn-vline, #chat body.nvn-streaming .custom-nvn-theme-toggle{ visibility: hidden !important; }`,
    dark: `#chat .custom-nvn-dialogue{
  --nvn-ink: #eef2f7;
  --nvn-ink-soft: rgba(238,242,247,.92);
  --nvn-muted: rgba(255,255,255,.48);
  --nvn-faint: rgba(255,255,255,.26);
  --nvn-line: rgba(255,255,255,.16);
  --nvn-line-soft: rgba(255,255,255,.10);
  --nvn-ts: 0 1px 2px rgba(0,0,0,.35);
  display: grid !important; grid-template-columns: 112px minmax(0,1fr) !important;
  column-gap: 2px !important; align-items: start !important;
  margin: 16px 0 !important; padding: 0 !important; border: 0 !important;
}#chat .custom-nvn-dialogue::before, #chat .custom-nvn-dialogue::after, #chat .custom-nvn-content::before, #chat .custom-nvn-content::after, #chat .custom-nvn-name-plate::before, #chat .custom-nvn-name-plate::after, #chat .custom-nvn-text::before, #chat .custom-nvn-text::after, #chat .custom-nvn-motion::before, #chat .custom-nvn-motion::after{ content: none !important; display: none !important; border: 0 !important; background: none !important; }#chat .custom-nvn-avatar-side{ grid-column: 1 !important; width: 112px !important; min-width: 112px !important; }#chat .custom-nvn-avatar-img{
  width: 112px !important; height: 140px !important; min-height: 140px !important;
  border-radius: 12px !important; border: 1.5px solid rgba(var(--rgb), .78) !important;
  background-size: cover !important; background-position: center top !important; background-repeat: no-repeat !important;
  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), .12) !important;
  image-rendering: -webkit-optimize-contrast !important;
  overflow: hidden !important;
}#chat .custom-nvn-vline{
  position: absolute !important; top: 14px !important; bottom: 6px !important;
  left: 0 !important; width: 1px !important;
  background: rgba(var(--rgb), .50) !important; pointer-events: none !important;
}#chat [data-nvn-user="1"] .custom-nvn-vline{ left: auto !important; right: 0 !important; }#chat .custom-nvn-content{
  grid-column: 2 !important; min-width: 0 !important;
  padding: 14px 0 0 10px !important;
  border-left: 0 !important;
  position: relative !important;
  background: none !important; box-shadow: none !important;
}#chat .custom-nvn-content::before{
  content: "" !important; display: block !important;
  position: absolute !important; left: 0 !important; top: 14px !important; bottom: 6px !important;
  width: 1px !important; background: rgba(var(--rgb), .50) !important;
}#chat .custom-nvn-name-plate{
  display: flex !important; align-items: center !important; gap: 0 !important;
  position: relative !important;
  margin: 0 0 4px !important; padding: 0 !important; min-height: 0 !important; width: 100% !important;
  background: none !important; border: 0 !important; box-shadow: none !important; align-self: stretch !important;
}#chat .custom-nvn-rule{
  flex: 1 1 auto !important; min-width: 0 !important; overflow: hidden !important;
  display: flex !important; align-items: center !important; gap: 8px !important;
  margin-left: 8px !important;
}#chat .custom-nvn-rule-line{
  flex: 0 0 auto !important; width: var(--nvn-line-first-w, 100%) !important; height: 1px !important;
  background: linear-gradient(90deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) !important;
}#chat .custom-nvn-name-plate::before{
  content: "" !important; display: block !important; flex: 0 0 6px !important;
  width: 6px !important; height: 6px !important; margin-right: 9px !important; border: 1px solid var(--main) !important;
  background: transparent !important; transform: rotate(45deg) !important; opacity: .9 !important;
}#chat .custom-nvn-dialogue:has(.custom-nvn-avatar-img[data-nvn-has-avatar="1"]) .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-rose-crest{
  display: none !important;
  flex: 0 0 13px !important; width: 13px !important; height: 13px !important; margin-right: 9px !important;
  align-items: center !important; justify-content: center !important;
  background: none !important; border: 0 !important; box-shadow: none !important;
  position: relative !important;
}#chat .custom-nvn-dialogue:has(.custom-nvn-avatar-img[data-nvn-has-avatar="1"]) .custom-nvn-rose-crest, #chat .custom-nvn-dialogue:is(__CAST_IS__) .custom-nvn-rose-crest{ display: inline-flex !important; }#chat .custom-nvn-dialogue:not([data-nvn-user="1"]):not([data-player^="user"]):not([data-player="true"]) .custom-nvn-rose-crest{ display: inline-flex !important; }#chat .custom-nvn-dialogue:not([data-nvn-user="1"]):not([data-player^="user"]):not([data-player="true"]) .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-dialogue[data-nvn-main="1"] .custom-nvn-rose-crest{ display: inline-flex !important; }#chat .custom-nvn-dialogue[data-nvn-main="1"] .custom-nvn-name-plate::before{ display: none !important; }#chat .custom-nvn-dialogue[data-nvn-main="1"] .custom-nvn-name-plate, #chat .custom-nvn-dialogue[data-nvn-user="1"] .custom-nvn-name-plate{ width: 100% !important; align-self: stretch !important; }#chat .custom-nvn-rose-crest svg{ display: none !important; }#chat .custom-nvn-rose-crest::before{
  content: "" !important; display: block !important;
  width: 11px !important; height: 11px !important;
  background: var(--main) !important;
  -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.6c.95 6.5 3.95 9.5 10.4 10.4-6.45.9-9.45 3.9-10.4 10.4-.95-6.5-3.95-9.5-10.4-10.4C8.05 11.1 11.05 8.1 12 1.6z'/%3E%3C/svg%3E") center / contain no-repeat !important;
  mask: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.6c.95 6.5 3.95 9.5 10.4 10.4-6.45.9-9.45 3.9-10.4 10.4-.95-6.5-3.95-9.5-10.4-10.4C8.05 11.1 11.05 8.1 12 1.6z'/%3E%3C/svg%3E") center / contain no-repeat !important;
  filter: drop-shadow(0 0 4px rgba(var(--rgb), .55)) !important;
}#chat .custom-nvn-name-box{
  display: inline-flex !important; align-items: baseline !important;
  font-family: "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important;
  font-size: 13.5px !important; font-weight: 600 !important; letter-spacing: .18em !important;
  color: var(--nvn-ink) !important; text-shadow: none !important;
}#chat .custom-nvn-name-initial{ font-size: 1em !important; color: var(--main) !important; line-height: 1 !important; }#chat .custom-nvn-name-rest{ font-size: 1em !important; color: var(--nvn-ink) !important; margin-left: 1px !important; opacity: .92 !important; }#chat .custom-nvn-name-box .nvn-ch{ font-size: 1em !important; font-weight: 600 !important; letter-spacing: .18em !important; line-height: 1 !important; }#chat .custom-nvn-name-box .nvn-ch:first-child{ font-size: 1.1em !important; font-weight: 600 !important; }#chat .custom-nvn-name-box .nvn-ch:last-child{ margin-right: -0.18em !important; }#chat .custom-nvn-name-box .nvn-ch:nth-child(2n+1){ color: var(--main) !important; }#chat .custom-nvn-action{
  margin-left: 6px !important; flex: 0 0 auto !important;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", "Noto Sans Mono CJK SC", monospace !important;
  font-size: 11px !important; font-weight: 500 !important; letter-spacing: .1em !important;
  color: var(--main) !important; background: none !important; border: 0 !important;
  padding: 0 !important; border-radius: 0 !important; text-shadow: none !important;
}#chat .custom-nvn-action::before{ content: "[" !important; color: var(--nvn-faint) !important; }#chat .custom-nvn-action::after{ content: "]" !important; color: var(--nvn-faint) !important; }#chat .custom-nvn-action:empty{ display: none !important; }#chat .custom-nvn-theme-toggle{
  position: relative !important; flex: 0 0 auto !important;
  width: 15px !important; height: 15px !important;
  margin: 0 !important; padding: 0 !important; border: 0 !important;
  background: none !important; border-radius: 50% !important;
  cursor: pointer !important; position: absolute !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  color: var(--main) !important; opacity: .8 !important; pointer-events: auto !important;
  transition: opacity .15s ease, transform .15s ease !important;
  -webkit-tap-highlight-color: transparent !important;
}#chat .custom-nvn-theme-toggle:hover{ opacity: 1 !important; transform: scale(1.12) !important; }#chat .custom-nvn-theme-toggle:active{ transform: scale(.9) !important; }#chat .custom-nvn-theme-toggle::before, #chat .custom-nvn-theme-toggle::after{
  content: "" !important; position: absolute !important; left: 50% !important; top: 50% !important;
}#chat .custom-nvn-theme-toggle[data-nvn-next="light"]::before{
  width: 6.5px !important; height: 6.5px !important; border-radius: 50% !important;
  background: currentColor !important; transform: translate(-50%, -50%) !important;
  box-shadow: 0 0 6px rgba(var(--rgb), .45) !important;
}#chat .custom-nvn-theme-toggle[data-nvn-next="light"]::after{
  width: 14px !important; height: 14px !important; transform: translate(-50%, -50%) !important;
  background:
    linear-gradient(currentColor, currentColor) 50% 0 / 1.3px 2.2px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 100% / 1.3px 2.2px no-repeat,
    linear-gradient(currentColor, currentColor) 0 50% / 2.2px 1.3px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 50% / 2.2px 1.3px no-repeat !important;
}#chat .custom-nvn-theme-toggle[data-nvn-next="dark"]::before{
  width: 9px !important; height: 9px !important; border-radius: 50% !important;
  transform: translate(-50%, -50%) !important;
  box-shadow: 2.4px -1.1px 0 0 currentColor !important;
}#chat .custom-nvn-text{
  display: block !important; margin: 0 !important; padding: 0 !important;
  background: none !important; border: 0 !important; box-shadow: none !important; text-align: left !important;
}#chat .custom-nvn-primary{
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important;
  font-size: 16px !important; line-height: 1.95 !important; letter-spacing: .03em !important;
  color: var(--nvn-ink-soft) !important; text-shadow: var(--nvn-ts) !important;
}#chat .custom-nvn-quote-mark{ display: inline !important; color: var(--main) !important; opacity: 1 !important; font-weight: 400 !important; font-size: 1.25em !important; line-height: 1 !important; }#chat .custom-nvn-quote-mark.custom-left::before{ content: "「" !important; }#chat .custom-nvn-quote-mark.custom-right::before{ content: "」" !important; }#chat .custom-nvn-motion{
  display: block !important; margin: 9px 0 0 !important; padding: 0 !important;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace !important;
  font-size: 12.5px !important; line-height: 1.65 !important; letter-spacing: .01em !important;
  color: rgba(var(--rgb), .88) !important; background: none !important; border: 0 !important; box-shadow: none !important;
  text-shadow: none !important;
}#chat .custom-nvn-motion::before{ content: "// " !important; display: inline !important; color: rgba(var(--rgb),.85) !important; }#chat .custom-nvn-motion:empty{ display: none !important; }#chat [is_user="true"] .custom-nvn-dialogue, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]){ grid-template-columns: minmax(0,1fr) 112px !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-avatar-side, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-avatar-side{ grid-column: 2 !important; grid-row: 1 !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-content, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-content{
  grid-column: 1 !important; grid-row: 1 !important;
  padding: 14px 10px 0 0 !important;
  border-left: 0 !important; border-right: 0 !important;
  text-align: right !important;
}#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-name-plate{ flex-direction: row-reverse !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate::before, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-name-plate::before{ display: none !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-name-plate::after, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-name-plate::after{
  background: linear-gradient(270deg,
    rgba(var(--rgb), .62) 0, rgba(var(--rgb), .62) 16px,
    rgba(var(--rgb), 0) 16px, rgba(var(--rgb), 0) 32px,
    rgba(var(--rgb), .42) 32px, rgba(var(--rgb), .10) 100%) !important;
}#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-theme-toggle, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-theme-toggle{ left: auto !important; right: 16px !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-action, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-action{ margin-left: 0 !important; margin-right: 6px !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-text, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-text{ text-align: right !important; }#chat [is_user="true"] .custom-nvn-dialogue .custom-nvn-motion, #chat .custom-nvn-dialogue:is([data-player^="user"],[data-player="true"]) .custom-nvn-motion{
  text-align: right !important;
  background: none !important; background-color: transparent !important; background-image: none !important;
  border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
  padding: 0 !important; text-shadow: none !important;
}#chat [data-nvn-user="1"]{ grid-template-columns: minmax(0,1fr) 112px !important; }#chat [data-nvn-user="1"] .custom-nvn-avatar-side{ display: block !important; grid-column: 2 !important; grid-row: 1 !important; }#chat [data-nvn-user="1"] .custom-nvn-avatar-img{ display: flex !important; }#chat [data-nvn-user="1"] .custom-nvn-content{
  grid-column: 1 !important; grid-row: 1 !important;
  padding: 1px 16px 0 0 !important;
  border-left: 0 !important; border-right: 1px solid rgba(var(--rgb), .50) !important;
  text-align: right !important;
}#chat [data-nvn-user="1"] .custom-nvn-content::before{ left: auto !important; right: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-text, #chat [data-nvn-user="1"] .custom-nvn-text .custom-nvn-primary{ text-align: right !important; background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-name-plate{ display: grid !important; grid-template-columns: minmax(0,1fr) auto auto !important; align-items: center !important; }#chat [data-nvn-user="1"] .custom-nvn-rule{ order: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-action{ order: 1 !important; margin-left: 0 !important; margin-right: 0 !important; }#chat [data-nvn-user="1"] .custom-nvn-name-box{ order: 2 !important; }#chat [data-nvn-user="1"] .custom-nvn-name-plate::before{ display: none !important; }#chat [data-nvn-user="1"] .custom-nvn-rule{ flex-direction: row-reverse !important; margin-left: 0 !important; margin-right: 8px !important; }#chat [data-nvn-user="1"] .custom-nvn-rule-line{ flex: 1 1 auto !important; width: auto !important; background: linear-gradient(270deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) !important; }#chat [data-nvn-user="1"] .custom-nvn-motion{
  text-align: right !important; width: auto !important; align-self: stretch !important;
  background: none !important; background-color: transparent !important; background-image: none !important;
  border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
  padding: 0 !important; text-shadow: none !important;
}#chat [data-nvn-user="1"] .custom-nvn-rose-crest{ display: none !important; }@media (max-width: 560px){#chat .custom-nvn-dialogue{ grid-template-columns: 75px minmax(0,1fr) !important; column-gap: 12px !important; margin: 12px 0 !important; }#chat .custom-nvn-avatar-side{ width: 75px !important; min-width: 75px !important; }#chat .custom-nvn-avatar-img{ width: 75px !important; height: 95px !important; min-height: 95px !important; border-radius: 10px !important; }#chat .custom-nvn-content{ padding-left: 12px !important; }#chat .custom-nvn-primary{ font-size: 15px !important; }#chat .custom-nvn-rose-crest{ flex-basis: 16px !important; width: 16px !important; height: 16px !important; border-radius: 5px !important; }#chat .custom-nvn-theme-toggle{ width: 15px !important; height: 15px !important; }}#chat .custom-nvn-text-tail:has(.custom-nvn-primary:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))), #chat .custom-nvn-text-tail:has(.custom-nvn-quote-val:empty):not(:has(.custom-nvn-primary:not(:empty))):not(:has(.custom-nvn-ja-fallback:not(:empty))){
  display: none !important;
}#chat body.nvn-streaming .custom-nvn-rule, #chat body.nvn-streaming .custom-nvn-vline, #chat body.nvn-streaming .custom-nvn-theme-toggle{ visibility: hidden !important; }`
  };

  function fullCss(theme) {
    if (!cache) cache = {};
    if (!cache[theme]) {
      cache[theme] = (CSS[theme] + buildNewCharacterCss())
        .split('__CAST_IS__').join(CAST_IS) + CAST_CSS;
    }
    return cache[theme];
  }

  /* 页面最终样式：基础 CSS + 布局补丁 + 方案 D 版式（D 必须最后，才能压过补丁里的名字字体等规则） */
  const STREAM_FIX_CSS = `
/* ====== 1. 彻底移除所有竖线（角色行 & user行） ====== */
#chat .custom-nvn-vline,
#chat .custom-nvn-content::before,
#chat .custom-nvn-content::after {
  content: none !important;
  display: none !important;
  width: 0 !important;
  border: 0 !important;
  background: none !important;
}
#chat .custom-nvn-content:not(#nvn-modern-boost) {
  padding: 10px 0 0 12px !important;
  border-left: 0 !important;
  border-right: 0 !important;
}

/* ====== 2. 仿图3「玲奈子」大首字粗黑体姓名 + 奇偶字染色 ====== */
#chat .custom-nvn-name-plate:not(#nvn-modern-boost) {
  display: flex !important;
  flex-direction: row !important;
  justify-content: flex-start !important;
  align-items: center !important;
  width: 100% !important;
  margin: 0 0 6px !important;
  padding: 0 !important;
}
#chat .custom-nvn-name-box:not(#nvn-modern-boost) {
  display: inline-flex !important;
  align-items: baseline !important;
  font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
  font-size: 16.5px !important;
  font-weight: 800 !important;
  letter-spacing: 0.06em !important;
  line-height: 1.2 !important;
}
/* 首字放大（22px 粗黑体） */
#chat .custom-nvn-name-initial:not(#nvn-modern-boost),
#chat .custom-nvn-name-box .nvn-ch:first-child {
  font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
  font-size: 22px !important;
  font-weight: 800 !important;
  letter-spacing: 0.04em !important;
  line-height: 1.1 !important;
  margin-right: 2px !important;
  color: var(--main) !important;
}
/* 拆字后的单字样式（无背景裁剪，彻底消除底边 1px 细线） */
#chat .custom-nvn-name-box .nvn-ch:not(:first-child) {
  font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
  font-size: 16.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em !important;
  line-height: 1.1 !important;
}
#chat .custom-nvn-name-box .nvn-ch:nth-child(2n+1) {
  color: var(--main) !important;
}
#chat .custom-nvn-name-box .nvn-ch:nth-child(2n) {
  color: var(--nvn-ink) !important;
}
#chat .custom-nvn-name-box .nvn-ch:last-child {
  margin-right: 0 !important;
}
/* 流式期间（尚未拆字时）的纯 CSS 奇偶字渐变色，防闪烁 */
#chat .custom-nvn-name-rest:not(#nvn-modern-boost) {
  font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
  font-size: 16.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em !important;
  line-height: 1.25 !important;
  padding-bottom: 2px !important;
  margin: 0 0 -2px 0 !important;
  opacity: 0.96 !important;
  background-image: linear-gradient(
    90deg,
    var(--nvn-ink) 0,
    var(--nvn-ink) 1.03em,
    var(--main) 1.03em,
    var(--main) 2.09em,
    var(--nvn-ink) 2.09em,
    var(--nvn-ink) 3.15em,
    var(--main) 3.15em,
    var(--main) 4.21em,
    var(--nvn-ink) 4.21em,
    var(--nvn-ink) 5.27em,
    var(--main) 5.27em,
    var(--main) 6.33em,
    var(--nvn-ink) 6.33em,
    var(--nvn-ink) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}

/* ====== 3. 动作描写与神态标签换字体 ====== */
#chat .custom-nvn-action:not(#nvn-modern-boost) {
  font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important;
  margin-left: 8px !important;
}
#chat .custom-nvn-motion:not(#nvn-modern-boost) {
  font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 1.7 !important;
  letter-spacing: 0.04em !important;
  margin-top: 8px !important;
}

/* ====== 4. 普通角色行：纯 CSS 星标 + 太阳图标 + 横线 ====== */
#chat .custom-nvn-dialogue:not([data-nvn-user="1"]):not([data-player^="user"]):not([data-player="玩家"]):not([data-player="true"]) .custom-nvn-name-plate:not(:has(.custom-nvn-rose-crest))::before {
  content: "" !important;
  display: inline-block !important;
  flex: 0 0 13px !important;
  width: 13px !important;
  height: 13px !important;
  margin-right: 9px !important;
  border: 0 !important;
  transform: none !important;
  background: var(--main) !important;
  -webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.6c.95 6.5 3.95 9.5 10.4 10.4-6.45.9-9.45 3.9-10.4 10.4-.95-6.5-3.95-9.5-10.4-10.4C8.05 11.1 11.05 8.1 12 1.6z'/%3E%3C/svg%3E") center / 11px 11px no-repeat !important;
  mask: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.6c.95 6.5 3.95 9.5 10.4 10.4-6.45.9-9.45 3.9-10.4 10.4-.95-6.5-3.95-9.5-10.4-10.4C8.05 11.1 11.05 8.1 12 1.6z'/%3E%3C/svg%3E") center / 11px 11px no-repeat !important;
  filter: drop-shadow(0 0 4px rgba(var(--rgb), .55)) !important;
  opacity: 1 !important;
}

#chat .custom-nvn-dialogue:not([data-nvn-user="1"]):not([data-player^="user"]):not([data-player="玩家"]):not([data-player="true"]) .custom-nvn-name-plate:not(:has(.custom-nvn-rule))::after {
  content: "" !important;
  display: block !important;
  flex: 1 1 auto !important;
  height: 15px !important;
  margin-left: 8px !important;
  cursor: pointer !important;
  background:
    radial-gradient(circle, var(--main) 0 3.2px, transparent 3.5px) 0 50% / 15px 15px no-repeat,
    linear-gradient(var(--main), var(--main)) 6.85px 0.5px / 1.3px 2.2px no-repeat,
    linear-gradient(var(--main), var(--main)) 6.85px 12.3px / 1.3px 2.2px no-repeat,
    linear-gradient(var(--main), var(--main)) 0.5px 6.85px / 2.2px 1.3px no-repeat,
    linear-gradient(var(--main), var(--main)) 12.3px 6.85px / 2.2px 1.3px no-repeat,
    linear-gradient(90deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) 23px 50% / calc(100% - 23px) 1px no-repeat !important;
  opacity: .85 !important;
}

/* ====== 5. 玩家行（user模式）：完美镜像对齐 + 动作 // 在最右侧 ====== */
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) {
  --main: #7fc4ff;
  --sub: #cfe4ff;
  --rgb: 127, 196, 255;
  --motion-color: #a9cfff;
  grid-template-columns: minmax(0, 1fr) 112px !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-avatar-side {
  display: block !important;
  grid-column: 2 !important;
  grid-row: 1 !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-content:not(#nvn-modern-boost) {
  grid-column: 1 !important;
  grid-row: 1 !important;
  padding: 10px 12px 0 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  text-align: right !important;
}
/* 覆盖旧版 grid 与 order: 0/1/2，统一使用 row-reverse 镜像排列：从右到左依次为 名字 -> 神态 -> 太阳 -> 横线 */
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-name-plate:not(#nvn-modern-boost) {
  display: flex !important;
  flex-direction: row-reverse !important;
  justify-content: flex-start !important;
  align-items: center !important;
  width: 100% !important;
  align-self: stretch !important;
  margin: 0 0 6px !important;
  padding: 0 !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-name-plate > * {
  order: 0 !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-action:not(#nvn-modern-boost) {
  margin-left: 0 !important;
  margin-right: 8px !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-rule {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  width: auto !important;
  display: flex !important;
  flex-direction: row-reverse !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 8px !important;
  margin-left: 0 !important;
  margin-right: 8px !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-rule-line {
  flex: 0 0 auto !important;
  width: var(--nvn-line-first-w, 100%) !important;
  height: 1px !important;
  background: linear-gradient(270deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-rose-crest,
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-name-plate::before {
  display: none !important;
  content: none !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-name-plate:not(:has(.custom-nvn-rule))::after {
  content: "" !important;
  display: block !important;
  flex: 1 1 auto !important;
  height: 15px !important;
  margin-left: 0 !important;
  margin-right: 8px !important;
  cursor: pointer !important;
  background:
    radial-gradient(circle, var(--main) 0 3.2px, transparent 3.5px) 100% 50% / 15px 15px no-repeat,
    linear-gradient(var(--main), var(--main)) calc(100% - 6.85px) 0.5px / 1.3px 2.2px no-repeat,
    linear-gradient(var(--main), var(--main)) calc(100% - 6.85px) 12.3px / 1.3px 2.2px no-repeat,
    linear-gradient(var(--main), var(--main)) calc(100% - 12.3px) 6.85px / 2.2px 1.3px no-repeat,
    linear-gradient(var(--main), var(--main)) calc(100% - 0.5px) 6.85px / 2.2px 1.3px no-repeat,
    linear-gradient(270deg, rgba(var(--rgb), .55), rgba(var(--rgb), .08)) 0 50% / calc(100% - 23px) 1px no-repeat !important;
  opacity: .85 !important;
}

/* user 模式的动作描写：隐藏左侧 //，在最右侧显示 // */
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-motion:not(#nvn-modern-boost)::before {
  content: none !important;
  display: none !important;
}
#chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) .custom-nvn-motion:not(:empty):not(#nvn-modern-boost)::after {
  content: "//" !important;
  display: inline !important;
  margin-left: 4px !important;
  color: rgba(var(--rgb), .85) !important;
}

/* ====== 6. 纯 CSS 锁定引号样式与行内头像兜底字隐藏 ====== */
#chat .custom-nvn-text .custom-nvn-quote-mark:not(#nvn-modern-boost) {
  display: inline !important;
  width: auto !important;
  font-size: 1.25em !important;
  opacity: 1 !important;
  color: var(--main) !important;
}
#chat .custom-nvn-avatar-img:is([style*="background-image"], [data-wn-ua-applied="1"]) .custom-nvn-avatar-fallback-box:not(#nvn-modern-boost),
#chat .custom-nvn-avatar-img:is([style*="background-image"], [data-wn-ua-applied="1"]) .custom-nvn-avatar-fallback:not(#nvn-modern-boost) {
  display: none !important;
}
@media (max-width: 560px) {
  #chat :is([is_user="true"] .custom-nvn-dialogue, .custom-nvn-dialogue:is([data-player^="user"], [data-player="玩家"], [data-player="true"], [data-nvn-user="1"])) {
    grid-template-columns: minmax(0, 1fr) 75px !important;
  }
  #chat .custom-nvn-name-initial:not(#nvn-modern-boost),
  #chat .custom-nvn-name-box .nvn-ch:first-child { font-size: 19px !important; }
  #chat .custom-nvn-name-rest:not(#nvn-modern-boost),
  #chat .custom-nvn-name-box .nvn-ch:not(:first-child) { font-size: 14.5px !important; }
}

/* ====== 纯中文：字体跟随酒馆默认 + 字号同步《克蕾雅》 ====== */
#chat .custom-nvn-dialogue:not(:has(.custom-nvn-bilingual-ruby)):not(#nvn-modern-boost) {
  font-family: inherit !important;
}
#chat .custom-nvn-dialogue:not(:has(.custom-nvn-bilingual-ruby)):not(#nvn-modern-boost) :is(
  .custom-nvn-text, .custom-nvn-primary, .custom-nvn-zh-only,
  .custom-nvn-name-box, .custom-nvn-name-initial, .custom-nvn-name-rest, .nvn-ch,
  .custom-nvn-action, .custom-nvn-motion
) {
  font-family: inherit !important;
}
#chat .custom-nvn-dialogue:not(:has(.custom-nvn-bilingual-ruby)) :is(.custom-nvn-primary, .custom-nvn-zh-only) {
  font-size: 1.05em !important;
  line-height: 1.8 !important;
  letter-spacing: 0.05em !important;
  font-weight: 500 !important;
}
`;

  function pageCss(theme) {
    const d = D_LAYOUT_CSS[theme] || D_LAYOUT_CSS.dark;
    return fullCss(theme) + LAYOUT_PATCH_CSS + d.split('__CAST_IS__').join(CAST_IS) + STREAM_FIX_CSS;
  }

  function apply(theme, force) {
    if (!Object.prototype.hasOwnProperty.call(CSS, theme)) theme = 'dark';    if (!force && theme === current && styleEl && styleEl.isConnected) return;

    HD = getHostDoc();
    const chatBox = HD.getElementById ? HD.getElementById('chat') : null;
    const head = chatBox || HD.head || HD.documentElement;
    if (!head) return;

    try {
      for (const el of HD.querySelectorAll('#' + STYLE_ID)) {
        try { el.remove(); } catch (_) {}
      }
    } catch (_) {}

    const el = HD.createElement('style');
    el.id = STYLE_ID;
    el.setAttribute('data-owner', '对白美化·CSS注入器');
    el.setAttribute('data-nvn-theme', theme);
    el.setAttribute('data-nvn-version', VERSION);
    try { el.setAttribute('data-nvn-card', BOUND_NAME || ''); } catch (_) {}
    el.textContent = pageCss(theme);
    head.appendChild(el);

    styleEl = el;
    current = theme;
  }

  /* ---------------- 精准流式检测（流式一停 300ms 内立刻激活，绝不卡按钮） ---------------- */
  const disposers = [];
  let timer = null;
  let schedTimer = null;
  let isMutating = false;
  let lastMutationAt = 0;

  function isActivelyStreaming() {
    try {
      if (Date.now() - lastMutationAt < 300) {
        const stopBtn = HD.getElementById && HD.getElementById('mes_stop');
        if (stopBtn) {
          const cs = (HW.getComputedStyle || window.getComputedStyle)(stopBtn);
          if (cs && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0') return true;
        }
        if (HW.is_send_press === true) return true;
      }
    } catch (_) {}
    return false;
  }

  function ensureStyleOnly() {
    try {
      if (styleEl && styleEl.isConnected) return;
      const t = userTheme || current || 'dark';
      apply(t, true);
    } catch (_) {}
  }

  function reconcile() {
    if (!alive) return;
    if (BOUND_NAME) {
      const now = currentCharName();
      if (now && now !== BOUND_NAME) { suspend(); return; }
    }
    try { if (!HD.querySelector('.custom-nvn-dialogue')) return; } catch (_) {}

    if (isActivelyStreaming()) {
      ensureStyleOnly();
      return;
    }

    isMutating = true;
    try {
      const t = userTheme || current || 'dark';
      apply(t, false);
      if (!styleEl || !styleEl.isConnected) apply(t, true);
      injectToggles();
    } catch (_) {} finally {
      setTimeout(function () { isMutating = false; }, 0);
    }
  }

  function schedule(delay) {
    if (!alive) return;
    ensureStyleOnly();
    if (schedTimer) clearTimeout(schedTimer);
    const wait = typeof delay === 'number' ? delay : 320;
    schedTimer = setTimeout(function () {
      schedTimer = null;
      reconcile();
    }, wait);
  }

  function wireObserver() {
    const MO = HW.MutationObserver || window.MutationObserver;
    if (!MO || !HD.body) return;
    try {
      const mo = new MO(function () {
        if (isMutating) return;
        lastMutationAt = Date.now();
        schedule(320);
      });
      mo.observe(HD.body, { childList: true, subtree: true });
      disposers.push(function () { try { mo.disconnect(); } catch (_) {} });
    } catch (_) {}
  }

  function wireEvents() {
    const on = fn('eventOn');
    if (typeof on === 'function') {
      let ET = null;
      try { if (typeof event_types !== 'undefined' && event_types) ET = event_types; } catch (_) {}
      const endName  = (ET && ET.GENERATION_ENDED)   || 'generation_ended';
      const stopName = (ET && ET.GENERATION_STOPPED) || 'generation_stopped';
      try {
        on(endName,  function () { lastMutationAt = 0; schedule(20); });
        on(stopName, function () { lastMutationAt = 0; schedule(20); });
      } catch (_) {}

      const pairs = [
        ['MESSAGE_RENDERED',   'message_rendered'],
        ['MESSAGE_UPDATED',    'message_updated'],
        ['MESSAGE_EDITED',     'message_edited'],
        ['MESSAGE_SWIPED',     'message_swiped'],
        ['CHAT_CHANGED',       'chat_changed'],
        ['CHARACTER_SELECTED', 'character_selected'],
        ['GROUP_UPDATED',      'group_updated'],
      ];
      for (const p of pairs) {
        const name = (ET && ET[p[0]]) || p[1];
        try { on(name, function () { schedule(150); }); } catch (_) {}
      }
    }

    const onResize = function () {
      try {
        for (const r of HD.querySelectorAll('.custom-nvn-dialogue[data-nvn-ready="1"]')) {
          r.removeAttribute('data-nvn-ready');
        }
        schedule(150);
      } catch (_) {}
    };
    try { HW.addEventListener('resize', onResize, { passive: true }); } catch (_) {}
    disposers.push(function () { try { HW.removeEventListener('resize', onResize); } catch (_) {} });
  }

  /* ---------------- 亮 / 暗切换按钮（全局事件委托：随时秒点秒切） ---------------- */
  const INST = 'v' + Math.random().toString(36).slice(2, 8);
  let lastFire = 0;
  let suspended = false;

  function appliedTheme() {
    try {
      const el = HD.getElementById ? HD.getElementById(STYLE_ID) : null;
      const t = el && el.getAttribute('data-nvn-theme');
      if (t === 'light' || t === 'dark') return t;
    } catch (_) {}
    return (current === 'light' ? 'light' : 'dark');
  }

  function syncToggles() {
    try {
      const next = appliedTheme() === 'light' ? 'dark' : 'light';
      const label = next === 'light' ? '切换到亮色' : '切换到暗色';
      for (const b of HD.querySelectorAll('.custom-nvn-theme-toggle')) {
        if (b.getAttribute('data-nvn-next') !== next) b.setAttribute('data-nvn-next', next);
        if (b.getAttribute('aria-label') !== label) {
          b.setAttribute('aria-label', label);
          b.setAttribute('title', label);
        }
      }
    } catch (_) {}
  }

  function setTheme(next) {
    if (next !== 'light' && next !== 'dark') return;
    userTheme = next;
    try { const ls = HW.localStorage; if (ls) ls.setItem(MODE_KEY, next); } catch (_) {}
    cache = null;
    apply(next, true);
    if (appliedTheme() !== next) {
      try {
        const head = HD.head || HD.documentElement;
        for (const el of HD.querySelectorAll('#' + STYLE_ID)) { try { el.remove(); } catch (_) {} }
        const el = HD.createElement('style');
        el.id = STYLE_ID;
        el.setAttribute('data-owner', '对白美化·CSS注入器');
        el.setAttribute('data-nvn-theme', next);
        el.setAttribute('data-nvn-version', VERSION);
        el.textContent = pageCss(next);
        head.appendChild(el);
        styleEl = el;
        current = next;
      } catch (_) {}
    }
    syncToggles();
    return appliedTheme();
  }

  function toggleTheme() {
    return setTheme(appliedTheme() === 'dark' ? 'light' : 'dark');
  }

  function wireGlobalToggleClick() {
    const onTap = function (ev) {
      try {
        if (ev.button !== undefined && ev.button !== 0) return;
        const target = ev.target;
        if (!target || !target.closest) return;

        const btn = target.closest('.custom-nvn-theme-toggle');
        if (btn) {
          const now = Date.now();
          if (now - lastFire < 250) return;
          lastFire = now;
          ev.preventDefault();
          ev.stopPropagation();
          toggleTheme();
          return;
        }

        const np = target.closest('.custom-nvn-name-plate');
        if (np && !np.querySelector('.custom-nvn-theme-toggle')) {
          const row = np.closest('.custom-nvn-dialogue');
          if (!row) return;
          const ac = np.querySelector('.custom-nvn-action');
          const nb = np.querySelector('.custom-nvn-name-box');
          const hasAc = ac && String(ac.textContent || '').trim().length > 0;
          const anchor = hasAc ? ac : nb;
          if (!anchor) return;
          const rect = anchor.getBoundingClientRect();
          const x = ev.clientX;
          const y = ev.clientY;
          if (y < rect.top - 8 || y > rect.bottom + 8) return;
          const dp = String(row.getAttribute('data-player') || '');
          const mes = row.closest('.mes');
          const isUser = row.getAttribute('data-nvn-user') === '1' || dp === 'user' || dp === '玩家' || dp === 'true' || (mes && mes.getAttribute('is_user') === 'true');
          const hit = isUser ? (x >= rect.left - 30 && x <= rect.left - 2) : (x >= rect.right + 2 && x <= rect.right + 30);
          if (hit) {
            const now = Date.now();
            if (now - lastFire < 250) return;
            lastFire = now;
            ev.preventDefault();
            ev.stopPropagation();
            toggleTheme();
          }
        }
      } catch (_) {}
    };
    try { HD.addEventListener('click', onTap, true); } catch (_) {}
    disposers.push(function () { try { HD.removeEventListener('click', onTap, true); } catch (_) {} });
  }

  function suspend() {
    try {
      for (const el of HD.querySelectorAll('#' + STYLE_ID)) { try { el.remove(); } catch (_) {} }
    } catch (_) {}
    try {
      for (const b of HD.querySelectorAll('.custom-nvn-theme-toggle')) { try { b.remove(); } catch (_) {} }
    } catch (_) {}
    styleEl = null;
    current = null;
    suspended = true;
  }

  function wirePopoverDismiss() {
    const closeOnDown = function (ev) {
      try {
        if (ev.button !== undefined && ev.button !== 0) return;
        const x = ev.clientX, y = ev.clientY;
        for (const d of HD.querySelectorAll('.custom-nvn-avatar-popover[open]')) {
          const s = d.querySelector('summary');
          if (s) {
            const r = s.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) continue;
          }
          d.open = false;
        }
      } catch (_) {}
    };
    const closeOnEsc = function (ev) {
      if (ev.key !== 'Escape' && ev.keyCode !== 27) return;
      try { for (const d of HD.querySelectorAll('.custom-nvn-avatar-popover[open]')) d.open = false; } catch (_) {}
    };
    try { HD.addEventListener('pointerdown', closeOnDown, true); } catch (_) {}
    try { HW.addEventListener('keydown', closeOnEsc, true); } catch (_) {}
    try { HD.addEventListener('keydown', closeOnEsc, true); } catch (_) {}
    disposers.push(function () {
      try { HD.removeEventListener('pointerdown', closeOnDown, true); } catch (_) {}
      try { HW.removeEventListener('keydown', closeOnEsc, true); } catch (_) {}
      try { HD.removeEventListener('keydown', closeOnEsc, true); } catch (_) {}
    });
  }

  /* ---------------- 增量 DOM 处理函数 ---------------- */
  function markAvatars(rows) {
    try {
      const gs = HW.getComputedStyle || window.getComputedStyle;
      for (const row of rows) {
        for (const av of row.querySelectorAll('.custom-nvn-avatar-img')) {
          let has = false;
          try {
            const st = av.getAttribute('style');
            if (st && /background-image/i.test(st)) has = true;
            else if (av.getAttribute('data-wn-ua-applied')) has = true;
            else {
              const bi = String(gs(av).backgroundImage || '');
              has = bi.indexOf('url(') !== -1;
            }
          } catch (_) {}
          if (has) av.setAttribute('data-nvn-has-avatar', '1');
          else av.removeAttribute('data-nvn-has-avatar');
        }
      }
      for (const av of HD.querySelectorAll('.custom-nvn-avatar-img:not([data-nvn-has-avatar="1"])')) {
        const st = av.getAttribute('style');
        if ((st && /background-image/i.test(st)) || av.getAttribute('data-wn-ua-applied')) {
          av.setAttribute('data-nvn-has-avatar', '1');
        }
      }
    } catch (_) {}
  }

  function splitNames(rows) {
    try {
      for (const row of rows) {
        for (const box of row.querySelectorAll('.custom-nvn-name-box')) {
          if (box.getAttribute('data-nvn-split') === '1') continue;
          const txt = String(box.textContent || '').replace(/\s+/g, '');
          if (!txt) continue;
          box.setAttribute('data-nvn-split', '1');
          let html = '';
          for (const ch of Array.from(txt)) {
            html += '<span class="nvn-ch">' +
              ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
          }
          box.innerHTML = html;
        }
      }
    } catch (_) {}
  }

  function sweepEmptyTails(rows) {
    try {
      for (const row of rows) {
        for (const t of row.querySelectorAll('.custom-nvn-text-tail')) {
          const val = t.querySelector('.custom-nvn-primary, .custom-nvn-quote-val');
          const ja = t.querySelector('.custom-nvn-ja-fallback');
          const empty = (!val || !String(val.textContent || '').trim())
            && (!ja || !String(ja.textContent || '').trim());
          const have = t.style.getPropertyValue('display');
          if (empty) {
            if (have !== 'none') t.style.setProperty('display', 'none', 'important');
          } else if (have) {
            t.style.removeProperty('display');
          }
        }
      }
    } catch (_) {}
  }

  function playerName() {
    try {
      const ctx = HW.SillyTavern && HW.SillyTavern.getContext && HW.SillyTavern.getContext();
      if (ctx && ctx.name1) return String(ctx.name1).trim();
      const el = HD.getElementById && HD.getElementById('user_name');
      if (el && el.value) return String(el.value).trim();
    } catch (_) {}
    return '';
  }

  function markUserRows(rows) {
    try {
      for (const row of rows) {
        const mes = row.closest('.mes');
        const dp = String(row.getAttribute('data-player') || '');
        const isUser = dp === 'user' || dp === '玩家' || dp === 'true'
          || (mes && mes.getAttribute('is_user') === 'true');
        if (isUser) {
          row.setAttribute('data-nvn-user', '1');
          const av = row.querySelector('.custom-nvn-avatar-side');
          if (av) {
            try {
              av.style.setProperty('display', 'block', 'important');
              av.style.setProperty('grid-column', '2', 'important');
              av.style.setProperty('grid-row', '1', 'important');
            } catch (_) {}
          }
          const ct = row.querySelector('.custom-nvn-content');
          if (ct) { try { ct.style.setProperty('text-align', 'right', 'important'); } catch (_) {} }
        } else {
          row.removeAttribute('data-nvn-user');
        }
      }
    } catch (_) {}
  }

  function fillPlayerNames(rows) {
    try {
      const pName = playerName();
      for (const row of rows) {
        if (row.getAttribute('data-nvn-user') !== '1') continue;
        const nb = row.querySelector('.custom-nvn-name-box');
        if (!nb || String(nb.textContent || '').trim()) continue;
        const fb = row.querySelector('.custom-nvn-avatar-fallback');
        const nm = pName || String((fb && fb.textContent) || '').trim();
        if (nm) {
          nb.textContent = nm;
          nb.removeAttribute('data-nvn-split');
        }
      }
    } catch (_) {}
  }

  function ensureCrests(rows) {
    try {
      for (const row of rows) {
        if (row.getAttribute('data-nvn-user') === '1') { row.removeAttribute('data-nvn-main'); continue; }
        const nb = row.querySelector('.custom-nvn-name-box');
        if (!nb || !String(nb.textContent || '').trim()) { row.removeAttribute('data-nvn-main'); continue; }
        row.setAttribute('data-nvn-main', '1');
        const np = row.querySelector('.custom-nvn-name-plate');
        if (np && !np.querySelector('.custom-nvn-rose-crest')) {
          const c = HD.createElement('span');
          c.className = 'custom-nvn-rose-crest';
          c.setAttribute('aria-hidden', 'true');
          np.insertBefore(c, np.firstChild);
        }
      }
    } catch (_) {}
  }

  function applyLayoutFixes(rows) {
    try {
      const _small = (HW.innerWidth || window.innerWidth || 1280) <= 560;
      const _aw = _small ? 75 : 112;
      const _ah = _small ? 95 : 140;
      for (const row of rows) {
        const isUser = row.getAttribute('data-nvn-user') === '1';
        try {
          const _side = row.querySelector('.custom-nvn-avatar-side');
          if (_side) { _side.style.setProperty('width', _aw + 'px', 'important'); _side.style.setProperty('min-width', _aw + 'px', 'important'); }
          const _av = row.querySelector('.custom-nvn-avatar-img');
          if (_av) {
            _av.style.setProperty('width', _aw + 'px', 'important');
            _av.style.setProperty('height', _ah + 'px', 'important');
            _av.style.setProperty('min-height', _ah + 'px', 'important');
          }
        } catch (_) {}
        const np = row.querySelector('.custom-nvn-name-plate');
        if (np) {
          np.style.setProperty('padding-top', '0px', 'important');
          np.style.setProperty('margin-bottom', '6px', 'important');
          np.style.setProperty('width', '100%', 'important');
          np.style.setProperty('align-self', 'stretch', 'important');
          np.style.setProperty('min-height', '0', 'important');
        }
        const mo = row.querySelector('.custom-nvn-motion');
        if (mo) {
          mo.style.setProperty('width', '100%', 'important');
          mo.style.setProperty('text-align', isUser ? 'right' : 'left', 'important');
        }
      }
    } catch (_) {}
  }

  /* 角色行与 user 行统一将 .custom-nvn-rule 放在神态（或名字）之后，由 CSS row-reverse 自动镜像 */
  function ensureNameRule(rows) {
    try {
      for (const row of rows) {
        const np = row.querySelector('.custom-nvn-name-plate');
        if (!np) continue;
        let rule = np.querySelector('.custom-nvn-rule');
        if (!rule) {
          rule = HD.createElement('span');
          rule.className = 'custom-nvn-rule';
          const line = HD.createElement('span');
          line.className = 'custom-nvn-rule-line';
          rule.appendChild(line);
        }
        const ac = np.querySelector('.custom-nvn-action');
        const nb = np.querySelector('.custom-nvn-name-box');
        const hasAction = ac && String(ac.textContent || '').trim().length > 0;
        const anchor = hasAction ? ac : nb;
        if (anchor && rule.previousElementSibling !== anchor) anchor.after(rule);
      }
    } catch (_) {}
  }

  function ensureVLine() {}

  function ensureQuoteMarks(rows) {
    try {
      for (const row of rows) {
        for (const q of row.querySelectorAll('.custom-nvn-text .custom-nvn-quote-mark')) {
          q.style.setProperty('display', 'inline', 'important');
          q.style.setProperty('width', 'auto', 'important');
          q.style.setProperty('font-size', '1.25em', 'important');
          q.style.setProperty('opacity', '1', 'important');
          q.style.setProperty('color', 'var(--main)', 'important');
        }
      }
    } catch (_) {}
  }

  function fitFirstLine(rows) {
    try {
      const R = HD.createRange ? HD.createRange() : null;
      if (!R) return;
      const tasks = [];
      for (const row of rows) {
        const primary = row.querySelector('.custom-nvn-primary');
        const line = row.querySelector('.custom-nvn-rule-line');
        if (!primary || !line) continue;
        R.selectNodeContents(primary);
        const rects = R.getClientRects();
        if (!rects.length) continue;
        const first = rects[0];
        const lr = line.getBoundingClientRect();
        const isUser = row.getAttribute('data-nvn-user') === '1';
        if (isUser) {
          /* user 行：从太阳左侧（lr.right）向左量到台词首字左侧（first.left） */
          const w = Math.max(0, lr.right - first.left);
          tasks.push({ line: line, w: w });
        } else {
          /* 角色行：从太阳右侧（lr.left）向右量到台词首行末尾（first.right） */
          const w = Math.max(0, Math.min(first.right - lr.left, lr.width));
          tasks.push({ line: line, w: w });
        }
      }
      for (const t of tasks) {
        t.line.style.setProperty('--nvn-line-first-w', Math.ceil(t.w) + 'px');
      }
    } catch (_) {}
  }

  function injectToggles() {
    try {
      if (isActivelyStreaming()) return;
      suspended = false;
      const newRows = Array.from(HD.querySelectorAll('.custom-nvn-dialogue:not([data-nvn-ready="1"])'));
      if (!newRows.length) {
        markAvatars([]);
        return;
      }

      sweepEmptyTails(newRows);
      markAvatars(newRows);
      markUserRows(newRows);
      fillPlayerNames(newRows);
      splitNames(newRows);
      ensureCrests(newRows);
      applyLayoutFixes(newRows);
      ensureNameRule(newRows);
      ensureQuoteMarks(newRows);

      for (const row of newRows) {
        const np = row.querySelector('.custom-nvn-name-plate');
        if (!np) continue;
        if (!np.querySelector('.custom-nvn-theme-toggle[data-nvn-owner="' + INST + '"]')) {
          for (const old of np.querySelectorAll('.custom-nvn-theme-toggle')) {
            try { old.remove(); } catch (_) {}
          }
          const b = HD.createElement('button');
          b.type = 'button';
          b.className = 'custom-nvn-theme-toggle';
          b.setAttribute('data-nvn-theme-btn', '1');
          b.setAttribute('data-nvn-owner', INST);
          const rule = np.querySelector('.custom-nvn-rule');
          if (rule) rule.insertBefore(b, rule.firstElementChild); else np.appendChild(b);
          try {
            b.style.setProperty('position', 'relative', 'important');
            b.style.setProperty('left', 'auto', 'important');
            b.style.setProperty('right', 'auto', 'important');
            b.style.setProperty('top', 'auto', 'important');
            b.style.setProperty('transform', 'none', 'important');
            b.style.setProperty('margin', '0', 'important');
          } catch (_) {}
        }
      }

      fitFirstLine(newRows);
      syncToggles();

      for (const row of newRows) {
        row.setAttribute('data-nvn-ready', '1');
      }
    } catch (_) {}
  }

  try {
    HW.__NVN_SET_THEME__ = setTheme;
    HW.__NVN_DIAG__ = function () {
      return { theme: appliedTheme(), userTheme: userTheme, styleId: STYLE_ID,
               styleFound: !!(HD.getElementById && HD.getElementById(STYLE_ID)),
               toggles: HD.querySelectorAll('.custom-nvn-theme-toggle').length,
               bound: BOUND_NAME, nowChar: currentCharName(), alive: alive,
               suspended: suspended, isStreaming: isActivelyStreaming() };
    };
  } catch (_) {}

  /* ---------------- 启动 ---------------- */
  function destroy() {
    alive = false;
    try { if (timer) clearInterval(timer); } catch (_) {}
    try { if (schedTimer) clearTimeout(schedTimer); } catch (_) {}
    timer = null;
    schedTimer = null;
    for (const d of disposers.splice(0)) { try { d(); } catch (_) {} }
    try { if (styleEl && styleEl.isConnected) styleEl.remove(); } catch (_) {}
    styleEl = null;
    current = null;
    try {
      for (const r of HD.querySelectorAll('.custom-nvn-dialogue[data-nvn-ready="1"]')) {
        r.removeAttribute('data-nvn-ready');
      }
      for (const b of HD.querySelectorAll('.custom-nvn-theme-toggle')) b.remove();
    } catch (_) {}
  }

  function boot() {
    try { if (HW[SLOT] && typeof HW[SLOT].destroy === 'function') HW[SLOT].destroy(); } catch (_) {}
    try { HW.addEventListener('beforeunload', destroy); HW.addEventListener('pagehide', destroy); } catch (_) {}

    apply(userTheme || 'dark', true);
    injectToggles();
    wireObserver();
    wireEvents();
    wireGlobalToggleClick();
    wirePopoverDismiss();
    try { timer = setInterval(reconcile, 3000); } catch (_) {}

    HW[SLOT] = {
      version: VERSION,
      destroy: destroy,
      reconcile: reconcile,
      setTheme: setTheme,
      toggleTheme: toggleTheme,
      newCharacters: NEW_CHARACTERS,
    };
    try { HW.__NVN_DLG_VERSION__ = VERSION; } catch (_) {}
  }

  boot();

  try { setTimeout(function () { schedule(0); }, 1200); } catch (_) {}
})();
