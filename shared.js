// top 338 by traffic
const TLDs = ["com", "net", "org", "jp", "de", "uk", "fr", "br", "it", "ru", "es", "me", "gov", "pl", "ca", "au", "cn", "co", "in", "nl", "edu", "info", "eu", "ch", "id", "at", "kr", "cz", "mx", "be", "tv", "se", "tr", "tw", "al", "ua", "ir", "vn", "cl", "sk", "ly", "cc", "to", "no", "fi", "us", "pt", "dk", "ar", "hu", "tk", "gr", "il", "news", "ro", "my", "biz", "ie", "za", "nz", "sg", "ee", "th", "io", "xyz", "pe", "bg", "hk", "rs", "lt", "link", "ph", "club", "si", "site", "mobi", "by", "cat", "wiki", "la", "ga", "xxx", "cf", "hr", "ng", "jobs", "online", "kz", "ug", "gq", "ae", "is", "lv", "pro", "fm", "tips", "ms", "sa", "app", "lat", "pk", "ws", "top", "xn", "pw", "ai", "kw", "ml", "su", "lu", "nu", "ec", "uy", "az", "ma", "st", "asia", "im", "am", "email", "ke", "eg", "live", "md", "uz", "today", "ge", "ba", "bo", "blog", "lk", "do", "one", "ve", "media", "sh", "vip", "life", "guru", "mp", "int", "tz", "desi", "jo", "mk", "np", "py", "mu", "mn", "re", "travel", "tn", "gd", "sn", "cam", "shop", "mil", "tokyo", "gg", "kg", "cr", "li", "cu", "hn", "eus", "rocks", "bd", "dev", "fun", "video", "gt", "bz", "space", "store", "mt", "name", "work", "porn", "pub", "kh", "icu", "as", "cy", "pr", "careers", "ps", "dz", "iq", "ltd", "pa", "sv", "qa", "design", "sc", "sy", "aero", "tech", "best", "scot", "win", "ni", "bzh", "lb", "city", "digital", "red", "pg", "world", "ag", "ci", "report", "ac", "center", "ad", "ovh", "om", "cloud", "press", "zw", "vg", "cx", "website", "plus", "page", "bs", "cd", "gh", "moe", "help", "download", "ao", "cm", "af", "click", "mg", "tm", "na", "pics", "mv", "market", "rw", "fo", "fj", "tl", "gratis", "art", "mc", "mo", "gal", "coop", "nc", "run", "mz", "tj", "zone", "cv", "bh", "place", "gy", "agency", "kn", "mm", "bid", "bj", "je", "gs", "global", "lol", "tube", "lc", "bm", "ninja", "bn", "review", "bi", "ht", "sm", "ax", "pm", "ink", "vc", "so", "tel", "cw", "uno", "casa", "network", "buzz", "mw", "vu", "guide", "bf", "mq", "sex", "sr", "zm", "onl", "vet", "bw", "jm", "bar", "gp", "pf", "ne", "va", "bt", "sd", "expert", "kim", "africa", "mr", "gi", "tg", "cg", "ls", "sb", "ck", "gf", "yt", "dm", "realtor", "aw", "sz", "london", "et", "ky", "cool", "lr", "bb", "support", "taipei", "sl", "company", "dj", "social", "gm", "xn", "love"];

// top 3 by traffic
const superPrimaryTLDs = ["com", "net", "org"];

// top 30 by traffic
const primaryTLDs = ["com", "net", "org", "jp", "de", "uk", "fr", "br", "it", "ru", "es", "me", "gov", "pl", "ca", "au", "cn", "co", "in", "nl", "edu", "info", "eu", "ch", "id"];

const defaultCustomTLDs = {
    "": "com",
    "c": "com",
    "n": "net",
    "o": "org",
    "g": "gov",
    "e": "edu",
};

// Unified Validation logic passed a dynamic map to resolve scope issues
function isTopDown(hostLower, customMounts, customTLDsMap) {
    if (!hostLower || hostLower.includes(' ') || hostLower === ".") return false;

    let cleanHost = hostLower.split('/')[0];
    let parts = cleanHost.split('.');

    let firstPart = parts[0].toLowerCase();
    let lastPart = parts[parts.length - 1].toLowerCase();

    if (firstPart === "" && parts[1] && customMounts && customMounts[parts[1]] !== undefined) return true;
    if (customTLDsMap && customTLDsMap[firstPart] !== undefined) return true;

    if (superPrimaryTLDs.includes(lastPart)) return false;
    if (primaryTLDs.includes(firstPart)) return true;
    if (TLDs.includes(firstPart) && !TLDs.includes(lastPart)) return true;

    return false;
}

// PREPROCESSOR: Expands aliases as strict 1-to-1 string replacements
function expandCustomMounts(hostLower, customMounts) {
    if (hostLower === "") return hostLower
    let parts = hostLower.split('.');
    if (parts.length === 0) return hostLower;

    if (parts[0] !== "") return hostLower

    let expanded = hostLower
    let postDot = parts[1].split("/")[0]
    let afterPostDot = parts.slice(2)
    let paths = expanded.split("/").slice(1).join("/")
    if (paths !== "") paths = paths.replace(/^/, "/")


    while (parts[0] === "" && customMounts["." + postDot]) {
        let substituted = customMounts["." + postDot]
        expanded = (substituted + afterPostDot.join(".")).split("/")[0]
        let newPath = "/" + substituted.split("/").slice(1).join("/")
        paths = paths.replace(/^/, newPath);
        if (substituted.includes("/") && parts.length > 2) {
            return `${substituted}.${parts.slice(2).join(".")}${paths}`
        }
        parts = expanded.split("/")[0].split(".")
        postDot = parts[1]
        afterPostDot = parts.slice(2)
    }
    return expanded + paths
}