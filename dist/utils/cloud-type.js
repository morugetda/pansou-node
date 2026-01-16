const cloudTypePatterns = [
    {
        type: 'baidu',
        patterns: [
            /pan\.baidu\.com\/s\//i,
            /pan\.baidu\.com\/share\//i,
            /baidu\.com\/s\//i
        ]
    },
    {
        type: 'aliyun',
        patterns: [
            /www\.aliyundrive\.com\/s\//i,
            /aliyundrive\.com\/s\//i,
            /aliyun\.com\/s\//i
        ]
    },
    {
        type: 'quark',
        patterns: [
            /pan\.quark\.cn\/s\//i,
            /quark\.cn\/s\//i,
            /quark\.com\/s\//i
        ]
    },
    {
        type: 'tianyi',
        patterns: [
            /cloud\.189\.cn\/t\//i,
            /189\.cn\/t\//i
        ]
    },
    {
        type: 'uc',
        patterns: [
            /pan\.uc\.cn\//i,
            /uc\.cn\/pan\//i
        ]
    },
    {
        type: 'mobile',
        patterns: [
            /cloud\.139\.com\//i,
            /139\.com\/pan\//i
        ]
    },
    {
        type: '115',
        patterns: [
            /115\.com\/s\//i,
            /115\.com\/p\//i
        ]
    },
    {
        type: 'pikpak',
        patterns: [
            /mypikpak\.com\//i,
            /pikpak\.cloud\//i
        ]
    },
    {
        type: 'xunlei',
        patterns: [
            /pan\.xunlei\.com\//i,
            /xunlei\.com\/s\//i
        ]
    },
    {
        type: '123',
        patterns: [
            /www\.123pan\.com\//i,
            /123pan\.com\//i
        ]
    },
    {
        type: 'magnet',
        patterns: [
            /^magnet:/i
        ]
    },
    {
        type: 'ed2k',
        patterns: [
            /^ed2k:/i
        ]
    }
];
export function detectCloudType(url) {
    for (const { type, patterns } of cloudTypePatterns) {
        for (const pattern of patterns) {
            if (pattern.test(url)) {
                return type;
            }
        }
    }
    return 'others';
}
export function extractPassword(text) {
    const patterns = [
        /提取码[：:\s]*([a-zA-Z0-9]+)/i,
        /密码[：:\s]*([a-zA-Z0-9]+)/i,
        /码[：:\s]*([a-zA-Z0-9]+)/i,
        /pwd[：:\s]*([a-zA-Z0-9]+)/i,
        /password[：:\s]*([a-zA-Z0-9]+)/i,
        /提取码[：:\s]*([^\s]+)/i
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    return undefined;
}
export function parseLinks(text) {
    const links = [];
    const urlPattern = /(https?:\/\/[^\s]+)|(magnet:[^\s]+)|(ed2k:[^\s]+)/gi;
    const lines = text.split('\n');
    for (const line of lines) {
        const urlMatches = line.match(urlPattern);
        if (urlMatches) {
            for (const url of urlMatches) {
                const type = detectCloudType(url);
                const password = extractPassword(line);
                links.push({
                    type,
                    url,
                    password
                });
            }
        }
    }
    return links;
}
const cloudTypeKeys = ['baidu', 'aliyun', 'quark', 'tianyi', 'uc', 'mobile', '115', 'pikpak', 'xunlei', '123', 'magnet', 'ed2k', 'others'];
export function mergeLinksByType(results) {
    const merged = {};
    for (const key of cloudTypeKeys) {
        merged[key] = [];
    }
    for (const result of results) {
        for (const link of result.links || []) {
            const type = link.type;
            if (!merged[type]) {
                merged[type] = [];
            }
            merged[type].push({
                type,
                url: link.url,
                password: link.password || '',
                note: result.title || '',
                datetime: link.datetime || result.datetime,
                source: `tg:${result.channel}`,
                images: result.images || []
            });
        }
    }
    return merged;
}
export const cloudTypeNames = {
    baidu: '百度网盘',
    aliyun: '阿里云盘',
    quark: '夸克网盘',
    tianyi: '天翼云盘',
    uc: 'UC网盘',
    mobile: '移动云盘',
    '115': '115网盘',
    pikpak: 'PikPak',
    xunlei: '迅雷网盘',
    '123': '123网盘',
    magnet: '磁力链接',
    ed2k: '电驴链接',
    others: '其他'
};
//# sourceMappingURL=cloud-type.js.map