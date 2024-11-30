// func: 单韵母转片假名
export function fin_conv(fin) {
    const fin_map = {
        '': '', 'a': 'ア', 'o': 'オ', 'e': 'ウ', 'i': 'イ', 'u': 'ウ', 'v': 'ウ',
        'n': 'ン', 'ng': 'ン'
    };
    return fin_map[fin];
}

// func: 双韵母转片假名
export function fin2_conv(fin) {
    const fin_map = {
        '': '', 'a': 'ア', 'o': 'オ', 'e': 'エ', 'i': 'イ', 'u': 'ウ', 'v': 'ウ',
        'ai': 'アイ', 'ei': 'エイ', 'ui': 'ウイ', 'ao': 'アオ', 'ou': 'オウ', 
        'iu': 'イウ', 'ie': 'イエ', 've': 'ウエ', 'an': 'アン', 'en': 'エン', 
        'in': 'イン', 'un': 'ウン', 'vn': 'ウン', 'ang': 'アン', 'eng': 'エン', 
        'ing': 'イン', 'ong': 'オン',
    };
    return fin_map[fin];
}

// func: 声母与一个韵母转片假名
export function fin_ini_conv(ini, fin, tail) {
    switch (fin) {
        case 'a':
            const fin_map_a = {
                '': 'ア', 'b': 'バ', 'p': 'パ', 'm': 'マ', 'f': 'ファ', 'd': 'ダ',
                't': 'タ', 'n': 'ナ', 'l': 'ラ', 'g': 'ガ', 'k': 'カ', 'h': 'ハ',
                'j': 'ジャ', 'q': 'チャ', 'x': 'シャ', 'zh': 'ジャ', 'ch': 'チャ',
                'sh': 'シャ', 'r': 'ラ', 'z': 'ザ', 'c': 'ツァ', 's': 'サ',
                'y': 'ヤ', 'w': 'ワ'
            };
            return fin_map_a[ini];
        case 'o':
            const fin_map_o = {
                '': 'オ', 'b': 'ボ', 'p': 'ポ', 'm': 'モ', 'f': 'フォ', 'd': 'ド',
                't': 'ト', 'n': 'ノ', 'l': 'ロ', 'g': 'ゴ', 'k': 'コ', 'h': 'ホ',
                'j': 'ジョ', 'q': 'チョ', 'x': 'ショ', 'zh': 'ジョ', 'ch': 'チョ',
                'sh': 'ショ', 'r': 'ロ', 'z': 'ゾ', 'c': 'ツォ', 's': 'ソ',
                'y': 'ヨ', 'w': 'ヲ'
            };
            return fin_map_o[ini];
        case 'e':
            if (!tail) {
                const fin_map_e = {
                    '': 'ウ', 'b': 'ブ', 'p': 'プ', 'm': 'ム', 'f': 'フ', 'd': 'ド',
                    't': 'ツ', 'n': 'ヌ', 'l': 'ル', 'g': 'グ', 'k': 'ク', 'h': 'フ',
                    'j': 'ジュ', 'q': 'チュ', 'x': 'シュ', 'zh': 'ジュ', 'ch': 'チュ',
                    'sh': 'シュ', 'r': 'ル', 'z': 'ズ', 'c': 'ツ', 's': 'ス',
                    'y': 'イェ', 'w': 'ウ'
                };
                return fin_map_e[ini];
            } else {
                const fin_map_e = {
                    '': 'エ', 'b': 'ベ', 'p': 'ペ', 'm': 'メ', 'f': 'フェ', 'd': 'デ',
                    't': 'テ', 'n': 'ネ', 'l': 'レ', 'g': 'ゲ', 'k': 'ケ', 'h': 'ヘ',
                    'j': 'ジェ', 'q': 'チェ', 'x': 'シェ', 'zh': 'ジェ', 'ch': 'チェ',
                    'sh': 'シェ', 'r': 'レ', 'z': 'ゼ', 'c': 'ツェ', 's': 'セ',
                    'y': 'イェ', 'w': 'ウェ'
                };
                return fin_map_e[ini];
            }
        case 'i':
            const fin_map_i = {
                '': 'イ', 'b': 'ビ', 'p': 'ピ', 'm': 'ミ', 'f': 'フィ', 'd': 'ディ',
                't': 'ティ', 'n': 'ニ', 'l': 'リ', 'g': 'ギ', 'k': 'キ', 'h': 'ヒ',
                'j': 'ジ', 'q': 'チ', 'x': 'シ', 'zh': 'ジ', 'ch': 'チ', 'sh': 'シ',
                'r': 'リ', 'z': 'ズ', 'c': 'ツ', 's': 'ス', 'y': 'イ', 'w': 'ウィ'
            };
            return fin_map_i[ini];
        case 'u':
            const fin_map_u = {
                '': 'ウ', 'b': 'ブ', 'p': 'プ', 'm': 'ム', 'f': 'フ', 'd': 'ド',
                't': 'ツ', 'n': 'ヌ', 'l': 'ル', 'g': 'グ', 'k': 'ク', 'h': 'フ',
                'j': 'ジュ', 'q': 'チュ', 'x': 'シュ', 'zh': 'ジュ', 'ch': 'チュ',
                'sh': 'シュ', 'r': 'ル', 'z': 'ズ', 'c': 'ツ', 's': 'ス',
                'y': 'ユ', 'w': 'ウ'
            };
            return fin_map_u[ini];
        case 'v':
            const fin_map_v = {
                '': 'ウ', 'b': 'ブ', 'p': 'プ', 'm': 'ム', 'f': 'フ', 'd': 'ド',
                't': 'ツ', 'n': 'ヌ', 'l': 'ル', 'g': 'グ', 'k': 'ク', 'h': 'フ',
                'j': 'ジュ', 'q': 'チュ', 'x': 'シュ', 'zh': 'ジュ', 'ch': 'チュ',
                'sh': 'シュ', 'r': 'ル', 'z': 'ズ', 'c': 'ツ', 's': 'ス',
                'y': 'ヴ', 'w': 'ウ'
            };
            return fin_map_v[ini];
        default:
            console.log('Error: that is impossible!');
            return ini;
    }
}

// 读数字
export function num_conv(num) {
    let res = '';
    let float = false;
    let digit = 0;      // 位数
    let zero = true;    // 末尾的0
    // 注：不做二和两的区分，语境十分复杂
    const num_map = {
        '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
        '6': '六', '7': '七', '8': '八', '9': '九'
    };
    const digit_map = {
        0: '', 1: '十', 2: '百', 3: '千', 4: '万',
        5: '十', 6: '百', 7: '千', 8: '亿', 9: '十',
        10: '百', 11: '千', 12: '兆', 13: '十', 14: '百',
        15: '千', 16: '京', 17: '十', 18: '百', 19: '千'
    };
    // 判断是不是小数
    if (num.indexOf('.') != -1) float = true;
    // 读数
    for (let i = num.length-1; i >= 0; --i) {
        // 正负号
        if (num[i] == '-') {
            res = '负' + res;
            continue;
        }
        if (num[i] == '+') {
            res = '正' + res;
            continue;
        }
        // 小数点前后读数方法不同
        if (num[i] == '.') {
            res = '点' + res;
            float = false;
            continue;
        }
        // 小数部分
        if (float) {
            res = num_map[num[i]] + res;
        } 
        // 整数部分
        else {
            if (num[i] == '0') {
                // 末尾的0
                if (!zero) {
                    if (digit % 4 == 0) {
                        res = digit_map[digit] + res;
                    } else {
                        res = num_map[num[i]] + res;
                    }
                }
            } else {
                // 高位处理
                if (zero) {
                    zero = false;
                    // 万、亿、兆、京等防止重复
                    if (digit % 4 == 0) {
                        res = num_map[num[i]] + digit_map[digit] + res;
                    } else {
                        res = num_map[num[i]] + digit_map[digit] + digit_map[Math.floor(digit/4)*4] + res;
                    }
                } else {
                    res = num_map[num[i]] + digit_map[digit] + res;
                }
            }
            ++digit;
        }
    }
    // 小于1的小数
    if (digit == 1 && zero) res = '零' + res;
    // 合并连续的零
    res = res.replace(/零+/g, '零');
    return res;
  }

// 判断该字符是否为字母
export function isLetter(char) {
    return /^[A-Za-z]$/.test(char);
}

