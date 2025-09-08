// Dynamic Content Loader - Tech News Integration
// Phase 1: Frontend JavaScript Implementation

class TechContentLoader {
    constructor() {
        this.apis = {
            // 使用免费的新闻API
            gnews: 'https://gnews.io/api/v4/search',
            newsapi: 'https://newsapi.org/v2/everything',
            // 备用API源
            devto: 'https://dev.to/api/articles',
            github: 'https://api.github.com/search/repositories'
        };
        this.fallbackContent = this.getFallbackContent();
        this.cache = {
            data: null,
            timestamp: null,
            duration: 30 * 60 * 1000 // 30分钟缓存
        };
    }

    // 获取缓存内容
    getCachedData() {
        if (this.cache.data && this.cache.timestamp) {
            const isValid = (Date.now() - this.cache.timestamp) < this.cache.duration;
            if (isValid) {
                return this.cache.data;
            }
        }
        return null;
    }

    // 设置缓存
    setCachedData(data) {
        this.cache.data = data;
        this.cache.timestamp = Date.now();
    }

    // 获取技术新闻内容
    async fetchTechNews() {
        try {
            // 首先检查缓存
            const cached = this.getCachedData();
            if (cached) {
                return cached;
            }

            // 尝试多个API源
            const content = await this.tryMultipleAPIs();
            
            if (content && content.length > 0) {
                this.setCachedData(content);
                return content;
            }
            
            // 如果所有API都失败，使用备用内容
            return this.fallbackContent;
        } catch (error) {
            console.warn('API请求失败，使用备用内容:', error);
            return this.fallbackContent;
        }
    }

    // 尝试多个API源
    async tryMultipleAPIs() {
        // 1. 尝试Dev.to API (免费无限制)
        try {
            const devtoContent = await this.fetchFromDevTo();
            if (devtoContent && devtoContent.length > 0) {
                return devtoContent;
            }
        } catch (error) {
            console.warn('Dev.to API failed:', error);
        }

        // 2. 尝试GitHub Trending
        try {
            const githubContent = await this.fetchFromGitHub();
            if (githubContent && githubContent.length > 0) {
                return githubContent;
            }
        } catch (error) {
            console.warn('GitHub API failed:', error);
        }

        // 3. 使用RSS feed解析 (HackerNews, Reddit等)
        try {
            const rssContent = await this.fetchFromRSS();
            if (rssContent && rssContent.length > 0) {
                return rssContent;
            }
        } catch (error) {
            console.warn('RSS feeds failed:', error);
        }

        return null;
    }

    // Dev.to API获取内容
    async fetchFromDevTo() {
        const response = await fetch('https://dev.to/api/articles?tag=javascript,react,python,webdev&top=7');
        if (!response.ok) throw new Error('Dev.to API failed');
        
        const articles = await response.json();
        return articles.slice(0, 6).map(article => ({
            title: this.truncateTitle(article.title),
            description: this.truncateDescription(article.description || article.title),
            readTime: `${article.reading_time_minutes || Math.floor(Math.random() * 10 + 5)} min read`,
            date: this.formatDate(article.published_at),
            category: this.getRandomCategory(),
            views: this.generateViews()
        }));
    }

    // GitHub Trending获取内容
    async fetchFromGitHub() {
        const query = 'language:javascript,typescript,python,react stars:>100 pushed:>2025-08-01';
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=6`);
        
        if (!response.ok) throw new Error('GitHub API failed');
        
        const data = await response.json();
        return data.items.map(repo => ({
            title: `Exploring ${repo.name}: ${this.generateRepoDescription(repo)}`,
            description: `${repo.description || 'Interesting project'} - ${repo.stargazers_count} stars, ${repo.language || 'Multi-language'} based.`,
            readTime: `${Math.floor(Math.random() * 8 + 6)} min read`,
            date: this.formatDate(repo.updated_at),
            category: 'Open Source',
            views: this.generateViews()
        }));
    }

    // RSS Feed内容获取
    async fetchFromRSS() {
        // 使用公开的RSS到JSON转换服务
        const rssFeeds = [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml',
            'https://feeds.arstechnica.com/arstechnica/technology-lab'
        ];

        try {
            // 使用rss2json服务
            const feedUrl = rssFeeds[Math.floor(Math.random() * rssFeeds.length)];
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=6`);
            
            if (!response.ok) throw new Error('RSS service failed');
            
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
                return data.items.map(item => ({
                    title: this.truncateTitle(item.title),
                    description: this.truncateDescription(item.description.replace(/<[^>]*>/g, '')),
                    readTime: `${Math.floor(Math.random() * 12 + 5)} min read`,
                    date: this.formatDate(item.pubDate),
                    category: this.getRandomCategory(),
                    views: this.generateViews()
                }));
            }
        } catch (error) {
            console.warn('RSS parsing failed:', error);
        }
        
        return null;
    }

    // 工具函数
    truncateTitle(title) {
        return title.length > 80 ? title.substring(0, 77) + '...' : title;
    }

    truncateDescription(desc) {
        if (!desc) return 'Interesting technical insights and real-world development experiences...';
        const clean = desc.replace(/<[^>]*>/g, '').trim();
        return clean.length > 200 ? clean.substring(0, 197) + '...' : clean;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) return 'Today';
        if (daysDiff === 1) return 'Yesterday';
        if (daysDiff < 7) return `${daysDiff} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    getRandomCategory() {
        const categories = [
            'Web Development', 'AI & ML', 'Developer Tools', 
            'Hardware Review', 'Software Tips', 'Tech Trends'
        ];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    generateViews() {
        return `${(Math.random() * 4 + 1).toFixed(1)}k reads`;
    }

    generateRepoDescription(repo) {
        const descriptions = [
            'A Game-Changing Tool',
            'Powerful Development Solution',
            'Innovative Framework',
            'Essential Developer Resource',
            'Cutting-Edge Library'
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    // 备用内容（当所有API都失败时使用）
    getFallbackContent() {
        return [
            {
                title: "Building Better React Components with TypeScript in 2025",
                description: "After 6 months of migrating legacy components, here's what I learned about TypeScript patterns, performance optimization, and developer experience improvements...",
                readTime: "8 min read",
                date: "2 days ago",
                category: "Web Development",
                views: "2.3k reads"
            },
            {
                title: "My Experience with Claude Sonnet 4 for Code Reviews",
                description: "Using AI for code reviews has transformed my development workflow. Here's how I integrated Claude into my daily coding routine and the surprising results...",
                readTime: "10 min read",
                date: "3 days ago", 
                category: "AI & Productivity",
                views: "3.1k reads"
            },
            {
                title: "Why I Switched from Docker to Podman (And You Should Consider It)",
                description: "Container security, rootless execution, and better resource management - here's my honest comparison after 4 months with Podman...",
                readTime: "12 min read",
                date: "5 days ago",
                category: "Developer Tools", 
                views: "1.9k reads"
            },
            {
                title: "M3 MacBook Air vs Framework Laptop 16: Developer's Choice",
                description: "I used both laptops for intensive development work over 3 months. Performance, repairability, and ecosystem considerations for choosing your next dev machine...",
                readTime: "14 min read", 
                date: "1 week ago",
                category: "Hardware Review",
                views: "2.7k reads"
            },
            {
                title: "Optimizing React Performance: Real-World Bundle Splitting",
                description: "Reduced initial load time by 60% across 12 production apps. Here's the step-by-step guide to code splitting that actually works in complex applications...",
                readTime: "11 min read",
                date: "1 week ago", 
                category: "Web Development",
                views: "1.8k reads"
            },
            {
                title: "PostgreSQL vs MongoDB: 2025 Performance Benchmarks",
                description: "I benchmarked both databases with identical workloads across 6 months. Query performance, scaling characteristics, and maintenance overhead compared...",
                readTime: "15 min read",
                date: "2 weeks ago",
                category: "Database",
                views: "2.1k reads"
            }
        ];
    }

    // 更新侧边栏热门文章
    async updatePopularPosts() {
        try {
            const content = await this.fetchTechNews();
            const popularPostsContainer = document.querySelector('.popular-posts');
            
            if (!popularPostsContainer) return;

            popularPostsContainer.innerHTML = content.slice(0, 5).map(article => 
                `<li>
                    <a href="#">${article.title}</a>
                    <span class="post-views">${article.views}</span>
                </li>`
            ).join('');

            console.log('✅ Popular posts updated with fresh content');
        } catch (error) {
            console.error('Failed to update popular posts:', error);
        }
    }

    // 更新主要文章区域
    async updateMainArticles() {
        try {
            const content = await this.fetchTechNews();
            const latestSection = document.querySelector('#latest .blog-posts');
            const reviewsSection = document.querySelector('#reviews .blog-posts');
            
            // 调试信息
            console.log('Latest section found:', !!latestSection);
            console.log('Reviews section found:', !!reviewsSection);

            // 更新Latest Posts
            if (latestSection) {
                latestSection.innerHTML = content.slice(0, 3).map(article => 
                    `<article class="blog-post">
                        <div class="post-meta">
                            <span class="post-date">${article.date}</span>
                            <span class="post-category">${article.category}</span>
                        </div>
                        <h3><a href="article.html">${article.title}</a></h3>
                        <p class="post-excerpt">${article.description}</p>
                        <div class="post-footer">
                            <span class="read-time">${article.readTime}</span>
                            <a href="article.html" class="read-more">Continue Reading →</a>
                        </div>
                    </article>`
                ).join('');
                console.log('✅ Latest section updated');
            } else {
                console.error('❌ Latest section not found');
            }

            // 更新Reviews Section
            if (reviewsSection) {
                reviewsSection.innerHTML = content.slice(3, 6).map(article => 
                    `<article class="blog-post">
                        <div class="post-meta">
                            <span class="post-date">${article.date}</span>
                            <span class="post-category">${article.category}</span>
                        </div>
                        <h3><a href="article.html">${article.title}</a></h3>
                        <p class="post-excerpt">${article.description}</p>
                        <div class="post-footer">
                            <span class="read-time">${article.readTime}</span>
                            <a href="article.html" class="read-more">Continue Reading →</a>
                        </div>
                    </article>`
                ).join('');
                console.log('✅ Reviews section updated');
            } else {
                console.error('❌ Reviews section not found');
            }

            console.log('✅ Main articles updated with fresh content');
        } catch (error) {
            console.error('Failed to update main articles:', error);
        }
    }

    // 初始化内容加载
    async init() {
        console.log('🚀 Initializing dynamic content loader...');
        
        // 等待DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.loadContent(), 1000); // 延迟1秒确保DOM完全渲染
            });
        } else {
            setTimeout(() => this.loadContent(), 1000);
        }
    }

    // 加载所有内容
    async loadContent() {
        console.log('📥 Loading fresh tech content...');
        
        // 显示加载状态
        this.showLoadingState();
        
        try {
            // 并行更新所有内容区域
            await Promise.all([
                this.updatePopularPosts(),
                this.updateMainArticles()
            ]);
            
            console.log('✨ All content updated successfully!');
            this.showStatus('✨ Content updated with fresh tech articles!', 'success');
        } catch (error) {
            console.error('Content loading failed:', error);
            this.showStatus('Using cached content (API temporarily unavailable)', 'error');
        } finally {
            this.hideLoadingState();
        }
    }

    // 显示API状态
    showStatus(message, type = 'loading') {
        const statusEl = document.getElementById('apiStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `api-status show ${type}`;
            
            // 3秒后自动隐藏
            setTimeout(() => {
                statusEl.classList.remove('show');
            }, 3000);
        }
    }

    // 显示加载状态
    showLoadingState() {
        const sections = document.querySelectorAll('.blog-posts, .popular-posts');
        sections.forEach(section => {
            section.style.opacity = '0.7';
        });
        this.showStatus('Fetching latest tech content...', 'loading');
    }

    // 隐藏加载状态  
    hideLoadingState() {
        const sections = document.querySelectorAll('.blog-posts, .popular-posts');
        sections.forEach(section => {
            section.style.opacity = '1';
        });
    }
}

// 页面加载时自动初始化
const contentLoader = new TechContentLoader();
contentLoader.init();

// 每30分钟自动更新一次内容
setInterval(() => {
    console.log('🔄 Auto-refreshing content...');
    contentLoader.loadContent();
}, 30 * 60 * 1000);

// 暴露到全局作用域，便于调试
window.techContentLoader = contentLoader;