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
};

// Unified Validation logic passed a dynamic map to resolve scope issues
function isTopDown(hostLower, customMounts, customTLDsMap) {
    if (!hostLower || hostLower.includes(' ') || hostLower === ".") return false;

    // Strip out path, query (?), and fragment (#) to isolate the domain part
    let cleanHost = hostLower.split(/[\/\?#]/)[0];
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

function expandCustomMounts(hostLower, customMounts) {
    if (hostLower === "") return hostLower

    let splitBySlash = hostLower.split("/")
    let splitByDot = splitBySlash[0].split(".")
    if (splitByDot.length === 0) return hostLower;

    let first = splitByDot[0]
    let second = splitByDot[1]
    if (first !== "") return hostLower

    let subdomains = splitByDot.slice(2)
    let subpaths = splitBySlash.slice(1)
    let subbed = ""
    let beenawhile = false
    while (first === "" && customMounts["." + second] && !(customMounts["." + second].includes("/") && subdomains.length > 0)) {
        beenawhile = true
        subbed = customMounts["." + second]
        splitBySlash = subbed.split("/")
        splitByDot = splitBySlash[0].split(".")

        subdomains.unshift(...splitBySlash[0].split(".").slice(2))
        subpaths.unshift(...splitBySlash.slice(1))

        first = splitByDot[0]
        second = splitByDot[1]
    }

    if (!beenawhile) {
        return hostLower
    }
    let subdomainsStr = (subdomains.length === 0 ? "" : "." + subdomains.join("."))
    let pathsStr = (subpaths.length === 0 ? "" : "/" + subpaths.join("/"))

    first = subbed.split("/")[0].split(".")[0]
    second = subbed.split("/")[0].split(".")[1]
    return first + "." + second + subdomainsStr + pathsStr
}