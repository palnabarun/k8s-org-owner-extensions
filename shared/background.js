// Background script for GitHub Kubernetes Owner Checker

// This background script is minimal as most functionality is handled in the content script
// It could be extended in the future for features like caching API responses

chrome.runtime.onInstalled.addListener(() => {
    console.log('GitHub Kubernetes Owner Checker extension installed');
});