(async function () {
  'use strict';

  const VERSION  = '2.5.11';
  /* 【2.4.23】图全部改为 GitHub 图库绝对链接；新增 10 部作品 81 人；脸红改为独立叠加层。 */
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
   *     avatar:   'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/maxx/normal.webp',
   *     portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/maxx/uniform.webp' },
   * ========================================================================= */
  const NEW_CHARACTERS = [

    /* ============================== Summer Pockets REFLECTION BLUE ============================== */
    { chars: ['䌷·文德斯', '䌷'],
      main: '#eeb369',
      sub: '#f6d5ac',
      rgb: '238, 179, 105',
      motion: '#d6a15e',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tsumugi/uniform.webp',
      big: true },
    { chars: ['七海'],
      main: '#a564db',
      sub: '#ceaaeb',
      rgb: '165, 100, 219',
      motion: '#9e60d2',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/nanami/normal.webp' },
    { chars: ['三谷良一'],
      main: '#da7f61',
      sub: '#ebb9a8',
      rgb: '218, 127, 97',
      motion: '#c47257',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ryoichi/normal.webp' },
    { chars: ['久岛鸥'],
      main: '#737ade',
      sub: '#b2b6ed',
      rgb: '115, 122, 222',
      motion: '#6e75d5',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/normal.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/puzzled.webp',
        '脸红通常': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/normal-blush.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/happy.webp',
        '脸红得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/smug-blush.webp',
        '脸红惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/surprised-blush.webp',
        '脸红生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/angry-blush.webp',
        '脸红疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/puzzled-blush.webp',
        '脸红难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/sad-blush.webp',
        '脸红高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/happy-blush.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kamome/outfit1.webp',
      big: true },
    { chars: ['加纳天善'],
      main: '#9582e2',
      sub: '#c5baef',
      rgb: '149, 130, 226',
      motion: '#8675cb',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/tenzen/normal.webp' },
    { chars: ['加藤羽未'],
      main: '#e995d8',
      sub: '#f3c5ea',
      rgb: '233, 149, 216',
      motion: '#d286c2',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/umi/outfit1.webp',
      big: true },
    { chars: ['岬镜子'],
      main: '#da9462',
      sub: '#ebc4a9',
      rgb: '218, 148, 98',
      motion: '#c48558',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kyoko/normal.webp',
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kyoko/outfit1.webp',
      big: true },
    { chars: ['水织静久'],
      main: '#baa4ea',
      sub: '#d9cdf3',
      rgb: '186, 164, 234',
      motion: '#a794d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shizuku/uniform.webp',
      big: true },
    { chars: ['神山识'],
      main: '#e85489',
      sub: '#f2a1be',
      rgb: '232, 84, 137',
      motion: '#df5184',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiki/uniform.webp',
      big: true },
    { chars: ['稻荷'],
      main: '#8dd5e4',
      sub: '#c0e8f0',
      rgb: '141, 213, 228',
      motion: '#7fc0cd',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/inari/normal.webp',
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/inari/full.webp',
      big: true },
    { chars: ['空门苍'],
      main: '#c5a2e9',
      sub: '#dfccf3',
      rgb: '197, 162, 233',
      motion: '#b192d2',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/normal.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/puzzled.webp',
        '脸红通常': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/normal-blush.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/happy.webp',
        '脸红得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/smug-blush.webp',
        '脸红惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/surprised-blush.webp',
        '脸红生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/angry-blush.webp',
        '脸红疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/puzzled-blush.webp',
        '脸红腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/smirk-blush.webp',
        '脸红难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/sad-blush.webp',
        '脸红高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/happy-blush.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ao/uniform.webp',
      big: true },
    { chars: ['空门蓝'],
      main: '#b49be8',
      sub: '#d6c8f2',
      rgb: '180, 155, 232',
      motion: '#a28cd1',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/ai/normal.webp' },
    { chars: ['野村美希'],
      main: '#6ddd84',
      sub: '#afecbb',
      rgb: '109, 221, 132',
      motion: '#62c777',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/miki/outfit1.webp',
      big: true },
    { chars: ['鸣濑小鸠'],
      main: '#a4caea',
      sub: '#cde2f3',
      rgb: '164, 202, 234',
      motion: '#94b6d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/kobato/normal.webp' },
    { chars: ['鸣濑白羽'],
      main: '#a4d2ea',
      sub: '#cde6f3',
      rgb: '164, 210, 234',
      motion: '#94bdd3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/summerpockets/shiroha/uniform.webp',
      big: true },

    /* ============================== 恋爱？我就借走了哦！ ============================== */
    { chars: ['天满八纯'],
      main: '#e86562',
      sub: '#f2aaa9',
      rgb: '232, 101, 98',
      motion: '#d15b58',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/hasumi/uniform.webp',
      big: true },
    { chars: ['小关桃子'],
      main: '#7ea0e1',
      sub: '#b8cbee',
      rgb: '126, 160, 225',
      motion: '#7190ca',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/momoko/uniform.webp',
      big: true },
    { chars: ['新海月'],
      main: '#67db94',
      sub: '#abebc4',
      rgb: '103, 219, 148',
      motion: '#5dc585',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsuki/outfit1.webp',
      big: true },
    { chars: ['泉千夏'],
      main: '#c596e6',
      sub: '#dfc5f1',
      rgb: '197, 150, 230',
      motion: '#b187cf',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/chinatsu/uniform.webp',
      big: true },
    { chars: ['泉子夏'],
      main: '#b98ce4',
      sub: '#d8c0f0',
      rgb: '185, 140, 228',
      motion: '#a67ecd',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/konatsu/uniform.webp',
      big: true },
    { chars: ['濑川绘未'],
      main: '#f4ba4d',
      sub: '#f9d99d',
      rgb: '244, 186, 77',
      motion: '#dca745',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/emi/uniform.webp',
      big: true },
    { chars: ['空路椿'],
      main: '#bc99e7',
      sub: '#dac7f2',
      rgb: '188, 153, 231',
      motion: '#a98ad0',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/tsubaki/outfit1.webp',
      big: true },
    { chars: ['美滨咲希'],
      main: '#e2a681',
      sub: '#efceba',
      rgb: '226, 166, 129',
      motion: '#cb9574',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/saki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/saki/blush.webp' },
    { chars: ['远山爱季'],
      main: '#e87fa2',
      sub: '#f2b9cc',
      rgb: '232, 127, 162',
      motion: '#d17292',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lianai/aiki/normal.webp' },

    /* ============================== 水葬银币的伊斯特里亚 ============================== */
    { chars: ['久末紫乃'],
      main: '#cba4ea',
      sub: '#e2cdf3',
      rgb: '203, 164, 234',
      motion: '#b794d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/blush.webp',
      actions: {
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shino/outfit1.webp',
      big: true },
    { chars: ['久末紫子'],
      main: '#c0a4ea',
      sub: '#dccdf3',
      rgb: '192, 164, 234',
      motion: '#ad94d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/shiko/outfit1.webp',
      big: true },
    { chars: ['井土谷祈吏'],
      main: '#e1bb80',
      sub: '#eedab9',
      rgb: '225, 187, 128',
      motion: '#caa873',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kiri/normal.webp',
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kiri/outfit1.webp',
      big: true },
    { chars: ['八椚红叶'],
      main: '#a4ceea',
      sub: '#cde4f3',
      rgb: '164, 206, 234',
      motion: '#94b9d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/sad.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/momiji/outfit1.webp',
      big: true },
    { chars: ['安针冢逸美'],
      main: '#85b4e2',
      sub: '#bcd6ef',
      rgb: '133, 180, 226',
      motion: '#78a2cb',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/itsumi/normal.webp',
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/itsumi/outfit1.webp',
      big: true },
    { chars: ['小不动摇'],
      main: '#f1c871',
      sub: '#f7e1b1',
      rgb: '241, 200, 113',
      motion: '#d9b466',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yura/uniform.webp',
      big: true },
    { chars: ['汐入玖玖里'],
      main: '#9fc3e9',
      sub: '#cadef3',
      rgb: '159, 195, 233',
      motion: '#8fb0d2',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/kukuri/uniform.webp',
      big: true },
    { chars: ['煤谷小夜'],
      main: '#8488e2',
      sub: '#bbbeef',
      rgb: '132, 136, 226',
      motion: '#777acb',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/sayo/uniform.webp',
      big: true },
    { chars: ['神峰灯'],
      main: '#eda1c3',
      sub: '#f5cbde',
      rgb: '237, 161, 195',
      motion: '#d591b0',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/akari/outfit1.webp',
      big: true },
    { chars: ['茅崎夕樱'],
      main: '#ec8bb5',
      sub: '#f5bfd6',
      rgb: '236, 139, 181',
      motion: '#d47da3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/yuuka/uniform.webp',
      big: true },
    { chars: ['茅崎征士'],
      main: '#8687e3',
      sub: '#bcbdf0',
      rgb: '134, 135, 227',
      motion: '#797acc',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/seiji/normal.webp' },
    { chars: ['进藤和奏'],
      main: '#92e6c2',
      sub: '#c3f1dd',
      rgb: '146, 230, 194',
      motion: '#83cfaf',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shuizang/waka/outfit1.webp',
      big: true },

    /* ============================== 灵感满溢的甜蜜创想 ============================== */
    { chars: ['和泉妃爱'],
      main: '#f1e26d',
      sub: '#f7efaf',
      rgb: '241, 226, 109',
      motion: '#d9cb62',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hina/uniform.webp',
      big: true },
    { chars: ['和泉里'],
      main: '#e67d7a',
      sub: '#f1b8b6',
      rgb: '230, 125, 122',
      motion: '#cf706e',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/sato/normal.webp' },
    { chars: ['圣莉莉子'],
      main: '#a4d4ea',
      sub: '#cde7f3',
      rgb: '164, 212, 234',
      motion: '#94bfd3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/ririko/uniform.webp',
      big: true },
    { chars: ['常磐华乃'],
      main: '#f286c0',
      sub: '#f8bcdc',
      rgb: '242, 134, 192',
      motion: '#da79ad',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/smug.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/kano/uniform.webp',
      big: true },
    { chars: ['新川广梦'],
      main: '#717cde',
      sub: '#b1b7ed',
      rgb: '113, 124, 222',
      motion: '#6c77d5',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/hiromu/uniform.webp',
      big: true },
    { chars: ['锦明日海'],
      main: '#9ad5e7',
      sub: '#c7e8f2',
      rgb: '154, 213, 231',
      motion: '#8bc0d0',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/asumi/uniform.webp',
      big: true },
    { chars: ['镰仓诗樱'],
      main: '#8e88e3',
      sub: '#c1bef0',
      rgb: '142, 136, 227',
      motion: '#807acc',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/thinking.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shion/uniform.webp',
      big: true },
    { chars: ['雪景四季'],
      main: '#a4ceea',
      sub: '#cde4f3',
      rgb: '164, 206, 234',
      motion: '#94b9d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/shiki/outfit1.webp',
      big: true },
    { chars: ['龙闲天梨'],
      main: '#f09265',
      sub: '#f7c3aa',
      rgb: '240, 146, 101',
      motion: '#d8835b',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/linggan/tenri/uniform.webp',
      big: true },

    /* ============================== 甜蜜女友2 ============================== */
    { chars: ['冰见山玲'],
      main: '#8b77df',
      sub: '#bfb4ed',
      rgb: '139, 119, 223',
      motion: '#8572d6',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/rei/uniform.webp',
      big: true },
    { chars: ['茑町千岁'],
      main: '#e0c579',
      sub: '#eedfb5',
      rgb: '224, 197, 121',
      motion: '#cab16d',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/chitose/uniform.webp',
      big: true },
    { chars: ['黑姬结灯'],
      main: '#9185e2',
      sub: '#c2bcef',
      rgb: '145, 133, 226',
      motion: '#8278cb',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv2/yuhi/uniform.webp',
      big: true },

    /* ============================== 甜蜜女友2.5 ============================== */
    { chars: ['一之濑穗波'],
      main: '#d9765d',
      sub: '#eab4a6',
      rgb: '217, 118, 93',
      motion: '#c36a54',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/honami/uniform.webp',
      big: true },
    { chars: ['沓野奏'],
      main: '#c5a4ea',
      sub: '#dfcdf3',
      rgb: '197, 164, 234',
      motion: '#b194d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/kanade/uniform.webp',
      big: true },
    { chars: ['砚川·优芙拉希·泪香', '砚川'],
      main: '#a4d1ea',
      sub: '#cde6f3',
      rgb: '164, 209, 234',
      motion: '#94bcd3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/blush.webp',
      actions: {
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/ruika/outfit1.webp',
      big: true },
    { chars: ['高社雪静'],
      main: '#998ae4',
      sub: '#c7bff0',
      rgb: '153, 138, 228',
      motion: '#8a7ccd',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv25/yukishizu/uniform.webp',
      big: true },

    /* ============================== 甜蜜女友3 ============================== */
    { chars: ['御所院冬桦'],
      main: '#a4cbea',
      sub: '#cde2f3',
      rgb: '164, 203, 234',
      motion: '#94b7d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/touka/uniform.webp',
      big: true },
    { chars: ['斯卡蕾特·斑鸠·维斯塔莉娅', '斯卡蕾特'],
      main: '#f2dd5f',
      sub: '#f8eca7',
      rgb: '242, 221, 95',
      motion: '#dac756',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/scarlet/uniform.webp',
      big: true },
    { chars: ['柳木叶梦'],
      main: '#f29359',
      sub: '#f8c4a4',
      rgb: '242, 147, 89',
      motion: '#da8450',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/hazuki/uniform.webp',
      big: true },
    { chars: ['柳木诗梦'],
      main: '#e1b680',
      sub: '#eed7b9',
      rgb: '225, 182, 128',
      motion: '#caa473',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/shimu/uniform.webp',
      big: true },
    { chars: ['鸿纱由美'],
      main: '#8f7ee1',
      sub: '#c1b8ee',
      rgb: '143, 126, 225',
      motion: '#8979d8',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/tiannv3/sayumi/uniform.webp',
      big: true },

    /* ============================== 纯白交响曲 ============================== */
    { chars: ['乾纱凪'],
      main: '#e47a71',
      sub: '#f0b6b1',
      rgb: '228, 122, 113',
      motion: '#cd6e66',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sana/uniform.webp',
      big: true },
    { chars: ['八冢万智'],
      main: '#e3c589',
      sub: '#f0dfbe',
      rgb: '227, 197, 137',
      motion: '#ccb17b',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/machi/normal.webp' },
    { chars: ['天羽结子'],
      main: '#d99ee8',
      sub: '#eacaf2',
      rgb: '217, 158, 232',
      motion: '#c38ed1',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/yuiko/normal.webp' },
    { chars: ['天羽美羽'],
      main: '#c19ce8',
      sub: '#ddc9f2',
      rgb: '193, 156, 232',
      motion: '#ae8cd1',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/miu/uniform.webp',
      big: true },
    { chars: ['安洁莉娜·菜夏·史威尔', '安洁莉娜'],
      main: '#93e6c0',
      sub: '#c4f1dc',
      rgb: '147, 230, 192',
      motion: '#84cfad',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/angelina/outfit1.webp',
      big: true },
    { chars: ['椋梨隼太'],
      main: '#e3be86',
      sub: '#f0dbbc',
      rgb: '227, 190, 134',
      motion: '#ccab79',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/hayata/normal.webp' },
    { chars: ['濑名兰华'],
      main: '#dea674',
      sub: '#edceb3',
      rgb: '222, 166, 116',
      motion: '#c89568',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/ranka/normal.webp' },
    { chars: ['濑名爱理'],
      main: '#edab61',
      sub: '#f5d1a8',
      rgb: '237, 171, 97',
      motion: '#d59a57',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/blush.webp',
      actions: {
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/airi/uniform.webp',
      big: true },
    { chars: ['瓜生樱乃'],
      main: '#96c6e6',
      sub: '#c5e0f1',
      rgb: '150, 198, 230',
      motion: '#87b2cf',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/blush.webp',
      actions: {
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/chunbai/sakuno/uniform.webp',
      big: true },

    /* ============================== 纸上魔法使 ============================== */
    { chars: ['伏见理央'],
      main: '#e48e9d',
      sub: '#f0c1c9',
      rgb: '228, 142, 157',
      motion: '#cd808d',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/blush.webp',
      actions: {
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/rio/uniform.webp',
      big: true },
    { chars: ['克丽索贝莉露'],
      main: '#a4d7ea',
      sub: '#cde9f3',
      rgb: '164, 215, 234',
      motion: '#94c2d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/chryso/outfit1.webp',
      big: true },
    { chars: ['日向彼方'],
      main: '#ee8db6',
      sub: '#f6c0d7',
      rgb: '238, 141, 182',
      motion: '#d67fa4',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/puzzled.webp',
        '腹黑笑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/smirk.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanata/uniform.webp',
      big: true },
    { chars: ['月社妃'],
      main: '#f2e562',
      sub: '#f8f1a9',
      rgb: '242, 229, 98',
      motion: '#dace58',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kisaki/uniform.webp',
      big: true },
    { chars: ['本城奏'],
      main: '#967ce0',
      sub: '#c5b7ee',
      rgb: '150, 124, 224',
      motion: '#8770ca',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanade/normal.webp',
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/kanade/outfit1.webp',
      big: true },
    { chars: ['本城岬'],
      main: '#9689e3',
      sub: '#c5bef0',
      rgb: '150, 137, 227',
      motion: '#877bcc',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/misaki/uniform.webp',
      big: true },
    { chars: ['游行寺夜子'],
      main: '#a4caea',
      sub: '#cde2f3',
      rgb: '164, 202, 234',
      motion: '#94b6d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/smug.webp',
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yoruko/uniform.webp',
      big: true },
    { chars: ['游行寺暗子'],
      main: '#de9371',
      sub: '#edc4b1',
      rgb: '222, 147, 113',
      motion: '#c88466',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yamiko/normal.webp',
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/yamiko/outfit1.webp',
      big: true },
    { chars: ['游行寺汀'],
      main: '#eec066',
      sub: '#f6dcab',
      rgb: '238, 192, 102',
      motion: '#d6ad5c',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/zhishang/migiwa/normal.webp' },

    /* ============================== 缘起甜韵趣恋丛生！ ============================== */
    { chars: ['八乙女凉花'],
      main: '#b2a4ea',
      sub: '#d5cdf3',
      rgb: '178, 164, 234',
      motion: '#a094d3',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ryouka/uniform.webp',
      big: true },
    { chars: ['冈井蒲公英'],
      main: '#af96e6',
      sub: '#d3c5f1',
      rgb: '175, 150, 230',
      motion: '#9e87cf',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/blush.webp',
      actions: {
        '得意': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/smug.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tanpopo/uniform.webp',
      big: true },
    { chars: ['寿珠祈'],
      main: '#f0d969',
      sub: '#f7eaac',
      rgb: '240, 217, 105',
      motion: '#d8c35e',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/tamaki/uniform.webp',
      big: true },
    { chars: ['漆原绫子'],
      main: '#94dfe6',
      sub: '#c4edf1',
      rgb: '148, 223, 230',
      motion: '#85c9cf',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/ayako/outfit1.webp',
      big: true },
    { chars: ['衣川美卯'],
      main: '#c36bdc',
      sub: '#deaeec',
      rgb: '195, 107, 220',
      motion: '#b060c6',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/miu/uniform.webp',
      big: true },
    { chars: ['近江希未'],
      main: '#ed93ab',
      sub: '#f5c4d1',
      rgb: '237, 147, 171',
      motion: '#d5849a',
      avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/normal.webp',
      blush: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/blush.webp',
      actions: {
        '思考': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/thinking.webp',
        '惊讶': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/surprised.webp',
        '生气': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/angry.webp',
        '疑惑': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/puzzled.webp',
        '难过': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/sad.webp',
        '高兴': 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/happy.webp' },
      portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yuanqi/nozomi/uniform.webp',
      big: true },
  ];

  /* =========================================================================
   * 紧凑角色构造器：由高饱和 main 自动推导 sub / rgb / motion，减少脚本体积
   * codes: h高兴 a生气 s难过 p疑惑 u惊讶 g得意 t思考 k腹黑笑 y害羞 f皱眉 nb脸红通常
   * ========================================================================= */
  const ASSET_BASE = 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/';
  const ACT_MAP = {
    h: ['高兴', 'happy.webp'], a: ['生气', 'angry.webp'], s: ['难过', 'sad.webp'],
    p: ['疑惑', 'puzzled.webp'], u: ['惊讶', 'surprised.webp'], g: ['得意', 'smug.webp'],
    t: ['思考', 'thinking.webp'], k: ['腹黑笑', 'smirk.webp'], y: ['害羞', 'shy.webp'],
    f: ['皱眉', 'frown.webp'], nb: ['脸红', 'normal-blush.webp'],
  };
  function _hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(', ');
  }
  function _mixHex(hex, target, ratio) {
    const h = hex.replace('#', '');
    const c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    const t = target === 'w' ? 255 : 0;
    return '#' + c.map(function (v) { return Math.round(v + (t - v) * ratio).toString(16).padStart(2, '0'); }).join('');
  }
  function mkChar(chars, path, main, codes, hasBlush, portrait) {
    const base = ASSET_BASE + path + '/';
    const obj = {
      chars: Array.isArray(chars) ? chars : [chars],
      main: main,
      sub: _mixHex(main, 'w', 0.42),
      rgb: _hexToRgb(main),
      motion: _mixHex(main, 'b', 0.10),
      avatar: base + 'normal.webp',
    };
    if (hasBlush) obj.blush = base + 'blush.webp';
    if (codes) {
      const actions = {};
      for (const code of codes.split(' ')) {
        const item = ACT_MAP[code];
        if (item) actions[item[0]] = base + item[1];
      }
      if (Object.keys(actions).length) obj.actions = actions;
    }
    if (portrait) { obj.portrait = base + portrait; obj.big = true; }
    return obj;
  }

 /* ============================== 新增 24 部作品 ============================== */
  NEW_CHARACTERS.push(
    /* 9nine As */
    mkChar('克莉丝涅娅', '9nine-as/kelisinieya', '#f2ce66', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar(['如月结那', '结那'], '9nine-as/ruyuejiena', '#92aae8', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar(['阿尔特西亚', '阿尔'], '9nine-as/aertexiya', '#9ec6f0', 'h a s p u g t k', 1, 'outfit1.webp'),

    /* 放课后的灰姑娘 */
    mkChar('宇佐川雪子', 'fangkehou/yuzuochuanxuezi', '#f49454', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('尤娜', 'fangkehou/youna', '#ef6c78', '', 0, 'uniform.webp'),
    mkChar('早见美菜子', 'fangkehou/zaojianmeicaizi', '#7894cc', '', 0, ''),
    mkChar('王城世菜', 'fangkehou/wangchengshicai', '#d4c2dc', 'h a s p u g t', 1, ''),
    mkChar('王城茉莉爱', 'fangkehou/wangchengmoliai', '#e4ced8', 'h a s p u g', 1, 'uniform.webp'),
    mkChar('田寄多乃实', 'fangkehou/tianjiduonaishi', '#b4a8b8', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('睦美', 'fangkehou/mumei', '#e4cc82', '', 0, ''),
    mkChar('筑岛筑紫', 'fangkehou/zhudaozhuzi', '#f4a2c4', 'h a s p u g', 1, 'uniform.webp'),
    mkChar('米莎亲', 'fangkehou/mishaqin', '#f6967a', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('长南阳佳', 'fangkehou/zhangnanyangjia', '#d8b698', 'h a s p u t', 1, 'uniform.webp'),

    /* 廃村少女 */
    mkChar('乌野燕', 'feicunshaonv/wuyeyan', '#dc9462', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('八云梓', 'feicunshaonv/bayunzi', '#ce8b66', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('刑部澪', 'feicunshaonv/xingbuling', '#9c7ce0', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('加贺美朱理', 'feicunshaonv/jiahemeizhuli', '#648ae0', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('古户由良良', 'feicunshaonv/guhuyouliangliang', '#aba0b4', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('楪爱香', 'feicunshaonv/yeaixiang', '#f28098', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('笼女', 'feicunshaonv/longnv', '#dfd0ba', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar(['艾玛·A·药师院', '艾玛'], 'feicunshaonv/aima-a-yaoshiyuan', '#f2d880', 'h a s p u g t k', 1, 'outfit1.webp'),

    /* 廃村少女2 幽秘蛊惑的姬之匣 */
    mkChar('御汐阳渚', 'feicunshaonv2/yuxiyangzhu', '#8c72e2', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('心珠', 'feicunshaonv2/xinzhu', '#cbb6ee', 'h a p u g t', 1, 'outfit1.webp'),
    mkChar('新沼铃', 'feicunshaonv2/xinzhaoling', '#eb965e', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('都筑七七濑', 'feicunshaonv2/douzhuqiqilai', '#d48f68', 'h a s p u g k', 1, 'outfit1.webp'),
    mkChar('龙灯八千世', 'feicunshaonv2/longdengbaqianshi', '#58c2d2', 'h a p u g t k', 1, 'outfit1.webp'),

    /* 黄昏的禁忌之药 */
    mkChar('南户朱音', 'huanghun/nanhuzhuyin', '#d69066', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('岩永皋月', 'huanghun/yanyonggaoyue', '#f08e4e', '', 0, 'outfit1.webp'),
    mkChar('岩永翔子', 'huanghun/yanyongxiangzi', '#ec9e6c', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('春日伊吕波', 'huanghun/chunriyilvbo', '#60cc94', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('皆神沙久耶', 'huanghun/jieshenshajiuye', '#9e7ce2', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('稻垣美里', 'huanghun/daoyuanmeili', '#be84e8', '', 0, ''),
    mkChar('银子', 'huanghun/yinzi', '#a2d6ea', 'h a s p u g k', 1, 'outfit1.webp'),
    mkChar('高见沙智子', 'huanghun/gaojianshazhizi', '#f2cf66', 'h a s p u t', 1, 'outfit1.webp'),

    /* 花之天使的夏日恋歌 */
    mkChar('朱鹭坂七绪', 'huanotianshi/zhulubanqixu', '#987ae2', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('椿姬恋羽', 'huanotianshi/chunjilianyu', '#d89468', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('碧衣愁', 'huanotianshi/biyichou', '#dfa070', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('美鸠夏乃', 'huanotianshi/meijiuxianai', '#f49482', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('美鸠深春', 'huanotianshi/meijiushenchun', '#d86484', '', 0, 'outfit1.webp'),
    mkChar(['阿德尔海特·冯·贝格施特拉瑟', '阿德尔海特'], 'huanotianshi/adeerhaite-feng-beigeshi-bc7c', '#f0c862', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('齐须莉玖', 'huanotianshi/qixulijiu', '#e292e6', 'h a s p u g t k', 1, 'outfit1.webp'),

    /* 花与乙女的祝福 */
    mkChar('佐上薰', 'huayuyinv/zuoshangxun', '#7cd2f2', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('名木城都', 'huayuyinv/mingmuchengdou', '#ee6296', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('天法院绫音', 'huayuyinv/tianfayuanlingyin', '#f4d668', 'h a s p u t', 0, 'uniform.webp'),
    mkChar('宇佐美沙枝', 'huayuyinv/yuzuomeishazhi', '#e0ae82', '', 0, 'outfit1.webp'),
    mkChar('宝生圣佳', 'huayuyinv/baoshengshengjia', '#5e82dc', 'h a s p u', 1, 'uniform.webp'),
    mkChar('山内', 'huayuyinv/shannei', '#dfba78', '', 0, ''),
    mkChar('山本真弥子', 'huayuyinv/shanbenzhenmizi', '#eb945e', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('月丘彰', 'huayuyinv/yueqiuzhang', '#df7e6c', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('月丘晶子', 'huayuyinv/yueqiuzhang', '#e88876', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('蓝那祈', 'huayuyinv/lannaqi', '#a67ce6', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('鹿岛志鹤', 'huayuyinv/ludaozhihe', '#eec264', 'h a s p u t', 1, 'uniform.webp'),

    /* 景之海的艾佩莉娅 */
    mkChar('Thinker', 'jingzhihai/thinker', '#b89c8a', '', 0, ''),
    mkChar('一久远', 'jingzhihai/yijiuyuan', '#f2ce66', 'h a s p u t', 1, 'outfit1.webp'),
    mkChar('一空观', 'jingzhihai/yikongguan', '#c49e84', '', 0, ''),
    mkChar('东真白', 'jingzhihai/dongzhenbai', '#868ae8', 'h a s p u t', 1, 'outfit1.webp'),
    mkChar('桐岛三羽', 'jingzhihai/tongdaosanyu', '#d4a886', 'h a s p u t', 1, 'outfit1.webp'),
    mkChar('桐岛零一', 'jingzhihai/tongdaolingyi', '#c4cf6e', '', 0, ''),
    mkChar('正圆七海', 'jingzhihai/zhengyuanqihai', '#ec6292', '', 0, 'outfit1.webp'),
    mkChar(['艾佩理雅', '艾佩莉娅'], 'jingzhihai/aipeiliya', '#8ed8ec', 'h a s p u t', 1, 'outfit1.webp'),
    mkChar('龙宫沙罗', 'jingzhihai/longgongshaluo', '#efc25e', '', 0, 'outfit1.webp'),

    /* 金辉恋曲四重奏 */
    mkChar(['伊罗艾', '伊罗艾·迪·卡巴列罗·伊斯塔'], 'jinhui/yiluoai', '#dec47c', '', 0, ''),
    mkChar('僧间理亚', 'jinhui/sengjianliya', '#eeca68', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('加贺爱子', 'jinhui/jiaheaizi', '#ee9c68', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar(['卡米娜尔·路·普鲁提亚·索尔特雷吉·希斯雅', '卡米娜尔'], 'jinhui/kaminaer-lu-pulutiya-suo-4441', '#f2bad0', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('城崎绚华', 'jinhui/chengqixuanhua', '#a47ee4', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('城崎老爷子', 'jinhui/chengqilaoyezi', '#aab8c8', '', 0, ''),
    mkChar('妃玲奈', 'jinhui/feilingnai', '#f2be52', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('市松千惠华', 'jinhui/shisongqianhuihua', '#7ae4c2', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar(['希尔维娅·路·库洛丝克劳恩·索尔特雷吉·希斯雅', '希尔维娅'], 'jinhui/xierweiya-lu-kuluosikela-c855', '#f4dc76', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('栗生茜', 'jinhui/lishengqian', '#ec6266', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar(['玛利亚·毕肖普', '玛利亚'], 'jinhui/maliya-bixiaopu', '#a6a2bc', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('缟投良', 'jinhui/gaotouliang', '#7c90c4', '', 0, ''),
    mkChar('艾吉斯娜', 'jinhui/aijisina', '#78d4cc', '', 0, 'outfit1.webp'),
    mkChar(['艾罗伊娜·蒂·卡巴列罗·易丝塔', '艾罗伊娜'], 'jinhui/ailuoyina-di-kabalieluo-bc93', '#e8d288', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('鹿苑寺菊千代', 'jinhui/luyuansijuqiandai', '#da9262', '', 0, ''),

    /* 我的恋天使太废柴了好可怕 */
    mkChar('乾依铃', 'lianzhishi/qianyiling', '#9c96ec', 'h a s p u', 1, 'uniform.webp'),
    mkChar('佐久真诗', 'lianzhishi/zuojiuzhenshi', '#7884dc', 'h a s p u', 0, 'uniform.webp'),
    mkChar('冲恒真空', 'lianzhishi/chonghengzhenkong', '#88daf4', 'h a p u g', 1, 'outfit1.webp'),
    mkChar('宇城杏树', 'lianzhishi/yuchengxingshu', '#e6d8a2', '', 0, ''),
    mkChar('峰越琴雏', 'lianzhishi/fengyueqinchu', '#d46280', 'h a s p u k', 1, 'outfit1.webp'),
    mkChar('幸咲来琉', 'lianzhishi/xingxiaolailiu', '#c8b8f0', 'h a s p u k', 1, 'outfit1.webp'),
    mkChar('恋见爱露', 'lianzhishi/lianjianailu', '#f278b4', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('绵贯绢', 'lianzhishi/mianguanjuan', '#bde678', 'h a s p u', 1, 'outfit1.webp'),
    mkChar('西筱琳果', 'lianzhishi/xixiaolinguo', '#cc8c68', 'a s p u g t k', 1, 'uniform.webp'),

    /* 她们的流仪 */
    mkChar('兔月胡太郎', 'liuyi/tuyuehutailang', '#dfb288', '', 1, 'uniform.webp'),
    mkChar('弓曳火乃香', 'liuyi/gongyehuonaixiang', '#ec6c9e', 'h a s p u', 1, 'outfit1.webp'),
    mkChar('由希濑濑里', 'liuyi/youxilailaili', '#64beff', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('白银朱音', 'liuyi/baiyinzhuyin', '#f2c45a', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('白银鸟羽莉', 'liuyi/baiyinniaoyuli', '#f0dc74', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('秋名凉月', 'liuyi/qiumingliangyue', '#f49ec2', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('花叶千佐都', 'liuyi/huayeqianzuodou', '#94e29a', 'h a s p u t', 1, 'uniform.webp'),

    /* 魔女的夜宴 */
    mkChar('久岛佳苗', 'monvdeyeyan/jiudaojiamiao', '#d69066', '', 0, ''),
    mkChar('保科太一', 'monvdeyeyan/baoketaiyi', '#9aa8b8', '', 0, ''),
    mkChar('假屋和奏', 'monvdeyeyan/jiawuhezou', '#f0d684', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('因幡巡', 'monvdeyeyan/yinfanxun', '#f49a52', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('户隐憧子', 'monvdeyeyan/huyinchongzi', '#ca8868', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('椎叶䌷', 'monvdeyeyan/chuiyechou', '#d4a88a', 'h a s p u g t k nb', 0, 'uniform.webp'),
    mkChar('海道秀明', 'monvdeyeyan/haidaoxiuming', '#aa96ce', '', 0, ''),
    mkChar('相马七绪', 'monvdeyeyan/xiangmaqixu', '#f2889c', '', 0, 'outfit1.webp'),
    mkChar('绫地宁宁', 'monvdeyeyan/lingdiningning', '#c4b2ee', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('赤城', 'monvdeyeyan/chicheng', '#86c6f0', '', 0, ''),
    mkChar('越路美穗', 'monvdeyeyan/yuelumeisui', '#5cc288', '', 0, ''),

    /* 千恋万花 */
    mkChar('丛雨', 'qianlianwanhua/congyu', '#9ce89e', 'h a p u g t k', 1, 'uniform.webp'),
    mkChar('常陆茉子', 'qianlianwanhua/changlumozi', '#72b6b0', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('朝武安晴', 'qianlianwanhua/chaowuanqing', '#688cd8', '', 0, ''),
    mkChar('朝武芳乃', 'qianlianwanhua/chaowufangnai', '#b8d8ee', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('猪谷心子', 'qianlianwanhua/zhuguxinzi', '#68c88c', '', 0, ''),
    mkChar(['蕾娜·列支敦瑙尔', '蕾娜'], 'qianlianwanhua/leina-liezhidunnaoer', '#f4d464', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('鞍马小春', 'qianlianwanhua/anmaxiaochun', '#f4869e', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('鞍马玄十郎', 'qianlianwanhua/anmaxuanshilang', '#a4b8cc', '', 0, ''),
    mkChar('马庭芦花', 'qianlianwanhua/matingluhua', '#d4689c', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('驹川美津叶', 'qianlianwanhua/juchuanmeijinye', '#7a96c2', '', 0, ''),

    /* 少女爱上姐姐2 */
    mkChar('七七原薰子', 'shaoaijie2/qiqiyuanxunzi', '#9a7ee2', 'h a s p u t nb', 0, 'uniform.webp'),
    mkChar('乌橘沙世子', 'shaoaijie2/wujushashizi', '#d6c284', '', 0, ''),
    mkChar('冷泉淡雪', 'shaoaijie2/lengquandanxue', '#f2de88', 'h a s p u t k', 1, 'uniform.webp'),
    mkChar(['凯莉·古兰瑟留斯', '凯莉'], 'shaoaijie2/kaili-gulanseliusi', '#e0ac80', '', 1, 'uniform.webp'),
    mkChar('哘雅乐乃', 'shaoaijie2/xingyayuenai', '#9876de', 'h a s p u g', 1, 'uniform.webp'),
    mkChar('妃宫千早', 'shaoaijie2/feigongqianzao', '#e2d6c4', 'h a s p u g', 1, 'uniform.webp'),
    mkChar('宫藤阳向', 'shaoaijie2/gongtengyangxiang', '#da9668', '', 0, ''),
    mkChar('度会史', 'shaoaijie2/duhuishi', '#8296c8', 'a p u nb', 0, 'uniform.webp'),
    mkChar('御门妙子', 'shaoaijie2/yumenmiaozi', '#cca286', '', 0, ''),
    mkChar('柏木优雨', 'shaoaijie2/baimuyouyu', '#ad82e4', 'h a s u t', 1, 'uniform.webp'),
    mkChar('梶浦绯纱子', 'shaoaijie2/weipufeishazi', '#d4865e', '', 0, ''),
    mkChar('皆濑初音', 'shaoaijie2/jielaichuyin', '#e4b890', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('真行寺茉清', 'shaoaijie2/zhenxingsimoqing', '#7484e2', '', 0, ''),
    mkChar('石动塞', 'shaoaijie2/shidongsai', '#7488c8', '', 0, ''),
    mkChar('神近香织理', 'shaoaijie2/shenjinxiangzhili', '#ded094', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('莳田圣', 'shaoaijie2/shitiansheng', '#efc462', '', 1, 'outfit1.webp'),

    /* 少女世界的生存之道 */
    mkChar('AI母亲', 'shaonvshijie/aimuqin', '#9ebcd0', '', 0, ''),
    mkChar('佐伯瑠璃子', 'shaonvshijie/zuoboliulizi', '#f2ca62', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('姬乃咲', 'shaonvshijie/jinaixiao', '#f2adc8', '', 0, ''),
    mkChar('姬乃灯里', 'shaonvshijie/jinaidengli', '#f490b6', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('守屋美玖', 'shaonvshijie/shouwumeijiu', '#86b4c8', 'h a s p t', 1, 'uniform.webp'),
    mkChar('守屋西雷', 'shaonvshijie/shouwuxilei', '#b8a4dc', 'h a s p u t', 1, 'outfit1.webp'),
    mkChar('本多真由美', 'shaonvshijie/benduozhenyoumei', '#e2b678', '', 0, 'outfit1.webp'),
    mkChar('片桐八重花', 'shaonvshijie/piantongbazhonghua', '#c69ee0', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('片桐结', 'shaonvshijie/piantongjie', '#d8bcc8', 'h a s p u g t k', 0, 'uniform.webp'),
    mkChar('藤堂凛', 'shaonvshijie/tengtanglin', '#a4c6d2', 'h a s p u t k', 1, 'uniform.webp'),

    /* 树莓立方体 */
    mkChar('咏', 'shumei/yong', '#dfb084', 'h a s p u g', 1, 'outfit1.webp'),
    mkChar('城田舞', 'shumei/chengtianwu', '#8286e4', '', 0, ''),
    mkChar(['樱庭·维多利亚·琉莉', '琉莉'], 'shumei/yingting-weiduoliya-liul-9393', '#bcaee8', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('海道美琴', 'shumei/haidaomeiqin', '#cc8c64', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('狩野凑', 'shumei/shouyecou', '#ec6296', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('结月悠', 'shumei/jieyueyou', '#f4d264', 'h a p u g t k', 1, 'uniform.webp'),

    /* 天津罪 */
    mkChar('恋冢爱', 'tianjinzui/lianzhongai', '#e6d8b8', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('朝比奈响子', 'tianjinzui/chaobinaixiangzi', '#c98868', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('水无月萤', 'tianjinzui/shuiwuyueying', '#6ea6cc', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('黑萤', 'tianjinzui/shuiwuyueying', '#d93848', 'h a s p u g t k', 0, 'uniform.webp'),
    mkChar('浅川光一', 'tianjinzui/qianchuanguangyi', '#cc9470', '', 0, ''),
    mkChar('浅川铃夏', 'tianjinzui/qianchuanlingxia', '#e09e68', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('织部心', 'tianjinzui/zhibuxin', '#d49262', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('织部杏月', 'tianjinzui/zhibuxingyue', '#8e82dc', 'h a s p u g t', 1, 'outfit1.webp'),

    /* 不要践踏天使的羽毛 */
    mkChar('十二次憩', 'tianshiyumao/shierciqi', '#a27ee2', 'h a s u g t k', 1, 'uniform.webp'),
    mkChar('双见空', 'tianshiyumao/shuangjiankong', '#f2cf62', 'h s p u g t k', 1, 'uniform.webp'),
    mkChar('双见菖蒲', 'tianshiyumao/shuangjianchangpu', '#7c82e4', 'h a s p u g t k', 1, 'uniform-sun.webp'),
    mkChar('土御门阳华', 'tianshiyumao/tuyumenyanghua', '#e2aa7c', '', 0, ''),
    mkChar('夏日光', 'tianshiyumao/xiariguang', '#9ad4f0', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('夏日照', 'tianshiyumao/xiarizhao', '#8cc2ec', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('夕星明', 'tianshiyumao/xixingming', '#dc5e78', '', 0, ''),
    mkChar('夕星羽音', 'tianshiyumao/xixingyuyin', '#e496e2', 'h a s p u g t k', 0, 'uniform.webp'),
    mkChar(['希思黎', '修女·希思黎'], 'tianshiyumao/xisili', '#f084b6', '', 0, ''),
    mkChar(['特罗肯海特·冯·梅璐库雅', '特罗肯海特', '梅璐库雅'], 'tianshiyumao/teluokenhaite-feng-meilu-0060', '#c6c4d8', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('艾丽娅', 'tianshiyumao/ailiya', '#eed884', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('荷尔拜因', 'tianshiyumao/heerbaiyin', '#e8c466', '', 0, ''),
    mkChar('鹰司', 'tianshiyumao/yingsi', '#f0c0cc', '', 0, 'uniform.webp'),
    mkChar('黑涡摘', 'tianshiyumao/heiwozhai', '#f48ea4', '', 0, 'outfit1.webp'),

    /* 特里诺兰 */
    mkChar('七波馨', 'trino/qiboxin', '#a6b8ca', '', 0, ''),
    mkChar('宫风夕梨', 'trino/gongfengxili', '#f49ac0', 'h a s p u g t k', 0, 'uniform.webp'),
    mkChar('日比野绫花', 'trino/ribiyelinghua', '#e8a2ac', '', 1, 'uniform.webp'),
    mkChar('白樱', 'trino/baiying', '#b6d4f2', 'h a s p u g', 1, 'uniform.webp'),
    mkChar('百南美', 'trino/bainanmei', '#d6ac8e', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('紬木沙罗', 'trino/choumushaluo', '#b092dc', 'h a s u g t k', 1, 'uniform.webp'),
    mkChar('花子F', 'trino/huazif', '#f0d680', 'h a s p u t', 1, 'uniform.webp'),

    /* 向日葵的教会与长长的暑假 */
    mkChar('夏咲咏', 'xiangrikui/xiaxiaoyong', '#e092e4', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar(['胧白·河马·金刚石', '胧白'], 'xiangrikui/longbai-hema-jingangshi', '#e6ce7e', 'h a s p t k', 1, 'outfit1.webp'),
    mkChar('野野原雏樱', 'xiangrikui/yeyeyuanchuying', '#f0dce6', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('鲇濑月子', 'xiangrikui/nianlaiyuezi', '#b498de', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('鹭月流华', 'xiangrikui/luyueliuhua', '#6c8ae2', 'h a s p u g', 1, 'outfit1.webp'),

    /* 幸运草的约定 */
    mkChar('乃木坂久远', 'xingyuncao/naimubanjiuyuan', '#8ac8a6', '', 0, ''),
    mkChar('加贺美光瑠', 'xingyuncao/jiahemeiguangliu', '#b6c4ee', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('加贺美碧瑠', 'xingyuncao/jiahemeibiliu', '#a2d8d6', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('结桥泉', 'xingyuncao/jieqiaoquan', '#f4ae54', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('西园寺', 'xingyuncao/xiyuansi', '#ebd284', '', 0, ''),
    mkChar('西园寺瑞穗', 'xingyuncao/xiyuansiruisui', '#ee9a70', '', 0, 'outfit1.webp'),
    mkChar('飞鸟凛', 'xingyuncao/feiniaolin', '#b89ce2', 'h a p u g k', 1, 'uniform.webp'),
    mkChar('鹰仓义臣', 'xingyuncao/yingcangyichen', '#cba286', '', 0, ''),
    mkChar('鹰仓杏璃', 'xingyuncao/yingcangxingli', '#8274e8', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('鹰仓杏铃', 'xingyuncao/yingcangxingling', '#f4d262', 'h a s p u g k', 1, 'uniform.webp'),
    mkChar('龙胆燕', 'xingyuncao/longdanyan', '#f4849c', 'h a s p u g', 1, 'uniform.webp'),
    mkChar('龙胆虎吉', 'xingyuncao/longdanhuji', '#f2a64e', '', 0, ''),

    /* 樱之刻 · 新登场/不同名角色（直接常驻生效） */
    mkChar('中村丽华', 'yingzhike/zhongcunlihua', '#b2cad4', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('坂本昭三', 'yingzhike/banbenzhaosan', '#c8a288', '', 0, ''),
    mkChar('恩田放哉', 'yingzhike/entianfangzai', '#e6ce82', '', 0, ''),
    mkChar('恩田雾乃', 'yingzhike/entianwunai', '#b8c8d6', '', 0, ''),
    mkChar('本间心铃', 'yingzhike/benjianxinling', '#8b7de0', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('本间礼次郎', 'yingzhike/benjianlicilang', '#a8b6c8', '', 0, ''),
    mkChar('村田清彦', 'yingzhike/cuntianqingyan', '#b0c4cc', '', 0, ''),
    mkChar('片贝拓实', 'yingzhike/pianbeituoshi', '#e4b872', '', 0, ''),
    mkChar(['马蒂·弗里曼', '马蒂'], 'yingzhike/madi-fuliman', '#f0ca66', '', 0, ''),
    mkChar('鸟谷静流', 'yingzhike/niaogujingliu', '#68a6ec', 'h a s p u t k', 0, 'uniform.webp'),

    /* 银色遥远 */
    mkChar('名白椛', 'yinseyaoyuan/mingbaihua', '#dc9666', 'h a s p u g t', 1, 'uniform-hs.webp'),
    mkChar('如月瑞羽', 'yinseyaoyuan/ruyueruiyu', '#64b4f0', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('新见雪月', 'yinseyaoyuan/xinjianxueyue', '#a27ce4', 'h a s p u k', 1, 'uniform-hs.webp'),
    mkChar('桧崎玛丽亚', 'yinseyaoyuan/guiqimaliya', '#e6ce88', '', 0, ''),
    mkChar('榊朱音', 'yinseyaoyuan/shenzhuyin', '#f05e64', '', 0, ''),
    mkChar(['爱丽莎·阿申斯基', '爱丽莎'], 'yinseyaoyuan/ailisha-ashensiji', '#f49ac0', 'h a s p u g', 1, 'outfit1.webp'),
    mkChar('苍井雏多', 'yinseyaoyuan/cangjingchuduo', '#f89248', 'h a s p u g', 1, 'uniform-hs.webp'),
    mkChar('莉莉安', 'yinseyaoyuan/lilian', '#7e88d4', '', 0, ''),
    mkChar('西园百百花', 'yinseyaoyuan/xiyuanbaibaihua', '#ce8a64', '', 0, ''),
    mkChar(['贝斯莉·萝丝·迪兹莉', '贝斯莉'], 'yinseyaoyuan/beisili-luosi-dizili', '#f2ce64', 'h a s p u g k', 1, 'uniform-hs.webp'),
    mkChar('阿久津怜士', 'yinseyaoyuan/ajiujinlianshi', '#92a4b6', '', 0, ''),

    /* 智以类聚 */
    mkChar('三宅康博', 'zhiyileiju/sanzhaikangbo', '#c88a66', '', 0, ''),
    mkChar('冬篠宫和', 'zhiyileiju/dongxiaogonghe', '#f29c5c', '', 0, 'uniform.webp'),
    mkChar('和久津智', 'zhiyileiju/hejiujinzhi', '#d89662', 'h a s p u t k', 1, 'outfit1.webp'),
    mkChar('和久津真耶', 'zhiyileiju/hejiujinzhenye', '#c6a088', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('尹央辉', 'zhiyileiju/yinyanghui', '#58be98', '', 0, 'outfit1.webp'),
    mkChar('才野原惠', 'zhiyileiju/caiyeyuanhui', '#a87ee6', '', 0, ''),
    mkChar('白鞘伊代', 'zhiyileiju/baiqiaoyidai', '#f2cc62', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('皆元瑠衣', 'zhiyileiju/jieyuanliuyi', '#df667c', 'h a s p u g t', 1, 'outfit1.webp'),
    mkChar('花城花鸡', 'zhiyileiju/huachenghuaji', '#e8d07e', 'h a s p u g t k', 1, 'uniform.webp'),
    mkChar('茅场茜子', 'zhiyileiju/maochangqianzi', '#6088dc', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('蝉丸伊鹤', 'zhiyileiju/chanwanyihe', '#62c49c', '', 0, ''),
    mkChar('鸣泷心和', 'zhiyileiju/minglongxinhe', '#f496bc', 'h a s p u g t', 1, 'uniform.webp')
  );

  /* =========================================================================
   * 樱之刻 · 同名角色十年后覆盖表（仅当世界书启用 [樱之刻][角色]🌸xxx 时自动切换）
   * ========================================================================= */
  const SAKURA_TOKI_OVERRIDES = [
    mkChar('冰川里奈', 'yingzhike/bingchuanlinai', '#a8c8ec', 'h a s p u t', 1, 'outfit1.webp'),
    mkChar('冰川露莉莴', 'yingzhike/bingchuanluliwo', '#f4a0c4', 'h a s p u g t', 1, 'uniform.webp'),
    mkChar('咲崎樱子', 'yingzhike/xiaoqiyingzi', '#ee82a8', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('夏目蓝', 'yingzhike/xiamulan', '#d6926a', 'h a s p u t k', 1, 'outfit1.webp'),
    mkChar(['御樱禀', '御樱稟'], 'yingzhike/yuyingbing', '#ea6868', 'h a s p u t', 0, 'outfit1.webp'),
    mkChar('恩田宁', 'yingzhike/entianning', '#ebd082', 'h a s p u', 0, 'outfit1.webp'),
    mkChar('柊乃乃未', 'yingzhike/zhongnainaiwei', '#dda4bc', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('栗山奈津子', 'yingzhike/lishannaijinzi', '#bc92da', 'h a s p u t', 1, 'uniform.webp'),
    mkChar('草薙健一郎', 'yingzhike/caotijianyilang', '#cca288', '', 0, ''),
    mkChar('长山香奈', 'yingzhike/zhangshanxiangnai', '#dfae86', 'h a s p u g t k', 1, 'outfit1.webp'),
    mkChar('鸟谷真琴', 'yingzhike/niaoguzhenqin', '#ec6ea2', 'h a s p u t k', 1, 'outfit1.webp'),
  ];
  /* ↑ 2026-11-09 现代世界观新坑：原表里 197 条旧角色（西幻 / 勇战·MGQ / 黑魂系）已全部清空。
     以后加人照上面「★★★ 新增角色 ★★★」的示例往数组里追加一条就行：
       { chars: ['角色名', '角色名·全名'], main: '#c9a227', sub: '#fffdf5',
         rgb: '201, 162, 39', motion: '#e0c060', rose: true, big: true,
         avatar: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/<作品拼音>/<角色拼音>/normal.webp', portrait: 'https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/<作品拼音>/<角色拼音>/uniform.webp' },
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
  /* =========================================================================
   * 图片源：GitHub 图库（直接写死绝对链接，不做任何运行时探测）
   * -------------------------------------------------------------------------
   *   仓库：https://github.com/jianchi89/galworld-assets
   *   前缀：https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets
   *
   * 所以「图还没传上去」的时候头像当然是空的 —— 传完就有了。
   * 换图（同名覆盖）后 jsDelivr 会缓存约 12 小时；想立刻生效就把前缀里的
   * @main 换成新 tag（如 @v4），或者在网址后面加 ?v=2。
   * ========================================================================= */
  const CAST_CSS = `


/* ===================== 全角色：主题色 / 头像 / 差分 / 立绘 =====================
   角色发色一览.txt → 主题色；合集200x250_URL对照表.txt → 图
   data-char 必须与姓名完全相等；欧美名只登记「名」；
   立绘：校园制服 → 衣装① → 衣装② → 衣装③ → 衣装④ → 大立绘
   由 _build_cast.py 生成，勿手改。
   ========================================================================== */

/* MAXX（飞翔心） */
[data-char="MAXX"] {
  --main: #92e8bf !important;
  --sub: #c0f2da !important;
  --rgb: 146, 232, 191 !important;
  --motion-color: #83d1ac !important;}
[data-char="MAXX"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/maxx/normal.webp") !important;
  cursor: pointer !important;}
[data-char="MAXX"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="MAXX"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="MAXX"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/maxx/normal.webp") !important;}
[data-char="MAXX"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/maxx/normal.webp") !important;}
[data-char="MAXX"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/maxx/uniform.webp") !important;}

/* 八重野萤（飞翔心） */
[data-char="八重野萤"] {
  --main: #93e0b5 !important;
  --sub: #c0edd4 !important;
  --rgb: 147, 224, 181 !important;
  --motion-color: #84caa3 !important;}
[data-char="八重野萤"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bazhongyeying/normal.webp") !important;
  cursor: pointer !important;}
[data-char="八重野萤"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="八重野萤"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="八重野萤"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bazhongyeying/normal.webp") !important;}
[data-char="八重野萤"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bazhongyeying/normal.webp") !important;}
[data-char="八重野萤"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bazhongyeying/uniform.webp") !important;}

/* 白鹭茉百合（飞翔心） */
[data-char="白鹭茉百合"], [data-char="茉百合"] {
  --main: #c2d6cf !important;
  --sub: #dce7e3 !important;
  --rgb: 194, 214, 207 !important;
  --motion-color: #afc1ba !important;}
[data-char="白鹭茉百合"] .custom-nvn-avatar-img, [data-char="茉百合"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/normal.webp") !important;
  cursor: pointer !important;}
[data-char="白鹭茉百合"] .custom-nvn-avatar-popover, [data-char="茉百合"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="白鹭茉百合"] .custom-nvn-avatar-img::after, [data-char="茉百合"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="白鹭茉百合"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/normal-blush.webp") !important;}
[data-char="白鹭茉百合"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/happy.webp") !important;}
[data-char="白鹭茉百合"][data-action="害羞"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/shy.webp") !important;}
[data-char="白鹭茉百合"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/surprised.webp") !important;}
[data-char="白鹭茉百合"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/happy-blush.webp") !important;}
[data-char="白鹭茉百合"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/surprised-blush.webp") !important;}
[data-char="白鹭茉百合"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/angry-blush.webp") !important;}
[data-char="白鹭茉百合"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/normal-blush.webp") !important;}
[data-char="白鹭茉百合"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/puzzled-blush.webp") !important;}
[data-char="白鹭茉百合"][data-action="难过"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/sad.webp") !important;}
[data-char="白鹭茉百合"][data-action="生气"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/angry.webp") !important;}
[data-char="白鹭茉百合"][data-action="通常"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/normal.webp") !important;}
[data-char="白鹭茉百合"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="茉百合"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/puzzled.webp") !important;}
[data-char="白鹭茉百合"] .custom-nvn-portrait-full, [data-char="茉百合"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bailumobaihe/uniform.webp") !important;}

/* 冰川京一郎（飞翔心） */
[data-char="冰川京一郎"] {
  --main: #cbc2d6 !important;
  --sub: #e1dce7 !important;
  --rgb: 203, 194, 214 !important;
  --motion-color: #b7afc1 !important;}
[data-char="冰川京一郎"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bingchuanjingyilang/normal.webp") !important;}
[data-char="冰川京一郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰川京一郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bingchuanjingyilang/normal.webp") !important;}
[data-char="冰川京一郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/bingchuanjingyilang/normal.webp") !important;}

/* 稻羽结衣（飞翔心） */
[data-char="稻羽结衣"], [data-char="结衣"] {
  --main: #e6b488 !important;
  --sub: #f0d4ba !important;
  --rgb: 230, 180, 136 !important;
  --motion-color: #cfa27a !important;}
[data-char="稻羽结衣"] .custom-nvn-avatar-img, [data-char="结衣"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="稻羽结衣"] .custom-nvn-avatar-popover, [data-char="结衣"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="稻羽结衣"] .custom-nvn-avatar-img::after, [data-char="结衣"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="稻羽结衣"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="结衣"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/normal-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/happy.webp") !important;}
[data-char="稻羽结衣"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/surprised.webp") !important;}
[data-char="稻羽结衣"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/happy-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/surprised-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="脸红难过"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/sad-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/angry-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/normal-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/puzzled-blush.webp") !important;}
[data-char="稻羽结衣"][data-action="难过"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/sad.webp") !important;}
[data-char="稻羽结衣"][data-action="生气"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/angry.webp") !important;}
[data-char="稻羽结衣"][data-action="通常"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/normal.webp") !important;}
[data-char="稻羽结衣"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="结衣"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/puzzled.webp") !important;}
[data-char="稻羽结衣"] .custom-nvn-portrait-full, [data-char="结衣"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/daoyujieyi/uniform.webp") !important;}

/* 电堂明（飞翔心） */
[data-char="电堂明"] {
  --main: #92e8c6 !important;
  --sub: #c0f2de !important;
  --rgb: 146, 232, 198 !important;
  --motion-color: #83d1b2 !important;}
[data-char="电堂明"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/diantangming/normal.webp") !important;
  cursor: pointer !important;}
[data-char="电堂明"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="电堂明"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="电堂明"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/diantangming/normal.webp") !important;}
[data-char="电堂明"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/diantangming/normal.webp") !important;}
[data-char="电堂明"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/diantangming/uniform.webp") !important;}

/* 抚子（飞翔心） */
[data-char="抚子"] {
  --main: #92b1e8 !important;
  --sub: #c0d2f2 !important;
  --rgb: 146, 177, 232 !important;
  --motion-color: #839fd1 !important;}
[data-char="抚子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/fuzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="抚子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="抚子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="抚子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/fuzi/normal.webp") !important;}
[data-char="抚子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/fuzi/normal.webp") !important;}
[data-char="抚子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/fuzi/uniform.webp") !important;}

/* 光（飞翔心） */
[data-char="光"] {
  --main: #92bde8 !important;
  --sub: #c0d9f2 !important;
  --rgb: 146, 189, 232 !important;
  --motion-color: #83aad1 !important;}
[data-char="光"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/guang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="光"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="光"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="光"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/guang/normal.webp") !important;}
[data-char="光"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/guang/normal.webp") !important;}
[data-char="光"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/guang/uniform.webp") !important;}

/* 皇千羽耶（飞翔心） */
[data-char="皇千羽耶"] {
  --main: #f2d087 !important;
  --sub: #f7e4b9 !important;
  --rgb: 242, 208, 135 !important;
  --motion-color: #dabb7a !important;}
[data-char="皇千羽耶"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangqianyuye/normal.webp") !important;
  cursor: pointer !important;}
[data-char="皇千羽耶"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皇千羽耶"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皇千羽耶"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangqianyuye/normal.webp") !important;}
[data-char="皇千羽耶"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangqianyuye/normal.webp") !important;}
[data-char="皇千羽耶"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangqianyuye/uniform.webp") !important;}

/* 皇天音（飞翔心） */
[data-char="皇天音"], [data-char="天音"] {
  --main: #f2da87 !important;
  --sub: #f7eab9 !important;
  --rgb: 242, 218, 135 !important;
  --motion-color: #dac47a !important;}
[data-char="皇天音"] .custom-nvn-avatar-img, [data-char="天音"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/normal.webp") !important;
  cursor: pointer !important;}
[data-char="皇天音"] .custom-nvn-avatar-popover, [data-char="天音"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皇天音"] .custom-nvn-avatar-img::after, [data-char="天音"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皇天音"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="天音"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/normal-blush.webp") !important;}
[data-char="皇天音"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="天音"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/happy.webp") !important;}
[data-char="皇天音"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="天音"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/surprised.webp") !important;}
[data-char="皇天音"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/happy-blush.webp") !important;}
[data-char="皇天音"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/surprised-blush.webp") !important;}
[data-char="皇天音"][data-action="脸红难过"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/sad-blush.webp") !important;}
[data-char="皇天音"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/angry-blush.webp") !important;}
[data-char="皇天音"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/normal-blush.webp") !important;}
[data-char="皇天音"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="天音"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/puzzled-blush.webp") !important;}
[data-char="皇天音"][data-action="难过"] .custom-nvn-avatar-img, [data-char="天音"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/sad.webp") !important;}
[data-char="皇天音"][data-action="生气"] .custom-nvn-avatar-img, [data-char="天音"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/angry.webp") !important;}
[data-char="皇天音"][data-action="通常"] .custom-nvn-avatar-img, [data-char="天音"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/normal.webp") !important;}
[data-char="皇天音"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="天音"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/puzzled.webp") !important;}
[data-char="皇天音"] .custom-nvn-portrait-full, [data-char="天音"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangtianyin/uniform.webp") !important;}

/* 皇奏龙（飞翔心） */
[data-char="皇奏龙"] {
  --main: #f2c887 !important;
  --sub: #f7dfb9 !important;
  --rgb: 242, 200, 135 !important;
  --motion-color: #dab47a !important;}
[data-char="皇奏龙"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangzoulong/normal.webp") !important;
  cursor: pointer !important;}
[data-char="皇奏龙"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皇奏龙"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皇奏龙"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangzoulong/normal.webp") !important;}
[data-char="皇奏龙"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangzoulong/normal.webp") !important;}
[data-char="皇奏龙"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/huangzoulong/uniform.webp") !important;}

/* 九条玖琉璃（飞翔心） */
[data-char="九条玖琉璃"], [data-char="玖琉璃"] {
  --main: #89b6f1 !important;
  --sub: #bbd5f7 !important;
  --rgb: 137, 182, 241 !important;
  --motion-color: #7ba4d9 !important;}
[data-char="九条玖琉璃"] .custom-nvn-avatar-img, [data-char="玖琉璃"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/jiutiaojiuliuli/normal.webp") !important;
  cursor: pointer !important;}
[data-char="九条玖琉璃"] .custom-nvn-avatar-popover, [data-char="玖琉璃"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="九条玖琉璃"] .custom-nvn-avatar-img::after, [data-char="玖琉璃"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="九条玖琉璃"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="玖琉璃"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/jiutiaojiuliuli/normal.webp") !important;}
[data-char="九条玖琉璃"][data-action="通常"] .custom-nvn-avatar-img, [data-char="玖琉璃"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/jiutiaojiuliuli/normal.webp") !important;}
[data-char="九条玖琉璃"] .custom-nvn-portrait-full, [data-char="玖琉璃"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/jiutiaojiuliuli/uniform.webp") !important;}

/* 水无濑樱子（飞翔心） */
[data-char="水无濑樱子"] {
  --main: #f287a1 !important;
  --sub: #f7b9c8 !important;
  --rgb: 242, 135, 161 !important;
  --motion-color: #da7a91 !important;}
[data-char="水无濑樱子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="水无濑樱子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="水无濑樱子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="水无濑樱子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/normal-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/happy.webp") !important;}
[data-char="水无濑樱子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/surprised.webp") !important;}
[data-char="水无濑樱子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/happy-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/surprised-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/sad-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/angry-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/normal-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/puzzled-blush.webp") !important;}
[data-char="水无濑樱子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/sad.webp") !important;}
[data-char="水无濑樱子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/angry.webp") !important;}
[data-char="水无濑樱子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/normal.webp") !important;}
[data-char="水无濑樱子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/puzzled.webp") !important;}
[data-char="水无濑樱子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/shuiwulaiyingzi/uniform.webp") !important;}

/* 丝茉茉（飞翔心） */
[data-char="丝茉茉"] {
  --main: #91b9e8 !important;
  --sub: #bfd6f2 !important;
  --rgb: 145, 185, 232 !important;
  --motion-color: #82a6d1 !important;}
[data-char="丝茉茉"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/simomo/normal.webp") !important;
  cursor: pointer !important;}
[data-char="丝茉茉"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="丝茉茉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="丝茉茉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/simomo/normal.webp") !important;}
[data-char="丝茉茉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/simomo/normal.webp") !important;}
[data-char="丝茉茉"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/simomo/uniform.webp") !important;}

/* 死神老师（飞翔心） */
[data-char="死神老师"] {
  --main: #89bfe6 !important;
  --sub: #bbdaf0 !important;
  --rgb: 137, 191, 230 !important;
  --motion-color: #7baccf !important;}
[data-char="死神老师"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/sishenlaoshi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="死神老师"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="死神老师"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="死神老师"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/sishenlaoshi/normal.webp") !important;}
[data-char="死神老师"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/sishenlaoshi/normal.webp") !important;}
[data-char="死神老师"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/sishenlaoshi/uniform.webp") !important;}

/* 小雪（飞翔心） */
[data-char="小雪"] {
  --main: #8cb4e7 !important;
  --sub: #bcd4f1 !important;
  --rgb: 140, 180, 231 !important;
  --motion-color: #7ea2d0 !important;}
[data-char="小雪"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xiaoxue/normal.webp") !important;
  cursor: pointer !important;}
[data-char="小雪"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小雪"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小雪"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xiaoxue/normal.webp") !important;}
[data-char="小雪"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xiaoxue/normal.webp") !important;}
[data-char="小雪"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xiaoxue/uniform.webp") !important;}

/* 雪代铃乃（飞翔心） */
[data-char="雪代铃乃"], [data-char="铃乃"] {
  --main: #c1cbd7 !important;
  --sub: #dbe1e8 !important;
  --rgb: 193, 203, 215 !important;
  --motion-color: #aeb7c2 !important;}
[data-char="雪代铃乃"] .custom-nvn-avatar-img, [data-char="铃乃"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="雪代铃乃"] .custom-nvn-avatar-popover, [data-char="铃乃"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="雪代铃乃"] .custom-nvn-avatar-img::after, [data-char="铃乃"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="雪代铃乃"][data-action^="脸红"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/normal-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="高兴"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/happy.webp") !important;}
[data-char="雪代铃乃"][data-action="害羞"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/shy.webp") !important;}
[data-char="雪代铃乃"][data-action="惊讶"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/surprised.webp") !important;}
[data-char="雪代铃乃"][data-action="脸红高兴"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/happy-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="脸红惊讶"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/surprised-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="脸红难过"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/sad-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="脸红生气"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/angry-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="脸红通常"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/normal-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="脸红疑惑"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/puzzled-blush.webp") !important;}
[data-char="雪代铃乃"][data-action="难过"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/sad.webp") !important;}
[data-char="雪代铃乃"][data-action="生气"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/angry.webp") !important;}
[data-char="雪代铃乃"][data-action="通常"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/normal.webp") !important;}
[data-char="雪代铃乃"][data-action="疑惑"] .custom-nvn-avatar-img, [data-char="铃乃"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/puzzled.webp") !important;}
[data-char="雪代铃乃"] .custom-nvn-portrait-full, [data-char="铃乃"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/xuedailingnai/uniform.webp") !important;}

/* 早河惠（飞翔心） */
[data-char="早河惠"] {
  --main: #ac7de4 !important;
  --sub: #cfb4ef !important;
  --rgb: 172, 125, 228 !important;
  --motion-color: #a578db !important;}
[data-char="早河惠"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/zaohehui/normal.webp") !important;
  cursor: pointer !important;}
[data-char="早河惠"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="早河惠"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="早河惠"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/zaohehui/normal.webp") !important;}
[data-char="早河惠"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/zaohehui/normal.webp") !important;}
[data-char="早河惠"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/feixiangxin/zaohehui/uniform.webp") !important;}

/* 冰堂芹香（芬芳） */
[data-char="冰堂芹香"] {
  --main: #e8c592 !important;
  --sub: #f2ddc0 !important;
  --rgb: 232, 197, 146 !important;
  --motion-color: #d1b183 !important;}
[data-char="冰堂芹香"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="冰堂芹香"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="冰堂芹香"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰堂芹香"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/normal-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/happy.webp") !important;}
[data-char="冰堂芹香"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/surprised.webp") !important;}
[data-char="冰堂芹香"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/happy-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/surprised-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/sad-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/angry-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/normal-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/puzzled-blush.webp") !important;}
[data-char="冰堂芹香"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/sad.webp") !important;}
[data-char="冰堂芹香"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/angry.webp") !important;}
[data-char="冰堂芹香"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/normal.webp") !important;}
[data-char="冰堂芹香"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/puzzled.webp") !important;}
[data-char="冰堂芹香"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/bingtangqinxiang/outfit1.webp") !important;}

/* 朝仓千弘（芬芳） */
[data-char="朝仓千弘"] {
  --main: #da8c51 !important;
  --sub: #eabc9a !important;
  --rgb: 218, 140, 81 !important;
  --motion-color: #c47e49 !important;}
[data-char="朝仓千弘"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/normal.webp") !important;
  cursor: pointer !important;}
[data-char="朝仓千弘"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="朝仓千弘"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="朝仓千弘"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/normal-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/happy.webp") !important;}
[data-char="朝仓千弘"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/happy-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/surprised-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/sad-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/angry-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/normal-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/puzzled-blush.webp") !important;}
[data-char="朝仓千弘"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/sad.webp") !important;}
[data-char="朝仓千弘"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/angry.webp") !important;}
[data-char="朝仓千弘"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/normal.webp") !important;}
[data-char="朝仓千弘"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/puzzled.webp") !important;}
[data-char="朝仓千弘"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/chaocangqianhong/uniform.webp") !important;}

/* 菱川琴枝（芬芳） */
[data-char="菱川琴枝"] {
  --main: #da794e !important;
  --sub: #eab198 !important;
  --rgb: 218, 121, 78 !important;
  --motion-color: #d1744b !important;}
[data-char="菱川琴枝"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/lingchuanqinzhi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="菱川琴枝"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="菱川琴枝"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="菱川琴枝"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/lingchuanqinzhi/normal.webp") !important;}
[data-char="菱川琴枝"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/lingchuanqinzhi/normal.webp") !important;}
[data-char="菱川琴枝"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/lingchuanqinzhi/outfit1.webp") !important;}

/* 牧濑皋月（芬芳） */
[data-char="牧濑皋月"] {
  --main: #679cdf !important;
  --sub: #a7c6ec !important;
  --rgb: 103, 156, 223 !important;
  --motion-color: #5d8cc9 !important;}
[data-char="牧濑皋月"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/normal.webp") !important;
  cursor: pointer !important;}
[data-char="牧濑皋月"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="牧濑皋月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="牧濑皋月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/normal-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/happy.webp") !important;}
[data-char="牧濑皋月"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/surprised.webp") !important;}
[data-char="牧濑皋月"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/happy-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/surprised-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/sad-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/angry-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/normal-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/puzzled-blush.webp") !important;}
[data-char="牧濑皋月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/sad.webp") !important;}
[data-char="牧濑皋月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/angry.webp") !important;}
[data-char="牧濑皋月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/normal.webp") !important;}
[data-char="牧濑皋月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/puzzled.webp") !important;}
[data-char="牧濑皋月"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/mulaigaoyue/uniform.webp") !important;}

/* 千原乃亚（芬芳） */
[data-char="千原乃亚"] {
  --main: #bc6ce0 !important;
  --sub: #d8aaed !important;
  --rgb: 188, 108, 224 !important;
  --motion-color: #b468d7 !important;}
[data-char="千原乃亚"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/normal.webp") !important;
  cursor: pointer !important;}
[data-char="千原乃亚"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="千原乃亚"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="千原乃亚"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/normal-blush.webp") !important;}
[data-char="千原乃亚"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/happy.webp") !important;}
[data-char="千原乃亚"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/surprised.webp") !important;}
[data-char="千原乃亚"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/happy-blush.webp") !important;}
[data-char="千原乃亚"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/surprised-blush.webp") !important;}
[data-char="千原乃亚"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/sad-blush.webp") !important;}
[data-char="千原乃亚"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/angry-blush.webp") !important;}
[data-char="千原乃亚"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/normal-blush.webp") !important;}
[data-char="千原乃亚"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/puzzled-blush.webp") !important;}
[data-char="千原乃亚"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/sad.webp") !important;}
[data-char="千原乃亚"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/angry.webp") !important;}
[data-char="千原乃亚"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/normal.webp") !important;}
[data-char="千原乃亚"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/puzzled.webp") !important;}
[data-char="千原乃亚"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/qianyuannaiya/uniform.webp") !important;}

/* 天城咲夜（芬芳） */
[data-char="天城咲夜"] {
  --main: #c092e8 !important;
  --sub: #dac0f2 !important;
  --rgb: 192, 146, 232 !important;
  --motion-color: #ad83d1 !important;}
[data-char="天城咲夜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/normal.webp") !important;
  cursor: pointer !important;}
[data-char="天城咲夜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="天城咲夜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="天城咲夜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/normal-blush.webp") !important;}
[data-char="天城咲夜"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/happy.webp") !important;}
[data-char="天城咲夜"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/surprised.webp") !important;}
[data-char="天城咲夜"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/happy-blush.webp") !important;}
[data-char="天城咲夜"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/surprised-blush.webp") !important;}
[data-char="天城咲夜"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/sad-blush.webp") !important;}
[data-char="天城咲夜"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/angry-blush.webp") !important;}
[data-char="天城咲夜"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/normal-blush.webp") !important;}
[data-char="天城咲夜"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/puzzled-blush.webp") !important;}
[data-char="天城咲夜"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/sad.webp") !important;}
[data-char="天城咲夜"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/angry.webp") !important;}
[data-char="天城咲夜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/normal.webp") !important;}
[data-char="天城咲夜"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/puzzled.webp") !important;}
[data-char="天城咲夜"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tianchengxiaoye/uniform.webp") !important;}

/* 天道八云（芬芳） */
[data-char="天道八云"] {
  --main: #da8f4e !important;
  --sub: #eabe98 !important;
  --rgb: 218, 143, 78 !important;
  --motion-color: #c48146 !important;}
[data-char="天道八云"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tiandaobayun/normal.webp") !important;
  cursor: pointer !important;}
[data-char="天道八云"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="天道八云"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="天道八云"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tiandaobayun/normal.webp") !important;}
[data-char="天道八云"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tiandaobayun/normal.webp") !important;}
[data-char="天道八云"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/tiandaobayun/outfit1.webp") !important;}

/* 夏目朱里（芬芳） */
[data-char="夏目朱里"] {
  --main: #f584b9 !important;
  --sub: #f9b8d6 !important;
  --rgb: 245, 132, 185 !important;
  --motion-color: #dc77a6 !important;}
[data-char="夏目朱里"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/normal.webp") !important;
  cursor: pointer !important;}
[data-char="夏目朱里"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目朱里"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目朱里"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/normal-blush.webp") !important;}
[data-char="夏目朱里"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/happy.webp") !important;}
[data-char="夏目朱里"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/happy-blush.webp") !important;}
[data-char="夏目朱里"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/sad-blush.webp") !important;}
[data-char="夏目朱里"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/angry-blush.webp") !important;}
[data-char="夏目朱里"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/thinking-blush.webp") !important;}
[data-char="夏目朱里"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/normal-blush.webp") !important;}
[data-char="夏目朱里"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/puzzled-blush.webp") !important;}
[data-char="夏目朱里"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/sad.webp") !important;}
[data-char="夏目朱里"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/angry.webp") !important;}
[data-char="夏目朱里"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/thinking.webp") !important;}
[data-char="夏目朱里"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/normal.webp") !important;}
[data-char="夏目朱里"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/puzzled.webp") !important;}
[data-char="夏目朱里"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/xiamuzhuli/uniform.webp") !important;}

/* 一之濑舞织（芬芳） */
[data-char="一之濑舞织"] {
  --main: #a07de3 !important;
  --sub: #c8b4ef !important;
  --rgb: 160, 125, 227 !important;
  --motion-color: #9a78da !important;}
[data-char="一之濑舞织"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/yizhilaiwuzhi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="一之濑舞织"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="一之濑舞织"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="一之濑舞织"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/yizhilaiwuzhi/normal.webp") !important;}
[data-char="一之濑舞织"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/yizhilaiwuzhi/normal.webp") !important;}
[data-char="一之濑舞织"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/fenfang/yizhilaiwuzhi/outfit1.webp") !important;}

/* 安娜塔西亚（画布） */
[data-char="安娜塔西亚"] {
  --main: #bf92e8 !important;
  --sub: #dac0f2 !important;
  --rgb: 191, 146, 232 !important;
  --motion-color: #ac83d1 !important;}
[data-char="安娜塔西亚"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/normal.webp") !important;
  cursor: pointer !important;}
[data-char="安娜塔西亚"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="安娜塔西亚"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="安娜塔西亚"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/normal-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/happy.webp") !important;}
[data-char="安娜塔西亚"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/surprised.webp") !important;}
[data-char="安娜塔西亚"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/happy-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/surprised-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/sad-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/angry-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/normal-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/puzzled-blush.webp") !important;}
[data-char="安娜塔西亚"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/sad.webp") !important;}
[data-char="安娜塔西亚"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/angry.webp") !important;}
[data-char="安娜塔西亚"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/normal.webp") !important;}
[data-char="安娜塔西亚"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/puzzled.webp") !important;}
[data-char="安娜塔西亚"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/annataxiya/uniform.webp") !important;}

/* 凤怜奈（画布） */
[data-char="凤怜奈"] {
  --main: #df696f !important;
  --sub: #eca8ab !important;
  --rgb: 223, 105, 111 !important;
  --motion-color: #d6656b !important;}
[data-char="凤怜奈"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="凤怜奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="凤怜奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="凤怜奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/normal-blush.webp") !important;}
[data-char="凤怜奈"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/happy.webp") !important;}
[data-char="凤怜奈"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/surprised.webp") !important;}
[data-char="凤怜奈"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/happy-blush.webp") !important;}
[data-char="凤怜奈"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/surprised-blush.webp") !important;}
[data-char="凤怜奈"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/sad-blush.webp") !important;}
[data-char="凤怜奈"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/angry-blush.webp") !important;}
[data-char="凤怜奈"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/normal-blush.webp") !important;}
[data-char="凤怜奈"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/puzzled-blush.webp") !important;}
[data-char="凤怜奈"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/sad.webp") !important;}
[data-char="凤怜奈"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/angry.webp") !important;}
[data-char="凤怜奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/normal.webp") !important;}
[data-char="凤怜奈"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/puzzled.webp") !important;}
[data-char="凤怜奈"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengliannai/uniform.webp") !important;}

/* 凤一朗（画布） */
[data-char="凤一朗"] {
  --main: #da804f !important;
  --sub: #eab599 !important;
  --rgb: 218, 128, 79 !important;
  --motion-color: #c47347 !important;}
[data-char="凤一朗"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengyilang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="凤一朗"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="凤一朗"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="凤一朗"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengyilang/normal.webp") !important;}
[data-char="凤一朗"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengyilang/normal.webp") !important;}
[data-char="凤一朗"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/fengyilang/outfit1.webp") !important;}

/* 猫西昭江（画布） */
[data-char="猫西昭江"] {
  --main: #6bcae0 !important;
  --sub: #a9e0ed !important;
  --rgb: 107, 202, 224 !important;
  --motion-color: #60b6ca !important;}
[data-char="猫西昭江"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/maoxizhaojiang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="猫西昭江"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="猫西昭江"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="猫西昭江"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/maoxizhaojiang/normal.webp") !important;}
[data-char="猫西昭江"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/maoxizhaojiang/normal.webp") !important;}
[data-char="猫西昭江"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/maoxizhaojiang/outfit1.webp") !important;}

/* 乾幸（画布） */
[data-char="乾幸"] {
  --main: #e7af8c !important;
  --sub: #f1d1bc !important;
  --rgb: 231, 175, 140 !important;
  --motion-color: #d09e7e !important;}
[data-char="乾幸"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/normal.webp") !important;
  cursor: pointer !important;}
[data-char="乾幸"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="乾幸"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="乾幸"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/normal-blush.webp") !important;}
[data-char="乾幸"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/happy.webp") !important;}
[data-char="乾幸"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/surprised.webp") !important;}
[data-char="乾幸"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/happy-blush.webp") !important;}
[data-char="乾幸"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/surprised-blush.webp") !important;}
[data-char="乾幸"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/sad-blush.webp") !important;}
[data-char="乾幸"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/angry-blush.webp") !important;}
[data-char="乾幸"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/normal-blush.webp") !important;}
[data-char="乾幸"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/puzzled-blush.webp") !important;}
[data-char="乾幸"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/sad.webp") !important;}
[data-char="乾幸"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/angry.webp") !important;}
[data-char="乾幸"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/normal.webp") !important;}
[data-char="乾幸"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/puzzled.webp") !important;}
[data-char="乾幸"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/qianxing/uniform.webp") !important;}

/* 瑞木杷虎（画布） */
[data-char="瑞木杷虎"] {
  --main: #da8650 !important;
  --sub: #eab99a !important;
  --rgb: 218, 134, 80 !important;
  --motion-color: #c47948 !important;}
[data-char="瑞木杷虎"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/ruimupahu/normal.webp") !important;
  cursor: pointer !important;}
[data-char="瑞木杷虎"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="瑞木杷虎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="瑞木杷虎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/ruimupahu/normal.webp") !important;}
[data-char="瑞木杷虎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/ruimupahu/normal.webp") !important;}
[data-char="瑞木杷虎"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/ruimupahu/outfit1.webp") !important;}

/* 深山瑞希（画布） */
[data-char="深山瑞希"] {
  --main: #da7a50 !important;
  --sub: #eab29a !important;
  --rgb: 218, 122, 80 !important;
  --motion-color: #d1754d !important;}
[data-char="深山瑞希"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="深山瑞希"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="深山瑞希"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="深山瑞希"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/normal-blush.webp") !important;}
[data-char="深山瑞希"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/happy.webp") !important;}
[data-char="深山瑞希"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/surprised.webp") !important;}
[data-char="深山瑞希"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/happy-blush.webp") !important;}
[data-char="深山瑞希"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/surprised-blush.webp") !important;}
[data-char="深山瑞希"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/sad-blush.webp") !important;}
[data-char="深山瑞希"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/angry-blush.webp") !important;}
[data-char="深山瑞希"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/normal-blush.webp") !important;}
[data-char="深山瑞希"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/puzzled-blush.webp") !important;}
[data-char="深山瑞希"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/sad.webp") !important;}
[data-char="深山瑞希"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/angry.webp") !important;}
[data-char="深山瑞希"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/normal.webp") !important;}
[data-char="深山瑞希"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/puzzled.webp") !important;}
[data-char="深山瑞希"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shenshanruixi/uniform.webp") !important;}

/* 狮子堂千晴（画布） */
[data-char="狮子堂千晴"] {
  --main: #f5da84 !important;
  --sub: #f9eab8 !important;
  --rgb: 245, 218, 132 !important;
  --motion-color: #dcc477 !important;}
[data-char="狮子堂千晴"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/normal.webp") !important;
  cursor: pointer !important;}
[data-char="狮子堂千晴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="狮子堂千晴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="狮子堂千晴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/normal-blush.webp") !important;}
[data-char="狮子堂千晴"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/surprised.webp") !important;}
[data-char="狮子堂千晴"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/surprised-blush.webp") !important;}
[data-char="狮子堂千晴"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/sad-blush.webp") !important;}
[data-char="狮子堂千晴"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/angry-blush.webp") !important;}
[data-char="狮子堂千晴"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/normal-blush.webp") !important;}
[data-char="狮子堂千晴"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/puzzled-blush.webp") !important;}
[data-char="狮子堂千晴"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/sad.webp") !important;}
[data-char="狮子堂千晴"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/angry.webp") !important;}
[data-char="狮子堂千晴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/normal.webp") !important;}
[data-char="狮子堂千晴"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/puzzled.webp") !important;}
[data-char="狮子堂千晴"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/shizitangqianqing/uniform.webp") !important;}

/* 沃尔夫冈（画布） */
[data-char="沃尔夫冈"] {
  --main: #e1ab73 !important;
  --sub: #eeceae !important;
  --rgb: 225, 171, 115 !important;
  --motion-color: #ca9a68 !important;}
[data-char="沃尔夫冈"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/woerfugang/normal.webp") !important;}
[data-char="沃尔夫冈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="沃尔夫冈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/woerfugang/normal.webp") !important;}
[data-char="沃尔夫冈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/woerfugang/normal.webp") !important;}

/* 乌丸铁子（画布） */
[data-char="乌丸铁子"] {
  --main: #cb93e0 !important;
  --sub: #e1c0ed !important;
  --rgb: 203, 147, 224 !important;
  --motion-color: #b784ca !important;}
[data-char="乌丸铁子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwantiezi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="乌丸铁子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="乌丸铁子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="乌丸铁子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwantiezi/normal.webp") !important;}
[data-char="乌丸铁子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwantiezi/normal.webp") !important;}
[data-char="乌丸铁子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwantiezi/outfit1.webp") !important;}

/* 乌丸紫月（画布） */
[data-char="乌丸紫月"] {
  --main: #c496e0 !important;
  --sub: #ddc2ed !important;
  --rgb: 196, 150, 224 !important;
  --motion-color: #b087ca !important;}
[data-char="乌丸紫月"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/normal.webp") !important;
  cursor: pointer !important;}
[data-char="乌丸紫月"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="乌丸紫月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="乌丸紫月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/normal-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/happy.webp") !important;}
[data-char="乌丸紫月"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/surprised.webp") !important;}
[data-char="乌丸紫月"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/happy-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/surprised-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/sad-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/angry-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/normal-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/puzzled-blush.webp") !important;}
[data-char="乌丸紫月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/sad.webp") !important;}
[data-char="乌丸紫月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/angry.webp") !important;}
[data-char="乌丸紫月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/normal.webp") !important;}
[data-char="乌丸紫月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/puzzled.webp") !important;}
[data-char="乌丸紫月"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/wuwanziyue/uniform.webp") !important;}

/* 佐藤洋（画布） */
[data-char="佐藤洋"] {
  --main: #de9a61 !important;
  --sub: #ecc4a3 !important;
  --rgb: 222, 154, 97 !important;
  --motion-color: #c88b57 !important;}
[data-char="佐藤洋"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/zuotengyang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="佐藤洋"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="佐藤洋"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="佐藤洋"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/zuotengyang/normal.webp") !important;}
[data-char="佐藤洋"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/zuotengyang/normal.webp") !important;}
[data-char="佐藤洋"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huabu/zuotengyang/outfit1.webp") !important;}

/* 八十岛壹与（近月） */
[data-char="八十岛壹与"] {
  --main: #91b9e8 !important;
  --sub: #bfd6f2 !important;
  --rgb: 145, 185, 232 !important;
  --motion-color: #82a6d1 !important;}
[data-char="八十岛壹与"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/bashidaoyiyu/normal.webp") !important;}
[data-char="八十岛壹与"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="八十岛壹与"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/bashidaoyiyu/normal.webp") !important;}
[data-char="八十岛壹与"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/bashidaoyiyu/normal.webp") !important;}

/* 布琉艾特（近月） */
[data-char="布琉艾特"] {
  --main: #dd905f !important;
  --sub: #ebbfa2 !important;
  --rgb: 221, 144, 95 !important;
  --motion-color: #c78256 !important;}
[data-char="布琉艾特"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/normal.webp") !important;
  cursor: pointer !important;}
[data-char="布琉艾特"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="布琉艾特"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="布琉艾特"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/normal-blush.webp") !important;}
[data-char="布琉艾特"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/smirk.webp") !important;}
[data-char="布琉艾特"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/happy.webp") !important;}
[data-char="布琉艾特"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/surprised.webp") !important;}
[data-char="布琉艾特"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/smirk-blush.webp") !important;}
[data-char="布琉艾特"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/happy-blush.webp") !important;}
[data-char="布琉艾特"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/surprised-blush.webp") !important;}
[data-char="布琉艾特"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/sad-blush.webp") !important;}
[data-char="布琉艾特"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/angry-blush.webp") !important;}
[data-char="布琉艾特"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/normal-blush.webp") !important;}
[data-char="布琉艾特"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/puzzled-blush.webp") !important;}
[data-char="布琉艾特"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/sad.webp") !important;}
[data-char="布琉艾特"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/angry.webp") !important;}
[data-char="布琉艾特"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/normal.webp") !important;}
[data-char="布琉艾特"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/puzzled.webp") !important;}
[data-char="布琉艾特"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/buliuaite-nikelaite-pula-93f2/uniform.webp") !important;}

/* 枞山红叶（近月） */
[data-char="枞山红叶"] {
  --main: #dda35d !important;
  --sub: #ebcaa1 !important;
  --rgb: 221, 163, 93 !important;
  --motion-color: #c79354 !important;}
[data-char="枞山红叶"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/congshanhongye/normal.webp") !important;
  cursor: pointer !important;}
[data-char="枞山红叶"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="枞山红叶"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="枞山红叶"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/congshanhongye/normal.webp") !important;}
[data-char="枞山红叶"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/congshanhongye/normal.webp") !important;}
[data-char="枞山红叶"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/congshanhongye/full.webp") !important;}

/* 大藏安东尼（近月） */
[data-char="大藏安东尼"] {
  --main: #8fb2e7 !important;
  --sub: #bed2f1 !important;
  --rgb: 143, 178, 231 !important;
  --motion-color: #81a0d0 !important;}
[data-char="大藏安东尼"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangandongni/normal.webp") !important;}
[data-char="大藏安东尼"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏安东尼"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangandongni/normal.webp") !important;}
[data-char="大藏安东尼"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangandongni/normal.webp") !important;}

/* 大藏骏我（近月） */
[data-char="大藏骏我"] {
  --main: #92c2e8 !important;
  --sub: #c0dcf2 !important;
  --rgb: 146, 194, 232 !important;
  --motion-color: #83afd1 !important;}
[data-char="大藏骏我"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangjunwo/normal.webp") !important;}
[data-char="大藏骏我"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏骏我"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangjunwo/normal.webp") !important;}
[data-char="大藏骏我"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangjunwo/normal.webp") !important;}

/* 大藏里想奈（近月） */
[data-char="大藏里想奈"] {
  --main: #997ae3 !important;
  --sub: #c4b2ef !important;
  --rgb: 153, 122, 227 !important;
  --motion-color: #9375da !important;}
[data-char="大藏里想奈"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="大藏里想奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="大藏里想奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏里想奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/normal-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/smirk.webp") !important;}
[data-char="大藏里想奈"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/happy.webp") !important;}
[data-char="大藏里想奈"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/surprised.webp") !important;}
[data-char="大藏里想奈"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/smirk-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/happy-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/27/98989227d1bf15d11415c14031faf9c816a53624ffce4be5.png") !important;}
[data-char="大藏里想奈"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/surprised-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/sad-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/normal-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/puzzled-blush.webp") !important;}
[data-char="大藏里想奈"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/sad.webp") !important;}
[data-char="大藏里想奈"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://origin.picgo.net/2026/11/27/bc6177f421bce9e8bb8717a23be067cffdb96b9ec18db215.png") !important;}
[data-char="大藏里想奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/normal.webp") !important;}
[data-char="大藏里想奈"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/puzzled.webp") !important;}
[data-char="大藏里想奈"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazanglixiangnai/uniform.webp") !important;}

/* 大藏衣远（近月） */
[data-char="大藏衣远"] {
  --main: #9a7de3 !important;
  --sub: #c4b4ef !important;
  --rgb: 154, 125, 227 !important;
  --motion-color: #9478da !important;}
[data-char="大藏衣远"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangyiyuan/normal.webp") !important;
  cursor: pointer !important;}
[data-char="大藏衣远"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="大藏衣远"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大藏衣远"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangyiyuan/normal.webp") !important;}
[data-char="大藏衣远"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangyiyuan/normal.webp") !important;}
[data-char="大藏衣远"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/dazangyiyuan/full.webp") !important;}

/* 迪特琳德（近月） */
[data-char="迪特琳德"] {
  --main: #c38ede !important;
  --sub: #dcbdec !important;
  --rgb: 195, 142, 222 !important;
  --motion-color: #b080c8 !important;}
[data-char="迪特琳德"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/ditelinde-ciweigete/normal.webp") !important;
  cursor: pointer !important;}
[data-char="迪特琳德"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="迪特琳德"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="迪特琳德"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/ditelinde-ciweigete/normal.webp") !important;}
[data-char="迪特琳德"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/ditelinde-ciweigete/normal.webp") !important;}
[data-char="迪特琳德"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/ditelinde-ciweigete/full.webp") !important;}

/* 花之宫瑞穗（近月） */
[data-char="花之宫瑞穗"] {
  --main: #e0b06e !important;
  --sub: #edd1ab !important;
  --rgb: 224, 176, 110 !important;
  --motion-color: #ca9e63 !important;}
[data-char="花之宫瑞穗"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/normal.webp") !important;
  cursor: pointer !important;}
[data-char="花之宫瑞穗"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="花之宫瑞穗"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="花之宫瑞穗"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/normal-blush.webp") !important;}
[data-char="花之宫瑞穗"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/happy.webp") !important;}
[data-char="花之宫瑞穗"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/surprised.webp") !important;}
[data-char="花之宫瑞穗"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/happy-blush.webp") !important;}
[data-char="花之宫瑞穗"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/sad-blush.webp") !important;}
[data-char="花之宫瑞穗"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/angry-blush.webp") !important;}
[data-char="花之宫瑞穗"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/normal-blush.webp") !important;}
[data-char="花之宫瑞穗"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/puzzled-blush.webp") !important;}
[data-char="花之宫瑞穗"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/sad.webp") !important;}
[data-char="花之宫瑞穗"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/angry.webp") !important;}
[data-char="花之宫瑞穗"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/normal.webp") !important;}
[data-char="花之宫瑞穗"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/puzzled.webp") !important;}
[data-char="花之宫瑞穗"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huazhigongruisui/outfit1.webp") !important;}

/* 华花（近月） */
[data-char="华花"] {
  --main: #56db9a !important;
  --sub: #9deac4 !important;
  --rgb: 86, 219, 154 !important;
  --motion-color: #4dc58b !important;}
[data-char="华花"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huahua/normal.webp") !important;
  cursor: pointer !important;}
[data-char="华花"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="华花"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="华花"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huahua/normal.webp") !important;}
[data-char="华花"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huahua/normal.webp") !important;}
[data-char="华花"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/huahua/full.webp") !important;}

/* 莉莉安奴（近月） */
[data-char="莉莉安奴"] {
  --main: #f387a3 !important;
  --sub: #f8b9ca !important;
  --rgb: 243, 135, 163 !important;
  --motion-color: #db7a93 !important;}
[data-char="莉莉安奴"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liliannu-sailiya-lagelan-b685/normal.webp") !important;
  cursor: pointer !important;}
[data-char="莉莉安奴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="莉莉安奴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="莉莉安奴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liliannu-sailiya-lagelan-b685/normal.webp") !important;}
[data-char="莉莉安奴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liliannu-sailiya-lagelan-b685/normal.webp") !important;}
[data-char="莉莉安奴"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liliannu-sailiya-lagelan-b685/full.webp") !important;}

/* 柳之濑凑（近月） */
[data-char="柳之濑凑"] {
  --main: #f2879c !important;
  --sub: #f7b9c6 !important;
  --rgb: 242, 135, 156 !important;
  --motion-color: #da7a8c !important;}
[data-char="柳之濑凑"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/normal.webp") !important;
  cursor: pointer !important;}
[data-char="柳之濑凑"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="柳之濑凑"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="柳之濑凑"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/normal-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/happy.webp") !important;}
[data-char="柳之濑凑"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/surprised.webp") !important;}
[data-char="柳之濑凑"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/happy-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/surprised-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/sad-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/angry-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/normal-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/puzzled-blush.webp") !important;}
[data-char="柳之濑凑"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/sad.webp") !important;}
[data-char="柳之濑凑"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/angry.webp") !important;}
[data-char="柳之濑凑"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/normal.webp") !important;}
[data-char="柳之濑凑"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/puzzled.webp") !important;}
[data-char="柳之濑凑"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/liuzhilaicou/uniform.webp") !important;}

/* 梅丽尔（近月） */
[data-char="梅丽尔"] {
  --main: #e8c692 !important;
  --sub: #f2dec0 !important;
  --rgb: 232, 198, 146 !important;
  --motion-color: #d1b283 !important;}
[data-char="梅丽尔"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="梅丽尔"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="梅丽尔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="梅丽尔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/normal-blush.webp") !important;}
[data-char="梅丽尔"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/happy.webp") !important;}
[data-char="梅丽尔"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/surprised.webp") !important;}
[data-char="梅丽尔"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/happy-blush.webp") !important;}
[data-char="梅丽尔"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/surprised-blush.webp") !important;}
[data-char="梅丽尔"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/sad-blush.webp") !important;}
[data-char="梅丽尔"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/angry-blush.webp") !important;}
[data-char="梅丽尔"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/normal-blush.webp") !important;}
[data-char="梅丽尔"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/puzzled-blush.webp") !important;}
[data-char="梅丽尔"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/sad.webp") !important;}
[data-char="梅丽尔"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/angry.webp") !important;}
[data-char="梅丽尔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/normal.webp") !important;}
[data-char="梅丽尔"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/puzzled.webp") !important;}
[data-char="梅丽尔"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/meilier-linqi/uniform.webp") !important;}

/* 名波七爱（近月） */
[data-char="名波七爱"] {
  --main: #e8cb92 !important;
  --sub: #f2e1c0 !important;
  --rgb: 232, 203, 146 !important;
  --motion-color: #d1b783 !important;}
[data-char="名波七爱"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/mingboqiai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="名波七爱"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="名波七爱"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="名波七爱"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/mingboqiai/normal.webp") !important;}
[data-char="名波七爱"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/mingboqiai/normal.webp") !important;}
[data-char="名波七爱"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/mingboqiai/full.webp") !important;}

/* 让·皮埃尔（近月） */
[data-char="让·皮埃尔"] {
  --main: #8ebde7 !important;
  --sub: #bdd9f1 !important;
  --rgb: 142, 189, 231 !important;
  --motion-color: #80aad0 !important;}
[data-char="让·皮埃尔"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/rang-piaier-shidanli/normal.webp") !important;}
[data-char="让·皮埃尔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="让·皮埃尔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/rang-piaier-shidanli/normal.webp") !important;}
[data-char="让·皮埃尔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/rang-piaier-shidanli/normal.webp") !important;}

/* 萨莎（近月） */
[data-char="萨莎"] {
  --main: #ad92e8 !important;
  --sub: #cfc0f2 !important;
  --rgb: 173, 146, 232 !important;
  --motion-color: #9c83d1 !important;}
[data-char="萨莎"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/sasha-bikai-yaneikan/normal.webp") !important;
  cursor: pointer !important;}
[data-char="萨莎"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="萨莎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="萨莎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/sasha-bikai-yaneikan/normal.webp") !important;}
[data-char="萨莎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/sasha-bikai-yaneikan/normal.webp") !important;}
[data-char="萨莎"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/sasha-bikai-yaneikan/full.webp") !important;}

/* 山吹八千代（近月） */
[data-char="山吹八千代"] {
  --main: #da7f4e !important;
  --sub: #eab598 !important;
  --rgb: 218, 127, 78 !important;
  --motion-color: #c47246 !important;}
[data-char="山吹八千代"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shanchuibaqiandai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="山吹八千代"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="山吹八千代"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="山吹八千代"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shanchuibaqiandai/normal.webp") !important;}
[data-char="山吹八千代"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shanchuibaqiandai/normal.webp") !important;}
[data-char="山吹八千代"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shanchuibaqiandai/full.webp") !important;}

/* 杉村北斗（近月） */
[data-char="杉村北斗"] {
  --main: #92e8ab !important;
  --sub: #c0f2ce !important;
  --rgb: 146, 232, 171 !important;
  --motion-color: #83d19a !important;}
[data-char="杉村北斗"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shancunbeidou/normal.webp") !important;
  cursor: pointer !important;}
[data-char="杉村北斗"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="杉村北斗"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="杉村北斗"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shancunbeidou/normal.webp") !important;}
[data-char="杉村北斗"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shancunbeidou/normal.webp") !important;}
[data-char="杉村北斗"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/shancunbeidou/full.webp") !important;}

/* 瓦莲莉娅（近月） */
[data-char="瓦莲莉娅"] {
  --main: #c2d6cf !important;
  --sub: #dce7e3 !important;
  --rgb: 194, 214, 207 !important;
  --motion-color: #afc1ba !important;}
[data-char="瓦莲莉娅"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/walianliya-telianqiewein-94de/normal.webp") !important;
  cursor: pointer !important;}
[data-char="瓦莲莉娅"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="瓦莲莉娅"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="瓦莲莉娅"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/walianliya-telianqiewein-94de/normal.webp") !important;}
[data-char="瓦莲莉娅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/walianliya-telianqiewein-94de/normal.webp") !important;}
[data-char="瓦莲莉娅"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/walianliya-telianqiewein-94de/full.webp") !important;}

/* 小仓朝日（近月） */
[data-char="小仓朝日"] {
  --main: #a278e2 !important;
  --sub: #c9b1ee !important;
  --rgb: 162, 120, 226 !important;
  --motion-color: #9c73d9 !important;}
[data-char="小仓朝日"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/normal.webp") !important;
  cursor: pointer !important;}
[data-char="小仓朝日"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小仓朝日"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小仓朝日"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/normal-blush.webp") !important;}
[data-char="小仓朝日"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/happy.webp") !important;}
[data-char="小仓朝日"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/surprised.webp") !important;}
[data-char="小仓朝日"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/happy-blush.webp") !important;}
[data-char="小仓朝日"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/surprised-blush.webp") !important;}
[data-char="小仓朝日"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/sad-blush.webp") !important;}
[data-char="小仓朝日"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/angry-blush.webp") !important;}
[data-char="小仓朝日"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/normal-blush.webp") !important;}
[data-char="小仓朝日"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/puzzled-blush.webp") !important;}
[data-char="小仓朝日"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/sad.webp") !important;}
[data-char="小仓朝日"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/angry.webp") !important;}
[data-char="小仓朝日"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/normal.webp") !important;}
[data-char="小仓朝日"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/puzzled.webp") !important;}
[data-char="小仓朝日"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/xiaocangzhaori/uniform.webp") !important;}

/* 樱小路露娜（近月） */
[data-char="樱小路露娜"] {
  --main: #b392e8 !important;
  --sub: #d3c0f2 !important;
  --rgb: 179, 146, 232 !important;
  --motion-color: #a183d1 !important;}
[data-char="樱小路露娜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/normal.webp") !important;
  cursor: pointer !important;}
[data-char="樱小路露娜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="樱小路露娜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="樱小路露娜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/normal-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/smug.webp") !important;}
[data-char="樱小路露娜"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/smirk.webp") !important;}
[data-char="樱小路露娜"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/happy.webp") !important;}
[data-char="樱小路露娜"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/surprised.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/smug-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/smirk-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/happy-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/surprised-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/sad-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/angry-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/normal-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/puzzled-blush.webp") !important;}
[data-char="樱小路露娜"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/sad.webp") !important;}
[data-char="樱小路露娜"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/angry.webp") !important;}
[data-char="樱小路露娜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/normal.webp") !important;}
[data-char="樱小路露娜"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/puzzled.webp") !important;}
[data-char="樱小路露娜"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/yingxiaoluluna/uniform.webp") !important;}

/* 尤希尔（近月） */
[data-char="尤希尔"] {
  --main: #f2db87 !important;
  --sub: #f7eab9 !important;
  --rgb: 242, 219, 135 !important;
  --motion-color: #dac57a !important;}
[data-char="尤希尔"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/normal.webp") !important;
  cursor: pointer !important;}
[data-char="尤希尔"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="尤希尔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="尤希尔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/normal-blush.webp") !important;}
[data-char="尤希尔"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/happy.webp") !important;}
[data-char="尤希尔"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/surprised.webp") !important;}
[data-char="尤希尔"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/happy-blush.webp") !important;}
[data-char="尤希尔"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/surprised-blush.webp") !important;}
[data-char="尤希尔"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/sad-blush.webp") !important;}
[data-char="尤希尔"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/angry-blush.webp") !important;}
[data-char="尤希尔"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/normal-blush.webp") !important;}
[data-char="尤希尔"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/puzzled-blush.webp") !important;}
[data-char="尤希尔"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/sad.webp") !important;}
[data-char="尤希尔"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/angry.webp") !important;}
[data-char="尤希尔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/normal.webp") !important;}
[data-char="尤希尔"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/puzzled.webp") !important;}
[data-char="尤希尔"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jinyue/youxier-fululu-rangmeier/uniform.webp") !important;}

/* 不知火怜（轮舞曲） */
[data-char="不知火怜"] {
  --main: #5a8fdc !important;
  --sub: #9fbeeb !important;
  --rgb: 90, 143, 220 !important;
  --motion-color: #5689d3 !important;}
[data-char="不知火怜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/buzhihuolian/normal.webp") !important;}
[data-char="不知火怜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="不知火怜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/buzhihuolian/normal.webp") !important;}
[data-char="不知火怜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/buzhihuolian/normal.webp") !important;}

/* 江利原美月（轮舞曲） */
[data-char="江利原美月"] {
  --main: #b890df !important;
  --sub: #d6bfec !important;
  --rgb: 184, 144, 223 !important;
  --motion-color: #a682c9 !important;}
[data-char="江利原美月"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/normal.webp") !important;
  cursor: pointer !important;}
[data-char="江利原美月"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="江利原美月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="江利原美月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/normal-blush.webp") !important;}
[data-char="江利原美月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/happy.webp") !important;}
[data-char="江利原美月"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/happy-blush.webp") !important;}
[data-char="江利原美月"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/sad-blush.webp") !important;}
[data-char="江利原美月"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/angry-blush.webp") !important;}
[data-char="江利原美月"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/normal-blush.webp") !important;}
[data-char="江利原美月"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/puzzled-blush.webp") !important;}
[data-char="江利原美月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/sad.webp") !important;}
[data-char="江利原美月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/angry.webp") !important;}
[data-char="江利原美月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/normal.webp") !important;}
[data-char="江利原美月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/puzzled.webp") !important;}
[data-char="江利原美月"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiangliyuanmeiyue/uniform.webp") !important;}

/* 堺浩一（轮舞曲） */
[data-char="堺浩一"] {
  --main: #deac65 !important;
  --sub: #eccfa6 !important;
  --rgb: 222, 172, 101 !important;
  --motion-color: #c89b5b !important;}
[data-char="堺浩一"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiehaoyi/normal.webp") !important;}
[data-char="堺浩一"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="堺浩一"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiehaoyi/normal.webp") !important;}
[data-char="堺浩一"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/jiehaoyi/normal.webp") !important;}

/* 门胁樱（轮舞曲） */
[data-char="门胁樱"] {
  --main: #f2cd87 !important;
  --sub: #f7e2b9 !important;
  --rgb: 242, 205, 135 !important;
  --motion-color: #dab87a !important;}
[data-char="门胁樱"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/normal.webp") !important;
  cursor: pointer !important;}
[data-char="门胁樱"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="门胁樱"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="门胁樱"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/normal-blush.webp") !important;}
[data-char="门胁樱"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/happy.webp") !important;}
[data-char="门胁樱"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/surprised.webp") !important;}
[data-char="门胁樱"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/happy-blush.webp") !important;}
[data-char="门胁樱"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/surprised-blush.webp") !important;}
[data-char="门胁樱"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/sad-blush.webp") !important;}
[data-char="门胁樱"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/angry-blush.webp") !important;}
[data-char="门胁樱"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/normal-blush.webp") !important;}
[data-char="门胁樱"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/puzzled-blush.webp") !important;}
[data-char="门胁樱"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/sad.webp") !important;}
[data-char="门胁樱"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/angry.webp") !important;}
[data-char="门胁樱"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/normal.webp") !important;}
[data-char="门胁樱"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/puzzled.webp") !important;}
[data-char="门胁樱"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/menxieying/uniform.webp") !important;}

/* 双叶沙那子（轮舞曲） */
[data-char="双叶沙那子"] {
  --main: #e2b378 !important;
  --sub: #eed3b1 !important;
  --rgb: 226, 179, 120 !important;
  --motion-color: #cba16c !important;}
[data-char="双叶沙那子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/shuangyeshanazi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="双叶沙那子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="双叶沙那子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="双叶沙那子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/shuangyeshanazi/normal.webp") !important;}
[data-char="双叶沙那子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/shuangyeshanazi/normal.webp") !important;}
[data-char="双叶沙那子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/shuangyeshanazi/outfit1.webp") !important;}

/* 天司凉香（轮舞曲） */
[data-char="天司凉香"] {
  --main: #ad77e2 !important;
  --sub: #cfb0ee !important;
  --rgb: 173, 119, 226 !important;
  --motion-color: #a672d9 !important;}
[data-char="天司凉香"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="天司凉香"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="天司凉香"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="天司凉香"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/normal-blush.webp") !important;}
[data-char="天司凉香"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/happy.webp") !important;}
[data-char="天司凉香"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/surprised.webp") !important;}
[data-char="天司凉香"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/happy-blush.webp") !important;}
[data-char="天司凉香"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/surprised-blush.webp") !important;}
[data-char="天司凉香"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/sad-blush.webp") !important;}
[data-char="天司凉香"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/angry-blush.webp") !important;}
[data-char="天司凉香"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/normal-blush.webp") !important;}
[data-char="天司凉香"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/puzzled-blush.webp") !important;}
[data-char="天司凉香"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/sad.webp") !important;}
[data-char="天司凉香"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/angry.webp") !important;}
[data-char="天司凉香"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/normal.webp") !important;}
[data-char="天司凉香"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/puzzled.webp") !important;}
[data-char="天司凉香"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/tiansiliangxiang/uniform.webp") !important;}

/* 小峰真奈美（轮舞曲） */
[data-char="小峰真奈美"] {
  --main: #f287af !important;
  --sub: #f7b9d1 !important;
  --rgb: 242, 135, 175 !important;
  --motion-color: #da7a9e !important;}
[data-char="小峰真奈美"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/normal.webp") !important;
  cursor: pointer !important;}
[data-char="小峰真奈美"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小峰真奈美"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小峰真奈美"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/normal-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/happy.webp") !important;}
[data-char="小峰真奈美"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/surprised.webp") !important;}
[data-char="小峰真奈美"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/happy-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/surprised-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/sad-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/angry-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/normal-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/puzzled-blush.webp") !important;}
[data-char="小峰真奈美"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/sad.webp") !important;}
[data-char="小峰真奈美"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/angry.webp") !important;}
[data-char="小峰真奈美"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/normal.webp") !important;}
[data-char="小峰真奈美"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/puzzled.webp") !important;}
[data-char="小峰真奈美"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaofengzhennaimei/uniform.webp") !important;}

/* 小石川珠音（轮舞曲） */
[data-char="小石川珠音"] {
  --main: #e8cd92 !important;
  --sub: #f2e2c0 !important;
  --rgb: 232, 205, 146 !important;
  --motion-color: #d1b883 !important;}
[data-char="小石川珠音"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaoshichuanzhuyin/normal.webp") !important;
  cursor: pointer !important;}
[data-char="小石川珠音"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="小石川珠音"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="小石川珠音"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaoshichuanzhuyin/normal.webp") !important;}
[data-char="小石川珠音"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaoshichuanzhuyin/normal.webp") !important;}
[data-char="小石川珠音"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xiaoshichuanzhuyin/outfit1.webp") !important;}

/* 新垣若菜（轮舞曲） */
[data-char="新垣若菜"] {
  --main: #f5cb84 !important;
  --sub: #f9e1b8 !important;
  --rgb: 245, 203, 132 !important;
  --motion-color: #dcb777 !important;}
[data-char="新垣若菜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="新垣若菜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="新垣若菜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新垣若菜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/normal-blush.webp") !important;}
[data-char="新垣若菜"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/smug.webp") !important;}
[data-char="新垣若菜"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/happy.webp") !important;}
[data-char="新垣若菜"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/smug-blush.webp") !important;}
[data-char="新垣若菜"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/happy-blush.webp") !important;}
[data-char="新垣若菜"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/sad-blush.webp") !important;}
[data-char="新垣若菜"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/angry-blush.webp") !important;}
[data-char="新垣若菜"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/normal-blush.webp") !important;}
[data-char="新垣若菜"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/puzzled-blush.webp") !important;}
[data-char="新垣若菜"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/sad.webp") !important;}
[data-char="新垣若菜"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/angry.webp") !important;}
[data-char="新垣若菜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/normal.webp") !important;}
[data-char="新垣若菜"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/puzzled.webp") !important;}
[data-char="新垣若菜"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/xinyuanruocai/uniform.webp") !important;}

/* 真原葵（轮舞曲） */
[data-char="真原葵"] {
  --main: #da8b4e !important;
  --sub: #eabc98 !important;
  --rgb: 218, 139, 78 !important;
  --motion-color: #c47d46 !important;}
[data-char="真原葵"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/normal.webp") !important;
  cursor: pointer !important;}
[data-char="真原葵"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="真原葵"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="真原葵"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/normal-blush.webp") !important;}
[data-char="真原葵"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/happy.webp") !important;}
[data-char="真原葵"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/surprised.webp") !important;}
[data-char="真原葵"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/happy-blush.webp") !important;}
[data-char="真原葵"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/surprised-blush.webp") !important;}
[data-char="真原葵"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/sad-blush.webp") !important;}
[data-char="真原葵"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/angry-blush.webp") !important;}
[data-char="真原葵"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/normal-blush.webp") !important;}
[data-char="真原葵"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/puzzled-blush.webp") !important;}
[data-char="真原葵"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/sad.webp") !important;}
[data-char="真原葵"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/angry.webp") !important;}
[data-char="真原葵"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/normal.webp") !important;}
[data-char="真原葵"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/puzzled.webp") !important;}
[data-char="真原葵"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuankui/outfit1.webp") !important;}

/* 真原祐里（轮舞曲） */
[data-char="真原祐里"] {
  --main: #f2d087 !important;
  --sub: #f7e4b9 !important;
  --rgb: 242, 208, 135 !important;
  --motion-color: #dabb7a !important;}
[data-char="真原祐里"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/normal.webp") !important;
  cursor: pointer !important;}
[data-char="真原祐里"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="真原祐里"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="真原祐里"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/normal-blush.webp") !important;}
[data-char="真原祐里"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/happy.webp") !important;}
[data-char="真原祐里"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/surprised.webp") !important;}
[data-char="真原祐里"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/happy-blush.webp") !important;}
[data-char="真原祐里"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/surprised-blush.webp") !important;}
[data-char="真原祐里"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/sad-blush.webp") !important;}
[data-char="真原祐里"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/angry-blush.webp") !important;}
[data-char="真原祐里"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/normal-blush.webp") !important;}
[data-char="真原祐里"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/puzzled-blush.webp") !important;}
[data-char="真原祐里"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/sad.webp") !important;}
[data-char="真原祐里"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/angry.webp") !important;}
[data-char="真原祐里"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/normal.webp") !important;}
[data-char="真原祐里"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/puzzled.webp") !important;}
[data-char="真原祐里"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zhenyuanyouli/uniform.webp") !important;}

/* 佐佐原亮子（轮舞曲） */
[data-char="佐佐原亮子"] {
  --main: #bb92e8 !important;
  --sub: #d8c0f2 !important;
  --rgb: 187, 146, 232 !important;
  --motion-color: #a883d1 !important;}
[data-char="佐佐原亮子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zuozuoyuanliangzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="佐佐原亮子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="佐佐原亮子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="佐佐原亮子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zuozuoyuanliangzi/normal.webp") !important;}
[data-char="佐佐原亮子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zuozuoyuanliangzi/normal.webp") !important;}
[data-char="佐佐原亮子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/lunwuqu/zuozuoyuanliangzi/outfit1.webp") !important;}

/* 不二卫哉（柠水） */
[data-char="不二卫哉"] {
  --main: #f5e484 !important;
  --sub: #f9efb8 !important;
  --rgb: 245, 228, 132 !important;
  --motion-color: #dccd77 !important;}
[data-char="不二卫哉"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/buerweizai/normal.webp") !important;}
[data-char="不二卫哉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="不二卫哉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/buerweizai/normal.webp") !important;}
[data-char="不二卫哉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/buerweizai/normal.webp") !important;}

/* 茶园那优花（柠水） */
[data-char="茶园那优花"] {
  --main: #b392e8 !important;
  --sub: #d3c0f2 !important;
  --rgb: 179, 146, 232 !important;
  --motion-color: #a183d1 !important;}
[data-char="茶园那优花"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/normal.webp") !important;
  cursor: pointer !important;}
[data-char="茶园那优花"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="茶园那优花"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="茶园那优花"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/normal-blush.webp") !important;}
[data-char="茶园那优花"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/smug.webp") !important;}
[data-char="茶园那优花"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/smirk.webp") !important;}
[data-char="茶园那优花"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/happy.webp") !important;}
[data-char="茶园那优花"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/surprised.webp") !important;}
[data-char="茶园那优花"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/smirk-blush.webp") !important;}
[data-char="茶园那优花"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/happy-blush.webp") !important;}
[data-char="茶园那优花"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/surprised-blush.webp") !important;}
[data-char="茶园那优花"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/angry-blush.webp") !important;}
[data-char="茶园那优花"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/normal-blush.webp") !important;}
[data-char="茶园那优花"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/puzzled-blush.webp") !important;}
[data-char="茶园那优花"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/sad.webp") !important;}
[data-char="茶园那优花"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/angry.webp") !important;}
[data-char="茶园那优花"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/normal.webp") !important;}
[data-char="茶园那优花"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/puzzled.webp") !important;}
[data-char="茶园那优花"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/chayuannayouhua/outfit1.webp") !important;}

/* 岛越月望（柠水） */
[data-char="岛越月望"] {
  --main: #f2d787 !important;
  --sub: #f7e8b9 !important;
  --rgb: 242, 215, 135 !important;
  --motion-color: #dac27a !important;}
[data-char="岛越月望"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="岛越月望"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="岛越月望"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="岛越月望"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/normal-blush.webp") !important;}
[data-char="岛越月望"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/smug.webp") !important;}
[data-char="岛越月望"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/smirk.webp") !important;}
[data-char="岛越月望"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/happy.webp") !important;}
[data-char="岛越月望"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/surprised.webp") !important;}
[data-char="岛越月望"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/smug-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/smirk-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/happy-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/surprised-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/sad-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/angry-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/normal-blush.webp") !important;}
[data-char="岛越月望"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/puzzled-blush.webp") !important;}
[data-char="岛越月望"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/sad.webp") !important;}
[data-char="岛越月望"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/angry.webp") !important;}
[data-char="岛越月望"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/normal.webp") !important;}
[data-char="岛越月望"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/puzzled.webp") !important;}
[data-char="岛越月望"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/daoyueyuewang/uniform.webp") !important;}

/* 二见原莉莉子（柠水） */
[data-char="二见原莉莉子"] {
  --main: #e892a2 !important;
  --sub: #f2c0c9 !important;
  --rgb: 232, 146, 162 !important;
  --motion-color: #d18392 !important;}
[data-char="二见原莉莉子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="二见原莉莉子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="二见原莉莉子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="二见原莉莉子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/normal-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/smug.webp") !important;}
[data-char="二见原莉莉子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/smirk.webp") !important;}
[data-char="二见原莉莉子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/happy.webp") !important;}
[data-char="二见原莉莉子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/surprised.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/smug-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/smirk-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/happy-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/surprised-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/sad-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/angry-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/thinking-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/normal-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/puzzled-blush.webp") !important;}
[data-char="二见原莉莉子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/sad.webp") !important;}
[data-char="二见原莉莉子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/angry.webp") !important;}
[data-char="二见原莉莉子"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/thinking.webp") !important;}
[data-char="二见原莉莉子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/normal.webp") !important;}
[data-char="二见原莉莉子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/puzzled.webp") !important;}
[data-char="二见原莉莉子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/erjianyuanlilizi/uniform.webp") !important;}

/* 砾川杰（柠水） */
[data-char="砾川杰"] {
  --main: #dfa792 !important;
  --sub: #ecccc0 !important;
  --rgb: 223, 167, 146 !important;
  --motion-color: #c99683 !important;}
[data-char="砾川杰"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanjie/normal.webp") !important;}
[data-char="砾川杰"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="砾川杰"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanjie/normal.webp") !important;}
[data-char="砾川杰"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanjie/normal.webp") !important;}

/* 砾川美玖（柠水） */
[data-char="砾川美玖"] {
  --main: #9392e8 !important;
  --sub: #c0c0f2 !important;
  --rgb: 147, 146, 232 !important;
  --motion-color: #8483d1 !important;}
[data-char="砾川美玖"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/normal.webp") !important;
  cursor: pointer !important;}
[data-char="砾川美玖"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="砾川美玖"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="砾川美玖"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/normal-blush.webp") !important;}
[data-char="砾川美玖"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/happy.webp") !important;}
[data-char="砾川美玖"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/surprised.webp") !important;}
[data-char="砾川美玖"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/happy-blush.webp") !important;}
[data-char="砾川美玖"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/surprised-blush.webp") !important;}
[data-char="砾川美玖"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/sad-blush.webp") !important;}
[data-char="砾川美玖"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/angry-blush.webp") !important;}
[data-char="砾川美玖"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/normal-blush.webp") !important;}
[data-char="砾川美玖"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/puzzled-blush.webp") !important;}
[data-char="砾川美玖"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/sad.webp") !important;}
[data-char="砾川美玖"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/angry.webp") !important;}
[data-char="砾川美玖"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/normal.webp") !important;}
[data-char="砾川美玖"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/puzzled.webp") !important;}
[data-char="砾川美玖"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanmeijiu/outfit1.webp") !important;}

/* 砾川雄真（柠水） */
[data-char="砾川雄真"] {
  --main: #dea68e !important;
  --sub: #eccbbd !important;
  --rgb: 222, 166, 142 !important;
  --motion-color: #c89580 !important;}
[data-char="砾川雄真"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanxiongzhen/normal.webp") !important;}
[data-char="砾川雄真"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="砾川雄真"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanxiongzhen/normal.webp") !important;}
[data-char="砾川雄真"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/lichuanxiongzhen/normal.webp") !important;}

/* 阳见惠凪（柠水） */
[data-char="阳见惠凪"] {
  --main: #f287a5 !important;
  --sub: #f7b9cb !important;
  --rgb: 242, 135, 165 !important;
  --motion-color: #da7a94 !important;}
[data-char="阳见惠凪"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="阳见惠凪"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="阳见惠凪"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="阳见惠凪"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/normal-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/happy.webp") !important;}
[data-char="阳见惠凪"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/surprised.webp") !important;}
[data-char="阳见惠凪"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/happy-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/surprised-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/sad-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/angry-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/normal-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/puzzled-blush.webp") !important;}
[data-char="阳见惠凪"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/sad.webp") !important;}
[data-char="阳见惠凪"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/angry.webp") !important;}
[data-char="阳见惠凪"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/normal.webp") !important;}
[data-char="阳见惠凪"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/puzzled.webp") !important;}
[data-char="阳见惠凪"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yangjianhuizhi/uniform.webp") !important;}

/* 隐杏珠（柠水） */
[data-char="隐杏珠"] {
  --main: #b270e1 !important;
  --sub: #d2acee !important;
  --rgb: 178, 112, 225 !important;
  --motion-color: #ab6cd8 !important;}
[data-char="隐杏珠"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/normal.webp") !important;
  cursor: pointer !important;}
[data-char="隐杏珠"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="隐杏珠"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="隐杏珠"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/normal-blush.webp") !important;}
[data-char="隐杏珠"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/smug.webp") !important;}
[data-char="隐杏珠"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/happy.webp") !important;}
[data-char="隐杏珠"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/surprised.webp") !important;}
[data-char="隐杏珠"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/smug-blush.webp") !important;}
[data-char="隐杏珠"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/happy-blush.webp") !important;}
[data-char="隐杏珠"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/surprised-blush.webp") !important;}
[data-char="隐杏珠"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/sad-blush.webp") !important;}
[data-char="隐杏珠"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/angry-blush.webp") !important;}
[data-char="隐杏珠"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/normal-blush.webp") !important;}
[data-char="隐杏珠"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/puzzled-blush.webp") !important;}
[data-char="隐杏珠"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/sad.webp") !important;}
[data-char="隐杏珠"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/angry.webp") !important;}
[data-char="隐杏珠"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/normal.webp") !important;}
[data-char="隐杏珠"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/puzzled.webp") !important;}
[data-char="隐杏珠"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/yinxingzhu/uniform.webp") !important;}

/* 仲原大梦（柠水） */
[data-char="仲原大梦"] {
  --main: #db7a54 !important;
  --sub: #eab29c !important;
  --rgb: 219, 122, 84 !important;
  --motion-color: #d27551 !important;}
[data-char="仲原大梦"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/zhongyuandameng/normal.webp") !important;}
[data-char="仲原大梦"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="仲原大梦"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/zhongyuandameng/normal.webp") !important;}
[data-char="仲原大梦"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/ningshui/zhongyuandameng/normal.webp") !important;}

/* 莲华（万华镜） */
[data-char="莲华"] {
  --main: #c88ede !important;
  --sub: #dfbdec !important;
  --rgb: 200, 142, 222 !important;
  --motion-color: #b480c8 !important;}
[data-char="莲华"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lianhua/normal.webp") !important;
  cursor: pointer !important;}
[data-char="莲华"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="莲华"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="莲华"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lianhua/normal.webp") !important;}
[data-char="莲华"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lianhua/normal.webp") !important;}
[data-char="莲华"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lianhua/outfit1.webp") !important;}

/* 铃森伊千果（万华镜） */
[data-char="铃森伊千果"] {
  --main: #e8c392 !important;
  --sub: #f2dcc0 !important;
  --rgb: 232, 195, 146 !important;
  --motion-color: #d1b083 !important;}
[data-char="铃森伊千果"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/normal.webp") !important;
  cursor: pointer !important;}
[data-char="铃森伊千果"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="铃森伊千果"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="铃森伊千果"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/normal-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/happy.webp") !important;}
[data-char="铃森伊千果"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/surprised.webp") !important;}
[data-char="铃森伊千果"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/happy-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/surprised-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/sad-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/angry-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/normal-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/puzzled-blush.webp") !important;}
[data-char="铃森伊千果"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/sad.webp") !important;}
[data-char="铃森伊千果"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/angry.webp") !important;}
[data-char="铃森伊千果"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/normal.webp") !important;}
[data-char="铃森伊千果"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/puzzled.webp") !important;}
[data-char="铃森伊千果"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/lingsenyiqianguo/uniform.webp") !important;}

/* 藤堂咲（万华镜） */
[data-char="藤堂咲"] {
  --main: #f5df84 !important;
  --sub: #f9ecb8 !important;
  --rgb: 245, 223, 132 !important;
  --motion-color: #dcc977 !important;}
[data-char="藤堂咲"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/tengtangxiao/normal.webp") !important;
  cursor: pointer !important;}
[data-char="藤堂咲"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="藤堂咲"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="藤堂咲"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/tengtangxiao/normal.webp") !important;}
[data-char="藤堂咲"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/tengtangxiao/normal.webp") !important;}
[data-char="藤堂咲"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/tengtangxiao/outfit1.webp") !important;}

/* 觋礼次郎（万华镜） */
[data-char="觋礼次郎"] {
  --main: #90b9e8 !important;
  --sub: #bfd6f2 !important;
  --rgb: 144, 185, 232 !important;
  --motion-color: #82a6d1 !important;}
[data-char="觋礼次郎"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xilicilang/normal.webp") !important;}
[data-char="觋礼次郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="觋礼次郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xilicilang/normal.webp") !important;}
[data-char="觋礼次郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xilicilang/normal.webp") !important;}

/* 觋夕莉（万华镜） */
[data-char="觋夕莉"] {
  --main: #f2cc87 !important;
  --sub: #f7e1b9 !important;
  --rgb: 242, 204, 135 !important;
  --motion-color: #dab87a !important;}
[data-char="觋夕莉"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/normal.webp") !important;
  cursor: pointer !important;}
[data-char="觋夕莉"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="觋夕莉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="觋夕莉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/normal-blush.webp") !important;}
[data-char="觋夕莉"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/smirk.webp") !important;}
[data-char="觋夕莉"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/happy.webp") !important;}
[data-char="觋夕莉"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/surprised.webp") !important;}
[data-char="觋夕莉"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/smirk-blush.webp") !important;}
[data-char="觋夕莉"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/happy-blush.webp") !important;}
[data-char="觋夕莉"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/surprised-blush.webp") !important;}
[data-char="觋夕莉"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/sad-blush.webp") !important;}
[data-char="觋夕莉"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/angry-blush.webp") !important;}
[data-char="觋夕莉"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/normal-blush.webp") !important;}
[data-char="觋夕莉"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/puzzled-blush.webp") !important;}
[data-char="觋夕莉"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/sad.webp") !important;}
[data-char="觋夕莉"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/angry.webp") !important;}
[data-char="觋夕莉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/normal.webp") !important;}
[data-char="觋夕莉"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/puzzled.webp") !important;}
[data-char="觋夕莉"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xixili/uniform.webp") !important;}

/* 觋夕摩（万华镜） */
[data-char="觋夕摩"] {
  --main: #f2e387 !important;
  --sub: #f7efb9 !important;
  --rgb: 242, 227, 135 !important;
  --motion-color: #dacc7a !important;}
[data-char="觋夕摩"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/normal.webp") !important;
  cursor: pointer !important;}
[data-char="觋夕摩"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="觋夕摩"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="觋夕摩"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/normal-blush.webp") !important;}
[data-char="觋夕摩"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/angry-blush.webp") !important;}
[data-char="觋夕摩"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/normal-blush.webp") !important;}
[data-char="觋夕摩"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/angry.webp") !important;}
[data-char="觋夕摩"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/normal.webp") !important;}
[data-char="觋夕摩"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/xiximo/uniform.webp") !important;}

/* 御殿场镜子（万华镜） */
[data-char="御殿场镜子"] {
  --main: #dda68a !important;
  --sub: #ebcbbb !important;
  --rgb: 221, 166, 138 !important;
  --motion-color: #c7957c !important;}
[data-char="御殿场镜子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="御殿场镜子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="御殿场镜子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="御殿场镜子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/normal-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/smug.webp") !important;}
[data-char="御殿场镜子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/smirk.webp") !important;}
[data-char="御殿场镜子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/happy.webp") !important;}
[data-char="御殿场镜子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/surprised.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/smug-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/smirk-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/happy-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/surprised-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/sad-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/angry-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/normal-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/puzzled-blush.webp") !important;}
[data-char="御殿场镜子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/sad.webp") !important;}
[data-char="御殿场镜子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/angry.webp") !important;}
[data-char="御殿场镜子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/normal.webp") !important;}
[data-char="御殿场镜子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/puzzled.webp") !important;}
[data-char="御殿场镜子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/wanhuajing/yudianchangjingzi/uniform.webp") !important;}

/* 本间丽华（樱之诗） */
[data-char="本间丽华"] {
  --main: #b092e8 !important;
  --sub: #d1c0f2 !important;
  --rgb: 176, 146, 232 !important;
  --motion-color: #9e83d1 !important;}
[data-char="本间丽华"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/benjianlihua/normal.webp") !important;
  cursor: pointer !important;}
[data-char="本间丽华"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="本间丽华"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="本间丽华"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/benjianlihua/normal.webp") !important;}
[data-char="本间丽华"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/benjianlihua/normal.webp") !important;}
[data-char="本间丽华"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/benjianlihua/full.webp") !important;}

/* 冰川里奈（樱之诗） */
[data-char="冰川里奈"] {
  --main: #bd92e8 !important;
  --sub: #d9c0f2 !important;
  --rgb: 189, 146, 232 !important;
  --motion-color: #aa83d1 !important;}
[data-char="冰川里奈"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="冰川里奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="冰川里奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰川里奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/normal-blush.webp") !important;}
[data-char="冰川里奈"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/smirk.webp") !important;}
[data-char="冰川里奈"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/happy.webp") !important;}
[data-char="冰川里奈"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/surprised.webp") !important;}
[data-char="冰川里奈"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/smirk-blush.webp") !important;}
[data-char="冰川里奈"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/happy-blush.webp") !important;}
[data-char="冰川里奈"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/surprised-blush.webp") !important;}
[data-char="冰川里奈"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/sad-blush.webp") !important;}
[data-char="冰川里奈"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/angry-blush.webp") !important;}
[data-char="冰川里奈"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/normal-blush.webp") !important;}
[data-char="冰川里奈"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/puzzled-blush.webp") !important;}
[data-char="冰川里奈"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/sad.webp") !important;}
[data-char="冰川里奈"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/angry.webp") !important;}
[data-char="冰川里奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/normal.webp") !important;}
[data-char="冰川里奈"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/puzzled.webp") !important;}
[data-char="冰川里奈"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanlinai/uniform.webp") !important;}

/* 冰川露莉莴（樱之诗） */
[data-char="冰川露莉莴"] {
  --main: #c092e8 !important;
  --sub: #dac0f2 !important;
  --rgb: 192, 146, 232 !important;
  --motion-color: #ad83d1 !important;}
[data-char="冰川露莉莴"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanluliwo/normal.webp") !important;
  cursor: pointer !important;}
[data-char="冰川露莉莴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="冰川露莉莴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="冰川露莉莴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanluliwo/normal.webp") !important;}
[data-char="冰川露莉莴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanluliwo/normal.webp") !important;}
[data-char="冰川露莉莴"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/bingchuanluliwo/full.webp") !important;}

/* 伯奇（樱之诗） */
[data-char="伯奇"] {
  --main: #da944e !important;
  --sub: #eac198 !important;
  --rgb: 218, 148, 78 !important;
  --motion-color: #c48546 !important;}
[data-char="伯奇"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/boqi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="伯奇"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="伯奇"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="伯奇"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/boqi/normal.webp") !important;}
[data-char="伯奇"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/boqi/normal.webp") !important;}
[data-char="伯奇"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/boqi/full.webp") !important;}

/* 草薙健一郎（樱之诗） */
[data-char="草薙健一郎"] {
  --main: #e8c992 !important;
  --sub: #f2e0c0 !important;
  --rgb: 232, 201, 146 !important;
  --motion-color: #d1b583 !important;}
[data-char="草薙健一郎"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotijianyilang/normal.webp") !important;}
[data-char="草薙健一郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="草薙健一郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotijianyilang/normal.webp") !important;}
[data-char="草薙健一郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotijianyilang/normal.webp") !important;}

/* 草薙直哉（樱之诗） */
[data-char="草薙直哉"] {
  --main: #d5c3ca !important;
  --sub: #e7dce0 !important;
  --rgb: 213, 195, 202 !important;
  --motion-color: #c0b0b6 !important;}
[data-char="草薙直哉"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotizhizai/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="草薙直哉"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="草薙直哉"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="草薙直哉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="草薙直哉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotizhizai/normal.webp") !important;}
[data-char="草薙直哉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotizhizai/normal.webp") !important;}

/* 川内野铃菜（樱之诗） */
[data-char="川内野铃菜"] {
  --main: #da924e !important;
  --sub: #eac098 !important;
  --rgb: 218, 146, 78 !important;
  --motion-color: #c48346 !important;}
[data-char="川内野铃菜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyelingcai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="川内野铃菜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="川内野铃菜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="川内野铃菜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyelingcai/normal.webp") !important;}
[data-char="川内野铃菜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyelingcai/normal.webp") !important;}
[data-char="川内野铃菜"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyelingcai/full.webp") !important;}

/* 川内野优美（樱之诗） */
[data-char="川内野优美"] {
  --main: #bf68df !important;
  --sub: #daa7ec !important;
  --rgb: 191, 104, 223 !important;
  --motion-color: #b764d6 !important;}
[data-char="川内野优美"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/normal.webp") !important;
  cursor: pointer !important;}
[data-char="川内野优美"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="川内野优美"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="川内野优美"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/normal-blush.webp") !important;}
[data-char="川内野优美"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/smirk.webp") !important;}
[data-char="川内野优美"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/happy.webp") !important;}
[data-char="川内野优美"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/surprised.webp") !important;}
[data-char="川内野优美"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/smirk-blush.webp") !important;}
[data-char="川内野优美"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/happy-blush.webp") !important;}
[data-char="川内野优美"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/surprised-blush.webp") !important;}
[data-char="川内野优美"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/sad-blush.webp") !important;}
[data-char="川内野优美"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/angry-blush.webp") !important;}
[data-char="川内野优美"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/normal-blush.webp") !important;}
[data-char="川内野优美"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/puzzled-blush.webp") !important;}
[data-char="川内野优美"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/sad.webp") !important;}
[data-char="川内野优美"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/angry.webp") !important;}
[data-char="川内野优美"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/normal.webp") !important;}
[data-char="川内野优美"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/puzzled.webp") !important;}
[data-char="川内野优美"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chuanneiyeyoumei/uniform.webp") !important;}

/* 吹（樱之诗） */
[data-char="吹"] {
  --main: #a681e4 !important;
  --sub: #cbb6ef !important;
  --rgb: 166, 129, 228 !important;
  --motion-color: #9f7cdb !important;}
[data-char="吹"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chui/normal.webp") !important;
  cursor: pointer !important;}
[data-char="吹"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="吹"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="吹"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chui/normal.webp") !important;}
[data-char="吹"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chui/normal.webp") !important;}
[data-char="吹"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/chui/full.webp") !important;}

/* 东浪见（樱之诗） */
[data-char="东浪见"] {
  --main: #92b1e8 !important;
  --sub: #c0d2f2 !important;
  --rgb: 146, 177, 232 !important;
  --motion-color: #839fd1 !important;}
[data-char="东浪见"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/donglangjian/normal.webp") !important;}
[data-char="东浪见"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="东浪见"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/donglangjian/normal.webp") !important;}
[data-char="东浪见"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/donglangjian/normal.webp") !important;}

/* 恩田宁（樱之诗） */
[data-char="恩田宁"] {
  --main: #e8c292 !important;
  --sub: #f2dcc0 !important;
  --rgb: 232, 194, 146 !important;
  --motion-color: #d1af83 !important;}
[data-char="恩田宁"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/entianning/normal.webp") !important;
  cursor: pointer !important;}
[data-char="恩田宁"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="恩田宁"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="恩田宁"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/entianning/normal.webp") !important;}
[data-char="恩田宁"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/entianning/normal.webp") !important;}
[data-char="恩田宁"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/entianning/full.webp") !important;}

/* 栗山奈津子（樱之诗） */
[data-char="栗山奈津子"] {
  --main: #9f78e2 !important;
  --sub: #c7b1ee !important;
  --rgb: 159, 120, 226 !important;
  --motion-color: #9973d9 !important;}
[data-char="栗山奈津子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/lishannaijinzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="栗山奈津子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="栗山奈津子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="栗山奈津子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/lishannaijinzi/normal.webp") !important;}
[data-char="栗山奈津子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/lishannaijinzi/normal.webp") !important;}
[data-char="栗山奈津子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/lishannaijinzi/full.webp") !important;}

/* 泷泽托马斯（樱之诗） */
[data-char="泷泽托马斯"] {
  --main: #f2dc87 !important;
  --sub: #f7ebb9 !important;
  --rgb: 242, 220, 135 !important;
  --motion-color: #dac67a !important;}
[data-char="泷泽托马斯"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/longzetuomasi/normal.webp") !important;}
[data-char="泷泽托马斯"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="泷泽托马斯"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/longzetuomasi/normal.webp") !important;}
[data-char="泷泽托马斯"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/longzetuomasi/normal.webp") !important;}

/* 麦提弗里曼（樱之诗） */
[data-char="麦提弗里曼"] {
  --main: #e8cb92 !important;
  --sub: #f2e1c0 !important;
  --rgb: 232, 203, 146 !important;
  --motion-color: #d1b783 !important;}
[data-char="麦提弗里曼"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/maitifuliman/normal.webp") !important;}
[data-char="麦提弗里曼"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="麦提弗里曼"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/maitifuliman/normal.webp") !important;}
[data-char="麦提弗里曼"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/maitifuliman/normal.webp") !important;}

/* 明石亘（樱之诗） */
[data-char="明石亘"] {
  --main: #c7ced1 !important;
  --sub: #dfe3e4 !important;
  --rgb: 199, 206, 209 !important;
  --motion-color: #b3b9bc !important;}
[data-char="明石亘"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshigen/normal.webp") !important;
  cursor: pointer !important;}
[data-char="明石亘"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="明石亘"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="明石亘"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshigen/normal.webp") !important;}
[data-char="明石亘"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshigen/normal.webp") !important;}
[data-char="明石亘"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshigen/full.webp") !important;}

/* 明石小牧（樱之诗） */
[data-char="明石小牧"] {
  --main: #e0a76e !important;
  --sub: #edccab !important;
  --rgb: 224, 167, 110 !important;
  --motion-color: #ca9663 !important;}
[data-char="明石小牧"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaomu/normal.webp") !important;
  cursor: pointer !important;}
[data-char="明石小牧"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="明石小牧"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="明石小牧"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaomu/normal.webp") !important;}
[data-char="明石小牧"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaomu/normal.webp") !important;}
[data-char="明石小牧"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaomu/outfit1.webp") !important;}

/* 明石小沙智（樱之诗） */
[data-char="明石小沙智"] {
  --main: #da964e !important;
  --sub: #eac298 !important;
  --rgb: 218, 150, 78 !important;
  --motion-color: #c48746 !important;}
[data-char="明石小沙智"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaoshazhi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="明石小沙智"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="明石小沙智"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="明石小沙智"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaoshazhi/normal.webp") !important;}
[data-char="明石小沙智"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaoshazhi/normal.webp") !important;}
[data-char="明石小沙智"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/mingshixiaoshazhi/outfit1.webp") !important;}

/* 鸟谷纱希（樱之诗） */
[data-char="鸟谷纱希"] {
  --main: #e1b398 !important;
  --sub: #eed3c3 !important;
  --rgb: 225, 179, 152 !important;
  --motion-color: #caa189 !important;}
[data-char="鸟谷纱希"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaogushaxi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="鸟谷纱希"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="鸟谷纱希"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="鸟谷纱希"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaogushaxi/normal.webp") !important;}
[data-char="鸟谷纱希"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaogushaxi/normal.webp") !important;}
[data-char="鸟谷纱希"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaogushaxi/full.webp") !important;}

/* 鸟谷真琴（樱之诗） */
[data-char="鸟谷真琴"] {
  --main: #b092e8 !important;
  --sub: #d1c0f2 !important;
  --rgb: 176, 146, 232 !important;
  --motion-color: #9e83d1 !important;}
[data-char="鸟谷真琴"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/normal.webp") !important;
  cursor: pointer !important;}
[data-char="鸟谷真琴"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="鸟谷真琴"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="鸟谷真琴"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/normal-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/happy.webp") !important;}
[data-char="鸟谷真琴"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/surprised.webp") !important;}
[data-char="鸟谷真琴"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/happy-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/surprised-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/sad-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/angry-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/normal-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/puzzled-blush.webp") !important;}
[data-char="鸟谷真琴"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/sad.webp") !important;}
[data-char="鸟谷真琴"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/angry.webp") !important;}
[data-char="鸟谷真琴"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/normal.webp") !important;}
[data-char="鸟谷真琴"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/puzzled.webp") !important;}
[data-char="鸟谷真琴"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/niaoguzhenqin/uniform.webp") !important;}

/* 片贝巧实（樱之诗） */
[data-char="片贝巧实"] {
  --main: #e8c492 !important;
  --sub: #f2ddc0 !important;
  --rgb: 232, 196, 146 !important;
  --motion-color: #d1b083 !important;}
[data-char="片贝巧实"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/pianbeiqiaoshi/normal.webp") !important;}
[data-char="片贝巧实"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="片贝巧实"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/pianbeiqiaoshi/normal.webp") !important;}
[data-char="片贝巧实"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/pianbeiqiaoshi/normal.webp") !important;}

/* 若田清二郎（樱之诗） */
[data-char="若田清二郎"] {
  --main: #ddb28b !important;
  --sub: #ebd2bc !important;
  --rgb: 221, 178, 139 !important;
  --motion-color: #c7a07d !important;}
[data-char="若田清二郎"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/ruotianqingerlang/normal.webp") !important;}
[data-char="若田清二郎"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="若田清二郎"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/ruotianqingerlang/normal.webp") !important;}
[data-char="若田清二郎"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/ruotianqingerlang/normal.webp") !important;}

/* 夏目圭（樱之诗） */
[data-char="夏目圭"] {
  --main: #9298e8 !important;
  --sub: #c0c3f2 !important;
  --rgb: 146, 152, 232 !important;
  --motion-color: #8389d1 !important;}
[data-char="夏目圭"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamugui/normal.webp") !important;
  cursor: pointer !important;}
[data-char="夏目圭"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目圭"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目圭"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamugui/normal.webp") !important;}
[data-char="夏目圭"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamugui/normal.webp") !important;}
[data-char="夏目圭"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamugui/full.webp") !important;}

/* 夏目蓝（樱之诗） */
[data-char="夏目蓝"] {
  --main: #ddae8a !important;
  --sub: #ebd0bb !important;
  --rgb: 221, 174, 138 !important;
  --motion-color: #c79d7c !important;}
[data-char="夏目蓝"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/normal.webp") !important;
  cursor: pointer !important;}
[data-char="夏目蓝"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目蓝"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目蓝"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/normal-blush.webp") !important;}
[data-char="夏目蓝"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/smirk.webp") !important;}
[data-char="夏目蓝"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/happy.webp") !important;}
[data-char="夏目蓝"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/surprised.webp") !important;}
[data-char="夏目蓝"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/smirk-blush.webp") !important;}
[data-char="夏目蓝"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/happy-blush.webp") !important;}
[data-char="夏目蓝"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/surprised-blush.webp") !important;}
[data-char="夏目蓝"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/sad-blush.webp") !important;}
[data-char="夏目蓝"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/angry-blush.webp") !important;}
[data-char="夏目蓝"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/normal-blush.webp") !important;}
[data-char="夏目蓝"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/puzzled-blush.webp") !important;}
[data-char="夏目蓝"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/sad.webp") !important;}
[data-char="夏目蓝"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/angry.webp") !important;}
[data-char="夏目蓝"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/normal.webp") !important;}
[data-char="夏目蓝"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/puzzled.webp") !important;}
[data-char="夏目蓝"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamulan/outfit1.webp") !important;}

/* 夏目雫（樱之诗） */
[data-char="夏目雫"] {
  --main: #f287aa !important;
  --sub: #f7b9ce !important;
  --rgb: 242, 135, 170 !important;
  --motion-color: #da7a99 !important;}
[data-char="夏目雫"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/normal.webp") !important;
  cursor: pointer !important;}
[data-char="夏目雫"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="夏目雫"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="夏目雫"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/normal-blush.webp") !important;}
[data-char="夏目雫"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/smirk.webp") !important;}
[data-char="夏目雫"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/happy.webp") !important;}
[data-char="夏目雫"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/surprised.webp") !important;}
[data-char="夏目雫"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/smirk-blush.webp") !important;}
[data-char="夏目雫"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/happy-blush.webp") !important;}
[data-char="夏目雫"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/surprised-blush.webp") !important;}
[data-char="夏目雫"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/sad-blush.webp") !important;}
[data-char="夏目雫"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/angry-blush.webp") !important;}
[data-char="夏目雫"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/normal-blush.webp") !important;}
[data-char="夏目雫"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/puzzled-blush.webp") !important;}
[data-char="夏目雫"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/sad.webp") !important;}
[data-char="夏目雫"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/angry.webp") !important;}
[data-char="夏目雫"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/normal.webp") !important;}
[data-char="夏目雫"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/puzzled.webp") !important;}
[data-char="夏目雫"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiamuna/uniform.webp") !important;}

/* 咲崎樱子（樱之诗） */
[data-char="咲崎樱子"] {
  --main: #f287b6 !important;
  --sub: #f7b9d5 !important;
  --rgb: 242, 135, 182 !important;
  --motion-color: #da7aa4 !important;}
[data-char="咲崎樱子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiaoqiyingzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="咲崎樱子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="咲崎樱子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="咲崎樱子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiaoqiyingzi/normal.webp") !important;}
[data-char="咲崎樱子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiaoqiyingzi/normal.webp") !important;}
[data-char="咲崎樱子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/xiaoqiyingzi/full.webp") !important;}

/* 一宫（樱之诗） */
[data-char="一宫"] {
  --main: #92b2e8 !important;
  --sub: #c0d2f2 !important;
  --rgb: 146, 178, 232 !important;
  --motion-color: #83a0d1 !important;}
[data-char="一宫"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yigong/normal.webp") !important;}
[data-char="一宫"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="一宫"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yigong/normal.webp") !important;}
[data-char="一宫"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yigong/normal.webp") !important;}

/* 御樱稟（樱之诗） */
[data-char="御樱稟"] {
  --main: #db9d55 !important;
  --sub: #eac69c !important;
  --rgb: 219, 157, 85 !important;
  --motion-color: #c58d4c !important;}
[data-char="御樱稟"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/normal.webp") !important;
  cursor: pointer !important;}
[data-char="御樱稟"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="御樱稟"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="御樱稟"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/normal-blush.webp") !important;}
[data-char="御樱稟"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/smirk.webp") !important;}
[data-char="御樱稟"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/happy.webp") !important;}
[data-char="御樱稟"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/surprised.webp") !important;}
[data-char="御樱稟"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/smirk-blush.webp") !important;}
[data-char="御樱稟"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/happy-blush.webp") !important;}
[data-char="御樱稟"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/surprised-blush.webp") !important;}
[data-char="御樱稟"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/sad-blush.webp") !important;}
[data-char="御樱稟"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/angry-blush.webp") !important;}
[data-char="御樱稟"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/normal-blush.webp") !important;}
[data-char="御樱稟"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/sad.webp") !important;}
[data-char="御樱稟"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/angry.webp") !important;}
[data-char="御樱稟"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/normal.webp") !important;}
[data-char="御樱稟"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/puzzled.webp") !important;}
[data-char="御樱稟"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingbing/uniform.webp") !important;}

/* 御樱雄三（樱之诗） */
[data-char="御樱雄三"] {
  --main: #e8d592 !important;
  --sub: #f2e7c0 !important;
  --rgb: 232, 213, 146 !important;
  --motion-color: #d1c083 !important;}
[data-char="御樱雄三"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingxiongsan/normal.webp") !important;}
[data-char="御樱雄三"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="御樱雄三"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingxiongsan/normal.webp") !important;}
[data-char="御樱雄三"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/yuyingxiongsan/normal.webp") !important;}

/* 长山香奈（樱之诗） */
[data-char="长山香奈"] {
  --main: #e5a784 !important;
  --sub: #f0ccb8 !important;
  --rgb: 229, 167, 132 !important;
  --motion-color: #ce9677 !important;}
[data-char="长山香奈"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhangshanxiangnai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="长山香奈"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="长山香奈"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="长山香奈"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhangshanxiangnai/normal.webp") !important;}
[data-char="长山香奈"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhangshanxiangnai/normal.webp") !important;}
[data-char="长山香奈"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhangshanxiangnai/full.webp") !important;}

/* 中村水菜（樱之诗） */
[data-char="中村水菜"] {
  --main: #be68df !important;
  --sub: #d9a7ec !important;
  --rgb: 190, 104, 223 !important;
  --motion-color: #b664d6 !important;}
[data-char="中村水菜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunshuicai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="中村水菜"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="中村水菜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="中村水菜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunshuicai/normal.webp") !important;}
[data-char="中村水菜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunshuicai/normal.webp") !important;}
[data-char="中村水菜"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunshuicai/full.webp") !important;}

/* 中村义贞（樱之诗） */
[data-char="中村义贞"] {
  --main: #cbc2d6 !important;
  --sub: #e1dce7 !important;
  --rgb: 203, 194, 214 !important;
  --motion-color: #b7afc1 !important;}
[data-char="中村义贞"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunyizhen/normal.webp") !important;}
[data-char="中村义贞"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="中村义贞"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunyizhen/normal.webp") !important;}
[data-char="中村义贞"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunyizhen/normal.webp") !important;}

/* 中村章一（樱之诗） */
[data-char="中村章一"] {
  --main: #e8c892 !important;
  --sub: #f2dfc0 !important;
  --rgb: 232, 200, 146 !important;
  --motion-color: #d1b483 !important;}
[data-char="中村章一"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunzhangyi/normal.webp") !important;}
[data-char="中村章一"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="中村章一"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunzhangyi/normal.webp") !important;}
[data-char="中村章一"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongcunzhangyi/normal.webp") !important;}

/* 柊乃乃未（樱之诗） */
[data-char="柊乃乃未"] {
  --main: #f287b6 !important;
  --sub: #f7b9d5 !important;
  --rgb: 242, 135, 182 !important;
  --motion-color: #da7aa4 !important;}
[data-char="柊乃乃未"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongnainaiwei/normal.webp") !important;
  cursor: pointer !important;}
[data-char="柊乃乃未"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="柊乃乃未"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="柊乃乃未"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongnainaiwei/normal.webp") !important;}
[data-char="柊乃乃未"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongnainaiwei/normal.webp") !important;}
[data-char="柊乃乃未"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/zhongnainaiwei/full.webp") !important;}

/* 成濑沙月（9nine） */
[data-char="成濑沙月"] {
  --main: #af74e1 !important;
  --sub: #d1aeee !important;
  --rgb: 175, 116, 225 !important;
  --motion-color: #a86fd8 !important;}
[data-char="成濑沙月"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="成濑沙月"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="成濑沙月"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="成濑沙月"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="成濑沙月"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/normal.webp") !important;}
[data-char="成濑沙月"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/happy.webp") !important;}
[data-char="成濑沙月"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/surprised.webp") !important;}
[data-char="成濑沙月"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/sad.webp") !important;}
[data-char="成濑沙月"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/angry.webp") !important;}
[data-char="成濑沙月"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/normal.webp") !important;}
[data-char="成濑沙月"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/chenglaishayue/puzzled.webp") !important;}

/* 九条都（9nine） */
[data-char="九条都"] {
  --main: #e8bf92 !important;
  --sub: #f2dac0 !important;
  --rgb: 232, 191, 146 !important;
  --motion-color: #d1ac83 !important;}
[data-char="九条都"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/normal.webp") !important;
  cursor: pointer !important;}
[data-char="九条都"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="九条都"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="九条都"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/normal-blush.webp") !important;}
[data-char="九条都"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/happy.webp") !important;}
[data-char="九条都"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/surprised.webp") !important;}
[data-char="九条都"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/happy-blush.webp") !important;}
[data-char="九条都"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/surprised-blush.webp") !important;}
[data-char="九条都"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/sad-blush.webp") !important;}
[data-char="九条都"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/angry-blush.webp") !important;}
[data-char="九条都"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/normal-blush.webp") !important;}
[data-char="九条都"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/puzzled-blush.webp") !important;}
[data-char="九条都"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/sad.webp") !important;}
[data-char="九条都"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/angry.webp") !important;}
[data-char="九条都"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/normal.webp") !important;}
[data-char="九条都"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/puzzled.webp") !important;}
[data-char="九条都"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiutiaodou/full.webp") !important;}

/* 高峰莲夜（9nine） */
[data-char="高峰莲夜"] {
  --main: #ec667c !important;
  --sub: #f4a6b3 !important;
  --rgb: 236, 102, 124 !important;
  --motion-color: #e36277 !important;}
[data-char="高峰莲夜"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/gaofenglianye/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="高峰莲夜"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="高峰莲夜"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="高峰莲夜"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="高峰莲夜"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/gaofenglianye/normal.webp") !important;}
[data-char="高峰莲夜"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/gaofenglianye/normal.webp") !important;}

/* 苏菲缇雅（9nine） */
[data-char="苏菲缇雅"] {
  --main: #d5c3ca !important;
  --sub: #e7dce0 !important;
  --rgb: 213, 195, 202 !important;
  --motion-color: #c0b0b6 !important;}
[data-char="苏菲缇雅"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/sufeitiya/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="苏菲缇雅"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="苏菲缇雅"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="苏菲缇雅"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="苏菲缇雅"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/sufeitiya/normal.webp") !important;}
[data-char="苏菲缇雅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/sufeitiya/normal.webp") !important;}

/* 结城希亚（9nine） */
[data-char="结城希亚"] {
  --main: #db7a56 !important;
  --sub: #eab29d !important;
  --rgb: 219, 122, 86 !important;
  --motion-color: #d27553 !important;}
[data-char="结城希亚"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/normal.webp") !important;
  cursor: pointer !important;}
[data-char="结城希亚"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="结城希亚"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="结城希亚"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/normal-blush.webp") !important;}
[data-char="结城希亚"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/happy.webp") !important;}
[data-char="结城希亚"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/happy-blush.webp") !important;}
[data-char="结城希亚"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/sad-blush.webp") !important;}
[data-char="结城希亚"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/angry-blush.webp") !important;}
[data-char="结城希亚"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/normal-blush.webp") !important;}
[data-char="结城希亚"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/puzzled-blush.webp") !important;}
[data-char="结城希亚"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/sad.webp") !important;}
[data-char="结城希亚"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/angry.webp") !important;}
[data-char="结城希亚"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/normal.webp") !important;}
[data-char="结城希亚"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/puzzled.webp") !important;}
[data-char="结城希亚"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/jiechengxiya/full.webp") !important;}

/* 香坂春风（9nine） */
[data-char="香坂春风"] {
  --main: #c392e8 !important;
  --sub: #dcc0f2 !important;
  --rgb: 195, 146, 232 !important;
  --motion-color: #b083d1 !important;}
[data-char="香坂春风"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/normal.webp") !important;
  cursor: pointer !important;}
[data-char="香坂春风"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="香坂春风"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="香坂春风"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/normal-blush.webp") !important;}
[data-char="香坂春风"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/smug.webp") !important;}
[data-char="香坂春风"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/smirk.webp") !important;}
[data-char="香坂春风"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/happy.webp") !important;}
[data-char="香坂春风"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/surprised.webp") !important;}
[data-char="香坂春风"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/smug-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/smirk-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/happy-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/surprised-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/sad-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/angry-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/normal-blush.webp") !important;}
[data-char="香坂春风"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/puzzled-blush.webp") !important;}
[data-char="香坂春风"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/sad.webp") !important;}
[data-char="香坂春风"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/angry.webp") !important;}
[data-char="香坂春风"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/normal.webp") !important;}
[data-char="香坂春风"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/puzzled.webp") !important;}
[data-char="香坂春风"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xiangbanchunfeng/full.webp") !important;}

/* 新海天（9nine） */
[data-char="新海天"] {
  --main: #92aae8 !important;
  --sub: #c0cef2 !important;
  --rgb: 146, 170, 232 !important;
  --motion-color: #8399d1 !important;}
[data-char="新海天"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/normal.webp") !important;
  cursor: pointer !important;}
[data-char="新海天"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="新海天"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新海天"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/normal-blush.webp") !important;}
[data-char="新海天"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/smug.webp") !important;}
[data-char="新海天"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/happy.webp") !important;}
[data-char="新海天"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/surprised.webp") !important;}
[data-char="新海天"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/smug-blush.webp") !important;}
[data-char="新海天"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/happy-blush.webp") !important;}
[data-char="新海天"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/surprised-blush.webp") !important;}
[data-char="新海天"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/sad-blush.webp") !important;}
[data-char="新海天"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/angry-blush.webp") !important;}
[data-char="新海天"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/thinking-blush.webp") !important;}
[data-char="新海天"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/normal-blush.webp") !important;}
[data-char="新海天"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/puzzled-blush.webp") !important;}
[data-char="新海天"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/sad.webp") !important;}
[data-char="新海天"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/angry.webp") !important;}
[data-char="新海天"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/thinking.webp") !important;}
[data-char="新海天"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/normal.webp") !important;}
[data-char="新海天"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/puzzled.webp") !important;}
[data-char="新海天"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaitian/full.webp") !important;}

/* 新海霞（9nine） */
[data-char="新海霞"] {
  --main: #4eda84 !important;
  --sub: #98eab8 !important;
  --rgb: 78, 218, 132 !important;
  --motion-color: #46c477 !important;}
[data-char="新海霞"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixia/normal.webp") !important;
  cursor: pointer !important;}
[data-char="新海霞"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="新海霞"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新海霞"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixia/normal.webp") !important;}
[data-char="新海霞"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixia/normal.webp") !important;}
[data-char="新海霞"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixia/full.webp") !important;}

/* 新海翔（9nine） */
[data-char="新海翔"] {
  --main: #4eda82 !important;
  --sub: #98eab6 !important;
  --rgb: 78, 218, 130 !important;
  --motion-color: #46c475 !important;}
[data-char="新海翔"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixiang/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="新海翔"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="新海翔"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="新海翔"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="新海翔"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixiang/normal.webp") !important;}
[data-char="新海翔"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/xinhaixiang/normal.webp") !important;}

/* 幽灵（9nine） */
[data-char="幽灵"] {
  --main: #f3d387 !important;
  --sub: #f8e5b9 !important;
  --rgb: 243, 211, 135 !important;
  --motion-color: #dbbe7a !important;}
[data-char="幽灵"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/youling/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="幽灵"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="幽灵"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="幽灵"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="幽灵"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/youling/normal.webp") !important;}
[data-char="幽灵"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/youling/happy.webp") !important;}
[data-char="幽灵"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/youling/normal.webp") !important;}

/* 深泽与一（9nine） */
[data-char="深泽与一"] {
  --main: #7faae7 !important;
  --sub: #b5cef1 !important;
  --rgb: 127, 170, 231 !important;
  --motion-color: #7299d0 !important;}
[data-char="深泽与一"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/shenzeyuyi/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="深泽与一"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="深泽与一"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="深泽与一"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="深泽与一"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/shenzeyuyi/normal.webp") !important;}
[data-char="深泽与一"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/9nine/shenzeyuyi/normal.webp") !important;}

/* 草薙直绪（樱之诗） */
[data-char="草薙直绪"] {
  --main: #d5c3ca !important;
  --sub: #e7dce0 !important;
  --rgb: 213, 195, 202 !important;
  --motion-color: #c0b0b6 !important;}
[data-char="草薙直绪"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotizhixu/normal.webp") !important;}
div.custom-nvn-dialogue[data-char="草薙直绪"] .custom-nvn-avatar-img:not(#nvn-modern-boost) { cursor: default !important;}
[data-char="草薙直绪"] .custom-nvn-avatar-popover { pointer-events: none !important;}
[data-char="草薙直绪"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="草薙直绪"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotizhixu/normal.webp") !important;}
[data-char="草薙直绪"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/yingzhishi/caotizhixu/normal.webp") !important;}

/* 花子（花子） */
[data-char="花子"] {
  --main: #f58684 !important;
  --sub: #f9b9b8 !important;
  --rgb: 245, 134, 132 !important;
  --motion-color: #dc7977 !important;}
[data-char="花子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="花子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="花子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="花子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/normal-blush.webp") !important;}
[data-char="花子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/smug.webp") !important;}
[data-char="花子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/smirk.webp") !important;}
[data-char="花子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/happy.webp") !important;}
[data-char="花子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/surprised.webp") !important;}
[data-char="花子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/smug-blush.webp") !important;}
[data-char="花子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/smirk-blush.webp") !important;}
[data-char="花子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/happy-blush.webp") !important;}
[data-char="花子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/surprised-blush.webp") !important;}
[data-char="花子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/sad-blush.webp") !important;}
[data-char="花子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/angry-blush.webp") !important;}
[data-char="花子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/normal-blush.webp") !important;}
[data-char="花子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/puzzled-blush.webp") !important;}
[data-char="花子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/sad.webp") !important;}
[data-char="花子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/angry.webp") !important;}
[data-char="花子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/normal.webp") !important;}
[data-char="花子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/puzzled.webp") !important;}
[data-char="花子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/huazi/huazi/full.webp") !important;}

/* 大垣日向（少女领域） */
[data-char="大垣日向"] {
  --main: #f5d084 !important;
  --sub: #f9e4b8 !important;
  --rgb: 245, 208, 132 !important;
  --motion-color: #dcbb77 !important;}
[data-char="大垣日向"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/normal.webp") !important;
  cursor: pointer !important;}
[data-char="大垣日向"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="大垣日向"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="大垣日向"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/normal-blush.webp") !important;}
[data-char="大垣日向"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/smug.webp") !important;}
[data-char="大垣日向"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/happy.webp") !important;}
[data-char="大垣日向"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/surprised.webp") !important;}
[data-char="大垣日向"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/smug-blush.webp") !important;}
[data-char="大垣日向"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/happy-blush.webp") !important;}
[data-char="大垣日向"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/surprised-blush.webp") !important;}
[data-char="大垣日向"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/sad-blush.webp") !important;}
[data-char="大垣日向"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/angry-blush.webp") !important;}
[data-char="大垣日向"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/normal-blush.webp") !important;}
[data-char="大垣日向"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/puzzled-blush.webp") !important;}
[data-char="大垣日向"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/sad.webp") !important;}
[data-char="大垣日向"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/angry.webp") !important;}
[data-char="大垣日向"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/normal.webp") !important;}
[data-char="大垣日向"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/puzzled.webp") !important;}
[data-char="大垣日向"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/dayuanrixiang/full.webp") !important;}

/* 飞鸟凑（少女领域） */
[data-char="飞鸟凑"] {
  --main: #b492e8 !important;
  --sub: #d4c0f2 !important;
  --rgb: 180, 146, 232 !important;
  --motion-color: #a283d1 !important;}
[data-char="飞鸟凑"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/normal.webp") !important;
  cursor: pointer !important;}
[data-char="飞鸟凑"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="飞鸟凑"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="飞鸟凑"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/normal-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/happy.webp") !important;}
[data-char="飞鸟凑"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/surprised.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/happy-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/surprised-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/sad-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/angry-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/thinking-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/normal-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/puzzled-blush.webp") !important;}
[data-char="飞鸟凑"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/sad.webp") !important;}
[data-char="飞鸟凑"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/angry.webp") !important;}
[data-char="飞鸟凑"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/thinking.webp") !important;}
[data-char="飞鸟凑"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/normal.webp") !important;}
[data-char="飞鸟凑"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/puzzled.webp") !important;}
[data-char="飞鸟凑"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/feiniaocou/full.webp") !important;}

/* 贵船柚子（少女领域） */
[data-char="贵船柚子"] {
  --main: #d5c3ca !important;
  --sub: #e7dce0 !important;
  --rgb: 213, 195, 202 !important;
  --motion-color: #c0b0b6 !important;}
[data-char="贵船柚子"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/normal.webp") !important;
  cursor: pointer !important;}
[data-char="贵船柚子"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="贵船柚子"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="贵船柚子"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/normal-blush.webp") !important;}
[data-char="贵船柚子"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/smug.webp") !important;}
[data-char="贵船柚子"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/smirk.webp") !important;}
[data-char="贵船柚子"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/happy.webp") !important;}
[data-char="贵船柚子"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/surprised.webp") !important;}
[data-char="贵船柚子"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/smug-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/smirk-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/happy-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/surprised-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/sad-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/angry-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/normal-blush.webp") !important;}
[data-char="贵船柚子"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/puzzled-blush.webp") !important;}
[data-char="贵船柚子"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/sad.webp") !important;}
[data-char="贵船柚子"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/angry.webp") !important;}
[data-char="贵船柚子"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/normal.webp") !important;}
[data-char="贵船柚子"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/puzzled.webp") !important;}
[data-char="贵船柚子"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/guichuanyouzi/full.webp") !important;}

/* 皆见美结（少女领域） */
[data-char="皆见美结"] {
  --main: #aee582 !important;
  --sub: #d0f0b6 !important;
  --rgb: 174, 229, 130 !important;
  --motion-color: #9dce75 !important;}
[data-char="皆见美结"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/normal.webp") !important;
  cursor: pointer !important;}
[data-char="皆见美结"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="皆见美结"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="皆见美结"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/normal-blush.webp") !important;}
[data-char="皆见美结"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/smirk.webp") !important;}
[data-char="皆见美结"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/happy.webp") !important;}
[data-char="皆见美结"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/surprised.webp") !important;}
[data-char="皆见美结"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/smirk-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/happy-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/surprised-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/sad-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/angry-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/thinking-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/normal-blush.webp") !important;}
[data-char="皆见美结"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/puzzled-blush.webp") !important;}
[data-char="皆见美结"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/sad.webp") !important;}
[data-char="皆见美结"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/angry.webp") !important;}
[data-char="皆见美结"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/thinking.webp") !important;}
[data-char="皆见美结"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/normal.webp") !important;}
[data-char="皆见美结"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/puzzled.webp") !important;}
[data-char="皆见美结"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/jiejianmeijie/full.webp") !important;}

/* 那波七海（少女领域） */
[data-char="那波七海"] {
  --main: #e28378 !important;
  --sub: #eeb7b1 !important;
  --rgb: 226, 131, 120 !important;
  --motion-color: #cb766c !important;}
[data-char="那波七海"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/naboqihai/normal.webp") !important;
  cursor: pointer !important;}
[data-char="那波七海"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="那波七海"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="那波七海"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/naboqihai/normal.webp") !important;}
[data-char="那波七海"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/naboqihai/normal.webp") !important;}
[data-char="那波七海"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/naboqihai/full.webp") !important;}

/* 西园寺风莉（少女领域） */
[data-char="西园寺风莉"] {
  --main: #e8b392 !important;
  --sub: #f2d3c0 !important;
  --rgb: 232, 179, 146 !important;
  --motion-color: #d1a183 !important;}
[data-char="西园寺风莉"] .custom-nvn-avatar-img {
  background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/normal.webp") !important;
  cursor: pointer !important;}
[data-char="西园寺风莉"] .custom-nvn-avatar-popover { pointer-events: auto !important;}
[data-char="西园寺风莉"] .custom-nvn-avatar-img::after { display: none !important;}
[data-char="西园寺风莉"][data-action^="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/normal-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/smug.webp") !important;}
[data-char="西园寺风莉"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/happy.webp") !important;}
[data-char="西园寺风莉"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/surprised.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/smug-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/happy-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/surprised-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/sad-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/angry-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/normal-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/puzzled-blush.webp") !important;}
[data-char="西园寺风莉"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/sad.webp") !important;}
[data-char="西园寺风莉"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/angry.webp") !important;}
[data-char="西园寺风莉"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/normal.webp") !important;}
[data-char="西园寺风莉"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/puzzled.webp") !important;}
[data-char="西园寺风莉"] .custom-nvn-portrait-full {
  content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/shaonvlingyu/xiyuansifengli/full.webp") !important;}

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

  function escCssStr(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function effectiveCastIs() {
    const extra = [];
    for (const c of NEW_CHARACTERS) {
      if (!c || !Array.isArray(c.chars)) continue;
      for (const n of c.chars) {
        if (n) extra.push('[data-char="' + escCssStr(n) + '"]');
      }
    }
    if (!extra.length) return CAST_IS;
    return CAST_IS ? (CAST_IS + ', ' + extra.join(', ')) : extra.join(', ');
  }

  function buildNewCharacterCss() {
    if (!NEW_CHARACTERS.length) return '';
    const B = '.mes_text div.custom-nvn-dialogue:is(';
    const BOOST = '):not(#nvn-char-color-override)';
    let out = '\n\n/* ================= 新增角色（由 NEW_CHARACTERS 自动生成） ================= */\n';
    for (const c of NEW_CHARACTERS) {
      if (!c || !Array.isArray(c.chars) || !c.chars.length) continue;
      const sel = c.chars.map(function (n) {
        const e = escCssStr(n);
        return '[data-char="' + e + '"], [data-char^="' + e + '·"]';
      }).join(', ');
      const head = B + sel + BOOST;
      const actions = (c.actions && typeof c.actions === 'object') ? c.actions : null;
      const baseAvatar = c.avatar || (actions && actions['通常']) || '';
      const hasPortrait = !!c.portrait;

      out += '\n/* ' + c.chars.join(' / ') + ' */\n';
      out += head + ' {\n'
           + '  --main: ' + (c.main || '#8896a5') + ' !important;\n'
           + '  --sub: ' + (c.sub || '#b2becb') + ' !important;\n'
           + '  --rgb: ' + (c.rgb || '136, 150, 165') + ' !important;\n'
           + '  --motion-color: ' + (c.motion || c.main || '#a8b5c2') + ' !important;\n'
           + '}\n';

      const chatHead = '.mes_text div.custom-chat-row:is(' + sel + ')';
      out += chatHead + ' {\n'
           + '  --main: ' + (c.main || '#8896a5') + ' !important;\n'
           + '  --sub: ' + (c.sub || '#b2becb') + ' !important;\n'
           + '  --rgb: ' + (c.rgb || '136, 150, 165') + ' !important;\n'
           + '  --motion-color: ' + (c.motion || c.main || '#a8b5c2') + ' !important;\n'
           + '}\n';
      if (baseAvatar) {
        out += chatHead + ' .custom-nvn-avatar-img {\n'
             + '  background-image: url("' + escCssStr(baseAvatar) + '") !important;\n'
             + '}\n';
      }

      if (baseAvatar || c.blush) {
        out += head + ' .custom-nvn-avatar-img {\n';
        if (baseAvatar) {
          out += '  background-image: url("' + escCssStr(baseAvatar) + '") !important;\n';
        }
        if (c.blush) {
          out += '  --nvn-blush: url("' + escCssStr(c.blush) + '");\n'
               + '  --nvn-blush-display: block;\n';
          if (c.blushPos) {
            out += '  --nvn-blush-pos: ' + c.blushPos + ';\n';
          }
          if (c.blushOpacity !== undefined) {
            out += '  --nvn-blush-opacity: ' + c.blushOpacity + ';\n';
          }
        }
        out += '  border: 1.5px solid rgba(var(--rgb), 0.78) !important;\n'
             + '  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;\n'
             + ((c.big || hasPortrait) ? '  cursor: pointer !important;\n' : '  cursor: default !important;\n')
             + '}\n';
        out += head + ' .custom-nvn-avatar-img::after { display: none !important; }\n';
        if (baseAvatar) {
          out += head + ' .custom-nvn-avatar-fallback-box { display: none !important; }\n';
        }
      } else if (c.big || hasPortrait) {
        out += head + ' .custom-nvn-avatar-img { cursor: pointer !important; }\n';
      }

      if (actions) {
        const entries = Object.entries(actions).filter(function (kv) { return kv[0] && kv[1]; });
        const normalEntries = entries
          .filter(function (kv) { return kv[0] !== '通常' && kv[0].indexOf('脸红') !== 0; })
          .sort(function (a, b) { return a[0].length - b[0].length; });
        const blushFallback = entries.filter(function (kv) { return kv[0] === '脸红'; });
        const exactBlushEntries = entries.filter(function (kv) { return kv[0] !== '脸红' && kv[0].indexOf('脸红') === 0; });

        for (const kv of normalEntries) {
          out += head + '[data-action*="' + escCssStr(kv[0]) + '"] .custom-nvn-avatar-img {\n'
               + '  background-image: url("' + escCssStr(kv[1]) + '") !important;\n'
               + '}\n';
        }
        for (const kv of blushFallback) {
          out += head + '[data-action^="脸红"] .custom-nvn-avatar-img {\n'
               + '  background-image: url("' + escCssStr(kv[1]) + '") !important;\n'
               + '  --nvn-blush-display: none;\n'
               + '}\n';
        }
        for (const kv of exactBlushEntries) {
          out += head + '[data-action="' + escCssStr(kv[0]) + '"] .custom-nvn-avatar-img {\n'
               + '  background-image: url("' + escCssStr(kv[1]) + '") !important;\n'
               + '  --nvn-blush-display: none;\n'
               + '}\n';
        }
      }

      if (c.blush && Array.isArray(c.blushTriggers) && c.blushTriggers.length) {
        const extra = c.blushTriggers.filter(function (t) { return t && t !== '脸红'; });
        if (extra.length) {
          const tSel = extra.map(function (t) { return '[data-action*="' + escCssStr(t) + '"]'; }).join(', ');
          out += head + ':is(' + tSel + ') .custom-nvn-avatar-img::after {\n'
               + '  display: var(--nvn-blush-display, none) !important;\n'
               + '}\n';
        }
      }

      out += head + '::before, ' + head + '::after { display: none !important; }\n';
      if (hasPortrait) {
        out += head + ' .custom-nvn-portrait-full {\n  content: url("' + escCssStr(c.portrait) + '") !important;\n}\n';
        out += head + ' .custom-nvn-avatar-popover { pointer-events: auto !important; }\n';
      } else {
        out += head + ' .custom-nvn-avatar-popover { pointer-events: none !important; }\n';
      }
      if (c.big) {
        out += head + ' .custom-nvn-avatar-fallback-box { display: none !important; }\n';
      }
      if (c.rose) {
        out += head + ' .custom-nvn-rose-crest {\n  display: flex !important;\n  align-items: center;\n'
             + '  justify-content: center;\n  width: 20px;\n  height: 20px;\n  color: var(--main);\n'
             + '  filter: drop-shadow(0 0 4px rgba(var(--rgb), 0.6));\n  flex-shrink: 0;\n}\n';
      }
    }
    return out;
  }

  /* 由 SAKURA_TOKI_OVERRIDES 生成十年后覆盖 CSS：
     权重为 2 个 ID（#chat + :not(#nvn-toki-override)），稳压 CAST_CSS 与 NEW_CHARACTERS，
     同时低于 AV_FB_STYLE_ID 的 3 个 ID，断链自动换源引擎照常生效。 */
  function buildSakuraTokiCss() {
    if (!SAKURA_TOKI_OVERRIDES.length) return '';
    const B = '#chat .mes_text div.custom-nvn-dialogue[data-nvn-toki="1"]:is(';
    const BOOST = '):not(#nvn-toki-override)';
    let out = '\n\n/* ================= 樱之刻 · 同名角色十年后自动覆盖 ================= */\n';
    for (const c of SAKURA_TOKI_OVERRIDES) {
      if (!c || !Array.isArray(c.chars) || !c.chars.length) continue;
      const sel = c.chars.map(function (n) {
        const e = escCssStr(n);
        return '[data-char="' + e + '"], [data-char^="' + e + '·"]';
      }).join(', ');
      const head = B + sel + BOOST;
      const actions = (c.actions && typeof c.actions === 'object') ? c.actions : null;
      const baseAvatar = c.avatar || '';
      const hasPortrait = !!c.portrait;

      out += head + ' {\n'
           + '  --main: ' + c.main + ' !important;\n'
           + '  --sub: ' + c.sub + ' !important;\n'
           + '  --rgb: ' + c.rgb + ' !important;\n'
           + '  --motion-color: ' + c.motion + ' !important;\n'
           + '}\n';

      if (baseAvatar || c.blush) {
        out += head + ' .custom-nvn-avatar-img {\n';
        if (baseAvatar) out += '  background-image: url("' + escCssStr(baseAvatar) + '") !important;\n';
        if (c.blush) {
          out += '  --nvn-blush: url("' + escCssStr(c.blush) + '") !important;\n'
               + '  --nvn-blush-display: block !important;\n';
        } else {
          out += '  --nvn-blush-display: none !important;\n';
        }
        out += '  border: 1.5px solid rgba(var(--rgb), 0.78) !important;\n'
             + '  box-shadow: 0 8px 22px var(--halo), inset 0 0 14px rgba(var(--rgb), 0.12) !important;\n'
             + ((c.big || hasPortrait) ? '  cursor: pointer !important;\n' : '  cursor: default !important;\n')
             + '}\n';
        out += head + ' .custom-nvn-avatar-fallback-box { display: none !important; }\n';
      }

      if (actions) {
        const entries = Object.entries(actions).filter(function (kv) { return kv[0] && kv[1]; });
        entries.sort(function (a, b) { return a[0].length - b[0].length; });
        for (const kv of entries) {
          out += head + '[data-action*="' + escCssStr(kv[0]) + '"] .custom-nvn-avatar-img {\n'
               + '  background-image: url("' + escCssStr(kv[1]) + '") !important;\n'
               + '}\n';
        }
      }

      if (hasPortrait) {
        out += head + ' .custom-nvn-portrait-full {\n  content: url("' + escCssStr(c.portrait) + '") !important;\n}\n';
        out += head + ' .custom-nvn-avatar-popover { pointer-events: auto !important; }\n';
      } else {
        out += head + ' .custom-nvn-avatar-popover { pointer-events: none !important; }\n';
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
div.custom-nvn-dialogue[data-char*="玛丽·安"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/mali-an/normal.webp") !important; }
[data-char*="克蕾雅"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal.webp") !important; }
[data-char*="克蕾雅"][data-action*="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smug.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smug-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smirk.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smirk-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/shy.webp") !important; }
[data-char*="克蕾雅"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/surprised.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/surprised-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/happy.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/happy-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/sad.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/sad-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/puzzled.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/puzzled-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/angry.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/angry-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="皱眉"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/frown.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红皱眉"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/frown-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/thinking.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/thinking-blush.webp") !important; }

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
div.custom-nvn-dialogue:is([data-char*="克蕾雅"], [data-char*="卢克蕾齐雅"]) .custom-nvn-portrait-full { content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/full.webp") !important; }

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
div.custom-nvn-dialogue[data-char*="玛丽·安"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/mali-an/normal.webp") !important; }
[data-char*="克蕾雅"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal.webp") !important; }
[data-char*="克蕾雅"][data-action*="脸红"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红通常"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/normal-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smug.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红得意"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smug-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smirk.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红腹黑笑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/smirk-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="害羞"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/shy.webp") !important; }
[data-char*="克蕾雅"][data-action="惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/surprised.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红惊讶"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/surprised-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/happy.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红高兴"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/happy-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/sad.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红难过"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/sad-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/puzzled.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红疑惑"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/puzzled-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/angry.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红生气"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/angry-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="皱眉"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/frown.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红皱眉"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/frown-blush.webp") !important; }
[data-char*="克蕾雅"][data-action="思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/thinking.webp") !important; }
[data-char*="克蕾雅"][data-action="脸红思考"] .custom-nvn-avatar-img { background-image: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/thinking-blush.webp") !important; }

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
div.custom-nvn-dialogue:is([data-char*="克蕾雅"], [data-char*="卢克蕾齐雅"]) .custom-nvn-portrait-full { content: url("https://fastly.jsdelivr.net/gh/jianchi89/galworld-assets@main/assets/jiukashili/keleiya/full.webp") !important; }

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
      const castIs = effectiveCastIs();
      cache[theme] = CSS[theme].split('__CAST_IS__').join(castIs)
        + CAST_CSS
        + buildNewCharacterCss()
        + buildSakuraTokiCss();
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

/* ====== 月丘晶子 / 黑萤：共用立绘并水平镜像翻转 ====== */
#chat div.custom-nvn-dialogue[data-char="月丘晶子"] .custom-nvn-avatar-img:not(#nvn-modern-boost),
#chat div.custom-nvn-dialogue[data-char="月丘晶子"] .custom-nvn-portrait-full:not(#nvn-modern-boost),
#chat div.custom-nvn-dialogue[data-char="黑萤"] .custom-nvn-avatar-img:not(#nvn-modern-boost),
#chat div.custom-nvn-dialogue[data-char="黑萤"] .custom-nvn-portrait-full:not(#nvn-modern-boost) {
  transform: scaleX(-1) !important;
}

/* ====== 7. 分离式脸红叠加层（data-action 含「脸红」时，自动叠上该角色的 --nvn-blush） ======
   素材 = 普通底图 + 200×250 透明脸红层；老角色没配 --nvn-blush 时变量为空 → display:none，不会重影。
   玩家头像脚本塞了行内 background-image 的行（[style*=background-image]）自动跳过。 */
:is(#chat, .mes_text) div.custom-nvn-dialogue[data-action*="脸红"] .custom-nvn-avatar-img:not(#nvn-modern-boost):not([style*="background-image"]):not([data-wn-ua-applied="1"])::after {
  content: "" !important;
  display: var(--nvn-blush-display, none) !important;
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border: 0 !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  background-image: var(--nvn-blush, none) !important;
  background-size: cover !important;
  background-position: var(--nvn-blush-pos, center top) !important;
  background-repeat: no-repeat !important;
  image-rendering: -webkit-optimize-contrast !important;
  opacity: var(--nvn-blush-opacity, 1) !important;
  box-shadow: none !important;
  pointer-events: none !important;
  z-index: 1 !important;
}
`;

  function pageCss(theme) {
    const d = D_LAYOUT_CSS[theme] || D_LAYOUT_CSS.dark;
    return fullCss(theme) + LAYOUT_PATCH_CSS + d.split('__CAST_IS__').join(effectiveCastIs()) + STREAM_FIX_CSS;
  }

  function apply(theme, force) {
    if (!Object.prototype.hasOwnProperty.call(CSS, theme)) theme = 'dark';
    if (!force && theme === current && styleEl && styleEl.isConnected) return;

    HD = getHostDoc();
    const head = HD.head || HD.documentElement;
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
      const stopBtn = HD.getElementById && HD.getElementById('mes_stop');
      if (stopBtn) {
        const cs = (HW.getComputedStyle || window.getComputedStyle)(stopBtn);
        if (cs && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0') return true;
      }
      if (HW.is_send_press === true) return true;
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
      syncSakuraToki(false);
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
        ['WORLDINFO_UPDATED',  'worldinfo_updated'],
      ];
      for (const p of pairs) {
        const name = (ET && ET[p[0]]) || p[1];
        try {
          on(name, function () {
            if (p[1] === 'worldinfo_updated' || p[1] === 'chat_changed' || p[1] === 'character_selected') {
              syncSakuraToki(true);
            }
            schedule(150);
          });
        } catch (_) {}
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
    try { if (HW.__NVN_DLG_VERSION__ === VERSION) delete HW.__NVN_DLG_VERSION__; } catch (_) {}
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

  /* ---------------- 头像断链自动换源 + 破缓存重试引擎 ---------------- */
  const AV_FB_STYLE_ID = 'nvn-avatar-fb-style';
  const AV_STATE = new Map(); /* key -> { state:'loading'|'ok'|'fixed'|'failed', fixedUrl, id, failedAt } */
  let avFbSeq = 0;
  let avFbInited = false;

  function extractCssUrl(val) {
    const m = String(val || '').match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
    if (!m || !m[1]) return '';
    const u = m[1].trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  function buildAvatarFallbacks(url) {
    const out = [];
    const add = function (u) { if (u && u !== url && out.indexOf(u) === -1) out.push(u); };
    const m = url.match(/^https:\/\/(?:fastly|gcore|cdn)\.jsdelivr\.net\/gh\/([^/]+\/[^/@]+)@([^/]+)\//i);
    if (m) {
      const repo = m[1], ref = m[2], rest = url.slice(m[0].length);
      add('https://gcore.jsdelivr.net/gh/' + repo + '@' + ref + '/' + rest);
      add('https://cdn.jsdelivr.net/gh/' + repo + '@' + ref + '/' + rest);
      add('https://raw.githubusercontent.com/' + repo + '/' + ref + '/' + rest);
    }
    /* 最后用带时间戳的破缓存原链重试一次，彻底绕开浏览器失败内存缓存 */
    add(url + (url.indexOf('?') === -1 ? '?' : '&') + '_r=' + Date.now());
    return out;
  }

  function ensureFbRule(id, goodUrl, isBlush) {
    try {
      let el = HD.getElementById ? HD.getElementById(AV_FB_STYLE_ID) : null;
      if (!avFbInited) {
        avFbInited = true;
        if (el) { el.remove(); el = null; }
      }
      if (!el) {
        el = HD.createElement('style');
        el.id = AV_FB_STYLE_ID;
        (HD.head || HD.documentElement).appendChild(el);
      }
      const marker = '/*fb:' + (isBlush ? 'b' : 'a') + id + '*/';
      if (el.textContent.indexOf(marker) !== -1) return;
      const esc = escCssStr(goodUrl);
      const rule = isBlush
        ? marker + ':is(#chat,.mes_text) div.custom-nvn-dialogue:not(#nvn-fb-a):not(#nvn-fb-b) .custom-nvn-avatar-img[data-nvn-blush-fb="' + id + '"]{--nvn-blush:url("' + esc + '") !important;}\n'
        : marker + ':is(#chat,.mes_text) div.custom-nvn-dialogue:not(#nvn-fb-a):not(#nvn-fb-b) .custom-nvn-avatar-img[data-nvn-fb="' + id + '"]{background-image:url("' + esc + '") !important;}\n';
      el.textContent += rule;
    } catch (_) {}
  }

  function applyFbToDom(origUrl, entry, isBlush) {
    try {
      const srcAttr = isBlush ? 'data-nvn-blush-src' : 'data-nvn-src';
      const fbAttr = isBlush ? 'data-nvn-blush-fb' : 'data-nvn-fb';
      ensureFbRule(entry.id, entry.fixedUrl, isBlush);
      for (const av of HD.querySelectorAll('.custom-nvn-avatar-img[' + srcAttr + ']')) {
        if (av.getAttribute(srcAttr) === origUrl) av.setAttribute(fbAttr, String(entry.id));
      }
    } catch (_) {}
  }

  function testImgLoad(url, timeoutMs) {
    return new Promise(function (resolve) {
      let done = false;
      const ImgCtor = HW.Image || Image;
      const img = new ImgCtor();
      const finish = function (ok) {
        if (done) return;
        done = true;
        clearTimeout(t);
        img.onload = img.onerror = null;
        resolve(ok);
      };
      const t = setTimeout(function () { finish(false); }, timeoutMs || 6500);
      img.onload = function () { finish(img.naturalWidth > 0); };
      img.onerror = function () { finish(false); };
      img.src = url;
    });
  }

  function guardAvatarUrl(origUrl, isBlush) {
    if (!origUrl) return;
    const key = (isBlush ? 'b:' : 'a:') + origUrl;
    const prev = AV_STATE.get(key);
    if (prev) {
      if (prev.state === 'ok' || prev.state === 'loading') return;
      if (prev.state === 'fixed') { applyFbToDom(origUrl, prev, isBlush); return; }
      if (prev.state === 'failed' && Date.now() - prev.failedAt < 15000) return;
    }
    const entry = prev || { state: 'loading', fixedUrl: '', id: 0, failedAt: 0 };
    entry.state = 'loading';
    AV_STATE.set(key, entry);

    testImgLoad(origUrl, 6000).then(async function (ok) {
      if (ok) { entry.state = 'ok'; return; }
      const cands = buildAvatarFallbacks(origUrl);
      for (const cand of cands) {
        if (await testImgLoad(cand, 7000)) {
          if (!entry.id) entry.id = ++avFbSeq;
          entry.state = 'fixed';
          entry.fixedUrl = cand;
          applyFbToDom(origUrl, entry, isBlush);
          return;
        }
      }
      entry.state = 'failed';
      entry.failedAt = Date.now();
    });
  }

  function retryFailedAvatars() {
    const now = Date.now();
    for (const kv of AV_STATE.entries()) {
      const k = kv[0], e = kv[1];
      if (e.state === 'failed' && now - e.failedAt >= 15000) {
        guardAvatarUrl(k.slice(2), k.indexOf('b:') === 0);
      }
    }
  }

  /* ---------------- 樱之刻世界书自动检测（[樱之刻][角色]🌸xxxx） ---------------- */
  const activeTokiChars = new Set();
  let lastTokiScanAt = 0;
  let tokiScanning = false;

  async function collectActiveWorldbookNames() {
    const names = new Set();
    const add = function (x) {
      if (!x) return;
      if (Array.isArray(x)) { for (const v of x) add(v); return; }
      if (typeof x === 'string' && x.trim()) names.add(x.trim());
    };
    try {
      const getCharWB = fn('getCharWorldbookNames');
      if (getCharWB) {
        const res = await getCharWB('current');
        if (res) { add(res.primary); add(res.additional); }
      }
    } catch (_) {}
    try {
      const getChatWB = fn('getChatWorldbookName');
      if (getChatWB) add(await getChatWB('current'));
    } catch (_) {}
    try {
      const getGlobalWB = fn('getGlobalWorldbookNames');
      if (getGlobalWB) add(await getGlobalWB());
    } catch (_) {}
    /* 兼容旧版酒馆助手 API */
    try {
      const f1 = fn('getCurrentCharPrimaryLorebook'); if (f1) add(await f1());
      const f2 = fn('getCharLorebooks'); if (f2) { const r = await f2(); if (r) { add(r.primary); add(r.additional); } }
      const f3 = fn('getGlobalLorebooks'); if (f3) add(await f3());
    } catch (_) {}
    /* 兜底直接读酒馆上下文 */
    try {
      const ctx = HW.SillyTavern && HW.SillyTavern.getContext && HW.SillyTavern.getContext();
      if (ctx) {
        const ch = (ctx.characterId !== undefined && ctx.characters) ? ctx.characters[ctx.characterId] : null;
        add(ch && ch.data && ch.data.extensions && ch.data.extensions.world);
        add(ctx.chatMetadata && ctx.chatMetadata.world_info);
      }
      add(HW.selected_world_info);
    } catch (_) {}
    return Array.from(names);
  }

  async function readWorldbookEntries(bookName) {
    try {
      const f = fn('getWorldbook');
      if (f) { const list = await f(bookName); if (Array.isArray(list)) return list; }
    } catch (_) {}
    try {
      const f = fn('getLorebookEntries');
      if (f) { const list = await f(bookName); if (Array.isArray(list)) return list; }
    } catch (_) {}
    try {
      const hdr = (HW.getRequestHeaders && HW.getRequestHeaders()) || { 'Content-Type': 'application/json' };
      const r = await (HW.fetch || fetch)('/api/worldinfo/get', {
        method: 'POST', headers: hdr, body: JSON.stringify({ name: bookName }),
      });
      if (r && r.ok) {
        const data = await r.json();
        if (data && data.entries) return Object.values(data.entries);
      }
    } catch (_) {}
    return [];
  }

  function isTokiChar(dc) {
    if (!dc || !activeTokiChars.size) return false;
    if (activeTokiChars.has(dc)) return true;
    for (const n of activeTokiChars) {
      if (dc.indexOf(n + '·') === 0) return true;
    }
    return false;
  }

  function applyTokiMarks(rows) {
    try {
      const changed = [];
      for (const row of rows) {
        const dc = String(row.getAttribute('data-char') || '');
        const want = isTokiChar(dc);
        const had = row.getAttribute('data-nvn-toki') === '1';
        if (want === had) continue;
        if (want) row.setAttribute('data-nvn-toki', '1');
        else row.removeAttribute('data-nvn-toki');
        /* 清理断链检测旧缓存，防止把新立绘换回旧图 */
        for (const av of row.querySelectorAll('.custom-nvn-avatar-img')) {
          av.removeAttribute('data-nvn-src');
          av.removeAttribute('data-nvn-blush-src');
          av.removeAttribute('data-nvn-fb');
          av.removeAttribute('data-nvn-blush-fb');
        }
        changed.push(row);
      }
      if (changed.length) markAvatars(changed);
    } catch (_) {}
  }

  async function syncSakuraToki(force) {
    if (!alive || tokiScanning) return;
    const now = Date.now();
    if (!force && now - lastTokiScanAt < 2500) return;
    tokiScanning = true;
    lastTokiScanAt = now;
    try {
      const books = await collectActiveWorldbookNames();
      const nextSet = new Set();
      for (const book of books) {
        const entries = await readWorldbookEntries(book);
        for (const e of entries) {
          if (!e) continue;
          const enabled = (typeof e.enabled === 'boolean') ? e.enabled : !e.disable;
          if (!enabled) continue;
          const title = String(e.name || e.comment || '');
          if (title.indexOf('[樱之刻]') === -1 || title.indexOf('[角色]') === -1) continue;
          const m = title.match(/\[樱之刻\]\s*\[角色\]\s*🌸?\s*([^\s（(·•—\-|/]+)/);
          const extracted = m ? m[1] : '';
          for (const c of SAKURA_TOKI_OVERRIDES) {
            const hit = c.chars.some(function (n) {
              return extracted === n || title.indexOf('🌸' + n) !== -1 || title.indexOf(']' + n) !== -1;
            });
            if (hit) { for (const n of c.chars) nextSet.add(n); }
          }
        }
      }
      let diff = nextSet.size !== activeTokiChars.size;
      if (!diff) { for (const n of nextSet) { if (!activeTokiChars.has(n)) { diff = true; break; } } }
      if (diff) {
        activeTokiChars.clear();
        for (const n of nextSet) activeTokiChars.add(n);
        applyTokiMarks(Array.from(HD.querySelectorAll('.custom-nvn-dialogue')));
      }
    } catch (_) {} finally {
      tokiScanning = false;
    }
  }

  /* ---------------- 增量 DOM 处理函数 ---------------- */
  function markAvatars(rows) {
    try {
      const gs = HW.getComputedStyle || window.getComputedStyle;
      for (const row of rows) {
        for (const av of row.querySelectorAll('.custom-nvn-avatar-img')) {
          let has = false;
          let cssUrl = '';
          let blushUrl = '';
          try {
            const st = av.getAttribute('style');
            if (st && /background-image/i.test(st)) has = true;
            else if (av.getAttribute('data-wn-ua-applied')) has = true;
            else {
              const cs = gs(av);
              const bi = String(cs.backgroundImage || '');
              has = bi.indexOf('url(') !== -1;
              if (has) {
                cssUrl = av.getAttribute('data-nvn-src') || extractCssUrl(bi);
                blushUrl = av.getAttribute('data-nvn-blush-src') || extractCssUrl(cs.getPropertyValue('--nvn-blush'));
              }
            }
          } catch (_) {}
          if (has) {
            av.setAttribute('data-nvn-has-avatar', '1');
            if (cssUrl) {
              av.setAttribute('data-nvn-src', cssUrl);
              guardAvatarUrl(cssUrl, false);
            }
            if (blushUrl) {
              av.setAttribute('data-nvn-blush-src', blushUrl);
              guardAvatarUrl(blushUrl, true);
            }
          } else {
            av.removeAttribute('data-nvn-has-avatar');
          }
        }
      }
      for (const av of HD.querySelectorAll('.custom-nvn-avatar-img:not([data-nvn-has-avatar="1"])')) {
        const st = av.getAttribute('style');
        if ((st && /background-image/i.test(st)) || av.getAttribute('data-wn-ua-applied')) {
          av.setAttribute('data-nvn-has-avatar', '1');
        }
      }
      retryFailedAvatars();
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
      applyTokiMarks(newRows);
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
    try { const fb = HD.getElementById && HD.getElementById('nvn-avatar-fb-style'); if (fb) fb.remove(); } catch (_) {}
    try { if (HW[SLOT] && HW[SLOT].destroy === destroy) delete HW[SLOT]; } catch (_) {}
    try { if (HW.__NVN_DLG_VERSION__ === VERSION) delete HW.__NVN_DLG_VERSION__; } catch (_) {}
    try {
      window.removeEventListener('pagehide', destroy);
      window.removeEventListener('unload', destroy);
      HW.removeEventListener('beforeunload', destroy);
      HW.removeEventListener('pagehide', destroy);
    } catch (_) {}
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
    try {
      window.addEventListener('pagehide', destroy);
      window.addEventListener('unload', destroy);
      HW.addEventListener('beforeunload', destroy);
      HW.addEventListener('pagehide', destroy);
    } catch (_) {}

    apply(userTheme || 'dark', true);
    injectToggles();
    syncSakuraToki(true);
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
