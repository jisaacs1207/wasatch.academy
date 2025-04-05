// Login functionality
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupLoginForm();
    setupLogoutButton();
});

function checkAuthStatus() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                showDashboard();
                loadCustomization();
            } else {
                showLoginForm();
            }
        })
        .catch(error => console.error('Error checking auth status:', error));
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (data.success) {
                    showDashboard();
                    loadCustomization();
                } else {
                    showToast('Invalid credentials', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed', 'error');
            }
        });
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                showLoginForm();
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

function showLoginForm() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
}

// Site customization functionality
let siteCustomization = {
    bannerUrl: '',
    backgroundColor: '#FFFFFF',
    headerColor: '#194A53',
    fontColor: '#333333',
    accentColor: '#F76B1C'
};

// Initialize color pickers and input fields
async function loadCustomization() {
    try {
        const response = await fetch('/api/customization');
        const data = await response.json();
        siteCustomization = { ...siteCustomization, ...data };
        updateColorInputs();
        updateBannerPreview();
    } catch (error) {
        console.error('Error loading customization:', error);
    }
}

function setupColorPicker(colorId, hexId, rgbId, customizationKey) {
    const colorPicker = document.getElementById(colorId);
    const hexInput = document.getElementById(hexId);
    const rgbInput = document.getElementById(rgbId);

    if (!colorPicker || !hexInput || !rgbInput) return;

    // Set initial values
    colorPicker.value = siteCustomization[customizationKey];
    hexInput.value = siteCustomization[customizationKey];
    rgbInput.value = hexToRgb(siteCustomization[customizationKey]);

    // Color picker change
    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        siteCustomization[customizationKey] = color;
        hexInput.value = color;
        rgbInput.value = hexToRgb(color);
        showPreview();
    });

    // Hex input change
    hexInput.addEventListener('input', (e) => {
        let color = e.target.value;
        if (isValidHex(color)) {
            siteCustomization[customizationKey] = color;
            colorPicker.value = color;
            rgbInput.value = hexToRgb(color);
            showPreview();
        }
    });

    // RGB input change
    rgbInput.addEventListener('input', (e) => {
        const rgb = e.target.value;
        if (isValidRgb(rgb)) {
            const hex = rgbToHex(rgb);
            siteCustomization[customizationKey] = hex;
            colorPicker.value = hex;
            hexInput.value = hex;
            showPreview();
        }
    });
}

function updateColorInputs() {
    setupColorPicker('bg-color', 'bg-color-hex', 'bg-color-rgb', 'backgroundColor');
    setupColorPicker('header-color', 'header-color-hex', 'header-color-rgb', 'headerColor');
    setupColorPicker('font-color', 'font-color-hex', 'font-color-rgb', 'fontColor');
    setupColorPicker('accent-color', 'accent-color-hex', 'accent-color-rgb', 'accentColor');
}

function updateBannerPreview() {
    const bannerImg = document.getElementById('current-banner');
    const bannerInput = document.getElementById('banner-url');
    
    if (bannerImg && bannerInput && siteCustomization.bannerUrl) {
        bannerImg.src = siteCustomization.bannerUrl;
        bannerInput.value = siteCustomization.bannerUrl;
    }
}

function updateBanner() {
    const bannerUrl = document.getElementById('banner-url').value;
    siteCustomization.bannerUrl = bannerUrl;
    updateBannerPreview();
    showPreview();
}

function showPreview() {
    // Create a preview of changes before applying
    const previewStyles = document.createElement('style');
    previewStyles.id = 'preview-styles';
    previewStyles.textContent = `
        :root {
            --bg-color: ${siteCustomization.backgroundColor};
            --header-color: ${siteCustomization.headerColor};
            --font-color: ${siteCustomization.fontColor};
            --accent-color: ${siteCustomization.accentColor};
        }
    `;

    // Remove existing preview if any
    const existingPreview = document.getElementById('preview-styles');
    if (existingPreview) {
        existingPreview.remove();
    }

    document.head.appendChild(previewStyles);
}

async function applyCustomization() {
    try {
        const response = await fetch('/api/customization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(siteCustomization)
        });

        const data = await response.json();
        if (data.success) {
            showToast('Customization applied successfully!', 'success');
        } else {
            showToast('Error applying customization', 'error');
        }
    } catch (error) {
        console.error('Error saving customization:', error);
        showToast('Error applying customization', 'error');
    }
}

// Color conversion utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
        : '';
}

function rgbToHex(rgb) {
    const values = rgb.match(/\d+/g);
    if (!values || values.length !== 3) return '';
    
    const [r, g, b] = values.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    });
    
    return `#${r}${g}${b}`;
}

function isValidHex(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function isValidRgb(color) {
    return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color);
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
