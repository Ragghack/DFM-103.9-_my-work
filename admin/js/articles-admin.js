// ==================== ARTICLES MANAGEMENT ====================
let currentArticleId = null;
let currentPage = 1;
const articlesPerPage = 10;

async function loadArticles() {
    try {
        const tbody = document.getElementById('articles-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2"></div>Loading articles...</td></tr>';
        
        // Get filter values
        const searchTerm = document.getElementById('search-articles')?.value || '';
        const category = document.getElementById('filter-articles-category')?.value || '';
        
        // Build query string
        let query = `?page=${currentPage}&limit=${articlesPerPage}`;
        if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
        if (category) query += `&category=${category}`;
        
        const data = await apiCall(`/articles${query}`);
        
        if (!data || !data.articles || data.articles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-newspaper fa-2x mb-3 d-block"></i>
                        No articles found
                        <div class="mt-2">
                            <button class="btn btn-sm btn-gold" onclick="showArticleForm()">
                                <i class="fas fa-plus me-1"></i>Create Your First Article
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.articles.map(article => `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input article-checkbox" value="${article._id}">
                </td>
                <td>
                    ${article.image_url ? 
                        `<img src="${article.image_url}" class="rounded" style="width: 40px; height: 40px; object-fit: cover;" alt="${article.title}">` : 
                        '<i class="fas fa-image text-muted"></i>'
                    }
                </td>
                <td>
                    <div class="fw-bold">${article.title}</div>
                    <small class="text-muted">${(article.excerpt || article.content || '').substring(0, 60)}...</small>
                </td>
                <td><span class="badge bg-secondary">${article.category}</span></td>
                <td>${article.author?.name || 'DFM Media'}</td>
                <td>${new Date(article.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="badge bg-${article.status === 'published' ? 'success' : article.status === 'draft' ? 'warning' : 'secondary'}">
                        ${article.status}
                    </span>
                    ${article.featured ? '<span class="badge bg-warning ms-1">Featured</span>' : ''}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editArticle('${article._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteArticle('${article._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="viewArticle('${article._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updatePagination(data.totalPages || 1, data.currentPage || 1);
        
    } catch (error) {
        console.error('Error loading articles:', error);
        const tbody = document.getElementById('articles-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Failed to load articles</td></tr>';
        }
    }
}

function showArticleForm(article = null) {
    const formSection = document.getElementById('article-form-section');
    const formTitle = document.getElementById('article-form-title');
    
    if (article) {
        formTitle.textContent = 'Edit Article';
        document.getElementById('article-title').value = article.title || '';
        document.getElementById('article-content').value = article.content || '';
        document.getElementById('article-excerpt').value = article.excerpt || '';
        document.getElementById('article-category').value = article.category || '';
        document.getElementById('article-status').value = article.status || 'draft';
        document.getElementById('article-featured').checked = article.featured || false;
        
        currentArticleId = article._id;

        if (article.image_url) {
            const preview = document.getElementById('article-image-preview');
            preview.style.display = 'block';
            document.getElementById('article-preview-img').src = article.image_url;
        }
    } else {
        formTitle.textContent = 'Add New Article';
        document.getElementById('article-form').reset();
        currentArticleId = null;
        document.getElementById('article-image-preview').style.display = 'none';
    }
    
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth' });
}

async function saveArticle() {
    try {
        const saveBtn = document.getElementById('save-article');
        setLoading(saveBtn, true);

        let imageUrl = null;
        const imageFile = document.getElementById('article-image').files[0];
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const payload = {
            title: document.getElementById('article-title').value,
            content: document.getElementById('article-content').value,
            excerpt: document.getElementById('article-excerpt').value || null,
            category: document.getElementById('article-category').value,
            status: document.getElementById('article-status').value,
            featured: document.getElementById('article-featured').checked,
            image_url: imageUrl
        };

        let response;
        if (currentArticleId) {
            response = await apiCall(`/articles/${currentArticleId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            response = await apiCall('/articles', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        showToast(`Article ${currentArticleId ? 'updated' : 'created'} successfully!`, 'success');
        hideArticleForm();
        await loadArticles();

    } catch (error) {
        console.error('Error saving article:', error);
        showToast('Failed to save article', 'danger');
    } finally {
        setLoading(saveBtn, false);
    }
}

function hideArticleForm() {
    document.getElementById('article-form-section').style.display = 'none';
}

async function editArticle(id) {
    try {
        const response = await apiCall(`/articles/${id}`);
        if (response?.article) {
            showArticleForm(response.article);
        }
    } catch (error) {
        console.error('Error loading article for edit:', error);
        showToast('Failed to load article', 'danger');
    }
}

async function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        await apiCall(`/articles/${id}`, { method: 'DELETE' });
        showToast('Article deleted successfully!', 'success');
        await loadArticles();
    } catch (error) {
        console.error('Error deleting article:', error);
        showToast('Failed to delete article', 'danger');
    }
}

function viewArticle(id) {
    window.open(`http://localhost:5000/article.html?id=${id}`, '_blank');
}

function updatePagination(totalPages, currentPage) {
    const pagination = document.getElementById('articles-pagination');
    if (!pagination) return;
    
    let html = '';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">&laquo;</a>
    </li>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
        }
    }
    
    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">&raquo;</a>
    </li>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadArticles();
}

// Search and filter
function setupSearchFilter() {
    const searchInput = document.getElementById('search-articles');
    const categoryFilter = document.getElementById('filter-articles-category');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            loadArticles();
        }, 500));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentPage = 1;
            loadArticles();
        });
    }
}

// Debug function for testing API
async function debugArticlesAPI() {
    try {
        console.log('Testing Articles API...');
        const response = await fetch(`${API_BASE}/articles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
        
        const data = await response.json();
        console.log('API Data:', data);
        
        showToast(`API Test: ${response.status} OK`, 'success');
        
    } catch (error) {
        console.error('Debug Error:', error);
        showToast(`API Test Failed: ${error.message}`, 'danger');
    }
}

// Test create article
async function testCreateArticle() {
    try {
        const testArticle = {
            title: 'Test Article ' + new Date().toLocaleTimeString(),
            content: 'This is a test article created for debugging purposes.',
            excerpt: 'Test article excerpt',
            category: 'other',
            status: 'draft',
            featured: false
        };
        
        console.log('Creating test article:', testArticle);
        
        const response = await apiCall('/articles/admin/articles', {
            method: 'POST',
            body: JSON.stringify(testArticle)
        });
        
        console.log('Test creation response:', response);
        showToast('Test article created successfully!', 'success');
        
        // Reload articles
        await loadArticles();
        
    } catch (error) {
        console.error('Test creation failed:', error);
        showToast('Test creation failed: ' + error.message, 'danger');
    }
}

// Bulk actions
async function applyBulkAction() {
    const selectedArticles = document.querySelectorAll('.article-checkbox:checked');
    const action = document.getElementById('bulk-action-articles').value;
    
    if (selectedArticles.length === 0) {
        showToast('Please select articles first', 'warning');
        return;
    }
    
    if (action === 'Bulk Actions') {
        showToast('Please select an action', 'warning');
        return;
    }
    
    const articleIds = Array.from(selectedArticles).map(cb => cb.value);
    
    try {
        let endpoint, method, successMessage;
        
        switch (action) {
            case 'publish':
                endpoint = '/articles/admin/bulk-publish';
                method = 'PUT';
                successMessage = 'Articles published';
                break;
            case 'draft':
                endpoint = '/articles/admin/bulk-draft';
                method = 'PUT';
                successMessage = 'Articles moved to draft';
                break;
            case 'delete':
                endpoint = '/articles/admin/bulk-delete';
                method = 'DELETE';
                successMessage = 'Articles deleted';
                break;
            default:
                return;
        }
        
        const response = await apiCall(endpoint, {
            method: method,
            body: JSON.stringify({ articleIds })
        });
        
        showToast(`${successMessage} successfully!`, 'success');
        await loadArticles();
        
    } catch (error) {
        console.error('Bulk action failed:', error);
        showToast('Bulk action failed', 'danger');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Setup image preview
    setupImagePreview('article-image', 'article-image-preview');
    
    // Article form
    document.getElementById('article-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveArticle();
    });
    
    // Buttons
    document.getElementById('add-article-btn')?.addEventListener('click', function() {
        showArticleForm();
    });
    
    document.getElementById('cancel-article')?.addEventListener('click', function() {
        hideArticleForm();
    });
    
    document.getElementById('refresh-articles')?.addEventListener('click', function() {
        loadArticles();
    });
    
    document.getElementById('debug-articles-btn')?.addEventListener('click', debugArticlesAPI);
    document.getElementById('test-create-article')?.addEventListener('click', testCreateArticle);
    
    // Bulk actions
    document.getElementById('apply-bulk-articles')?.addEventListener('click', applyBulkAction);
    
    // Select all checkbox
    document.getElementById('select-all-articles')?.addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.article-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
        });
    });
    
    // Setup search and filter
    setupSearchFilter();
    
    // Load initial data
    loadArticles();
});

// Make functions globally available
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.showArticleForm = showArticleForm;
window.viewArticle = viewArticle;
window.changePage = changePage;