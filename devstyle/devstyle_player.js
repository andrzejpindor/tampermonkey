// ==UserScript==
// @name         DevStyle Player Controls
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Speed controls and size toggle for DevStyle player
// @author       andrzejpindor
// @match        https://edu.devstyle.pl/products/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=devstyle.pl
// @updateURL    https://github.com/andrzejpindor/tampermonkey/blob/main/devstyle/devstyle_player.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ==================== KONFIGURACJA ====================
    
    const CONFIG = {
        speeds: [
            { label: '1.0x', value: '1x' },
            { label: '1.25x', value: '1.25x' },
            { label: '1.5x', value: '1.5x' },
            // Łatwo dodać więcej: { label: '2.0x', value: '2x' },
        ],
        selectors: {
            player: '.player',
            settingsButton: '[data-handle="settingsButton"]',
            settingsDialog: '[data-handle="settingsButton__dialog"]',
            video: '.player__video',
            playlist: '.player__playlist',
        },
        dialogTimeout: 3000,
        expandedSize: '100%',
    };

    const CONTAINER_ID = 'tm-player-controls';

    // ==================== UTILITIES ====================

    function waitForElement(selector, timeout = CONFIG.dialogTimeout) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const timer = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(timer);
                    resolve(el);
                }
                if (Date.now() - start > timeout) {
                    clearInterval(timer);
                    reject(new Error(`Element ${selector} not found`));
                }
            }, 50);
        });
    }

    function createButton(text, onClick, extraStyles = '') {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            padding: 6px 10px;
            cursor: pointer;
            height: 40px;
            font-size: 14px;
            margin-right: 4px;
            ${extraStyles}
        `;
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ==================== MODUŁY ====================

    function createSpeedControls(row) {
        const fragment = document.createDocumentFragment();

        CONFIG.speeds.forEach(speed => {
            const btn = createButton(speed.label, async () => {
                const settingsButton = row.querySelector(CONFIG.selectors.settingsButton);
                if (!settingsButton) return;

                settingsButton.click();

                try {
                    const dialog = await waitForElement(CONFIG.selectors.settingsDialog);
                    const radio = dialog.querySelector(`input[type="radio"][value="${speed.value}"]`);
                    radio?.click();
                } catch (e) {
                    console.warn('[DevStyle Controls] Settings dialog timeout');
                }
            }, 'width: 60px;');

            fragment.appendChild(btn);
        });

        return fragment;
    }

    function createSizeToggle(player) {
        let expanded = false;

        return createButton('Toggle size', () => {
            const container = player.closest('.container');
            if (!container) return;

            const video = player.querySelector(CONFIG.selectors.video);
            const playlist = player.querySelector(CONFIG.selectors.playlist);

            if (!expanded) {
                container.style.maxWidth = CONFIG.expandedSize;
                container.style.width = CONFIG.expandedSize;
                if (video) video.style.width = CONFIG.expandedSize;
                if (playlist) playlist.style.display = 'none';
            } else {
                container.style.removeProperty('max-width');
                container.style.removeProperty('width');
                if (video) video.style.removeProperty('width');
                if (playlist) playlist.style.removeProperty('display');
            }

            expanded = !expanded;
        }, 'width: 100px;');
    }

    // ==================== GŁÓWNA LOGIKA ====================

    function initControls() {
        const player = document.querySelector(CONFIG.selectors.player);
        if (!player) return;

        const row = player.closest('.row');
        if (!row || row.querySelector(`#${CONTAINER_ID}`)) return;

        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            flex-wrap: wrap;
        `;

        container.appendChild(createSpeedControls(row));
        container.appendChild(createSizeToggle(player));

        row.insertBefore(container, row.firstChild);
    }

    // ==================== INICJALIZACJA ====================

    const observer = new MutationObserver(initControls);
    observer.observe(document.body, { childList: true, subtree: true });
    initControls();
})();
