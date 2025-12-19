// ==================== CONFIGURATION ====================
const API_BASE = 'http://localhost:5000/api';
let currentUser = null;

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function getAuthHeaders() {
    const token = localStorage.getItem('dfm_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function apiCall(endpoint, options = {}) {
    try {
        console.log(`API Call: ${endpoint}`, options);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: getAuthHeaders(),
            ...options
        });
        
        console.log(`API Response Status: ${response.status} for ${endpoint}`);
        
        if (response.status === 401) {
            localStorage.removeItem('dfm_token');
            localStorage.removeItem('adminUser');
            window.location.href = 'admin-login.html';
            return null;
        }
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                console.error('API Error details:', errorData);
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log(`API Success: ${endpoint}`, data);
        return data;
        
    } catch (error) {
        console.error('API call failed:', {
            endpoint,
            error: error.message,
            stack: error.stack
        });
        showToast(`API Error: ${error.message}`, 'danger');
        throw error;
    }
}

function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

async function uploadFile(file, type = 'image') {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/media/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('dfm_token')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('File upload error:', error);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} upload failed: ${error.message}`, 'danger');
        return null;
    }
}

// Keep the old function for backward compatibility
async function uploadImage(file) {
    return uploadFile(file, 'image');
}

async function uploadAudio(file) {
    return uploadFile(file, 'audio');
}

function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input && preview) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.display = 'block';
                    preview.querySelector('img').src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
            }
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== AUTHENTICATION ====================
function checkAuth() {
    const token = localStorage.getItem('dfm_token');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = `${currentUser.name} (${currentUser.role})`;
        }
        applyRoleBasedAccess(currentUser.role);
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'admin-login.html';
    }
}

function logout() {
    localStorage.removeItem('dfm_token');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
}

function applyRoleBasedAccess(role) {
    const superAdminOnly = ['users', 'settings'];
    
    if (role === 'content_manager') {
        superAdminOnly.forEach(section => {
            const navLink = document.querySelector(`[data-section="${section}"]`);
            if (navLink) {
                navLink.style.display = 'none';
            }
        });
    }
}

// ==================== COMMON EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('admin-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('admin-theme', 'dark');
        }
    });
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Mobile menu
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('mobile-open');
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
});