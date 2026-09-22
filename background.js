// top 338 by traffic
const TLDs = ["com", "net", "org", "jp", "de", "uk", "fr", "br", "it", "ru", "es", "me", "gov", "pl", "ca", "au", "cn", "co", "in", "nl", "edu", "info", "eu", "ch", "id", "at", "kr", "cz", "mx", "be", "tv", "se", "tr", "tw", "al", "ua", "ir", "vn", "cl", "sk", "ly", "cc", "to", "no", "fi", "us", "pt", "dk", "ar", "hu", "tk", "gr", "il", "news", "ro", "my", "biz", "ie", "za", "nz", "sg", "ee", "th", "io", "xyz", "pe", "bg", "hk", "rs", "lt", "link", "ph", "club", "si", "site", "mobi", "by", "cat", "wiki", "la", "ga", "xxx", "cf", "hr", "ng", "jobs", "online", "kz", "ug", "gq", "ae", "is", "lv", "pro", "fm", "tips", "ms", "sa", "app", "lat", "pk", "ws", "top", "xn", "pw", "ai", "kw", "ml", "su", "lu", "nu", "ec", "uy", "az", "ma", "st", "asia", "im", "am", "email", "ke", "eg", "live", "md", "uz", "today", "ge", "ba", "bo", "blog", "lk", "do", "one", "ve", "media", "sh", "vip", "life", "guru", "mp", "int", "tz", "desi", "jo", "mk", "np", "py", "mu", "mn", "re", "travel", "tn", "gd", "sn", "cam", "shop", "mil", "tokyo", "gg", "kg", "cr", "li", "cu", "hn", "eus", "rocks", "bd", "dev", "fun", "video", "gt", "bz", "space", "store", "mt", "name", "work", "porn", "pub", "kh", "icu", "as", "cy", "pr", "careers", "ps", "dz", "iq", "ltd", "pa", "sv", "qa", "design", "sc", "sy", "aero", "tech", "best", "scot", "win", "ni", "bzh", "lb", "city", "digital", "red", "pg", "world", "ag", "ci", "report", "ac", "center", "ad", "ovh", "om", "cloud", "press", "zw", "vg", "cx", "website", "plus", "page", "bs", "cd", "gh", "moe", "help", "download", "ao", "cm", "af", "click", "mg", "tm", "na", "pics", "mv", "market", "rw", "fo", "fj", "tl", "gratis", "art", "mc", "mo", "gal", "coop", "nc", "run", "mz", "tj", "zone", "cv", "bh", "place", "gy", "agency", "kn", "mm", "bid", "bj", "je", "gs", "global", "lol", "tube", "lc", "bm", "ninja", "bn", "review", "bi", "ht", "sm", "ax", "pm", "ink", "vc", "so", "tel", "cw", "uno", "casa", "network", "buzz", "mw", "vu", "guide", "bf", "mq", "sex", "sr", "zm", "onl", "vet", "bw", "jm", "bar", "gp", "pf", "ne", "va", "bt", "sd", "expert", "kim", "africa", "mr", "gi", "tg", "cg", "ls", "sb", "ck", "gf", "yt", "dm", "realtor", "aw", "sz", "london", "et", "ky", "cool", "lr", "bb", "support", "taipei", "sl", "company", "dj", "social", "gm", "xn", "love"];

// top 3 by traffic
const superPrimaryTLDs = ["com", "net", "org"]

// top 30 by traffic
const primaryTLDs = ["com", "net", "org", "jp", "de", "uk", "fr", "br", "it", "ru", "es", "me", "gov", "pl", "ca", "au", "cn", "co", "in", "nl", "edu", "info", "eu", "ch", "id"];

const shortcuts = {
    "": "com",
    "c": "com",
    "n": "net",
    "o": "org",
    "g": "gov",
    "e": "edu",
};

// Map of common search engines to catch queries
const searchEngines = {
    "www.google.com": "q",
    "duckduckgo.com": "q",
    "www.bing.com": "q",
    "search.yahoo.com": "p",
    "ecosia.org": "q"
};

let customMounts = {};

// Load user mounts from storage
browser.storage.local.get({ customMounts: {} }).then(res => {
    customMounts = res.customMounts;
});

// Update the memory instantly if the user changes settings in the Options page
browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.customMounts) {
        customMounts = changes.customMounts.newValue;
    }
});

// PREPROCESSOR: Expands aliases as strict 1-to-1 string replacements
function expandCustomMounts(domainStr) {
    let parts = domainStr.split('.');
    if (parts.length === 0) return domainStr;

    let aliasKey = parts[0];
    let partsConsumed = 1;

    // Support leading dot triggers (e.g. ".soccer")
    if (parts[0] === "" && parts.length > 1) {
        aliasKey = "." + parts[1];
        partsConsumed = 2;
    }

    if (customMounts[aliasKey]) {
        let target = customMounts[aliasKey];
        let remainingParts = parts.slice(partsConsumed);

        if (remainingParts.length > 0) {
            // Treat the target as a 1-to-1 replacement text prefix
            let targetParts = target.split('/');
            let tDomain = targetParts[0];
            let tPath = targetParts.slice(1).join('/');

            let combinedDomain = tDomain + "." + remainingParts.join('.');
            return combinedDomain + (tPath ? "/" + tPath : "");
        } else {
            return target;
        }
    }
    return domainStr;
}

function isTopDownDomain(domainStr) {
    if (domainStr.includes(' ')) return false;
    if (domainStr === ".") return false

    let parts = domainStr.split('.');

    let firstPart = parts[0].toLowerCase();
    let lastPart = parts[parts.length - 1].toLowerCase();

    if (shortcuts[firstPart] !== undefined) return true;

    if (superPrimaryTLDs.includes(lastPart)) return false;
    if (primaryTLDs.includes(firstPart)) return true;
    if (TLDs.includes(firstPart) && !TLDs.includes(lastPart)) return true;

    return false;
}

function reverseDomain(domainStr) {
    let parts = domainStr.split('.');
    let firstPart = parts[0].toLowerCase();

    if (shortcuts[firstPart]) {
        parts[0] = shortcuts[firstPart];
    }
    return parts.reverse().join('.');
}

browser.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.type !== "main_frame") return;

        // ORIGIN FIX: Ignore requests that originate from clicking a link on a webpage.
        // Typed URLs will either lack an originUrl or use internal schemas (like about:newtab).
        if (details.originUrl && details.originUrl.startsWith("http")) {
            return;
        }

        let url = new URL(details.url);

        // CASE 1: Direct navigation attempt
        let hostLower = url.hostname.toLowerCase();
        let expandedHost = expandCustomMounts(hostLower);

        // MERGE AND RE-SPLIT: Cleanly separate domain from path after string replacements
        let fullPath1 = expandedHost + (url.pathname === '/' ? '' : url.pathname);
        let parts1 = fullPath1.split('/');
        let finalDomain1 = parts1[0];
        let finalPath1 = parts1.slice(1).join('/');

        if (isTopDownDomain(finalDomain1)) {
            let standardDomain = reverseDomain(finalDomain1);
            let newUrl = "https://" + standardDomain + (finalPath1 ? "/" + finalPath1 : "") + url.search + url.hash;
            return { redirectUrl: newUrl };
        }

        // CASE 2: Search engine query intercept
        let searchParam = searchEngines[url.hostname];
        if (searchParam && url.searchParams.has(searchParam)) {
            let query = url.searchParams.get(searchParam).trim();

            let [rawPath, ...queryAndHash] = query.split(/[\?#]/);
            let extraStuff = queryAndHash.length ? query.slice(rawPath.length) : "";

            let pathParts = rawPath.split('/');
            let queryDomain = pathParts[0].toLowerCase();
            let originalPath = pathParts.slice(1).join('/');

            let expandedDomain = expandCustomMounts(queryDomain);

            // MERGE AND RE-SPLIT: Cleanly separate domain from path
            let fullPath2 = expandedDomain + (originalPath ? "/" + originalPath : "");
            let parts2 = fullPath2.split('/');
            let finalDomain2 = parts2[0];
            let finalPath2 = parts2.slice(1).join('/');

            if (isTopDownDomain(finalDomain2)) {
                let standardDomain = reverseDomain(finalDomain2);
                let newUrl = "https://" + standardDomain + (finalPath2 ? '/' + finalPath2 : '') + extraStuff;
                return { redirectUrl: newUrl };
            }
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking"]
);