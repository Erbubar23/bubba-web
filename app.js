/**
 * Dynamic GitHub Portfolio Integration
 * Erick Buendia (@Erbubar23)
 * Fetches real-time repositories and user stats directly from GitHub REST API
 */

const GITHUB_USERNAME = 'Erbubar23';
const CACHE_KEY = `gh_cache_${GITHUB_USERNAME}_repos`;
const USER_CACHE_KEY = `gh_cache_${GITHUB_USERNAME}_user`;
const CACHE_TIME_KEY = `gh_cache_${GITHUB_USERNAME}_time`;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to prevent rate-limits

// GitHub language colors mapping
const LANGUAGE_COLORS = {
  'C++': '#f34b7d',
  'C': '#555555',
  'Python': '#3572A5',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Shell': '#89e051',
  'Assembly': '#6E4C13',
  'Rust': '#dea584',
  'Go': '#00ADD8',
  'Java': '#b07219',
  'C#': '#178600'
};

// State
let allRepositories = [];
let activeLanguageFilter = 'all';
let currentSearchTerm = '';
let currentSortOrder = 'pushed';

// DOM Elements
const projectsGrid = document.getElementById('projects-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const languageFiltersContainer = document.getElementById('language-filters');
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');

// Stat Elements
const statRepos = document.getElementById('stat-repos');
const statStars = document.getElementById('stat-stars');
const statForks = document.getElementById('stat-forks');
const statFollowers = document.getElementById('stat-followers');
const userAvatar = document.getElementById('user-avatar');
const countAll = document.getElementById('count-all');
const currentYear = document.getElementById('current-year');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  setupEventListeners();
  loadData();
});

function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase().trim();
    renderFilteredProjects();
  });

  // Sort
  sortSelect.addEventListener('change', (e) => {
    currentSortOrder = e.target.value;
    renderFilteredProjects();
  });

  // Refresh
  btnRefresh.addEventListener('click', () => {
    refreshIcon.classList.add('spinning');
    loadData(true).finally(() => {
      setTimeout(() => refreshIcon.classList.remove('spinning'), 500);
    });
  });
}

/**
 * Fetch GitHub user details
 */
async function fetchUserDetails(force = false) {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    if (!force && cached && cachedTime && (Date.now() - parseInt(cachedTime, 10)) < CACHE_TTL_MS) {
      updateUserUI(JSON.parse(cached));
      return;
    }

    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
    updateUserUI(data);
  } catch (error) {
    console.warn('Could not fetch user info from GitHub API:', error);
  }
}

function updateUserUI(user) {
  if (userAvatar && user.avatar_url) {
    userAvatar.src = user.avatar_url;
  }
  if (statFollowers && typeof user.followers === 'number') {
    statFollowers.textContent = user.followers;
  }
}

/**
 * Fetch repositories from GitHub API
 */
async function loadData(force = false) {
  await fetchUserDetails(force);

  try {
    const cachedRepos = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    if (!force && cachedRepos && cachedTime && (Date.now() - parseInt(cachedTime, 10)) < CACHE_TTL_MS) {
      allRepositories = JSON.parse(cachedRepos);
      processRepositories(allRepositories);
      return;
    }

    // Fetch up to 100 repositories, sorted by recently updated
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`
    );

    if (!response.ok) {
      if (response.status === 403 && cachedRepos) {
        console.warn('GitHub rate limit reached, using cached repositories.');
        allRepositories = JSON.parse(cachedRepos);
        processRepositories(allRepositories);
        return;
      }
      throw new Error(`Failed to fetch repos: ${response.status}`);
    }

    const repos = await response.json();
    
    // Filter out user's profile repository (if it is just Erbubar23/Erbubar23) from the projects grid if desired,
    // or keep it if it contains useful content. We'll show all public repos.
    allRepositories = repos;

    // Cache results
    localStorage.setItem(CACHE_KEY, JSON.stringify(repos));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    processRepositories(allRepositories);
  } catch (error) {
    console.error('Error loading GitHub repositories:', error);
    projectsGrid.innerHTML = `
      <div class="col-span-full p-8 text-center bg-slate-900/60 rounded-2xl border border-red-500/20 text-slate-300">
        <i data-lucide="alert-triangle" class="w-10 h-10 text-amber-400 mx-auto mb-2"></i>
        <p class="font-semibold">No se pudieron cargar los repositorios en este momento.</p>
        <p class="text-xs text-slate-400 mt-1">Revisa tu conexión o intenta nuevamente haciendo clic en Actualizar.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * Process repos, update stats, and build filters
 */
function processRepositories(repos) {
  // Compute global stats
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

  if (statRepos) statRepos.textContent = repos.length;
  if (statStars) statStars.textContent = totalStars;
  if (statForks) statForks.textContent = totalForks;
  if (countAll) countAll.textContent = repos.length;

  buildLanguageFilters(repos);
  renderFilteredProjects();
}

/**
 * Build dynamic language filter buttons based on actual repositories
 */
function buildLanguageFilters(repos) {
  // Count frequency of each language
  const languageCounts = {};
  repos.forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  // Remove existing dynamic buttons (keep "Todos")
  const dynamicButtons = languageFiltersContainer.querySelectorAll('.dynamic-filter');
  dynamicButtons.forEach(btn => btn.remove());

  // Sort languages by count
  const sortedLanguages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);

  sortedLanguages.forEach(([lang, count]) => {
    const btn = document.createElement('button');
    btn.className = `filter-pill dynamic-filter px-3 py-1 rounded-full text-xs font-medium ${
      activeLanguageFilter === lang ? 'active' : ''
    }`;
    btn.dataset.filter = lang;
    btn.innerHTML = `
      <span class="inline-block w-2 h-2 rounded-full mr-1.5" style="background-color: ${LANGUAGE_COLORS[lang] || '#8b949e'}"></span>
      ${lang} (${count})
    `;

    btn.addEventListener('click', () => {
      setLanguageFilter(lang);
    });

    languageFiltersContainer.appendChild(btn);
  });

  // Attach listener to "Todos" button
  const allBtn = languageFiltersContainer.querySelector('[data-filter="all"]');
  if (allBtn) {
    allBtn.onclick = () => setLanguageFilter('all');
  }
}

function setLanguageFilter(lang) {
  activeLanguageFilter = lang;
  
  // Update active pill classes
  const pills = languageFiltersContainer.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    if (pill.dataset.filter === lang) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderFilteredProjects();
}

/**
 * Filter, sort, and render project cards
 */
function renderFilteredProjects() {
  let filtered = [...allRepositories];

  // Language filter
  if (activeLanguageFilter !== 'all') {
    filtered = filtered.filter(repo => repo.language === activeLanguageFilter);
  }

  // Search filter (searches name, description, and topics)
  if (currentSearchTerm) {
    filtered = filtered.filter(repo => {
      const name = (repo.name || '').toLowerCase();
      const desc = (repo.description || '').toLowerCase();
      const topics = (repo.topics || []).join(' ').toLowerCase();
      const lang = (repo.language || '').toLowerCase();

      return name.includes(currentSearchTerm) ||
             desc.includes(currentSearchTerm) ||
             topics.includes(currentSearchTerm) ||
             lang.includes(currentSearchTerm);
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (currentSortOrder) {
      case 'stars':
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      case 'created':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'pushed':
      default:
        return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
    }
  });

  // Render cards or empty state
  if (filtered.length === 0) {
    projectsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  projectsGrid.innerHTML = filtered.map(repo => createProjectCardHTML(repo)).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Generate HTML for an individual project card
 */
function createProjectCardHTML(repo) {
  const langColor = LANGUAGE_COLORS[repo.language] || '#94a3b8';
  const updatedAgo = formatRelativeTime(repo.pushed_at || repo.updated_at);
  const description = repo.description || 'Sin descripción detallada por el momento.';
  const topics = repo.topics || [];

  return `
    <article class="project-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between overflow-hidden group">
      <div class="card-glow"></div>

      <div>
        <!-- Card Header: Title & Badges -->
        <div class="flex items-start justify-between gap-3 mb-2.5">
          <h3 class="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors tracking-tight line-clamp-1">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center gap-1.5">
              <i data-lucide="folder-git-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
              <span>${escapeHTML(repo.name)}</span>
            </a>
          </h3>

          <div class="flex items-center gap-1.5 shrink-0">
            ${repo.fork ? `
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                Fork
              </span>
            ` : ''}
            ${repo.archived ? `
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                Archivado
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Description -->
        <p class="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
          ${escapeHTML(description)}
        </p>

        <!-- Topics / Tags -->
        ${topics.length > 0 ? `
          <div class="flex flex-wrap gap-1.5 mb-4">
            ${topics.slice(0, 4).map(topic => `
              <span class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                #${escapeHTML(topic)}
              </span>
            `).join('')}
            ${topics.length > 4 ? `
              <span class="text-[10px] font-mono px-1.5 py-0.5 text-slate-500">
                +${topics.length - 4}
              </span>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Card Footer: Meta Info & Actions -->
      <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
        <div class="flex items-center gap-3">
          ${repo.language ? `
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${langColor};"></span>
              ${repo.language}
            </span>
          ` : '<span class="text-slate-500">Docs/Otro</span>'}

          ${repo.stargazers_count > 0 ? `
            <span class="flex items-center gap-1 hover:text-amber-300 transition-colors">
              <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400"></i>
              ${repo.stargazers_count}
            </span>
          ` : ''}

          ${repo.forks_count > 0 ? `
            <span class="flex items-center gap-1 hover:text-cyan-300 transition-colors">
              <i data-lucide="git-fork" class="w-3.5 h-3.5 text-cyan-400"></i>
              ${repo.forks_count}
            </span>
          ` : ''}
        </div>

        <div class="flex items-center gap-2">
          ${repo.homepage ? `
            <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all" title="Ver Demo / Web">
              <i data-lucide="globe" class="w-3.5 h-3.5"></i>
            </a>
          ` : ''}
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors" title="Ver repositorio en GitHub">
            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Format timestamp into Spanish relative time
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `hace ${diffInMinutes} m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `hace ${diffInDays} d`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
