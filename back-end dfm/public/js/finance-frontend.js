// Enhanced Finance Frontend with Hybrid Data Loading
const API_BASE = 'http://localhost:5000/api';

class FinanceDataManager {
    constructor() {
        this.cache = {};
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }

    async loadFinanceData() {
        try {
            const response = await fetch(`${API_BASE}/finance/overview`);
            const data = await response.json();
            
            this.cache = {
                data,
                timestamp: Date.now()
            };

            this.updateAllSections(data);
        } catch (error) {
            console.error('Error loading finance data:', error);
            this.useCachedData();
        }
    }

    updateAllSections(data) {
        this.updateFinancialMarkets(data);
        this.updateMarketTrends(data.externalData?.marketTrends);
        this.updateBudgetData(data.budgetData);
        this.updateBankProjects(data.bankProjects);
        this.updateDailyStatistics(data.externalData?.dailyStats);
        this.updateCurrencyRates(data.externalData?.currencyRates);
        this.updateFinanceArticles(data.financeArticles);
    }

    updateFinancialMarkets(data) {
        const stats = data.financialData;
        
        // Update main statistics cards
        this.updateStatCard('stock-market-growth', `${stats.stock_market_growth}%`);
        this.updateStatCard('interest-rate', `${stats.interest_rate}%`);
        this.updateStatCard('usd-xaf', stats.usd_xaf);
        this.updateStatCard('credit-growth', `${stats.credit_growth}%`);
    }

    updateMarketTrends(trends) {
        if (!trends) return;

        const sectors = ['banking', 'energy', 'agriculture'];
        const container = document.querySelector('.market-trends-container');
        
        if (container) {
            container.innerHTML = sectors.map(sector => {
                const trend = trends[sector];
                if (!trend) return '';
                
                return `
                    <div class="market-trend">
                        <div class="trend-icon">
                            <i class="fas ${this.getSectorIcon(sector)}"></i>
                        </div>
                        <div class="trend-info">
                            <div class="trend-title">${this.formatSectorName(sector)} Sector</div>
                            <div class="trend-value ${trend.change >= 0 ? 'positive' : 'negative'}">
                                ${trend.change >= 0 ? '+' : ''}${trend.value}%
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    updateBudgetData(budgetData) {
        if (!budgetData) return;

        // Update budget statistics
        this.updateStatCard('total-budget', budgetData.total_budget);
        this.updateStatCard('education-allocation', `${budgetData.education_allocation}%`);
        this.updateStatCard('healthcare-allocation', `${budgetData.healthcare_allocation}%`);
        this.updateStatCard('infrastructure-allocation', `${budgetData.infrastructure_allocation}%`);

        // Update revenue sources
        this.updateRevenueSources(budgetData.revenue_sources);
        
        // Check and display expiration notice if applicable
        this.checkBudgetExpiration(budgetData.expires_at);
    }

    updateRevenueSources(sources) {
        const container = document.getElementById('revenue-sources-list');
        if (container && sources) {
            container.innerHTML = Object.entries(sources).map(([key, value]) => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${this.formatRevenueSourceName(key)}
                    <span class="badge bg-warning rounded-pill">${value}%</span>
                </li>
            `).join('');
        }
    }

    checkBudgetExpiration(expiresAt) {
        if (!expiresAt) return;
        
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= 7) {
            this.showExpirationNotice(daysUntilExpiration);
        }
    }

    showExpirationNotice(days) {
        const notice = document.createElement('div');
        notice.className = `alert alert-warning alert-dismissible fade show mt-3`;
        notice.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            This budget data will expire in ${days} day${days !== 1 ? 's' : ''}.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const budgetSection = document.getElementById('budget-content');
        if (budgetSection) {
            budgetSection.querySelector('.card-body').appendChild(notice);
        }
    }

    updateBankProjects(projects) {
        const container = document.querySelector('#bank-projects-content .row');
        if (!container || !projects) return;
        
        container.innerHTML = projects.map(project => `
            <div class="col-md-6 mb-4">
                <div class="card news-card h-100">
                    <img src="${project.image_url || this.getDefaultProjectImage(project.category)}" 
                         class="card-img-top" alt="${project.title}">
                    <div class="card-body">
                        <h5 class="card-title">${project.title}</h5>
                        <p class="card-text">${project.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${project.bank_name}</small>
                            <span class="badge bg-${this.getStatusBadge(project.status)}">
                                ${project.status}
                            </span>
                        </div>
                        ${project.amount ? `<p class="mt-2"><strong>Amount:</strong> ${project.amount}</p>` : ''}
                        ${project.duration ? `<p class="mb-0"><strong>Duration:</strong> ${project.duration}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateDailyStatistics(stats) {
        if (!stats) return;

        // Update statistics cards
        this.updateStatCard('inflation-rate', `${stats.inflationRate}%`);
        this.updateStatCard('banking-index', '+2.1%');
        
        // Update statistics table
        this.updateStatisticsTable(stats);
    }

    updateStatisticsTable(stats) {
        const tableBody = document.querySelector('.statistics-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td>Stock Market Index</td>
                <td>${stats.stockMarketIndex}</td>
                <td class="change-positive">+2.3%</td>
                <td><i class="fas fa-arrow-up text-success"></i></td>
            </tr>
            <tr>
                <td>Unemployment Rate</td>
                <td>${stats.unemploymentRate}%</td>
                <td class="change-negative">-0.2%</td>
                <td><i class="fas fa-arrow-down text-success"></i></td>
            </tr>
            <tr>
                <td>Foreign Reserves</td>
                <td>$${stats.foreignReserves}B</td>
                <td class="change-positive">+0.8%</td>
                <td><i class="fas fa-arrow-up text-success"></i></td>
            </tr>
            <tr>
                <td>Government Debt to GDP</td>
                <td>${stats.governmentDebt}%</td>
                <td class="change-negative">-1.2%</td>
                <td><i class="fas fa-arrow-down text-success"></i></td>
            </tr>
        `;
    }

    updateCurrencyRates(rates) {
        const tableBody = document.querySelector('.currency-table tbody');
        if (!tableBody || !rates) return;
        
        tableBody.innerHTML = rates.map(rate => `
            <tr>
                <td>${rate.currency}</td>
                <td>${rate.code}</td>
                <td>${rate.value}</td>
                <td class="${rate.change_percentage >= 0 ? 'change-positive' : 'change-negative'}">
                    ${rate.change_percentage >= 0 ? '+' : ''}${rate.change_percentage}%
                </td>
            </tr>
        `).join('');
    }

    updateFinanceArticles(articles) {
        const container = document.querySelector('#upcoming-projects-container');
        if (!container || !articles) return;

        const projectArticles = articles.filter(article => 
            article.category === 'project' || article.category === 'investment'
        ).slice(0, 2);

        container.innerHTML = projectArticles.map(article => `
            <div class="col-md-6">
                <div class="card news-card h-100">
                    <img src="${article.image_url || this.getDefaultArticleImage(article.category)}" 
                         class="card-img-top" alt="${article.title}">
                    <div class="card-body">
                        <h5 class="card-title">${article.title}</h5>
                        <p class="card-text">${article.excerpt || article.content.substring(0, 150)}...</p>
                        <a href="/finance-article.html?id=${article._id}" class="btn btn-sm btn-dark">Read more</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Utility methods
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    getSectorIcon(sector) {
        const icons = {
            banking: 'university',
            energy: 'bolt',
            agriculture: 'tractor',
            technology: 'microchip'
        };
        return icons[sector] || 'chart-line';
    }

    formatSectorName(sector) {
        return sector.charAt(0).toUpperCase() + sector.slice(1);
    }

    formatRevenueSourceName(source) {
        const names = {
            tax_revenue: 'Tax Revenue',
            oil_gas: 'Oil & Gas',
            grants_aid: 'Grants & Aid',
            other_sources: 'Other Sources'
        };
        return names[source] || source;
    }

    getStatusBadge(status) {
        const statusMap = {
            'planned': 'secondary',
            'active': 'success',
            'completed': 'primary',
            'cancelled': 'danger'
        };
        return statusMap[status] || 'secondary';
    }

    getDefaultProjectImage(category) {
        const images = {
            'infrastructure': 'https://images.unsplash.com/photo-1591696205602-2f950c417dad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'energy': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'default': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        };
        return images[category] || images.default;
    }

    getDefaultArticleImage(category) {
        return 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }

    useCachedData() {
        if (this.cache.data && Date.now() - this.cache.timestamp < this.cacheDuration) {
            this.updateAllSections(this.cache.data);
        } else {
            this.showErrorState();
        }
    }

    showErrorState() {
        // Show error message or fallback content
        console.warn('Using fallback finance data');
    }

    // Auto-refresh data
    startAutoRefresh() {
        setInterval(() => {
            this.loadFinanceData();
        }, this.cacheDuration);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    const financeManager = new FinanceDataManager();
    financeManager.loadFinanceData();
    financeManager.startAutoRefresh();
    
    // Update current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
});