// 常用高频词根词缀总表
// type: prefix(前缀) / root(词根) / suffix(后缀)
// words 每项: [单词, 中文释义, 拆解说明]

export const AFFIX_TYPES = {
  prefix: { label: '前缀', en: 'PREFIX' },
  root: { label: '词根', en: 'ROOT' },
  suffix: { label: '后缀', en: 'SUFFIX' },
}

export const affixData = [
  // ==================== 前缀 ====================
  { type: 'prefix', form: 're-', meaning: '再次；回', en: 'again / back', words: [
    ['return', '返回；归还', 're + turn 转'],
    ['review', '复习；回顾', 're + view 看'],
    ['rebuild', '重建', 're + build 建造'],
    ['recycle', '回收利用', 're + cycle 循环'],
  ] },
  { type: 'prefix', form: 'un-', meaning: '不；相反', en: 'not', words: [
    ['unhappy', '不开心的', 'un + happy 快乐'],
    ['unable', '不能的', 'un + able 能'],
    ['unfair', '不公平的', 'un + fair 公平'],
    ['unlock', '解锁', 'un + lock 锁'],
  ] },
  { type: 'prefix', form: 'in- / im- / il- / ir-', meaning: '不；向内', en: 'not / into', words: [
    ['invisible', '看不见的', 'in + vis 看 + ible'],
    ['impossible', '不可能的', 'im + possible 可能'],
    ['illegal', '非法的', 'il + legal 合法'],
    ['irregular', '不规则的', 'ir + regular 规则'],
    ['input', '输入', 'in + put 放'],
  ] },
  { type: 'prefix', form: 'dis-', meaning: '不；分开', en: 'not / apart', words: [
    ['disappear', '消失', 'dis + appear 出现'],
    ['disagree', '不同意', 'dis + agree 同意'],
    ['disconnect', '断开', 'dis + connect 连接'],
    ['dishonest', '不诚实的', 'dis + honest 诚实'],
  ] },
  { type: 'prefix', form: 'pre-', meaning: '在前；预先', en: 'before', words: [
    ['predict', '预测', 'pre + dict 说'],
    ['preview', '预览', 'pre + view 看'],
    ['prepare', '准备', 'pre + pare 准备'],
    ['prevent', '阻止', 'pre + vent 来'],
  ] },
  { type: 'prefix', form: 'mis-', meaning: '错误', en: 'wrong', words: [
    ['mistake', '错误', 'mis + take 拿'],
    ['misunderstand', '误解', 'mis + understand 理解'],
    ['misspell', '拼错', 'mis + spell 拼写'],
    ['mislead', '误导', 'mis + lead 引导'],
  ] },
  { type: 'prefix', form: 'non-', meaning: '非；无', en: 'not', words: [
    ['nonstop', '不停的', 'non + stop 停'],
    ['nonsense', '胡说', 'non + sense 意义'],
    ['nonprofit', '非营利的', 'non + profit 利润'],
  ] },
  { type: 'prefix', form: 'ex-', meaning: '向外；前任', en: 'out / former', words: [
    ['export', '出口', 'ex + port 携带'],
    ['exit', '出口；退出', 'ex + it 走'],
    ['extend', '延伸', 'ex + tend 伸展'],
    ['ex-president', '前总统', 'ex + president 总统'],
  ] },
  { type: 'prefix', form: 'de-', meaning: '向下；去除', en: 'down / away', words: [
    ['decrease', '减少', 'de + crease 生长'],
    ['depart', '离开', 'de + part 部分'],
    ['delete', '删除', 'de + lete'],
    ['defend', '防御', 'de + fend 打击'],
  ] },
  { type: 'prefix', form: 'co- / com- / con-', meaning: '共同；一起', en: 'together', words: [
    ['cooperate', '合作', 'co + operate 操作'],
    ['connect', '连接', 'con + nect 绑'],
    ['combine', '结合', 'com + bine'],
    ['community', '社区', 'com + mun 服务 + ity'],
  ] },
  { type: 'prefix', form: 'sub-', meaning: '下；次', en: 'under', words: [
    ['subway', '地铁', 'sub + way 路'],
    ['subtitle', '字幕', 'sub + title 标题'],
    ['submit', '提交', 'sub + mit 送'],
    ['suburb', '郊区', 'sub + urb 城市'],
  ] },
  { type: 'prefix', form: 'trans-', meaning: '跨越；转移', en: 'across', words: [
    ['transport', '运输', 'trans + port 携带'],
    ['translate', '翻译', 'trans + late'],
    ['transfer', '转移', 'trans + fer 拿'],
    ['transform', '转变', 'trans + form 形状'],
  ] },
  { type: 'prefix', form: 'pro-', meaning: '向前；支持', en: 'forward', words: [
    ['progress', '进步', 'pro + gress 走'],
    ['promote', '促进', 'pro + mote 动'],
    ['protect', '保护', 'pro + tect 覆盖'],
    ['provide', '提供', 'pro + vide 看'],
  ] },
  { type: 'prefix', form: 'anti-', meaning: '反对；抵抗', en: 'against', words: [
    ['antibiotic', '抗生素', 'anti + bio 生命 + tic'],
    ['antisocial', '反社会的', 'anti + social 社会'],
    ['antiwar', '反战的', 'anti + war 战争'],
  ] },
  { type: 'prefix', form: 'over-', meaning: '过度；在上', en: 'over', words: [
    ['overdo', '做得过火', 'over + do 做'],
    ['overlook', '俯瞰；忽视', 'over + look 看'],
    ['overseas', '海外的', 'over + seas 海'],
  ] },
  { type: 'prefix', form: 'under-', meaning: '不足；在下', en: 'under', words: [
    ['understand', '理解', 'under + stand 站'],
    ['underline', '下划线', 'under + line 线'],
    ['underestimate', '低估', 'under + estimate 估计'],
  ] },
  { type: 'prefix', form: 'inter-', meaning: '之间；相互', en: 'between', words: [
    ['internet', '互联网', 'inter + net 网'],
    ['international', '国际的', 'inter + nation 国家 + al'],
    ['interview', '面试；采访', 'inter + view 看'],
    ['interact', '互动', 'inter + act 行动'],
  ] },
  { type: 'prefix', form: 'multi-', meaning: '多', en: 'many', words: [
    ['multimedia', '多媒体', 'multi + media 媒介'],
    ['multiply', '乘；增加', 'multi + ply 折叠'],
    ['multicultural', '多元文化的', 'multi + cultural 文化的'],
  ] },
  { type: 'prefix', form: 'super-', meaning: '超级；上', en: 'super', words: [
    ['supermarket', '超市', 'super + market 市场'],
    ['superstar', '巨星', 'super + star 星'],
    ['superior', '优越的', 'super + ior'],
  ] },
  { type: 'prefix', form: 'auto-', meaning: '自己', en: 'self', words: [
    ['automatic', '自动的', 'auto + matic'],
    ['autobiography', '自传', 'auto + bio 生命 + graphy 写'],
    ['autograph', '亲笔签名', 'auto + graph 写'],
  ] },
  { type: 'prefix', form: 'bi-', meaning: '二；两', en: 'two', words: [
    ['bicycle', '自行车', 'bi + cycle 轮'],
    ['bilingual', '双语的', 'bi + lingual 语言的'],
    ['biannual', '一年两次的', 'bi + annual 年度的'],
  ] },
  { type: 'prefix', form: 'tri-', meaning: '三', en: 'three', words: [
    ['triangle', '三角形', 'tri + angle 角'],
    ['tricycle', '三轮车', 'tri + cycle 轮'],
    ['triple', '三倍的', 'tri + ple'],
  ] },
  { type: 'prefix', form: 'semi-', meaning: '半', en: 'half', words: [
    ['semifinal', '半决赛', 'semi + final 决赛'],
    ['semicircle', '半圆', 'semi + circle 圆'],
    ['semicolon', '分号', 'semi + colon 冒号'],
  ] },
  { type: 'prefix', form: 'uni-', meaning: '一；单一', en: 'one', words: [
    ['uniform', '制服', 'uni + form 形状'],
    ['unique', '独一无二的', 'uni + que'],
    ['unit', '单元', 'uni + t'],
  ] },
  { type: 'prefix', form: 'en- / em-', meaning: '使成为', en: 'make', words: [
    ['enable', '使能够', 'en + able 能'],
    ['encourage', '鼓励', 'en + courage 勇气'],
    ['empower', '授权', 'em + power 权力'],
  ] },
  { type: 'prefix', form: 'fore-', meaning: '前；预先', en: 'before', words: [
    ['forecast', '预报', 'fore + cast 投掷'],
    ['forehead', '前额', 'fore + head 头'],
    ['foresee', '预见', 'fore + see 看'],
  ] },
  { type: 'prefix', form: 'post-', meaning: '之后', en: 'after', words: [
    ['postpone', '推迟', 'post + pone 放'],
    ['postwar', '战后的', 'post + war 战争'],
    ['postgraduate', '研究生', 'post + graduate 毕业'],
  ] },
  { type: 'prefix', form: 'mid-', meaning: '中间', en: 'middle', words: [
    ['midnight', '午夜', 'mid + night 夜'],
    ['midday', '正午', 'mid + day 日'],
    ['midterm', '期中', 'mid + term 学期'],
  ] },
  { type: 'prefix', form: 'tele-', meaning: '远距离', en: 'distance', words: [
    ['telephone', '电话', 'tele + phone 声音'],
    ['television', '电视', 'tele + vision 看'],
    ['telegram', '电报', 'tele + gram 写'],
  ] },

  // ==================== 词根 ====================
  { type: 'root', form: 'port', meaning: '携带', en: 'carry', words: [
    ['transport', '运输', 'trans 跨越 + port 携带'],
    ['import', '进口', 'im 进入 + port 携带'],
    ['export', '出口', 'ex 出去 + port 携带'],
    ['portable', '便携的', 'port 携带 + able 可'],
  ] },
  { type: 'root', form: 'spect', meaning: '看', en: 'look', words: [
    ['inspect', '检查', 'in 向内 + spect 看'],
    ['respect', '尊重', 're 再 + spect 看'],
    ['spectator', '观众', 'spect 看 + ator 人'],
    ['expect', '期望', 'ex 向外 + spect 看'],
  ] },
  { type: 'root', form: 'dict', meaning: '说；断言', en: 'say', words: [
    ['predict', '预言', 'pre 预先 + dict 说'],
    ['dictionary', '词典', 'dict 说 + ion + ary'],
    ['dictate', '口述；命令', 'dict 说 + ate'],
    ['contradict', '反驳', 'contra 反对 + dict 说'],
  ] },
  { type: 'root', form: 'duct / duc', meaning: '引导', en: 'lead', words: [
    ['conduct', '引导；行为', 'con 共同 + duct 引导'],
    ['introduce', '介绍', 'intro 向内 + duce 引导'],
    ['reduce', '减少', 're 回 + duce 引导'],
    ['produce', '生产', 'pro 向前 + duce 引导'],
  ] },
  { type: 'root', form: 'struct', meaning: '建造', en: 'build', words: [
    ['construct', '建造', 'con 共同 + struct 建造'],
    ['structure', '结构', 'struct 建造 + ure'],
    ['destroy', '摧毁', 'de 去除 + stroy 建造'],
    ['instruction', '说明', 'in 向内 + struct 建造 + ion'],
  ] },
  { type: 'root', form: 'scrib / script', meaning: '写', en: 'write', words: [
    ['describe', '描述', 'de 向下 + scribe 写'],
    ['prescription', '处方', 'pre 预先 + script 写 + ion'],
    ['manuscript', '手稿', 'manu 手 + script 写'],
    ['script', '脚本', 'script 写'],
  ] },
  { type: 'root', form: 'graph / gram', meaning: '写；画', en: 'write', words: [
    ['photograph', '照片', 'photo 光 + graph 画'],
    ['grammar', '语法', 'gram 写 + mar'],
    ['telegram', '电报', 'tele 远 + gram 写'],
    ['biography', '传记', 'bio 生命 + graphy 写'],
  ] },
  { type: 'root', form: 'voc / vok', meaning: '声音；喊', en: 'voice', words: [
    ['vocabulary', '词汇', 'voc 声音 + abul + ary'],
    ['vocal', '声音的', 'voc 声音 + al'],
    ['provoke', '激怒', 'pro 向前 + voke 喊'],
    ['advocate', '提倡', 'ad 朝向 + voc 喊 + ate'],
  ] },
  { type: 'root', form: 'form', meaning: '形状', en: 'shape', words: [
    ['inform', '通知', 'in 向内 + form 成形'],
    ['reform', '改革', 're 再 + form 形状'],
    ['transform', '转变', 'trans 跨越 + form 形状'],
    ['uniform', '制服', 'uni 一 + form 形状'],
  ] },
  { type: 'root', form: 'fact / fect', meaning: '做', en: 'make', words: [
    ['factory', '工厂', 'fact 做 + ory 场所'],
    ['manufacture', '制造', 'manu 手 + fact 做 + ure'],
    ['effect', '效果', 'ef 出 + fect 做'],
    ['perfect', '完美的', 'per 完全 + fect 做'],
  ] },
  { type: 'root', form: 'tract', meaning: '拉', en: 'pull', words: [
    ['attract', '吸引', 'at 朝向 + tract 拉'],
    ['extract', '提取', 'ex 出 + tract 拉'],
    ['contract', '合同；收缩', 'con 共同 + tract 拉'],
    ['subtract', '减去', 'sub 向下 + tract 拉'],
  ] },
  { type: 'root', form: 'mit / miss', meaning: '送；放出', en: 'send', words: [
    ['transmit', '传送', 'trans 跨越 + mit 送'],
    ['admit', '承认', 'ad 朝向 + mit 送'],
    ['mission', '使命', 'miss 送 + ion'],
    ['permission', '允许', 'per 通过 + miss 送 + ion'],
  ] },
  { type: 'root', form: 'tend / tent', meaning: '伸展', en: 'stretch', words: [
    ['extend', '延伸', 'ex 向外 + tend 伸展'],
    ['attend', '出席；照顾', 'at 朝向 + tend 伸展'],
    ['intention', '意图', 'in 向内 + tent 伸展 + ion'],
    ['tendency', '趋势', 'tend 伸展 + ency'],
  ] },
  { type: 'root', form: 'ven / vent', meaning: '来', en: 'come', words: [
    ['prevent', '阻止', 'pre 预先 + vent 来'],
    ['event', '事件', 'e 出 + vent 来'],
    ['invention', '发明', 'in 向内 + vent 来 + ion'],
    ['adventure', '冒险', 'ad 朝向 + vent 来 + ure'],
  ] },
  { type: 'root', form: 'vid / vis', meaning: '看', en: 'see', words: [
    ['video', '视频', 'vid 看 + eo'],
    ['visible', '看得见的', 'vis 看 + ible 可'],
    ['revise', '修订', 're 再 + vis 看 + e'],
    ['television', '电视', 'tele 远 + vision 看'],
  ] },
  { type: 'root', form: 'vert / vers', meaning: '转', en: 'turn', words: [
    ['convert', '转变', 'con 完全 + vert 转'],
    ['reverse', '反转', 're 回 + verse 转'],
    ['version', '版本', 'vers 转 + ion'],
    ['advertisement', '广告', 'ad + vert 转 + ise + ment'],
  ] },
  { type: 'root', form: 'volv / volut', meaning: '滚；转', en: 'roll', words: [
    ['involve', '涉及', 'in 进入 + volve 滚'],
    ['revolution', '革命', 're 回 + volut 转 + ion'],
    ['evolve', '进化', 'e 出 + volve 滚'],
    ['volume', '卷；体积', 'vol 转 + ume'],
  ] },
  { type: 'root', form: 'cred', meaning: '相信', en: 'believe', words: [
    ['credit', '信用', 'cred 相信 + it'],
    ['incredible', '难以置信的', 'in 不 + cred 相信 + ible'],
    ['creed', '信条', 'cred 相信的变体'],
  ] },
  { type: 'root', form: 'jur / jus', meaning: '法律；正义', en: 'law', words: [
    ['justice', '正义', 'just 正义 + ice'],
    ['jury', '陪审团', 'jur 法律 + y'],
    ['justify', '证明有理', 'just 正义 + ify 使'],
    ['injure', '伤害', 'in 不 + jure 正确'],
  ] },
  { type: 'root', form: 'leg / lect', meaning: '读；选择', en: 'read / choose', words: [
    ['lecture', '讲座', 'lect 读 + ure'],
    ['collect', '收集', 'col 共同 + lect 选择'],
    ['select', '选择', 'se 分开 + lect 选择'],
    ['legend', '传说', 'leg 读 + end'],
  ] },
  { type: 'root', form: 'luc / lum', meaning: '光', en: 'light', words: [
    ['illuminate', '照亮', 'il 向内 + lumin 光 + ate'],
    ['luminous', '发光的', 'lumin 光 + ous'],
    ['illustrate', '说明；图解', 'il + lustr 光 + ate'],
  ] },
  { type: 'root', form: 'manu / man', meaning: '手', en: 'hand', words: [
    ['manual', '手册；手工的', 'manu 手 + al'],
    ['manage', '管理', 'man 手 + age'],
    ['manufacture', '制造', 'manu 手 + fact 做 + ure'],
    ['manuscript', '手稿', 'manu 手 + script 写'],
  ] },
  { type: 'root', form: 'mem', meaning: '记忆', en: 'remember', words: [
    ['memory', '记忆', 'mem 记忆 + ory'],
    ['remember', '记得', 're 再 + member 记忆'],
    ['memorial', '纪念碑', 'memori 记忆 + al'],
  ] },
  { type: 'root', form: 'mot / mob / mov', meaning: '动', en: 'move', words: [
    ['motion', '运动', 'mot 动 + ion'],
    ['mobile', '移动的', 'mob 动 + ile'],
    ['move', '移动', 'mov 动 + e'],
    ['promote', '促进', 'pro 向前 + mote 动'],
  ] },
  { type: 'root', form: 'nat', meaning: '出生；自然', en: 'born', words: [
    ['nature', '自然', 'nat 出生 + ure'],
    ['native', '本地的', 'nat 出生 + ive'],
    ['nation', '国家', 'nat 出生 + ion'],
    ['international', '国际的', 'inter 之间 + nation 国家 + al'],
  ] },
  { type: 'root', form: 'nov', meaning: '新', en: 'new', words: [
    ['novel', '小说；新颖的', 'nov 新 + el'],
    ['innovate', '创新', 'in 进入 + nov 新 + ate'],
    ['renovate', '翻新', 're 再 + nov 新 + ate'],
  ] },
  { type: 'root', form: 'path', meaning: '感情；疾病', en: 'feeling', words: [
    ['sympathy', '同情', 'sym 相同 + pathy 感情'],
    ['empathy', '共情', 'em 进入 + pathy 感情'],
    ['apathy', '冷漠', 'a 无 + pathy 感情'],
    ['pathetic', '可怜的', 'path 感情 + etic'],
  ] },
  { type: 'root', form: 'ped', meaning: '脚', en: 'foot', words: [
    ['pedal', '踏板', 'ped 脚 + al'],
    ['pedestrian', '行人', 'ped 脚 + estrian'],
    ['expedition', '远征', 'ex 出 + ped 脚 + ition'],
  ] },
  { type: 'root', form: 'phon', meaning: '声音', en: 'sound', words: [
    ['telephone', '电话', 'tele 远 + phone 声音'],
    ['microphone', '麦克风', 'micro 小 + phone 声音'],
    ['symphony', '交响乐', 'sym 共同 + phony 声音'],
  ] },
  { type: 'root', form: 'psych', meaning: '心灵', en: 'mind', words: [
    ['psychology', '心理学', 'psych 心灵 + ology 学'],
    ['psychic', '通灵的', 'psych 心灵 + ic'],
  ] },
  { type: 'root', form: 'punct', meaning: '点；刺', en: 'point', words: [
    ['punctuation', '标点', 'punct 点 + uation'],
    ['punctual', '准时的', 'punct 点 + ual'],
    ['acupuncture', '针灸', 'acu 针 + punct 刺 + ure'],
  ] },
  { type: 'root', form: 'sci', meaning: '知道', en: 'know', words: [
    ['science', '科学', 'sci 知道 + ence'],
    ['conscious', '有意识的', 'con 共同 + sci 知道 + ous'],
    ['scientist', '科学家', 'sci 知道 + ent + ist 人'],
  ] },
  { type: 'root', form: 'sens / sent', meaning: '感觉', en: 'feel', words: [
    ['sense', '感觉', 'sens 感觉 + e'],
    ['sentence', '句子；判决', 'sent 感觉 + ence'],
    ['sensitive', '敏感的', 'sens 感觉 + itive'],
    ['consent', '同意', 'con 共同 + sent 感觉'],
  ] },
  { type: 'root', form: 'sign', meaning: '标记', en: 'mark', words: [
    ['signal', '信号', 'sign 标记 + al'],
    ['design', '设计', 'de 向下 + sign 标记'],
    ['signature', '签名', 'sign 标记 + ature'],
    ['assign', '分配', 'as 朝向 + sign 标记'],
  ] },
  { type: 'root', form: 'spir', meaning: '呼吸', en: 'breathe', words: [
    ['spirit', '精神', 'spir 呼吸 + it'],
    ['inspire', '激励', 'in 进入 + spire 呼吸'],
    ['expire', '到期', 'ex 出 + pire 呼吸'],
  ] },
  { type: 'root', form: 'sta / stit', meaning: '站立', en: 'stand', words: [
    ['station', '车站', 'sta 站立 + tion'],
    ['statue', '雕像', 'stat 站立 + ue'],
    ['constitute', '构成', 'con 共同 + stitute 站立'],
    ['standard', '标准', 'stand 站立 + ard'],
  ] },
  { type: 'root', form: 'tempor', meaning: '时间', en: 'time', words: [
    ['temporary', '临时的', 'tempor 时间 + ary'],
    ['contemporary', '当代的', 'con 共同 + tempor 时间 + ary'],
  ] },
  { type: 'root', form: 'terr', meaning: '土地；害怕', en: 'earth / fear', words: [
    ['territory', '领土', 'terr 土地 + itory'],
    ['terrible', '可怕的', 'terr 害怕 + ible'],
    ['terrific', '极好的', 'terr 害怕 + ific'],
  ] },
  { type: 'root', form: 'therm', meaning: '热', en: 'heat', words: [
    ['thermometer', '温度计', 'thermo 热 + meter 测量'],
    ['thermal', '热的', 'therm 热 + al'],
  ] },
  { type: 'root', form: 'val / vail', meaning: '价值', en: 'worth', words: [
    ['value', '价值', 'val 价值 + ue'],
    ['available', '可获得的', 'a 朝向 + vail 价值 + able'],
    ['evaluate', '评估', 'e 出 + valu 价值 + ate'],
  ] },
  { type: 'root', form: 'ver', meaning: '真', en: 'true', words: [
    ['verify', '核实', 'ver 真 + ify 使'],
    ['verdict', '裁决', 'ver 真 + dict 说'],
    ['very', '真正的；非常', 'ver 真 + y'],
  ] },
  { type: 'root', form: 'viv / vit', meaning: '活', en: 'live', words: [
    ['vivid', '生动的', 'viv 活 + id'],
    ['survive', '幸存', 'sur 超过 + vive 活'],
    ['vital', '至关重要的', 'vit 活 + al'],
    ['vitamin', '维生素', 'vit 活 + amin'],
  ] },
  { type: 'root', form: 'bio', meaning: '生命', en: 'life', words: [
    ['biology', '生物学', 'bio 生命 + logy 学'],
    ['biography', '传记', 'bio 生命 + graphy 写'],
    ['antibiotic', '抗生素', 'anti 反对 + bio 生命 + tic'],
  ] },
  { type: 'root', form: 'chron', meaning: '时间', en: 'time', words: [
    ['chronic', '慢性的', 'chron 时间 + ic'],
    ['chronology', '年表', 'chron 时间 + ology 学'],
    ['synchronize', '同步', 'syn 共同 + chron 时间 + ize'],
  ] },
  { type: 'root', form: 'log', meaning: '说；学科', en: 'speak / study', words: [
    ['dialogue', '对话', 'dia 相互 + logue 说'],
    ['logic', '逻辑', 'log 说 + ic'],
    ['biology', '生物学', 'bio 生命 + logy 学'],
    ['apology', '道歉', 'apo 远离 + logy 说'],
  ] },
  { type: 'root', form: 'sol', meaning: '单独', en: 'alone', words: [
    ['solo', '独奏；单独', 'sol 单独 + o'],
    ['solitude', '独处', 'sol 单独 + itude'],
    ['solitary', '孤独的', 'sol 单独 + itary'],
  ] },

  // ==================== 后缀 ====================
  { type: 'suffix', form: '-tion / -sion', meaning: '动作；状态（名词）', en: 'act / state', words: [
    ['education', '教育', 'educat 教育 + ion'],
    ['information', '信息', 'inform 告知 + ation'],
    ['decision', '决定', 'deci 决定 + sion'],
    ['discussion', '讨论', 'discuss 讨论 + ion'],
  ] },
  { type: 'suffix', form: '-ment', meaning: '行为；结果（名词）', en: 'result', words: [
    ['development', '发展', 'develop 发展 + ment'],
    ['government', '政府', 'govern 治理 + ment'],
    ['environment', '环境', 'environ 环绕 + ment'],
    ['agreement', '协议', 'agree 同意 + ment'],
  ] },
  { type: 'suffix', form: '-ness', meaning: '状态；性质（名词）', en: 'state', words: [
    ['happiness', '幸福', 'happy 快乐 + ness'],
    ['kindness', '善良', 'kind 善良 + ness'],
    ['darkness', '黑暗', 'dark 黑暗 + ness'],
  ] },
  { type: 'suffix', form: '-ity / -ty', meaning: '性质；状态（名词）', en: 'quality', words: [
    ['ability', '能力', 'able 能够 + ity'],
    ['activity', '活动', 'activ 活跃 + ity'],
    ['safety', '安全', 'safe 安全 + ty'],
    ['university', '大学', 'univers 宇宙 + ity'],
  ] },
  { type: 'suffix', form: '-er / -or', meaning: '做…的人 / 物', en: 'person / thing', words: [
    ['teacher', '教师', 'teach 教 + er'],
    ['worker', '工人', 'work 工作 + er'],
    ['actor', '演员', 'act 表演 + or'],
    ['inventor', '发明家', 'invent 发明 + or'],
  ] },
  { type: 'suffix', form: '-ist', meaning: '…的人（名词）', en: 'person', words: [
    ['scientist', '科学家', 'scien 科学 + tist'],
    ['artist', '艺术家', 'art 艺术 + ist'],
    ['pianist', '钢琴家', 'piano 钢琴 + ist'],
  ] },
  { type: 'suffix', form: '-ism', meaning: '主义；学说（名词）', en: 'doctrine', words: [
    ['tourism', '旅游业', 'tour 旅游 + ism'],
    ['optimism', '乐观', 'optim 最好 + ism'],
    ['capitalism', '资本主义', 'capital 资本 + ism'],
  ] },
  { type: 'suffix', form: '-ance / -ence', meaning: '性质；状态（名词）', en: 'state', words: [
    ['importance', '重要性', 'import 重要 + ance'],
    ['difference', '差异', 'differ 不同 + ence'],
    ['confidence', '自信', 'confid 相信 + ence'],
  ] },
  { type: 'suffix', form: '-hood', meaning: '时期；身份（名词）', en: 'status', words: [
    ['childhood', '童年', 'child 孩子 + hood'],
    ['neighborhood', '社区', 'neighbor 邻居 + hood'],
    ['adulthood', '成年', 'adult 成人 + hood'],
  ] },
  { type: 'suffix', form: '-ship', meaning: '关系；身份（名词）', en: 'relation', words: [
    ['friendship', '友谊', 'friend 朋友 + ship'],
    ['leadership', '领导力', 'leader 领导 + ship'],
    ['relationship', '关系', 'relation 联系 + ship'],
  ] },
  { type: 'suffix', form: '-dom', meaning: '领域；状态（名词）', en: 'state', words: [
    ['freedom', '自由', 'free 自由 + dom'],
    ['kingdom', '王国', 'king 国王 + dom'],
    ['wisdom', '智慧', 'wise 明智 + dom'],
  ] },
  { type: 'suffix', form: '-age', meaning: '行为；集合（名词）', en: 'act / collection', words: [
    ['marriage', '婚姻', 'marry 结婚 + age'],
    ['package', '包裹', 'pack 打包 + age'],
    ['shortage', '短缺', 'short 短 + age'],
  ] },
  { type: 'suffix', form: '-ure', meaning: '行为；结果（名词）', en: 'result', words: [
    ['culture', '文化', 'cult 耕作 + ure'],
    ['pressure', '压力', 'press 压 + ure'],
    ['pleasure', '快乐', 'pleas 使愉快 + ure'],
  ] },
  { type: 'suffix', form: '-ful', meaning: '充满…的（形容词）', en: 'full of', words: [
    ['careful', '小心的', 'care 小心 + ful'],
    ['beautiful', '美丽的', 'beauty 美 + ful'],
    ['useful', '有用的', 'use 使用 + ful'],
  ] },
  { type: 'suffix', form: '-less', meaning: '无…的（形容词）', en: 'without', words: [
    ['careless', '粗心的', 'care 小心 + less 无'],
    ['helpless', '无助的', 'help 帮助 + less'],
    ['endless', '无尽的', 'end 尽头 + less'],
  ] },
  { type: 'suffix', form: '-able / -ible', meaning: '可…的（形容词）', en: 'able to', words: [
    ['comfortable', '舒适的', 'comfort 舒适 + able'],
    ['visible', '可见的', 'vis 看 + ible'],
    ['acceptable', '可接受的', 'accept 接受 + able'],
  ] },
  { type: 'suffix', form: '-ous', meaning: '多…的；有…性质的', en: 'full of', words: [
    ['famous', '著名的', 'fame 名声 + ous'],
    ['dangerous', '危险的', 'danger 危险 + ous'],
    ['various', '各种各样的', 'vari 不同 + ous'],
  ] },
  { type: 'suffix', form: '-ive', meaning: '有…倾向的（形容词）', en: 'tending to', words: [
    ['active', '活跃的', 'act 行动 + ive'],
    ['creative', '有创造力的', 'creat 创造 + ive'],
    ['expensive', '昂贵的', 'expense 花费 + ive'],
  ] },
  { type: 'suffix', form: '-al', meaning: '与…有关的（形容词）', en: 'relating to', words: [
    ['national', '国家的', 'nation 国家 + al'],
    ['natural', '自然的', 'nature 自然 + al'],
    ['cultural', '文化的', 'culture 文化 + al'],
  ] },
  { type: 'suffix', form: '-ic / -ical', meaning: '与…有关的（形容词）', en: 'relating to', words: [
    ['basic', '基本的', 'base 基础 + ic'],
    ['economic', '经济的', 'economy 经济 + ic'],
    ['historical', '历史的', 'history 历史 + ical'],
  ] },
  { type: 'suffix', form: '-y', meaning: '多…的；像…的', en: 'full of', words: [
    ['sunny', '阳光充足的', 'sun 太阳 + y'],
    ['rainy', '下雨的', 'rain 雨 + y'],
    ['healthy', '健康的', 'health 健康 + y'],
  ] },
  { type: 'suffix', form: '-ish', meaning: '有点…的；…的', en: 'somewhat', words: [
    ['childish', '孩子气的', 'child 孩子 + ish'],
    ['selfish', '自私的', 'self 自己 + ish'],
    ['English', '英国的；英语', 'Engl + ish'],
  ] },
  { type: 'suffix', form: '-ary / -ory', meaning: '与…有关的（形容词）', en: 'relating to', words: [
    ['necessary', '必要的', 'necess 必需 + ary'],
    ['dictionary', '词典', 'diction 措辞 + ary'],
    ['laboratory', '实验室', 'laborat 劳动 + ory'],
  ] },
  { type: 'suffix', form: '-ize / -ise', meaning: '使…化（动词）', en: 'make', words: [
    ['realize', '意识到', 'real 真实 + ize'],
    ['modernize', '现代化', 'modern 现代 + ize'],
    ['organize', '组织', 'organ 器官 + ize'],
  ] },
  { type: 'suffix', form: '-ate', meaning: '使成为（动词）', en: 'make', words: [
    ['activate', '激活', 'active 活跃 + ate'],
    ['celebrate', '庆祝', 'celebr 荣誉 + ate'],
    ['communicate', '交流', 'communic 共同 + ate'],
  ] },
  { type: 'suffix', form: '-en', meaning: '使变得（动词）', en: 'make', words: [
    ['widen', '加宽', 'wide 宽 + en'],
    ['shorten', '缩短', 'short 短 + en'],
    ['strengthen', '加强', 'strength 力量 + en'],
  ] },
  { type: 'suffix', form: '-ly', meaning: '以…方式（副词）', en: 'in a way', words: [
    ['quickly', '快速地', 'quick 快 + ly'],
    ['happily', '幸福地', 'happy 幸福 + ly'],
    ['recently', '最近', 'recent 近来 + ly'],
  ] },
  { type: 'suffix', form: '-ward', meaning: '朝…方向（副词）', en: 'toward', words: [
    ['forward', '向前', 'for 前 + ward'],
    ['backward', '向后', 'back 后 + ward'],
    ['homeward', '回家的方向', 'home 家 + ward'],
  ] },
,
  { type: 'prefix', form: 'a- / an-', meaning: '不；无；非', en: 'not / without', words: [
    ['atypical', '非典型的', 'a 非 + typical 典型的'],
    ['anonymous', '匿名的', 'an 无 + onym 名字 + ous'],
    ['apathy', '冷漠；无动于衷', 'a 无 + path 感情 + y'],
    ['anarchy', '无政府状态', 'an 无 + arch 统治 + y']
  ] },
  { type: 'prefix', form: 'ab- / abs-', meaning: '离开；偏离；去除', en: 'away / off', words: [
    ['absent', '缺席的', 'ab 离开 + sent 存在'],
    ['abstract', '抽象的；摘要', 'abs 离开 + tract 拉'],
    ['abnormal', '反常的', 'ab 偏离 + normal 正常的'],
    ['absorb', '吸收', 'abs 去除 + sorb 吸吮']
  ] },
  { type: 'prefix', form: 'ad-', meaning: '朝向；加强；趋近', en: 'to / toward', words: [
    ['adhere', '粘附；坚持', 'ad 朝向 + her 粘'],
    ['adjust', '调整', 'ad 朝向 + just 正确'],
    ['advance', '前进；进步', 'ad 向前 + vance 走'],
    ['adapt', '适应；改编', 'ad 朝向 + apt 适合']
  ] },
  { type: 'prefix', form: 'ambi-', meaning: '两边；周围；模糊', en: 'both / around', words: [
    ['ambiguous', '模糊的；歧义的', 'ambi 两边 + ag 驱动 + uous'],
    ['ambidextrous', '双手灵巧的', 'ambi 两 + dexter 右 + ous'],
    ['ambient', '周围的；环境的', 'ambi 周围 + ent'],
    ['ambition', '抱负；野心', 'ambi 周围 + it 走 + ion']
  ] },
  { type: 'prefix', form: 'ante-', meaning: '在前；先于', en: 'before / in front', words: [
    ['antecedent', '先前的；先行词', 'ante 前 + ced 走 + ent'],
    ['antebellum', '战前的', 'ante 前 + bell 战争 + um'],
    ['anterior', '前面的；先前的', 'ante 前 + ior'],
    ['antedate', '早于；先于', 'ante 先 + date 日期']
  ] },
  { type: 'prefix', form: 'circum-', meaning: '周围；环绕', en: 'around / about', words: [
    ['circumference', '周长；圆周', 'circum 周围 + fer 带 + ence'],
    ['circumspect', '谨慎的；小心的', 'circum 周围 + spect 看'],
    ['circumstance', '环境；情况', 'circum 周围 + st 站 + ance'],
    ['circuit', '电路；回路', 'circum 环绕 + it 走']
  ] },
  { type: 'prefix', form: 'contra- / counter-', meaning: '反对；相反；对抗', en: 'against / opposite', words: [
    ['contradict', '反驳；矛盾', 'contra 反对 + dict 说'],
    ['counteract', '抵消；对抗', 'counter 相反 + act 行动'],
    ['contrast', '对比；对照', 'contra 相反 + st 站'],
    ['contraband', '违禁品；走私', 'contra 违反 + band 命令']
  ] },
  { type: 'prefix', form: 'extra-', meaning: '超出；在…之外；额外', en: 'beyond / outside', words: [
    ['extraordinary', '非凡的；特别的', 'extra 超出 + ordinary 普通的'],
    ['extraterrestrial', '外星的；地球外的', 'extra 外 + terr 地球 + estrial'],
    ['extracurricular', '课外的', 'extra 外 + curricul 课程 + ar'],
    ['extraneous', '无关的；外来的', 'extra 外 + ne 连接 + ous']
  ] },
  { type: 'prefix', form: 'hyper-', meaning: '超过；过度；在上', en: 'over / excessive', words: [
    ['hyperactive', '过度活跃的', 'hyper 过度 + active 活跃的'],
    ['hyperbole', '夸张法', 'hyper 超过 + bole 投掷'],
    ['hypertension', '高血压', 'hyper 过度 + tension 紧张'],
    ['hypercritical', '吹毛求疵的', 'hyper 过度 + critical 批评的']
  ] },
  { type: 'prefix', form: 'hypo-', meaning: '在下；不足；低于', en: 'under / below / deficient', words: [
    ['hypothermia', '体温过低', 'hypo 低 + therm 热 + ia'],
    ['hypothesis', '假设；假说', 'hypo 下 + thesis 放置'],
    ['hypodermic', '皮下的', 'hypo 下 + derm 皮 + ic'],
    ['hypocrite', '伪君子', 'hypo 下 + crit 评判 + e']
  ] },
  { type: 'prefix', form: 'infra-', meaning: '在下；低于； infra', en: 'below / beneath', words: [
    ['infrastructure', '基础设施', 'infra 下 + structure 结构'],
    ['infrared', '红外线的', 'infra 下 + red 红'],
    ['inferior', '劣等的；下级的', 'infer 下 + ior'],
    ['infringe', '侵犯；违反', 'infring 触碰 + e']
  ] },
  { type: 'prefix', form: 'intra-', meaning: '在内；内部', en: 'within / inside', words: [
    ['intranet', '内部网', 'intra 内 + net 网'],
    ['intravenous', '静脉内的', 'intra 内 + ven 静脉 + ous'],
    ['intramural', '校内的；内部的', 'intra 内 + mur 墙 + al'],
    ['intrastate', '州内的', 'intra 内 + state 州']
  ] },
  { type: 'prefix', form: 'intro-', meaning: '向内；进入', en: 'into / inward', words: [
    ['introduce', '介绍；引进', 'intro 向内 + duce 引导'],
    ['introspect', '内省；反省', 'intro 向内 + spect 看'],
    ['introvert', '内向的人', 'intro 向内 + vert 转'],
    ['introjection', '投射；投入', 'intro 向内 + ject 投 + ion']
  ] },
  { type: 'prefix', form: 'macro-', meaning: '大；宏观；长', en: 'large / big', words: [
    ['macroeconomics', '宏观经济学', 'macro 大 + economics 经济学'],
    ['macroscopic', '宏观的；肉眼可见的', 'macro 大 + scop 看 + ic'],
    ['macro', '宏观；宏指令', 'macro 大'],
    ['macrocosm', '宏观世界；宇宙', 'macro 大 + cosm 世界']
  ] },
  { type: 'prefix', form: 'meta-', meaning: '超越；变化；在…之后', en: 'beyond / change / after', words: [
    ['metaphor', '隐喻；比喻', 'meta 超越 + phor 携带'],
    ['metaphysics', '形而上学；玄学', 'meta 超越 + physics 物理学'],
    ['metabolism', '新陈代谢', 'meta 变化 + bol 投掷 + ism'],
    ['metamorphosis', '变形；蜕变', 'meta 变化 + morph 形状 + osis']
  ] },
  { type: 'prefix', form: 'mono-', meaning: '一；单一；独自', en: 'one / single / alone', words: [
    ['monologue', '独白；独角戏', 'mono 单一 + logue 说'],
    ['monotone', '单调的；单调音', 'mono 单一 + tone 音调'],
    ['monopoly', '垄断；专卖', 'mono 单一 + poly 卖'],
    ['monochrome', '单色的；黑白的', 'mono 单一 + chrome 颜色']
  ] },
  { type: 'prefix', form: 'omni-', meaning: '全；所有；到处', en: 'all / every', words: [
    ['omnipotent', '全能的', 'omni 全 + potent 有力的'],
    ['omniscient', '全知的', 'omni 全 + sci 知道 + ent'],
    ['omnipresent', '无所不在的', 'omni 全 + present 存在的'],
    ['omnivore', '杂食动物', 'omni 全 + vor 吃']
  ] },
  { type: 'prefix', form: 'ortho-', meaning: '正；直；正确', en: 'straight / correct / right', words: [
    ['orthodox', '正统的；传统的', 'ortho 正 + dox 观点'],
    ['orthopedic', '整形外科的', 'ortho 正 + ped 儿童 + ic'],
    ['orthogonal', '正交的；直角的', 'ortho 直 + gon 角 + al'],
    ['orthodontist', '正牙医生', 'ortho 正 + odont 牙 + ist']
  ] },
  { type: 'prefix', form: 'pan-', meaning: '全；泛；所有', en: 'all / every / whole', words: [
    ['pandemic', '大流行病', 'pan 全 + dem 人民 + ic'],
    ['panorama', '全景；全景画', 'pan 全 + orama 视野'],
    ['panacea', '万灵药；万能药', 'pan 全 + acea 治疗'],
    ['pantheism', '泛神论', 'pan 全 + the 神 + ism']
  ] },
  { type: 'prefix', form: 'para-', meaning: '旁；类似；超越；异常', en: 'beside / beyond / near', words: [
    ['parallel', '平行的；类似的', 'para 旁 + allel 另一个'],
    ['paragraph', '段落', 'para 旁 + graph 写'],
    ['paradox', '悖论；矛盾', 'para 超越 + dox 观点'],
    ['parasite', '寄生虫；食客', 'para 旁 + site 食物']
  ] },
  { type: 'prefix', form: 'per-', meaning: '通过；完全；彻底', en: 'through / thoroughly', words: [
    ['perfect', '完美的；使完善', 'per 完全 + fect 做'],
    ['persist', '坚持；持续', 'per 彻底 + sist 站立'],
    ['permanent', '永久的；固定的', 'per 完全 + man 停留 + ent'],
    ['permeate', '渗透；弥漫', 'per 通过 + me 经过 + ate']
  ] },
  { type: 'prefix', form: 'peri-', meaning: '周围；环绕；靠近', en: 'around / near / surrounding', words: [
    ['perimeter', '周长；周边', 'peri 周围 + meter 测量'],
    ['periscope', '潜望镜', 'peri 周围 + scope 看'],
    ['peripheral', '外围的；周边的', 'peri 周围 + pher 携带 + al'],
    ['period', '时期；周期', 'peri 周围 + od 路']
  ] },
  { type: 'prefix', form: 'poly-', meaning: '多；许多', en: 'many / much', words: [
    ['polygon', '多边形', 'poly 多 + gon 角'],
    ['polyglot', '通晓多种语言的人', 'poly 多 + glot 舌头'],
    ['polytechnic', '多种工艺的；理工学院', 'poly 多 + techn 技术 + ic'],
    ['polynomial', '多项式', 'poly 多 + nom 名称 + ial']
  ] },
  { type: 'prefix', form: 'retro-', meaning: '向后；回；追溯', en: 'backward / behind / back', words: [
    ['retrospect', '回顾；追溯', 'retro 向后 + spect 看'],
    ['retrograde', '倒退的；退化的', 'retro 向后 + grad 走 + e'],
    ['retroactive', '溯及既往的；有追溯力的', 'retro 回 + act 行动 + ive'],
    ['retroflex', '向后弯曲的', 'retro 向后 + flex 弯曲']
  ] },
  { type: 'prefix', form: 'ultra-', meaning: '超；极端；在…之外', en: 'beyond / extreme / excess', words: [
    ['ultraviolet', '紫外线的', 'ultra 超 + violet 紫色'],
    ['ultrasonic', '超声波的', 'ultra 超 + sonic 声音的'],
    ['ultra', '极端的；过激的', 'ultra 超'],
    ['ultramodern', '超现代的', 'ultra 超 + modern 现代的']
  ] },
  { type: 'root', form: 'act', meaning: '做；行动；驱动', en: 'do / act / drive', words: [
    ['action', '行动；动作', 'act 做 + ion'],
    ['active', '活跃的；积极的', 'act 行动 + ive'],
    ['react', '反应；回应', 're 回 + act 行动'],
    ['interact', '互动；相互作用', 'inter 相互 + act 行动'],
    ['transaction', '交易；事务', 'trans 跨越 + act 做 + ion']
  ] },
  { type: 'root', form: 'aud', meaning: '听；听觉', en: 'hear / listen', words: [
    ['audio', '音频；声音的', 'aud 听 + io'],
    ['audience', '观众；听众', 'aud 听 + ience'],
    ['audit', '审计；旁听', 'aud 听 + it'],
    ['auditorium', '礼堂；观众席', 'aud 听 + itorium 场所'],
    ['audible', '听得见的', 'aud 听 + ible 可']
  ] },
  { type: 'root', form: 'aqua', meaning: '水；液体', en: 'water / liquid', words: [
    ['aquarium', '水族馆；鱼缸', 'aqua 水 + arium 场所'],
    ['aquatic', '水生的；水的', 'aqua 水 + atic'],
    ['aqueduct', '渡槽；引水渠', 'aqua 水 + duct 引导'],
    ['aquamarine', '海蓝色；碧绿色', 'aqua 水 + marine 海的']
  ] },
  { type: 'root', form: 'cap / cept / ceive', meaning: '拿；抓；容纳；头', en: 'take / seize / hold', words: [
    ['capture', '捕获；俘虏', 'cap 抓 + ure'],
    ['accept', '接受；承认', 'ac 朝向 + cept 拿'],
    ['receive', '收到；接待', 're 回 + ceive 拿'],
    ['capacity', '容量；能力', 'cap 容纳 + acity'],
    ['anticipate', '预期；期望', 'anti 前 + cip 拿 + ate']
  ] },
  { type: 'root', form: 'ced / cess', meaning: '走；让步；移动', en: 'go / yield / move', words: [
    ['proceed', '继续；进行', 'pro 向前 + ceed 走'],
    ['succeed', '成功；继承', 'suc 下 + ceed 走'],
    ['access', '进入；通道', 'ac 朝向 + cess 走'],
    ['precedent', '先例；前例', 'pre 前 + ced 走 + ent'],
    ['recession', '衰退；后退', 're 回 + cess 走 + ion']
  ] },
  { type: 'root', form: 'clud / clus', meaning: '关闭；包含；结束', en: 'close / shut / include', words: [
    ['include', '包含；包括', 'in 向内 + clud 关闭'],
    ['exclude', '排除；排斥', 'ex 向外 + clud 关闭'],
    ['conclude', '结束；得出结论', 'con 完全 + clud 关闭'],
    ['seclude', '使隔离；使隐居', 'se 分开 + clud 关闭'],
    ['recluse', '隐士；隐居者', 're 回 + clus 关闭 + e']
  ] },
  { type: 'root', form: 'cogn', meaning: '知道；认识；认知', en: 'know / learn', words: [
    ['recognize', '认出；承认', 're 再 + cogn 知道 + ize'],
    ['cognitive', '认知的；认识的', 'cogn 知道 + itive'],
    ['cognition', '认知；认识', 'cogn 知道 + ition'],
    ['incognito', '隐姓埋名的', 'in 不 + cogn 知道 + ito'],
    ['cognizant', '认识到的；知晓的', 'cogn 知道 + izant']
  ] },
  { type: 'root', form: 'corp', meaning: '身体；团体；法人', en: 'body / group', words: [
    ['corporation', '公司；法人', 'corp 身体 + oration'],
    ['corpse', '尸体；死尸', 'corp 身体 + se'],
    ['corps', '军团；队', 'corp 身体 + s'],
    ['incorporate', '合并；包含', 'in 进入 + corp 身体 + orate'],
    ['corporeal', '物质的；有形的', 'corp 身体 + oreal']
  ] },
  { type: 'root', form: 'cide / cis', meaning: '杀；切；割', en: 'kill / cut', words: [
    ['suicide', '自杀', 'sui 自己 + cide 杀'],
    ['homicide', '杀人；他杀', 'homi 人 + cide 杀'],
    ['incision', '切口；切割', 'in 向内 + cis 切 + ion'],
    ['decisive', '决定性的；果断的', 'de 向下 + cis 切 + ive'],
    ['concise', '简洁的；简明的', 'con 完全 + cis 切']
  ] },
  { type: 'root', form: 'fer', meaning: '携带；带来；忍受', en: 'carry / bring / bear', words: [
    ['transfer', '转移；转让', 'trans 跨越 + fer 携带'],
    ['refer', '参考；提及', 're 回 + fer 携带'],
    ['differ', '不同；相异', 'dif 分开 + fer 携带'],
    ['offer', '提供；提议', 'of 朝向 + fer 携带'],
    ['suffer', '遭受；忍受', 'suf 下 + fer 忍受'],
    ['infer', '推断；推论', 'in 向内 + fer 携带']
  ] },
  { type: 'root', form: 'fid', meaning: '信任；信仰；信心', en: 'faith / trust / believe', words: [
    ['confidence', '信心；信任', 'con 完全 + fid 信任 + ence'],
    ['fidelity', '忠诚；保真', 'fid 信任 + elity'],
    ['infidel', '不信教者；异教徒', 'in 不 + fid 信任 + el'],
    ['confide', '吐露；信任', 'con 完全 + fid 信任 + e'],
    ['defiant', '挑衅的；反抗的', 'de 否定 + fi 信任 + ant']
  ] },
  { type: 'root', form: 'fin', meaning: '结束；界限；完成', en: 'end / limit / boundary', words: [
    ['final', '最终的；决赛', 'fin 结束 + al'],
    ['finish', '完成；结束', 'fin 结束 + ish'],
    ['define', '定义；解释', 'de 向下 + fin 界限 + e'],
    ['finite', '有限的', 'fin 界限 + ite'],
    ['infinite', '无限的', 'in 不 + finite 有限的'],
    ['refine', '精炼；提纯', 're 再 + fin 结束 + e']
  ] },
  { type: 'root', form: 'flect / flex', meaning: '弯曲；转向；反射', en: 'bend / turn / curve', words: [
    ['reflect', '反射；反映；思考', 're 回 + flect 弯曲'],
    ['flexible', '灵活的；柔韧的', 'flex 弯曲 + ible 可'],
    ['deflect', '使偏转；使转向', 'de 离开 + flect 弯曲'],
    ['inflect', '使弯曲；词形变化', 'in 向内 + flect 弯曲'],
    ['genuflect', '屈膝；跪拜', 'genu 膝 + flect 弯曲']
  ] },
  { type: 'root', form: 'flu / flux', meaning: '流；流动；流体', en: 'flow / stream / fluid', words: [
    ['fluid', '流体；流动的', 'flu 流 + id'],
    ['influence', '影响；势力', 'in 向内 + flu 流 + ence'],
    ['fluent', '流利的；流畅的', 'flu 流 + ent'],
    ['affluent', '富裕的；丰富的', 'af 朝向 + flu 流 + ent'],
    ['fluctuate', '波动；起伏', 'fluct 流动 + uate'],
    ['influx', '流入；涌入', 'in 向内 + flux 流']
  ] },
  { type: 'root', form: 'frag / fract', meaning: '破碎；断裂；碎片', en: 'break / shatter / fracture', words: [
    ['fragile', '易碎的；脆弱的', 'frag 破碎 + ile'],
    ['fraction', '分数；部分', 'fract 破碎 + ion'],
    ['fracture', '骨折；断裂', 'fract 破碎 + ure'],
    ['fragment', '碎片；片段', 'frag 破碎 + ment'],
    ['refract', '使折射', 're 回 + fract 破碎']
  ] },
  { type: 'root', form: 'fus', meaning: '倾倒；熔化；融合', en: 'pour / melt / blend', words: [
    ['confuse', '使困惑；混淆', 'con 共同 + fus 倾倒'],
    ['refuse', '拒绝；谢绝', 're 回 + fus 倾倒'],
    ['fusion', '融合；熔化', 'fus 倾倒 + ion'],
    ['diffuse', '扩散；弥漫', 'dif 分开 + fus 倾倒'],
    ['suffuse', '充满；弥漫', 'suf 下 + fus 倾倒'],
    ['transfuse', '输血；渗透', 'trans 跨越 + fus 倾倒']
  ] },
  { type: 'root', form: 'gen', meaning: '出生；种族；产生；起源', en: 'birth / race / produce / origin', words: [
    ['generate', '产生；生成', 'gen 产生 + erate'],
    ['gene', '基因', 'gen 出生 + e'],
    ['genetics', '遗传学', 'gen 出生 + etics'],
    ['genius', '天才；天赋', 'gen 出生 + ius'],
    ['genuine', '真正的；真诚的', 'gen 出生 + uine'],
    ['gender', '性别；性', 'gen 出生 + der'],
    ['genre', '类型；体裁', 'gen 种族 + re'],
    ['generous', '慷慨的；大方的', 'gen 产生 + erous']
  ] },
  { type: 'root', form: 'geo', meaning: '地球；土地；地理', en: 'earth / land / geography', words: [
    ['geography', '地理学；地形', 'geo 地球 + graphy 写'],
    ['geology', '地质学', 'geo 地球 + logy 学'],
    ['geometry', '几何学', 'geo 土地 + metry 测量'],
    ['geopolitics', '地缘政治学', 'geo 地球 + politics 政治'],
    ['geocentric', '以地球为中心的', 'geo 地球 + centric 中心的']
  ] },
  { type: 'root', form: 'grad / gress', meaning: '步；走；程度；等级', en: 'step / go / walk / degree', words: [
    ['grade', '等级；成绩', 'grad 步 + e'],
    ['graduate', '毕业；毕业生', 'grad 步 + uate'],
    ['progress', '进步；进展', 'pro 向前 + gress 走'],
    ['aggressive', '侵略的；好斗的', 'ag 朝向 + gress 走 + ive'],
    ['congress', '国会；代表大会', 'con 共同 + gress 走'],
    ['regress', '倒退；退化', 're 回 + gress 走']
  ] },
  { type: 'root', form: 'loc', meaning: '地方；位置；场所', en: 'place / local / location', words: [
    ['local', '当地的；本地的', 'loc 地方 + al'],
    ['locate', '定位；位于', 'loc 地方 + ate'],
    ['location', '位置；场所', 'loc 地方 + ation'],
    ['allocate', '分配；分派', 'al 朝向 + loc 地方 + ate'],
    ['relocate', '重新安置；迁移', 're 再 + locate 定位'],
    ['locomotive', '机车；火车头', 'loco 地方 + mot 移动 + ive']
  ] },
  { type: 'root', form: 'loqu / locut', meaning: '说；讲；言语', en: 'speak / talk / voice', words: [
    ['eloquent', '雄辩的；有口才的', 'e 出 + loqu 说 + ent'],
    ['colloquial', '口语的；通俗的', 'col 共同 + loqu 说 + ial'],
    ['circumlocution', '迂回说法；绕圈子', 'circum 周围 + locut 说 + ion'],
    ['loquacious', '话多的；健谈的', 'loqu 说 + acious'],
    ['elocution', '演说术；雄辩术', 'e 出 + locut 说 + ion']
  ] },
  { type: 'root', form: 'lud / lus', meaning: '玩；游戏；欺骗；嘲弄', en: 'play / mock / game / deceive', words: [
    ['ludicrous', '滑稽的；可笑的', 'lud 玩 + icrous'],
    ['delude', '欺骗；迷惑', 'de 向下 + lud 玩 + e'],
    ['illusion', '幻觉；错觉', 'il 向内 + lus 玩 + ion'],
    ['elude', '逃避；躲避', 'e 出 + lud 玩 + e'],
    ['prelude', '前奏；序幕', 'pre 前 + lud 玩 + e'],
    ['allude', '暗示；间接提到', 'al 朝向 + lud 玩 + e']
  ] },
  { type: 'root', form: 'medi', meaning: '中间；媒介；中等', en: 'middle / between / medium', words: [
    ['medium', '媒介；中等的', 'medi 中间 + um'],
    ['media', '媒体；媒介', 'medi 中间 + ia'],
    ['immediate', '立即的；直接的', 'im 无 + medi 中间 + ate'],
    ['intermediate', '中间的；中级的', 'inter 在…之间 + medi 中间 + ate'],
    ['medieval', '中世纪的', 'medi 中间 + eval 时代的'],
    ['mediocre', '平庸的；普通的', 'medi 中间 + ocre']
  ] },
  { type: 'root', form: 'migr', meaning: '迁移；移居；流浪', en: 'wander / move / migrate', words: [
    ['migrate', '迁移；移居', 'migr 迁移 + ate'],
    ['immigration', '移民；移居入境', 'im 进入 + migr 迁移 + ation'],
    ['emigrate', '移居外国', 'e 出 + migr 迁移 + ate'],
    ['migrant', '移民；候鸟', 'migr 迁移 + ant'],
    ['transmigrate', '转生；移居', 'trans 跨越 + migr 迁移 + ate']
  ] },
  { type: 'root', form: 'min', meaning: '小；少；突出；项目', en: 'small / less / little / project', words: [
    ['minor', '较小的；次要的', 'min 小 + or'],
    ['minute', '分钟；微小的', 'min 小 + ute'],
    ['diminish', '减少；缩小', 'di 向下 + min 小 + ish'],
    ['prominent', '突出的；显著的', 'pro 向前 + min 突出 + ent'],
    ['minimum', '最小值；最低限度', 'min 小 + imum'],
    ['eminent', '杰出的；著名的', 'e 出 + min 突出 + ent']
  ] },
  { type: 'root', form: 'mir', meaning: '惊奇；看；赞美', en: 'wonder / look / admire', words: [
    ['miracle', '奇迹；奇事', 'mir 惊奇 + acle'],
    ['mirror', '镜子；反映', 'mir 看 + ror'],
    ['admire', '钦佩；赞美', 'ad 朝向 + mir 看 + e'],
    ['marvel', '奇迹；惊奇', 'mar 惊奇 + vel'],
    ['mirage', '海市蜃楼；幻影', 'mir 看 + age']
  ] },
  { type: 'root', form: 'mod', meaning: '方式；尺度；模式；模型', en: 'manner / measure / mode / model', words: [
    ['mode', '方式；模式', 'mod 方式 + e'],
    ['model', '模型；模特', 'mod 模式 + el'],
    ['modify', '修改；修饰', 'mod 方式 + ify 使'],
    ['modern', '现代的；近代的', 'mod 方式 + ern'],
    ['modest', '谦虚的；适度的', 'mod 尺度 + est'],
    ['accommodate', '容纳；适应', 'ac 朝向 + commod 方便 + ate']
  ] },
  { type: 'root', form: 'mon', meaning: '警告；提醒；单独；一', en: 'warn / remind / alone / one', words: [
    ['monitor', '监视器；班长', 'mon 警告 + itor'],
    ['monument', '纪念碑；纪念物', 'mon 提醒 + ument'],
    ['monologue', '独白；独角戏', 'mono 单一 + logue 说'],
    ['monk', '修道士；僧侣', 'mon 单独 + k'],
    ['summon', '召唤；召集', 'sum 下 + mon 警告'],
    ['admonish', '告诫；警告', 'ad 朝向 + mon 警告 + ish']
  ] },
  { type: 'root', form: 'mort', meaning: '死亡；死；终有一死', en: 'death / die / mortal', words: [
    ['mortal', '终有一死的；凡人', 'mort 死亡 + al'],
    ['mortality', '死亡率；必死性', 'mort 死亡 + ality'],
    ['immortal', '不朽的；永生的', 'im 不 + mortal 必死的'],
    ['mortgage', '抵押；抵押贷款', 'mort 死亡 + gage 承诺'],
    ['mortify', '使屈辱；使羞愧', 'mort 死亡 + ify 使'],
    ['postmortem', '死后的；验尸', 'post 后 + mort 死亡 + em']
  ] },
  { type: 'root', form: 'morph', meaning: '形状；形态；结构', en: 'form / shape / structure', words: [
    ['morphology', '形态学；词法', 'morph 形状 + ology 学'],
    ['metamorphosis', '变形；蜕变', 'meta 变化 + morph 形状 + osis'],
    ['amorphous', '无定形的；非晶质的', 'a 无 + morph 形状 + ous'],
    ['polymorph', '多形体；多晶型物', 'poly 多 + morph 形状'],
    ['morphine', '吗啡', 'morph 形状 + ine']
  ] },
  { type: 'root', form: 'nav / naut', meaning: '船；航海；航行', en: 'ship / sailor / navigate', words: [
    ['navy', '海军；船队', 'nav 船 + y'],
    ['naval', '海军的；船的', 'nav 船 + al'],
    ['navigate', '航行；导航', 'nav 船 + igate'],
    ['astronaut', '宇航员', 'astro 星 + naut 航行者'],
    ['circumnavigate', '环航；绕行', 'circum 周围 + navigate 航行'],
    ['nausea', '恶心；晕船', 'naus 船 + ea']
  ] },
  { type: 'root', form: 'neg', meaning: '否认；不；否定', en: 'deny / not / negative', words: [
    ['negative', '否定的；消极的', 'neg 否定 + ative'],
    ['neglect', '忽视；疏忽', 'neg 不 + lect 选择'],
    ['negligible', '可忽略的；微不足道的', 'neg 不 + lig 选择 + ible'],
    ['renege', '食言；背信', 're 回 + neg 否认 + e'],
    ['abnegate', '放弃；舍弃', 'ab 离开 + neg 否认 + ate']
  ] },
  { type: 'root', form: 'nom', meaning: '名称；法律；秩序；安排', en: 'name / law / order / arrangement', words: [
    ['nominal', '名义上的；有名无实的', 'nom 名称 + inal'],
    ['nominate', '提名；任命', 'nom 名称 + inate'],
    ['denomination', '命名；教派；面额', 'de 向下 + nomin 名称 + ation'],
    ['economy', '经济；节约', 'eco 家 + nom 管理 + y'],
    ['astronomy', '天文学', 'astro 星 + nom 规律 + y'],
    ['autonomy', '自治；自主', 'auto 自己 + nom 法律 + y']
  ] },
  { type: 'root', form: 'norm', meaning: '规则；标准；规范；正常', en: 'rule / pattern / normal / standard', words: [
    ['normal', '正常的；标准的', 'norm 规则 + al'],
    ['norm', '规范；标准', 'norm 规则'],
    ['abnormal', '反常的；异常的', 'ab 偏离 + normal 正常的'],
    ['enormous', '巨大的；庞大的', 'e 出 + norm 规则 + ous'],
    ['subnormal', '低于正常的', 'sub 下 + normal 正常的'],
    ['normalize', '使正常化；标准化', 'normal 正常 + ize 使']
  ] },
  { type: 'root', form: 'not', meaning: '标记；笔记；知道；表示', en: 'mark / note / know / denote', words: [
    ['note', '笔记；注意', 'not 标记 + e'],
    ['notice', '通知；注意', 'not 知道 + ice'],
    ['denote', '表示；意味着', 'de 向下 + not 标记 + e'],
    ['annotate', '注释；评注', 'an 朝向 + not 标记 + ate'],
    ['notion', '概念；观念', 'not 知道 + ion'],
    ['notable', '显著的；著名的', 'not 标记 + able 可']
  ] },
  { type: 'root', form: 'numer', meaning: '数；数字；计数', en: 'number / count / numeral', words: [
    ['number', '数字；数量', 'numer 数 + ber'],
    ['numeral', '数字的；数词', 'numer 数 + al'],
    ['enumerate', '列举；枚举', 'e 出 + numer 数 + ate'],
    ['numerous', '许多的；众多的', 'numer 数 + ous'],
    ['innumerable', '无数的；数不清的', 'in 不 + numer 数 + able'],
    ['supernumerary', '额外的；多余的', 'super 超 + numer 数 + ary']
  ] },
  { type: 'root', form: 'oper', meaning: '工作；劳动；操作', en: 'work / labor / operate', words: [
    ['operate', '操作；运转', 'oper 工作 + ate'],
    ['cooperate', '合作；协作', 'co 共同 + oper 工作 + ate'],
    ['opera', '歌剧', 'oper 工作 + a'],
    ['operation', '操作；手术', 'oper 工作 + ation'],
    ['operator', '操作员；经营者', 'oper 工作 + ator'],
    ['cooperative', '合作的；合作社', 'co 共同 + oper 工作 + ative']
  ] },
  { type: 'root', form: 'opt', meaning: '眼睛；视觉；选择；最好', en: 'eye / vision / choose / best', words: [
    ['optical', '光学的；视觉的', 'opt 眼睛 + ical'],
    ['option', '选择；选项', 'opt 选择 + ion'],
    ['optimistic', '乐观的', 'optim 最好 + istic'],
    ['opt', '选择；挑选', 'opt 选择'],
    ['adopt', '采用；收养', 'ad 朝向 + opt 选择'],
    ['synopsis', '概要；摘要', 'syn 共同 + ops 看 + is']
  ] },
  { type: 'root', form: 'ordin', meaning: '秩序；顺序；排列；命令', en: 'order / row / series / arrange', words: [
    ['order', '命令；顺序', 'ordin 秩序 + er'],
    ['ordinary', '普通的；平常的', 'ordin 秩序 + ary'],
    ['coordinate', '协调；坐标', 'co 共同 + ordin 秩序 + ate'],
    ['subordinate', '下级的；从属的', 'sub 下 + ordin 秩序 + ate'],
    ['ordinal', '顺序的；序数词', 'ordin 秩序 + al'],
    ['disorder', '混乱；无序', 'dis 不 + order 秩序']
  ] },
  { type: 'root', form: 'ori', meaning: '升起；开始；起源；东方', en: 'rise / begin / origin / gold', words: [
    ['origin', '起源；由来', 'ori 升起 + gin'],
    ['orient', '东方；使适应', 'ori 升起 + ent'],
    ['originate', '起源；发起', 'origin 起源 + ate'],
    ['original', '原始的；最初的', 'origin 起源 + al'],
    ['abort', '流产；中止', 'ab 偏离 + ort 升起'],
    ['orientation', '方向；定位', 'orient 东方 + ation']
  ] },
  { type: 'root', form: 'pel / puls', meaning: '驱动；推；迫使', en: 'drive / push / compel', words: [
    ['compel', '强迫；迫使', 'com 完全 + pel 推'],
    ['expel', '驱逐；开除', 'ex 向外 + pel 推'],
    ['pulse', '脉搏；脉冲', 'puls 推 + e'],
    ['impulse', '冲动；脉冲', 'im 向内 + puls 推 + e'],
    ['repulse', '击退；拒绝', 're 回 + puls 推 + e'],
    ['propel', '推进；驱使', 'pro 向前 + pel 推']
  ] },
  { type: 'root', form: 'phil', meaning: '爱；喜爱；亲和', en: 'love / affection / affinity', words: [
    ['philosophy', '哲学；人生观', 'phil 爱 + soph 智慧 + y'],
    ['philanthropy', '慈善；博爱', 'phil 爱 + anthrop 人类 + y'],
    ['bibliophile', '藏书家；爱书者', 'biblio 书 + phil 爱 + e'],
    ['philharmonic', '爱乐的；交响乐团的', 'phil 爱 + harmonic 和声的'],
    ['philology', '语文学；文献学', 'phil 爱 + ology 学']
  ] },
  { type: 'root', form: 'phob', meaning: '恐惧；害怕；恐惧症', en: 'fear / dread / phobia', words: [
    ['phobia', '恐惧症；恐惧', 'phob 恐惧 + ia'],
    ['claustrophobia', '幽闭恐惧症', 'claustr 关闭 + phob 恐惧 + ia'],
    ['xenophobia', '仇外；排外', 'xeno 外来 + phob 恐惧 + ia'],
    ['agoraphobia', '广场恐惧症', 'agora 广场 + phob 恐惧 + ia'],
    ['hydrophobia', '恐水症；狂犬病', 'hydro 水 + phob 恐惧 + ia']
  ] },
  { type: 'root', form: 'phot / phos', meaning: '光；光线；照片', en: 'light / photo / photography', words: [
    ['photograph', '照片；摄影', 'photo 光 + graph 写'],
    ['photon', '光子', 'phot 光 + on'],
    ['photosynthesis', '光合作用', 'photo 光 + synthesis 合成'],
    ['photography', '摄影术', 'photo 光 + graphy 写'],
    ['phosphorus', '磷；启明星', 'phos 光 + phorus 携带'],
    ['photocopy', '复印；影印本', 'photo 光 + copy 复制']
  ] },
  { type: 'root', form: 'pict', meaning: '画；描绘；图片', en: 'paint / picture / depict', words: [
    ['picture', '图片；照片', 'pict 画 + ure'],
    ['paint', '绘画；油漆', 'paint 画'],
    ['depict', '描绘；描述', 'de 向下 + pict 画'],
    ['pictorial', '绘画的；图片的', 'pict 画 + orial'],
    ['pictograph', '象形文字；图画文字', 'picto 画 + graph 写']
  ] },
  { type: 'root', form: 'plac', meaning: '使高兴；平静；安抚', en: 'please / calm / appease / placid', words: [
    ['placid', '平静的；温和的', 'plac 平静 + id'],
    ['placate', '安抚；抚慰', 'plac 高兴 + ate'],
    ['placebo', '安慰剂；宽心话', 'plac 高兴 + ebo'],
    ['complacent', '自满的；得意的', 'com 完全 + plac 高兴 + ent'],
    ['implacable', '不能安抚的；难和解的', 'im 不 + plac 安抚 + able']
  ] },
  { type: 'root', form: 'ple / plen', meaning: '满；充满；更多；完全', en: 'fill / full / more / plenty', words: [
    ['plenty', '大量；充足', 'plen 满 + ty'],
    ['complete', '完成；完全的', 'com 完全 + plete 满'],
    ['supplement', '补充；增补', 'sup 下 + ple 满 + ment'],
    ['implement', '实施；工具', 'im 向内 + ple 满 + ment'],
    ['plenary', '全体的；充分的', 'plen 满 + ary'],
    ['deplete', '耗尽；使枯竭', 'de 向下 + plete 满']
  ] },
  { type: 'root', form: 'plic / ply', meaning: '折叠；弯曲；编织；填充', en: 'fold / bend / interweave / fill', words: [
    ['complicate', '使复杂；使复杂化', 'com 共同 + plic 折叠 + ate'],
    ['duplicate', '复制；重复', 'du 二 + plic 折叠 + ate'],
    ['implicate', '牵连；暗示', 'im 向内 + plic 折叠 + ate'],
    ['replicate', '复制；重复', 're 再 + plic 折叠 + ate'],
    ['apply', '申请；应用', 'ap 朝向 + ply 折叠'],
    ['reply', '回答；答复', 're 回 + ply 折叠'],
    ['supply', '供应；供给', 'sup 下 + ply 填充'],
    ['comply', '遵守；顺从', 'com 共同 + ply 填充']
  ] },
  { type: 'root', form: 'pop', meaning: '人民；民众；人口', en: 'people / nation / population', words: [
    ['population', '人口；全体居民', 'popul 人民 + ation'],
    ['popular', '流行的；受欢迎的', 'popul 人民 + ar'],
    ['populous', '人口稠密的', 'popul 人民 + ous'],
    ['pop', '流行音乐；弹出', 'pop 人民'],
    ['populace', '平民；大众', 'popul 人民 + ace'],
    ['depopulate', '使人口减少', 'de 向下 + popul 人民 + ate']
  ] },
  { type: 'root', form: 'poss / pot', meaning: '能力；力量；可能；权力', en: 'able / power / possible / potent', words: [
    ['possible', '可能的', 'poss 能力 + ible 可'],
    ['possess', '拥有；占有', 'pos 放置 + sess 坐'],
    ['potent', '强有力的；有效的', 'pot 力量 + ent'],
    ['potential', '潜在的；潜力', 'potent 有力 + ial'],
    ['impossible', '不可能的', 'im 不 + possible 可能的'],
    ['potency', '效力；潜能', 'pot 力量 + ency']
  ] },
  { type: 'root', form: 'prob', meaning: '证明；测试；值得；好', en: 'prove / test / worthy / good', words: [
    ['prove', '证明；证实', 'prob 证明 + e'],
    ['probe', '探查；调查', 'prob 测试 + e'],
    ['probable', '可能的；大概的', 'prob 证明 + able 可'],
    ['approval', '批准；赞成', 'ap 朝向 + prov 证明 + al'],
    ['problem', '问题；难题', 'prob 测试 + lem'],
    ['reprobate', '堕落的；恶棍', 're 回 + prob 证明 + ate']
  ] },
  { type: 'root', form: 'priv', meaning: '单独的；自己的；私人的；剥夺', en: 'single / own / apart / private', words: [
    ['private', '私人的；私有的', 'priv 单独 + ate'],
    ['privacy', '隐私；私密', 'priv 私人 + acy'],
    ['deprive', '剥夺；使丧失', 'de 去除 + priv 自己 + e'],
    ['privilege', '特权；优惠', 'privi 私人 + lege 法律'],
    ['privy', '知情的；私下的', 'priv 私人 + y']
  ] },
  { type: 'root', form: 'rad / radic', meaning: '根；根源；刮；擦', en: 'root / scratch / scrape / radical', words: [
    ['radical', '根本的；激进的', 'radic 根 + al'],
    ['radish', '萝卜', 'rad 根 + ish'],
    ['eradicate', '根除；消灭', 'e 出 + radic 根 + ate'],
    ['radiate', '辐射；散发', 'radi 光线 + ate'],
    ['radio', '无线电；收音机', 'radi 光线 + o'],
    ['radius', '半径；范围', 'radi 光线 + us']
  ] },
  { type: 'root', form: 'reg / rec', meaning: '统治；指导；直；正；王', en: 'rule / guide / straight / king', words: [
    ['regular', '规则的；定期的', 'reg 指导 + ular'],
    ['regulate', '管理；调节', 'regul 指导 + ate'],
    ['region', '地区；区域', 'reg 统治 + ion'],
    ['regal', '帝王的；豪华的', 'reg 王 + al'],
    ['correct', '正确的；改正', 'cor 完全 + rect 直'],
    ['direct', '直接的；指导', 'di 分开 + rect 直'],
    ['erect', '直立的；建立', 'e 出 + rect 直']
  ] },
  { type: 'root', form: 'rid / ris', meaning: '笑；微笑；嘲笑', en: 'laugh / smile / ridicule', words: [
    ['ridiculous', '可笑的；荒谬的', 'rid 笑 + iculous'],
    ['deride', '嘲笑；嘲弄', 'de 向下 + rid 笑 + e'],
    ['risible', '可笑的；爱笑的', 'ris 笑 + ible 可'],
    ['ridicule', '嘲笑；奚落', 'rid 笑 + icule'],
    ['derision', '嘲笑；嘲弄', 'de 向下 + ris 笑 + ion']
  ] },
  { type: 'root', form: 'rog', meaning: '问；请求；提议；质问', en: 'ask / question / propose', words: [
    ['interrogate', '审问；询问', 'inter 在…之间 + rog 问 + ate'],
    ['arrogant', '傲慢的；自大的', 'ar 朝向 + rog 要求 + ant'],
    ['prerogative', '特权；优先权', 'pre 前 + rog 问 + ative'],
    ['abrogate', '废除；取消', 'ab 离开 + rog 提议 + ate'],
    ['rogue', '流氓；骗子', 'rog 傲慢 + ue'],
    ['derogatory', '贬低的；不敬的', 'de 向下 + rog 问 + atory']
  ] },
  { type: 'root', form: 'sacr', meaning: '神圣的；圣礼；献祭', en: 'sacred / holy / rite / sacrifice', words: [
    ['sacred', '神圣的；庄严的', 'sacr 神圣 + ed'],
    ['sacrifice', '牺牲；献祭', 'sacr 神圣 + i fice 做'],
    ['sacrilege', '亵渎圣物；渎圣', 'sacr 神圣 + ilege 收集'],
    ['consecrate', '奉为神圣；奉献', 'con 完全 + secr 神圣 + ate'],
    ['desecrate', '亵渎；玷污', 'de 去除 + secr 神圣 + ate'],
    ['sacrament', '圣礼；圣事', 'sacr 神圣 + ament']
  ] },
  { type: 'root', form: 'sal', meaning: '盐；安全；完整；跳', en: 'salt / safe / whole / leap', words: [
    ['salt', '盐；咸的', 'sal 盐 + t'],
    ['saline', '盐的；含盐的', 'sal 盐 + ine'],
    ['salary', '薪水；工资', 'sal 盐 + ary（古罗马用盐发薪）'],
    ['salute', '敬礼；致敬', 'sal 健康 + ute'],
    ['salvation', '拯救；救世', 'salv 安全 + ation'],
    ['salient', '显著的；突出的', 'sal 跳 + ient']
  ] },
  { type: 'root', form: 'sanc', meaning: '神圣的；不可侵犯的；批准', en: 'holy / sacred / inviolable / sanction', words: [
    ['sanctify', '使神圣；尊崇', 'sanct 神圣 + ify 使'],
    ['sanctuary', '圣所；避难所', 'sanct 神圣 + uary'],
    ['sanction', '批准；制裁', 'sanc 神圣 + tion'],
    ['sanctimonious', '假装虔诚的', 'sanct 神圣 + imonious'],
    ['sanctity', '神圣；尊严', 'sanct 神圣 + ity']
  ] },
  { type: 'root', form: 'soci', meaning: '同伴；伙伴；社会；联合', en: 'companion / associate / society / social', words: [
    ['social', '社会的；社交的', 'soci 同伴 + al'],
    ['society', '社会；社团', 'soci 同伴 + ety'],
    ['associate', '联系；同事', 'as 朝向 + soci 同伴 + ate'],
    ['sociable', '好交际的；友善的', 'soci 同伴 + able 可'],
    ['dissociate', '分离；脱离', 'dis 分开 + soci 同伴 + ate'],
    ['sociology', '社会学', 'soci 社会 + ology 学']
  ] },
  { type: 'root', form: 'somn', meaning: '睡眠；困倦；瞌睡', en: 'sleep / drowsy / somnolent', words: [
    ['somnolent', '困倦的；催眠的', 'somn 睡眠 + olent'],
    ['insomnia', '失眠症', 'in 不 + somn 睡眠 + ia'],
    ['somnambulist', '梦游者', 'somn 睡眠 + ambul 走 + ist'],
    ['somniloquy', '梦话；说梦话', 'somn 睡眠 + iloquy 说'],
    ['somniferous', '催眠的；令人困倦的', 'somn 睡眠 + ifer 携带 + ous']
  ] },
  { type: 'root', form: 'son', meaning: '声音；音调；睡眠', en: 'sound / tone / sleep', words: [
    ['sound', '声音；听起来', 'son 声音 + d'],
    ['sonar', '声呐；声波定位', 'son 声音 + ar'],
    ['consonant', '辅音；一致的', 'con 共同 + son 声音 + ant'],
    ['unison', '齐唱；一致', 'uni 一 + son 声音'],
    ['sonnet', '十四行诗', 'son 声音 + net'],
    ['dissonance', '不和谐；不一致', 'dis 分开 + son 声音 + ance']
  ] },
  { type: 'root', form: 'soph', meaning: '智慧；聪明；技巧', en: 'wisdom / wise / skill', words: [
    ['philosophy', '哲学；人生观', 'phil 爱 + soph 智慧 + y'],
    ['sophisticated', '复杂的；精密的', 'soph 智慧 + isticated'],
    ['sophomore', '大二学生；幼稚的人', 'sopho 智慧 + more 愚蠢'],
    ['sophist', '诡辩家；智者', 'soph 智慧 + ist'],
    ['sophistry', '诡辩；似是而非的推理', 'soph 智慧 + istry'],
    ['pansophic', '全知的；无所不知的', 'pan 全 + soph 智慧 + ic']
  ] },
  { type: 'root', form: 'spec / scop', meaning: '看；观察；镜；范围', en: 'look / see / appear / scope', words: [
    ['microscope', '显微镜', 'micro 小 + scope 看'],
    ['telescope', '望远镜', 'tele 远 + scope 看'],
    ['scope', '范围；视野', 'scop 看 + e'],
    ['horoscope', '占星术；星座', 'horo 时间 + scope 看'],
    ['sceptic', '怀疑论者', 'scept 看 + ic'],
    ['kaleidoscope', '万花筒', 'kaleido 美丽 + scope 看']
  ] },
  { type: 'root', form: 'sper', meaning: '希望；期望；散布', en: 'hope / expect / scatter', words: [
    ['despair', '绝望；失望', 'de 去除 + spair 希望'],
    ['prosper', '繁荣；成功', 'pro 向前 + sper 希望'],
    ['prosperity', '繁荣；兴旺', 'prosper 繁荣 + ity'],
    ['desperate', '绝望的；拼命的', 'de 去除 + sper 希望 + ate'],
    ['asperity', '严酷；粗暴', 'a 不 + sper 希望 + ity'],
    ['prosperous', '繁荣的；兴旺的', 'prosper 繁荣 + ous']
  ] },
  { type: 'root', form: 'test', meaning: '证明；测试；见证；检验', en: 'witness / prove / test / testify', words: [
    ['test', '测试；检验', 'test 证明'],
    ['testify', '作证；证明', 'test 见证 + ify 使'],
    ['testimony', '证词；证据', 'test 见证 + imony'],
    ['contest', '竞赛；争论', 'con 共同 + test 证明'],
    ['protest', '抗议；反对', 'pro 向前 + test 证明'],
    ['attest', '证明；证实', 'at 朝向 + test 证明'],
    ['detest', '厌恶；憎恨', 'de 向下 + test 证明']
  ] },
  { type: 'root', form: 'the', meaning: '神；上帝；神圣', en: 'god / divine / theology', words: [
    ['theology', '神学；宗教学', 'the 神 + ology 学'],
    ['theism', '有神论；一神论', 'the 神 + ism'],
    ['atheism', '无神论', 'a 无 + the 神 + ism'],
    ['pantheism', '泛神论', 'pan 全 + the 神 + ism'],
    ['theocracy', '神权政治', 'the 神 + cracy 统治'],
    ['apotheosis', '神化；尊为神圣', 'apo 离开 + the 神 + osis']
  ] },
  { type: 'root', form: 'tom', meaning: '切；割；切片；解剖', en: 'cut / slice / section / anatomy', words: [
    ['anatomy', '解剖学；解剖', 'ana 向上 + tom 切 + y'],
    ['atom', '原子；微粒', 'a 不 + tom 切（不可切分）'],
    ['dichotomy', '二分法；对立', 'dicho 二 + tom 切 + y'],
    ['epitome', '缩影；典型', 'epi 在…上 + tom 切 + e'],
    ['tome', '大部头书；卷', 'tom 切 + e'],
    ['appendectomy', '阑尾切除术', 'append 阑尾 + ectomy 切除']
  ] },
  { type: 'root', form: 'tort', meaning: '扭曲；拧；折磨；歪曲', en: 'twist / wring / torture / distort', words: [
    ['torture', '折磨；拷问', 'tort 扭曲 + ure'],
    ['distort', '扭曲；歪曲', 'dis 分开 + tort 扭曲'],
    ['contort', '扭曲；曲解', 'con 完全 + tort 扭曲'],
    ['extort', '敲诈；勒索', 'ex 向外 + tort 扭曲'],
    ['retort', '反驳；回嘴', 're 回 + tort 扭曲'],
    ['tortuous', '曲折的；转弯抹角的', 'tort 扭曲 + uous']
  ] },
  { type: 'root', form: 'tox', meaning: '毒；毒素；有毒', en: 'poison / toxin / toxic / intoxicate', words: [
    ['toxin', '毒素；毒质', 'tox 毒 + in'],
    ['toxic', '有毒的；中毒的', 'tox 毒 + ic'],
    ['toxicology', '毒理学', 'tox 毒 + icology 学'],
    ['intoxicate', '使中毒；使陶醉', 'in 进入 + tox 毒 + icate'],
    ['detoxify', '解毒；去除毒素', 'de 去除 + tox 毒 + ify'],
    ['toxemia', '毒血症', 'tox 毒 + emia 血症']
  ] },
  { type: 'root', form: 'trib', meaning: '给予；分配；支付；部落', en: 'give / bestow / pay / tribute', words: [
    ['tribute', '贡品；致敬', 'trib 给予 + ute'],
    ['contribute', '贡献；捐献', 'con 共同 + trib 给予 + ute'],
    ['distribute', '分配；分发', 'dis 分开 + trib 给予 + ute'],
    ['attribute', '归因于；属性', 'at 朝向 + trib 给予 + ute'],
    ['tribe', '部落；宗族', 'trib 部落 + e'],
    ['tribal', '部落的；种族的', 'trib 部落 + al'],
    ['retribution', '报应；惩罚', 're 回 + tribut 给予 + ion']
  ] },
  { type: 'root', form: 'trud / trus', meaning: '推；挤；插入；强迫', en: 'push / thrust / intrude', words: [
    ['intrude', '闯入；侵入', 'in 向内 + trud 推 + e'],
    ['extrude', '挤出；压出', 'ex 向外 + trud 推 + e'],
    ['protrude', '突出；伸出', 'pro 向前 + trud 推 + e'],
    ['obtrude', '强加；闯入', 'ob 朝向 + trud 推 + e'],
    ['intrusion', '闯入；侵入', 'in 向内 + trus 推 + ion'],
    ['abstruse', '深奥的；难解的', 'abs 离开 + trus 推 + e']
  ] },
  { type: 'root', form: 'turb', meaning: '扰乱；搅动；混乱；骚动', en: 'disturb / agitate / confusion / turbulent', words: [
    ['disturb', '打扰；扰乱', 'dis 分开 + turb 扰乱'],
    ['turbulent', '动荡的；骚乱的', 'turb 扰乱 + ulent'],
    ['turbine', '涡轮机；汽轮机', 'turb 搅动 + ine'],
    ['turbid', '浑浊的；混乱的', 'turb 搅动 + id'],
    ['perturb', '使不安；扰乱', 'per 完全 + turb 扰乱'],
    ['disturbance', '干扰；骚乱', 'disturb 扰乱 + ance']
  ] },
  { type: 'root', form: 'urb', meaning: '城市；都市；城镇', en: 'city / urban / suburb', words: [
    ['urban', '城市的；都市的', 'urb 城市 + an'],
    ['suburb', '郊区；郊外', 'sub 下 + urb 城市'],
    ['urbanization', '城市化', 'urban 城市 + ization'],
    ['urbane', '温文尔雅的；有礼貌的', 'urb 城市 + ane'],
    ['exurban', '城市远郊的', 'ex 外 + urban 城市的'],
    ['interurban', '城市间的', 'inter 在…之间 + urban 城市的']
  ] },
  { type: 'root', form: 'vac', meaning: '空；空洞；空缺；真空', en: 'empty / void / vacant / vacuum', words: [
    ['vacant', '空的；空缺的', 'vac 空 + ant'],
    ['vacuum', '真空；真空吸尘器', 'vac 空 + uum'],
    ['vacate', '腾出；撤离', 'vac 空 + ate'],
    ['vacation', '假期；休假', 'vac 空 + ation（空出工作）'],
    ['evacuate', '疏散；撤离', 'e 出 + vac 空 + uate'],
    ['vacuity', '空虚；空白', 'vac 空 + uity']
  ] },
  { type: 'root', form: 'vad / vas', meaning: '走；行；移动；侵入', en: 'go / walk / move / invade', words: [
    ['invade', '侵略；侵入', 'in 向内 + vad 走 + e'],
    ['evade', '逃避；规避', 'e 出 + vad 走 + e'],
    ['pervade', '弥漫；遍及', 'per 完全 + vad 走 + e'],
    ['invader', '侵略者；入侵者', 'invade 侵略 + er'],
    ['evasion', '逃避；规避', 'e 出 + vas 走 + ion'],
    ['invasive', '侵略性的；侵入的', 'in 向内 + vas 走 + ive']
  ] },
  { type: 'root', form: 'var', meaning: '变化；不同；多样；变量', en: 'change / different / variable / vary', words: [
    ['vary', '变化；不同', 'var 变化 + y'],
    ['variable', '可变的；变量', 'var 变化 + able 可'],
    ['variety', '多样性；种类', 'var 变化 + iety'],
    ['various', '各种各样的', 'var 变化 + ious'],
    ['variation', '变化；变异', 'var 变化 + iation'],
    ['invariant', '不变的；恒定的', 'in 不 + variant 变化的']
  ] },
  { type: 'root', form: 'verb', meaning: '词；动词；言语', en: 'word / verb / verbal / adverb', words: [
    ['verb', '动词', 'verb 词'],
    ['verbal', '口头的；动词的', 'verb 词 + al'],
    ['adverb', '副词', 'ad 朝向 + verb 词'],
    ['proverb', '谚语；格言', 'pro 向前 + verb 词'],
    ['verbose', '冗长的；啰嗦的', 'verb 词 + ose'],
    ['verbatim', '逐字地；一字不差地', 'verb 词 + atim']
  ] },
  { type: 'root', form: 'vest', meaning: '穿衣；衣服；授予；投资', en: 'clothe / dress / garment / invest', words: [
    ['vest', '背心；马甲', 'vest 衣服'],
    ['invest', '投资；投入', 'in 进入 + vest 衣服（穿上→投入）'],
    ['divest', '剥夺；脱去', 'di 分开 + vest 衣服'],
    ['vestment', '法衣；礼服', 'vest 衣服 + ment'],
    ['investigate', '调查；研究', 'invest 投入 + igate'],
    ['transvestite', '异装癖者', 'trans 跨越 + vest 衣服 + ite']
  ] },
  { type: 'root', form: 'vig', meaning: '活泼；精力；活力；警醒', en: 'lively / energetic / vigorous / vigil', words: [
    ['vigorous', '精力充沛的；强健的', 'vigor 活力 + ous'],
    ['vigor', '活力；精力', 'vig 活泼 + or'],
    ['vigil', '守夜；监视', 'vig 警醒 + il'],
    ['vigilant', '警惕的；警醒的', 'vigil 监视 + ant'],
    ['invigorate', '使精力充沛；鼓舞', 'in 进入 + vigor 活力 + ate'],
    ['revitalize', '使恢复活力；使新生', 're 再 + vital 生命 + ize']
  ] },
  { type: 'root', form: 'vinc', meaning: '征服；克服；战胜', en: 'conquer / overcome / invincible', words: [
    ['invincible', '不可战胜的；无敌的', 'in 不 + vinc 征服 + ible'],
    ['convince', '说服；使信服', 'con 完全 + vinc 征服 + e'],
    ['conviction', '信念；定罪', 'convict 定罪 + ion'],
    ['evince', '表明；显示', 'e 出 + vinc 征服 + e'],
    ['vincible', '可征服的；可战胜的', 'vinc 征服 + ible'],
    ['province', '省；领域', 'pro 向前 + vinc 征服 + e']
  ] },
  { type: 'root', form: 'vir', meaning: '男人；男性；男子气概；美德', en: 'man / male / virtue / virile', words: [
    ['virtue', '美德；德行', 'vir 男人 + tue（男子气概→美德）'],
    ['virile', '有男子气概的；精力充沛的', 'vir 男人 + ile'],
    ['virtual', '虚拟的；实际上的', 'vir 男人 + tual'],
    ['virtuoso', '艺术大师；名家', 'virtu 美德 + oso'],
    ['triumvirate', '三人执政；三头政治', 'trium 三 + vir 男人 + ate'],
    ['virago', '泼妇；悍妇', 'vir 男人 + ago']
  ] },
  { type: 'root', form: 'vor', meaning: '吃；吞食；贪婪', en: 'eat / devour / greedy / carnivore', words: [
    ['carnivore', '食肉动物', 'carni 肉 + vor 吃 + e'],
    ['herbivore', '食草动物', 'herbi 草 + vor 吃 + e'],
    ['omnivore', '杂食动物', 'omni 全 + vor 吃 + e'],
    ['devour', '吞食；毁灭', 'de 完全 + vour 吃'],
    ['voracious', '贪吃的；贪婪的', 'vor 吃 + acious'],
    ['insectivore', '食虫动物', 'insect 昆虫 + ivor 吃 + e']
  ] },
  { type: 'root', form: 'vot', meaning: '发誓；承诺；投票；奉献', en: 'vow / promise / devote / vote', words: [
    ['vote', '投票；选举', 'vot 发誓 + e'],
    ['voter', '选民；投票者', 'vote 投票 + er'],
    ['devote', '奉献；致力于', 'de 向下 + vot 发誓 + e'],
    ['devotion', '奉献；忠诚', 'devote 奉献 + ion'],
    ['votive', '奉献的；还愿的', 'vot 发誓 + ive'],
    ['veto', '否决；禁止', 'vet 禁止 + o']
  ] }
]
