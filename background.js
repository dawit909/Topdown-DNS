const searchEngines = {
    "www.google.com": "q",
    "duckduckgo.com": "q",
    "www.bing.com": "q",
    "search.yahoo.com": "p",
    "ecosia.org": "q"
};

let customTLDs = { ...defaultCustomTLDs };
let customMounts = {};

// Load user mounts and customTLDs from storage
browser.storage.local.get({ customMounts: {}, customTLDs: null }).then(res => {
    customMounts = res.customMounts || {};
    if (res.customTLDs) {
        customTLDs = res.customTLDs;
    } else {
        browser.storage.local.set({ customTLDs: customTLDs });
    }
});

// Update the memory instantly if the user changes settings in the Options page
browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
        if (changes.customMounts) {
            customMounts = changes.customMounts.newValue || {};
        }
        if (changes.customTLDs) {
            customTLDs = changes.customTLDs.newValue || {};
        }
    }
});

function reverseDomain(domainStr) {
    let parts = domainStr.split('.');
    let firstPart = parts[0].toLowerCase();

    if (customTLDs[firstPart] !== undefined) {
        parts[0] = customTLDs[firstPart];
    }
    return parts.reverse().join('.');
}

// Helper to decompose target strings or expanded mounts into standard URL components
function parseTopDownTarget(targetStr) {
    let hash = "";
    let search = "";

    let hashIdx = targetStr.indexOf('#');
    if (hashIdx !== -1) {
        hash = targetStr.slice(hashIdx);
        targetStr = targetStr.slice(0, hashIdx);
    }

    let queryIdx = targetStr.indexOf('?');
    if (queryIdx !== -1) {
        search = targetStr.slice(queryIdx);
        targetStr = targetStr.slice(0, queryIdx);
    }

    let parts = targetStr.split('/');
    let domain = parts[0];
    let path = parts.length > 1 ? "/" + parts.slice(1).join('/') : "";

    return { domain, path, search, hash };
}

// Safely joins path segments without duplicating slashes
function joinPaths(basePath, extraPath) {
    if (!extraPath || extraPath === "/") return basePath || "";
    if (!basePath) return extraPath;
    if (basePath.endsWith('/') && extraPath.startsWith('/')) {
        return basePath + extraPath.slice(1);
    }
    if (!basePath.endsWith('/') && !extraPath.startsWith('/')) {
        return basePath + "/" + extraPath;
    }
    return basePath + extraPath;
}
browser.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.type !== "main_frame") return;

        if (details.originUrl && details.originUrl.startsWith("http")) {
            return;
        }

        let url = new URL(details.url);

        // CASE 1: Direct navigation (.r/soccer?sort=top#header)
        let expanded = expandCustomMounts(url.hostname, customMounts);
        let parsedExpanded = parseTopDownTarget(expanded);

        if (isTopDown(parsedExpanded.domain, customMounts, customTLDs)) {
            let standardDomain = reverseDomain(parsedExpanded.domain);
            let finalPath = joinPaths(parsedExpanded.path, url.pathname);

            // Merge mount target query and user query
            let finalSearch = "";
            if (parsedExpanded.search && url.search) {
                finalSearch = parsedExpanded.search + "&" + url.search.slice(1);
            } else {
                finalSearch = parsedExpanded.search || url.search;
            }

            // User fragment takes precedence over target mount fragment
            let finalHash = url.hash || parsedExpanded.hash;

            let newUrl = "https://" + standardDomain + finalPath + finalSearch + finalHash;
            return { redirectUrl: newUrl };
        }

        // CASE 2: Search engine query intercept
        let searchParam = searchEngines[url.hostname];
        if (searchParam && url.searchParams.has(searchParam)) {
            let query = url.searchParams.get(searchParam).trim();

            // Extract user query and fragment from search text
            let userParsed = parseTopDownTarget(query); // separates host/path from ?query and #hash

            let pathParts = userParsed.domain.split('/');
            let queryDomain = pathParts[0].toLowerCase();
            let userPath = joinPaths(
                pathParts.length > 1 ? "/" + pathParts.slice(1).join('/') : "",
                userParsed.path
            );

            let expandedDomain = expandCustomMounts(queryDomain, customMounts);
            let parsedExpanded = parseTopDownTarget(expandedDomain);

            if (isTopDown(parsedExpanded.domain, customMounts, customTLDs)) {
                let standardDomain = reverseDomain(parsedExpanded.domain);
                let finalPath = joinPaths(parsedExpanded.path, userPath);

                // Merge query strings
                let finalSearch = "";
                if (parsedExpanded.search && userParsed.search) {
                    finalSearch = parsedExpanded.search + "&" + userParsed.search.slice(1);
                } else {
                    finalSearch = parsedExpanded.search || userParsed.search;
                }

                let finalHash = userParsed.hash || parsedExpanded.hash;

                let newUrl = "https://" + standardDomain + finalPath + finalSearch + finalHash;
                return { redirectUrl: newUrl };
            }
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking"]
);