// Content script for GitHub Kubernetes Owner Checker
(function () {
    'use strict';

    // Check if we're on a GitHub profile page
    function isProfilePage() {
        const pathParts = window.location.pathname.split('/');
        return pathParts.length === 2 && pathParts[1] &&
            !pathParts[1].includes('.') &&
            !['search', 'notifications', 'settings', 'pulls', 'issues', 'marketplace', 'topics', 'trending', 'collections', 'events', 'explore'].includes(pathParts[1]);
    }

    // Extract username from GitHub profile URL
    function extractUsername() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[1];
    }

    // Check if user is owner of any Kubernetes repositories using cs.k8s.io API
    async function checkKubernetesOwnership(username) {
        try {
            // Use cs.k8s.io API to search for username in OWNERS files across Kubernetes repositories
            const url = `https://cs.k8s.io/api/v1/search?stats=fosho&repos=*&rng=:20&q=${encodeURIComponent(username)}&i=fosho&files=OWNERS&excludeFiles=vendor/`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`cs.k8s.io API error: ${response.status}`);
            }

            const data = await response.json();

            // Check if any files were found (indicating ownership)
            const isOwner = data.Stats && data.Stats.FilesOpened > 0;

            return {
                hasKubernetesRepos: isOwner,
                filesFound: data.Stats?.FilesOpened || 0
            };
        } catch (error) {
            console.error('Error checking Kubernetes ownership:', error);
            return {
                hasKubernetesRepos: false,
                filesFound: 0,
                error: error.message
            };
        }
    }

    // Create and display banner
    function createBanner(username, ownershipData) {
        // Remove existing banner if present
        const existingBanner = document.getElementById('k8s-owner-banner');
        if (existingBanner) {
            existingBanner.remove();
        }

        const banner = document.createElement('div');
        banner.id = 'k8s-owner-banner';
        banner.className = 'k8s-banner';

        if (ownershipData.error) {
            banner.className += ' error';
            banner.innerHTML = `
                <div class="k8s-banner-content">
                    <span class="k8s-icon">⚠️</span>
                    <span class="k8s-text">Error checking Kubernetes repositories: ${ownershipData.error}</span>
                </div>
            `;
        } else if (ownershipData.hasKubernetesRepos) {
            banner.className += ' owner';
            const searchUrl = `https://cs.k8s.io/api/v1/search?stats=fosho&repos=*&rng=:20&q=${encodeURIComponent(username)}&i=fosho&files=OWNERS&excludeFiles=vendor/`;

            banner.innerHTML = `
                <div class="k8s-banner-content">
                    <span class="k8s-icon">⎈</span>
                    <span class="k8s-text">
                        <strong>${username}</strong> is an owner in the Kubernetes organization (found in ${ownershipData.filesFound} OWNERS files) -
                        <a href="${searchUrl}" target="_blank" class="search-link">View details</a>
                    </span>
                </div>
            `;
        } else {
            banner.className += ' not-owner';
            const searchUrl = `https://cs.k8s.io/api/v1/search?stats=fosho&repos=*&rng=:20&q=${encodeURIComponent(username)}&i=fosho&files=OWNERS&excludeFiles=vendor/`;

            banner.innerHTML = `
                <div class="k8s-banner-content">
                    <span class="k8s-icon">ℹ️</span>
                    <span class="k8s-text">
                        <strong>${username}</strong> is not listed as an owner in Kubernetes organization OWNERS files -
                        <a href="${searchUrl}" target="_blank" class="search-link">Search manually</a>
                    </span>
                </div>
            `;
        }

        // Insert banner at the top of the profile content
        const profileContent = document.querySelector('.js-profile-editable-area') ||
            document.querySelector('[data-test-selector="profile-overview-tab"]') ||
            document.querySelector('.Layout-main');

        if (profileContent) {
            profileContent.insertBefore(banner, profileContent.firstChild);
        }
    }

    // Main function to run the check
    async function runKubernetesOwnerCheck() {
        if (!isProfilePage()) {
            return;
        }

        const username = extractUsername();
        if (!username) {
            return;
        }

        // Show loading banner
        const loadingBanner = document.createElement('div');
        loadingBanner.id = 'k8s-owner-banner';
        loadingBanner.className = 'k8s-banner loading';
        loadingBanner.innerHTML = `
            <div class="k8s-banner-content">
                <span class="k8s-icon">⏳</span>
                <span class="k8s-text">Checking Kubernetes repositories for ${username}...</span>
            </div>
        `;

        const profileContent = document.querySelector('.js-profile-editable-area') ||
            document.querySelector('[data-test-selector="profile-overview-tab"]') ||
            document.querySelector('.Layout-main');

        if (profileContent) {
            profileContent.insertBefore(loadingBanner, profileContent.firstChild);
        }

        // Check ownership
        const ownershipData = await checkKubernetesOwnership(username);

        // Display results
        createBanner(username, ownershipData);
    }

    // Run check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runKubernetesOwnerCheck);
    } else {
        runKubernetesOwnerCheck();
    }

    // Run check on navigation changes (for SPA behavior)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(runKubernetesOwnerCheck, 1000); // Delay to let page load
        }
    }).observe(document, { subtree: true, childList: true });
})();
