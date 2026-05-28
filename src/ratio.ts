
// "4:3"のような文字列を4/3=1.3333...といった数値に変換する。
export function parseRatio(str: string): number {
    const splited = str.split(":");
    
    if (splited.length !== 2) {
        throw new Error(`Invalid ratio format: ${str}`);
    }

    const [x, y] = splited.map(Number);
    const ans = x / y;

    if (isNaN(ans) || !isFinite(ans)) {
        throw new Error(`Invalid ratio numbers: ${str}`);
    }

    return ans;
}

///  簡単な整数比表現を探す。
/// ratioToString(1.77777777778) = '16:9'
/// ratioToString(1.33333333333) = '4:3'
/// ratioToString(1.61803398875) = '55.01:34'
export function ratioToString(ratio: number): string {
    let best = {x: ratio, y: 1, score: Infinity};

    for(let i = 1; i <= 30; i++) {
        // 数値誤差を消すため小数点下2桁まで保持
        const a = Math.round(i * ratio * 100) / 100;
        const b = Math.round(i / ratio * 100) / 100;

        // 0.01未満の差は同率一位とみなす
        const score_a = Math.abs(a - Math.round(a));
        const score_b = Math.abs(b - Math.round(b));

        // スコアが同率の場合（おそらく両方整数比）は、先に出た方つまりxが小さいほうを優先する
        if (score_a < best.score) best = {x: a, y: i, score: score_a};
        if (score_b < best.score) best = {x: i, y: b, score: score_b};

        if (best.score < 0.005) break;
    }

    return `${best.x}:${best.y}`;
}
