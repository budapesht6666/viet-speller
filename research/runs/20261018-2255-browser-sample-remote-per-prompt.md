### Прогон: browser, говорит sample-remote, сессия per-prompt

- UA: `Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1`
- secure=true, SR=да (webkit), phrases=false

| Вопрос | Итог |
|---|---|
| interim / финал | первый interim от открытия окна — медиана 3.77 с; финал после последнего изменения — медиана 1.90 с; совпадение после конца образца — медиана -0.63 с |
| диакритика | есть в 1 из 1 непустых ответов |
| шесть тонов ma | с тоном 0 из 6; другой тон 0; не то слово 0; пусто 6 |
| неверный тон | как сказано 0; исправил по смыслу 0; иное 4 из 4 |
| одиночный слог | узнан (хотя бы без знаков) 0 из 6; с тоном 0 |
| числа | цифрами 0 из 5: «», «», «», «», «» |
| фразы | целиком с тонами 1 из 7; без знаков 1 |

| Задание | Сказано | Услышано | Вердикт | interim, с | финал, с |
|---|---|---|---|---|---|
| p-xin-chao | xin chào | Xin chào | совпало с тонами | 3.77 | 5.68 |
| p-cam-on-anh | cảm ơn anh | — | ничего не пришло | — | — |
| p-bao-nhieu-tien | bao nhiêu tiền | — | ничего не пришло | — | — |
| p-khong-hieu | tôi không hiểu | — | ничего не пришло | — | — |
| p-khong-cay | không cay | — | ничего не пришло | — | — |
| p-dung-o-day | dừng ở đây | — | ничего не пришло | — | — |
| p-ca-phe | cho tôi một cà phê sữa đá | — | ничего не пришло | — | — |
| s-ba | ba | — | ничего не пришло | — | — |
| s-nha | nhà | — | ничего не пришло | — | — |
| s-ga | gà | — | ничего не пришло | — | — |
| s-tra | trà | — | ничего не пришло | — | — |
| s-ngu | ngủ | — | ничего не пришло | — | — |
| s-pho | phở | — | ничего не пришло | — | — |
| t-ma | ma | — | ничего не пришло | — | — |
| t-ma-sac | má | — | ничего не пришло | — | — |
| t-ma-huyen | mà | — | ничего не пришло | — | — |
| t-ma-hoi | mả | — | ничего не пришло | — | — |
| t-ma-nga | mã | — | ничего не пришло | — | — |
| t-ma-nang | mạ | — | ничего не пришло | — | — |
| w-bao-nhieu | bao nhiều tiền | — | ничего не пришло | — | — |
| w-xin-chao | xin chạo | — | ничего не пришло | — | — |
| w-hieu | tôi không hiếu | — | ничего не пришло | — | — |
| w-sua | cà phê sửa đá | — | ничего не пришло | — | — |
| n-10 | mười | — | ничего не пришло | — | — |
| n-25 | hai mươi lăm | — | ничего не пришло | — | — |
| n-123 | một trăm hai mươi ba | — | ничего не пришло | — | — |
| n-50k | năm mươi nghìn | — | ничего не пришло | — | — |
| n-3m | ba triệu | — | ничего не пришло | — | — |

<details><summary>журнал</summary>

```
[0.00] === VI PROBE === mode=browser secure=true SR=да (webkit) phrases=false
[0.01] UA=Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1
[17.17] === автозамер ===
[17.17] SR.start() вызван
[17.17] --- окно: p-xin-chao «xin chào» (говорит: sample-remote, сессия: per-prompt)
[18.57] SR onstart, сессия #1
[18.57] ноутбук: играй
[18.88] SR onaudiostart
[20.94] SR onspeechstart
[20.94] onresult len=1 idx=0 | interim #0 alts=1: "Xin"(0.00)
[20.95] onresult len=1 idx=0 | interim #0 alts=1: "Xin chào"(0.00)
[21.58] ноутбук: образец доиграл
[22.85] onresult len=1 idx=0 | FINAL #0 alts=1: "Xin chào"(0.98)
[24.36] >>> p-xin-chao: «Xin chào» → совпало с тонами (закрыто: финал и тишина) | {"firstInterim":3.77,"match":3.78,"final":5.68,"lastChange":3.78,"playEnd":4.41}
[25.16] SR.start() вызван
[25.17] --- окно: p-cam-on-anh «cảm ơn anh» (говорит: sample-remote, сессия: per-prompt)
[25.18] SR onstart, сессия #2
[25.18] ноутбук: играй
[25.18] SR onaudiostart
[28.25] ноутбук: образец доиграл
[37.19] >>> p-cam-on-anh: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.08}
[37.23] SR ONERROR: aborted — No speech detected (старая сессия)
[38.00] SR.start() вызван
[38.00] --- окно: p-bao-nhieu-tien «bao nhiêu tiền» (говорит: sample-remote, сессия: per-prompt)
[38.01] SR onstart, сессия #3
[38.01] ноутбук: играй
[38.04] SR onaudiostart
[41.06] ноутбук: образец доиграл
[50.01] >>> p-bao-nhieu-tien: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.06}
[50.06] SR ONERROR: aborted — No speech detected (старая сессия)
[50.81] SR.start() вызван
[50.82] --- окно: p-khong-hieu «tôi không hiểu» (говорит: sample-remote, сессия: per-prompt)
[50.82] SR onstart, сессия #4
[50.82] ноутбук: играй
[50.85] SR onaudiostart
[53.87] ноутбук: образец доиграл
[62.82] >>> p-khong-hieu: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.05}
[62.87] SR ONERROR: aborted — No speech detected (старая сессия)
[63.63] SR.start() вызван
[63.63] --- окно: p-khong-cay «không cay» (говорит: sample-remote, сессия: per-prompt)
[63.63] SR onstart, сессия #5
[63.64] ноутбук: играй
[63.67] SR onaudiostart
[66.65] ноутбук: образец доиграл
[75.64] >>> p-khong-cay: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.02}
[75.68] SR ONERROR: aborted — No speech detected (старая сессия)
[76.44] SR.start() вызван
[76.44] --- окно: p-dung-o-day «dừng ở đây» (говорит: sample-remote, сессия: per-prompt)
[76.45] SR onstart, сессия #6
[76.45] ноутбук: играй
[76.48] SR onaudiostart
[79.65] ноутбук: образец доиграл
[88.45] >>> p-dung-o-day: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.21}
[88.48] SR ONERROR: aborted — No speech detected (старая сессия)
[89.26] SR.start() вызван
[89.26] --- окно: p-ca-phe «cho tôi một cà phê sữa đá» (говорит: sample-remote, сессия: per-prompt)
[89.29] SR onstart, сессия #7
[89.29] ноутбук: играй
[89.29] SR onaudiostart
[93.04] ноутбук: образец доиграл
[101.29] >>> p-ca-phe: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.79}
[101.34] SR ONERROR: aborted — No speech detected (старая сессия)
[102.10] SR.start() вызван
[102.10] --- окно: s-ba «ba» (говорит: sample-remote, сессия: per-prompt)
[102.11] SR onstart, сессия #8
[102.11] ноутбук: играй
[102.14] SR onaudiostart
[105.51] ноутбук: образец доиграл
[114.11] >>> s-ba: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.41}
[114.15] SR ONERROR: aborted — No speech detected (старая сессия)
[114.91] SR.start() вызван
[114.92] --- окно: s-nha «nhà» (говорит: sample-remote, сессия: per-prompt)
[114.92] SR onstart, сессия #9
[114.92] ноутбук: играй
[114.95] SR onaudiostart
[117.91] ноутбук: образец доиграл
[126.92] >>> s-nha: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":2.99}
[126.97] SR ONERROR: aborted — No speech detected (старая сессия)
[127.73] SR.start() вызван
[127.73] --- окно: s-ga «gà» (говорит: sample-remote, сессия: per-prompt)
[127.74] SR onstart, сессия #10
[127.74] ноутбук: играй
[127.76] SR onaudiostart
[130.75] ноутбук: образец доиграл
[139.74] >>> s-ga: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.02}
[139.78] SR ONERROR: aborted — No speech detected (старая сессия)
[140.54] SR.start() вызван
[140.55] --- окно: s-tra «trà» (говорит: sample-remote, сессия: per-prompt)
[140.55] SR onstart, сессия #11
[140.55] ноутбук: играй
[140.58] SR onaudiostart
[143.56] ноутбук: образец доиграл
[152.55] >>> s-tra: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.02}
[152.60] SR ONERROR: aborted — No speech detected (старая сессия)
[153.36] SR.start() вызван
[153.36] --- окно: s-ngu «ngủ» (говорит: sample-remote, сессия: per-prompt)
[153.40] SR onstart, сессия #12
[153.40] ноутбук: играй
[153.40] SR onaudiostart
[156.41] ноутбук: образец доиграл
[165.40] >>> s-ngu: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.05}
[165.45] SR ONERROR: aborted — No speech detected (старая сессия)
[166.20] SR.start() вызван
[166.21] --- окно: s-pho «phở» (говорит: sample-remote, сессия: per-prompt)
[166.21] SR onstart, сессия #13
[166.21] ноутбук: играй
[166.24] SR onaudiostart
[169.28] ноутбук: образец доиграл
[178.21] >>> s-pho: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.08}
[178.26] SR ONERROR: aborted — No speech detected (старая сессия)
[179.02] SR.start() вызван
[179.02] --- окно: t-ma «ma» (говорит: sample-remote, сессия: per-prompt)
[179.06] SR onstart, сессия #14
[179.06] ноутбук: играй
[179.06] SR onaudiostart
[182.10] ноутбук: образец доиграл
[191.06] >>> t-ma: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.09}
[191.10] SR ONERROR: aborted — No speech detected (старая сессия)
[191.87] SR.start() вызван
[191.87] --- окно: t-ma-sac «má» (говорит: sample-remote, сессия: per-prompt)
[191.87] SR onstart, сессия #15
[191.87] ноутбук: играй
[191.91] SR onaudiostart
[194.92] ноутбук: образец доиграл
[203.88] >>> t-ma-sac: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.06}
[203.92] SR ONERROR: aborted — No speech detected (старая сессия)
[204.68] SR.start() вызван
[204.68] --- окно: t-ma-huyen «mà» (говорит: sample-remote, сессия: per-prompt)
[204.72] SR onstart, сессия #16
[204.73] ноутбук: играй
[204.73] SR onaudiostart
[207.75] ноутбук: образец доиграл
[216.73] >>> t-ma-huyen: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.07}
[216.77] SR ONERROR: aborted — No speech detected (старая сессия)
[217.53] SR.start() вызван
[217.53] --- окно: t-ma-hoi «mả» (говорит: sample-remote, сессия: per-prompt)
[217.54] SR onstart, сессия #17
[217.54] ноутбук: играй
[217.57] SR onaudiostart
[220.67] ноутбук: образец доиграл
[229.54] >>> t-ma-hoi: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.14}
[229.59] SR ONERROR: aborted — No speech detected (старая сессия)
[230.35] SR.start() вызван
[230.35] --- окно: t-ma-nga «mã» (говорит: sample-remote, сессия: per-prompt)
[230.36] SR onstart, сессия #18
[230.36] ноутбук: играй
[230.39] SR onaudiostart
[233.45] ноутбук: образец доиграл
[242.36] >>> t-ma-nga: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.1}
[242.40] SR ONERROR: aborted — No speech detected (старая сессия)
[243.16] SR.start() вызван
[243.17] --- окно: t-ma-nang «mạ» (говорит: sample-remote, сессия: per-prompt)
[243.17] SR onstart, сессия #19
[243.17] ноутбук: играй
[243.21] SR onaudiostart
[246.21] ноутбук: образец доиграл
[255.17] >>> t-ma-nang: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.04}
[255.22] SR ONERROR: aborted — No speech detected (старая сессия)
[255.98] SR.start() вызван
[255.98] --- окно: w-bao-nhieu «bao nhiều tiền» (говорит: sample-remote, сессия: per-prompt)
[255.99] SR onstart, сессия #20
[255.99] ноутбук: играй
[256.02] SR onaudiostart
[259.16] ноутбук: образец доиграл
[267.99] >>> w-bao-nhieu: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.18}
[268.04] SR ONERROR: aborted — No speech detected (старая сессия)
[268.80] SR.start() вызван
[268.80] --- окно: w-xin-chao «xin chạo» (говорит: sample-remote, сессия: per-prompt)
[268.84] SR onstart, сессия #21
[268.84] ноутбук: играй
[268.84] SR onaudiostart
[271.55] ноутбук: образец доиграл
[280.84] >>> w-xin-chao: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":2.75}
[280.88] SR ONERROR: aborted — No speech detected (старая сессия)
[281.64] SR.start() вызван
[281.65] --- окно: w-hieu «tôi không hiếu» (говорит: sample-remote, сессия: per-prompt)
[281.68] SR onstart, сессия #22
[281.68] ноутбук: играй
[281.68] SR onaudiostart
[284.67] ноутбук: образец доиграл
[293.68] >>> w-hieu: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.03}
[293.73] SR ONERROR: aborted — No speech detected (старая сессия)
[294.49] SR.start() вызван
[294.49] --- окно: w-sua «cà phê sửa đá» (говорит: sample-remote, сессия: per-prompt)
[294.53] SR onstart, сессия #23
[294.53] ноутбук: играй
[294.53] SR onaudiostart
[297.77] ноутбук: образец доиграл
[306.53] >>> w-sua: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.28}
[306.57] SR ONERROR: aborted — No speech detected (старая сессия)
[307.33] SR.start() вызван
[307.34] --- окно: n-10 «mười» (говорит: sample-remote, сессия: per-prompt)
[307.37] SR onstart, сессия #24
[307.37] ноутбук: играй
[307.37] SR onaudiostart
[310.46] ноутбук: образец доиграл
[319.37] >>> n-10: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.13}
[319.42] SR ONERROR: aborted — No speech detected (старая сессия)
[320.18] SR.start() вызван
[320.18] --- окно: n-25 «hai mươi lăm» (говорит: sample-remote, сессия: per-prompt)
[320.19] SR onstart, сессия #25
[320.19] ноутбук: играй
[320.22] SR onaudiostart
[323.26] ноутбук: образец доиграл
[332.19] >>> n-25: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.09}
[332.23] SR ONERROR: aborted — No speech detected (старая сессия)
[333.00] SR.start() вызван
[333.00] --- окно: n-123 «một trăm hai mươi ba» (говорит: sample-remote, сессия: per-prompt)
[333.03] SR onstart, сессия #26
[333.03] ноутбук: играй
[333.03] SR onaudiostart
[336.40] ноутбук: образец доиграл
[345.03] >>> n-123: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.4}
[345.07] SR ONERROR: aborted — No speech detected (старая сессия)
[345.84] SR.start() вызван
[345.84] --- окно: n-50k «năm mươi nghìn» (говорит: sample-remote, сессия: per-prompt)
[345.85] SR onstart, сессия #27
[345.85] ноутбук: играй
[345.88] SR onaudiostart
[348.97] ноутбук: образец доиграл
[357.85] >>> n-50k: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.13}
[357.89] SR ONERROR: aborted — No speech detected (старая сессия)
[358.65] SR.start() вызван
[358.66] --- окно: n-3m «ba triệu» (говорит: sample-remote, сессия: per-prompt)
[358.66] SR onstart, сессия #28
[358.66] ноутбук: играй
[358.69] SR onaudiostart
[361.70] ноутбук: образец доиграл
[370.67] >>> n-3m: «» → ничего не пришло (закрыто: тишина) | {"firstInterim":null,"match":null,"final":null,"lastChange":null,"playEnd":3.05}
[370.71] SR ONERROR: aborted — No speech detected (старая сессия)
```
</details>
