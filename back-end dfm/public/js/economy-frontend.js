// Fetch and display real economy data
async function loadEconomyData() {
  try {
    // Load economic indicators
    const indicatorsResponse = await fetch('/api/economy/indicators');
    if (indicatorsResponse.ok) {
      const indicatorsData = await indicatorsResponse.json();
      updateEconomicIndicators(indicatorsData);
    }
    
    // Load economy articles for each section
    const sections = ['economy', 'eco-africa', 'eco-agriculture', 'eco-innovation'];
    
    for (const section of sections) {
      await loadSectionArticles(section);
      await loadSectionStats(section);
    }
    
  } catch (error) {
    console.error('Error loading economy data:', error);
    // Fallback to default content if API fails
  }
}

function updateEconomicIndicators(data) {
  const indicators = document.querySelectorAll('.stat-value');
  if (indicators.length >= 4 && data) {
    indicators[0].textContent = `${data.gdp_growth}%`;
    indicators[1].textContent = `${data.industrial_growth}%`;
    indicators[2].textContent = `${data.unemployment_rate}%`;
    indicators[3].textContent = `${data.inflation_rate}%`;
  }
}

async function loadSectionArticles(section) {
  try {
    const response = await fetch(`/api/economy/articles?section=${section}&limit=4`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.items) {
        updateSectionContent(section, data.items);
      }
    }
  } catch (error) {
    console.error(`Error loading ${section} articles:`, error);
  }
}

async function loadSectionStats(section) {
  try {
    const response = await fetch(`/api/economy/section-stats/${section}`);
    if (response.ok) {
      const data = await response.json();
      if (data) {
        updateSectionStats(section, data);
      }
    }
  } catch (error) {
    console.error(`Error loading ${section} stats:`, error);
  }
}

function updateSectionContent(section, articles) {
  const contentElement = document.getElementById(`${section}-content`);
  if (!contentElement) return;
  
  const articlesContainer = contentElement.querySelector('.row');
  if (!articlesContainer) return;
  
  // Clear existing placeholder content but keep the first row structure
  const firstRow = articlesContainer;
  if (firstRow) {
    // Find and clear only the article cards, keep the structure
    const articleCards = firstRow.querySelectorAll('.col-md-6');
    articleCards.forEach(card => card.remove());
  }
  
  articles.forEach((article, index) => {
    if (index < 2) { // Only show 2 articles per row
      const articleHTML = `
        <div class="col-md-6">
          <div class="card news-card h-100">
            ${article.image_url ? 
              `<img src="${article.image_url}" class="card-img-top" alt="${article.image_alt || article.title}">` : 
              `<img src="https://images.unsplash.com/photo-1588690154757-badf4644190f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" class="card-img-top" alt="${article.title}">`
            }
            <div class="card-body">
              <h5 class="card-title">${article.title}</h5>
              <p class="card-text">${article.excerpt || article.content.substring(0, 150)}...</p>
              <a href="/economy-article.html?slug=${article.slug || article._id}" class="btn btn-sm btn-dark">Read more</a>
            </div>
          </div>
        </div>
      `;
      
      if (firstRow) {
        firstRow.innerHTML += articleHTML;
      }
    }
  });
}

function updateSectionStats(section, stats) {
  const contentElement = document.getElementById(`${section}-content`);
  if (!contentElement) return;
  
  const statsGrid = contentElement.querySelector('.stats-grid');
  if (!statsGrid) return;
  
  // Update stats based on section
  const statBoxes = statsGrid.querySelectorAll('.stat-box');
  const statKeys = Object.keys(stats);
  
  statBoxes.forEach((box, index) => {
    if (index < statKeys.length) {
      const valueElement = box.querySelector('.stat-value');
      if (valueElement) {
        valueElement.textContent = stats[statKeys[index]];
      }
    }
  });
}

// Load economy data when page loads
document.addEventListener('DOMContentLoaded', loadEconomyData);