chrome.runtime.onInstalled.addListener(() => {
    console.log('GitHub Kubernetes Owner Checker extension installed');
});

// Fetch runs in background to avoid CORS restrictions on content script origin
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'CHECK_OWNERSHIP') return false;

    const url = `https://cs.k8s.io/api/v1/search?stats=fosho&repos=*&rng=:20&q=${encodeURIComponent(message.username)}&i=fosho&files=OWNERS&excludeFiles=vendor/`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`cs.k8s.io API error: ${response.status}`);
            return response.json();
        })
        .then(data => sendResponse({
            hasKubernetesRepos: data.Stats && data.Stats.FilesOpened > 0,
            filesFound: data.Stats?.FilesOpened || 0
        }))
        .catch(error => sendResponse({
            hasKubernetesRepos: false,
            filesFound: 0,
            error: error.message
        }));

    return true; // keep channel open for async sendResponse
});
