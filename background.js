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

browser.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.type !== "main_frame") return;

        if (details.originUrl && details.originUrl.startsWith("http")) {
            return;
        }

        let url = new URL(details.url);
        // 1. Expand the mount (e.g., from "r" to "com.reddit/r")
        let expanded = expandCustomMounts(url.hostname, customMounts);

        // 2. Isolate the domain from any path the mount introduced
        let expandedParts = expanded.split('/');
        let domainPart = expandedParts[0]; // "com.reddit"
        let injectedPath = expandedParts.length > 1 ? "/" + expandedParts.slice(1).join('/') : ""; // "/r"

        // 3. Verify and reverse ONLY the domain part
        if (isTopDown(domainPart, customMounts, customTLDs)) {
            let standardDomain = reverseDomain(domainPart); // "reddit.com"

            // 4. Reconstruct the final path
            let finalPath = injectedPath;
            if (url.pathname !== "/") {
                finalPath += url.pathname; // handles .r/soccer -> /r/soccer
            }

            let newUrl = "https://" + standardDomain + finalPath + url.search;
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

            let expandedDomain = expandCustomMounts(queryDomain, customMounts);

            let fullPath2 = expandedDomain + (originalPath ? "/" + originalPath : "");
            let parts2 = fullPath2.split('/');
            let finalDomain2 = parts2[0];
            let finalPath2 = parts2.slice(1).join('/');

            if (isTopDown(finalDomain2, customMounts, customTLDs)) {
                let standardDomain = reverseDomain(finalDomain2);
                let newUrl = "https://" + standardDomain + (finalPath2 ? '/' + finalPath2 : '') + extraStuff;
                return { redirectUrl: newUrl };
            }
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking"]
);