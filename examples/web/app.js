// 全局变量
const API_BASE = 'http://localhost:8080';
let currentResults = {
    merged_by_type: {},
    total: 0
};
let currentFilter = null;

// 网盘类型名称
const cloudTypeNames = {
    'baidu': '百度网盘',
    'aliyun': '阿里云盘',
    'quark': '夸克网盘',
    'tianyi': '天翼云盘',
    'uc': 'UC网盘',
    'mobile': '移动云盘',
    '115': '115网盘',
    'pikpak': 'PikPak',
    'xunlei': '迅雷网盘',
    '123': '123网盘',
    'magnet': '磁力链接',
    'ed2k': '电驴链接',
    'others': '其他'
};

// ==================== 工具函数 ====================

// 显示提示
function showToast(message, type = 'info') {
    if (typeof message === 'string' && (
        message.includes('showtest') ||
        message.includes('测试') && message.length < 20 ||
        message.includes('扩展') ||
        message.includes('插件可用')
    )) {
        console.warn('Blocked external toast:', message);
        return;
    }
    
    const existingToast = document.querySelector('.internal-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'internal-toast';
    toast.dataset.internal = 'true';
    toast.textContent = message;
    
    if (type === 'error') {
        toast.style.background = 'rgba(244, 67, 54, 0.9)';
    } else if (type === 'success') {
        toast.style.background = 'rgba(76, 175, 80, 0.9)';
    } else {
        toast.style.background = 'rgba(0, 0, 0, 0.9)';
    }
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        border: 2px solid #4caf50;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 显示/隐藏加载状态
function showLoading(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

// 显示无结果
function showNoResults() {
    const container = document.getElementById('results');
    container.innerHTML = '';
    
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty';
    emptyDiv.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: white;
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        margin: 20px 0;
    `;
    emptyDiv.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
        <p style="font-size: 1.2rem;">未找到相关资源</p>
        <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.8;">请尝试其他关键词</p>
    `;
    
    container.appendChild(emptyDiv);
}

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeJs(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/&/g, '\\&')
        .replace(/</g, '\\<')
        .replace(/>/g, '\\>');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// ==================== 搜索相关函数 ====================

// 停止搜索
function stopSearch() {
    if (window.searchState) {
        window.searchState.isSearching = false;
        showToast('⏹️ 已停止搜索');
        
        const statusItem = document.getElementById('searching-status');
        if (statusItem) {
            statusItem.remove();
        }
        
        restoreSearchButton();
    }
}

// 恢复搜索按钮
function restoreSearchButton() {
    const searchBtn = document.getElementById('searchBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (searchBtn && stopBtn) {
        searchBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }
}

// 显示搜索状态
function showSearchingState() {
    const container = document.getElementById('results');
    const existingStatus = document.getElementById('searching-status');
    
    if (!existingStatus) {
        const statusItem = document.createElement('div');
        statusItem.id = 'searching-status';
        statusItem.className = 'result-item';
        statusItem.style.cssText = `
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 10px;
        `;
        statusItem.innerHTML = `
            <div class="result-title" style="color: white;">
                🔍 正在搜索中...
            </div>
            <div class="result-meta" style="color: rgba(255,255,255,0.9);">
                请稍等，正在为您查找更多资源...
            </div>
        `;
        
        container.appendChild(statusItem);
    }
    
    restoreSearchButton();
}

// 合并新结果
function mergeNewResults(resultsObj, newData) {
    if (!newData.merged_by_type) return resultsObj;
    
    if (!resultsObj.merged_by_type) {
        resultsObj.merged_by_type = {};
    }
    
    let totalNewLinks = 0;
    
    for (const [type, links] of Object.entries(newData.merged_by_type)) {
        if (links && links.length > 0) {
            if (!resultsObj.merged_by_type[type]) {
                resultsObj.merged_by_type[type] = [];
            }
            
            const existingUrls = new Set(
                resultsObj.merged_by_type[type].map(link => link.url)
            );
            
            for (const link of links) {
                if (!existingUrls.has(link.url)) {
                    resultsObj.merged_by_type[type].push({
                        ...link,
                        timestamp: Date.now()
                    });
                    totalNewLinks++;
                }
            }
        }
    }
    
    resultsObj.total = Object.values(resultsObj.merged_by_type)
        .reduce((sum, links) => sum + links.length, 0);
    
    return resultsObj;
}

// 追加新结果到页面（按搜索顺序）
function appendNewResults(data) {
    if (!data.merged_by_type) return;
    
    const container = document.getElementById('results');
    
    const previousTotal = currentResults.total;
    currentResults = mergeNewResults(currentResults, data);
    
    if (currentResults.total > previousTotal) {
        window.searchState.allResults = Object.values(currentResults.merged_by_type).flat();
        window.searchState.totalCount = currentResults.total;
        
        // 按搜索顺序追加新结果
        const allNewLinks = [];
        for (const [type, links] of Object.entries(data.merged_by_type)) {
            if (links && links.length > 0) {
                const existingUrls = new Set(
                    container.querySelectorAll('.result-item').map(item => {
                        const linkElement = item.querySelector('.btn-download');
                        return linkElement ? linkElement.getAttribute('onclick') : '';
                    }).map(onclick => {
                        const match = onclick.match(/'([^']+)'/);
                        return match ? match[1] : '';
                    })
                );
                
                for (const link of links) {
                    if (!existingUrls.has(link.url)) {
                        const resultItem = createResultItem(link, type);
                        container.appendChild(resultItem);
                        allNewLinks.push(link);
                    }
                }
            }
        }
        
        showToast(`🔍 找到 ${currentResults.total} 个相关资源 (${attempts <= 5 ? '搜索中...' : '搜索完成'})`);
        
        // 移除无结果提示
        const emptyElement = container.querySelector('.empty');
        if (emptyElement) {
            emptyElement.remove();
        }
    }
}

// 异步获取搜索结果（找到一个显示一个）
async function getSearchResultsAsync(keyword) {
    try {
        window.searchState.isSearching = true;
        
        // 先获取所有结果
        const response = await fetch(`${API_BASE}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kw: keyword,
                res: 'merge'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`搜索完成，获得${data.total}个结果`);
        
        // API已经返回正确的格式，直接使用
        console.log(`各类型结果:`, Object.keys(data.merged_by_type).map(type => `${type}:${data.merged_by_type[type].length}`));
        
        // 初始化currentResults
        currentResults = {
            merged_by_type: {},
            total: 0
        };
        
        // 异步显示每个类型的结果
        await displayResultsAsync(data.merged_by_type);
        
        // 更新搜索状态
        window.searchState.allResults = Object.values(currentResults.merged_by_type).flat();
        window.searchState.totalCount = currentResults.total;
        window.searchState.isSearching = false;
        
        // 显示搜索完成状态
        const container = document.getElementById('results');
        
        // 移除搜索中状态
        const searchingStatus = document.getElementById('searching-status');
        if (searchingStatus) {
            searchingStatus.remove();
        }
        
        const completedStatus = document.createElement('div');
        completedStatus.className = 'result-item';
        completedStatus.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 10px;
        `;
        completedStatus.innerHTML = `
            <div class="result-title" style="color: white;">
                ✅ 搜索完成
            </div>
            <div class="result-meta" style="color: rgba(255,255,255,0.9);">
                共找到 <strong>${window.searchState.totalCount}</strong> 个相关资源
            </div>
        `;
        
        const firstChild = container.firstChild;
        if (firstChild) {
            container.insertBefore(completedStatus, firstChild);
        } else {
            container.appendChild(completedStatus);
        }
        
        console.log(`Async search completed. Final results count: ${window.searchState.totalCount}`);
        
        showToast(`✅ 搜索完成，共找到 ${window.searchState.totalCount} 个相关资源`, 'success');
        
    } catch (error) {
        console.error('搜索失败:', error);
        showToast(`❌ 搜索失败: ${error.message}`);
        window.searchState.isSearching = false;
    }
}

// 异步显示结果（逐个类型处理，每个类型内逐个显示）
async function displayResultsAsync(mergedByType) {
    const container = document.getElementById('results');
    const typeOrder = ['baidu', 'aliyun', 'quark', 'tianyi', '115', 'pikpak', 'magnet', 'ed2k'];
    
    // 按优先级排序类型
    const sortedTypes = Object.keys(mergedByType).sort((a, b) => {
        const indexA = typeOrder.indexOf(a);
        const indexB = typeOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    
    console.log('开始异步显示结果，类型顺序:', sortedTypes);
    
    for (const type of sortedTypes) {
        const results = mergedByType[type];
        if (!results || results.length === 0) continue;
        
        console.log(`开始显示 ${type} 类型的 ${results.length} 个结果`);
        
        // 显示类型标题
        const typeHeader = document.createElement('div');
        typeHeader.className = 'result-item';
        typeHeader.style.cssText = `
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 8px;
            font-weight: bold;
        `;
        typeHeader.innerHTML = `
            ${cloudTypeNames[type] || type.toUpperCase()} - ${results.length} 个资源
        `;
        container.appendChild(typeHeader);
        
        // 更新currentResults
        if (!currentResults.merged_by_type[type]) {
            currentResults.merged_by_type[type] = [];
        }
        
        // 逐个显示该类型的结果
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            
            // 添加到currentResults
            currentResults.merged_by_type[type].push(result);
            currentResults.total++;
            
            // 创建并显示结果项
            const resultItem = createResultItem(result, type);
            container.appendChild(resultItem);
            
            // 更新搜索状态
            window.searchState.allResults.push(result);
            window.searchState.totalCount = currentResults.total;
            
            // 显示进度
            if (i % 5 === 0 || i === results.length - 1) {
                console.log(`已显示 ${type} 类型 ${i + 1}/${results.length} 个结果，总计: ${currentResults.total}`);
                showToast(`🔍 已找到 ${currentResults.total} 个资源 (${type} ${i + 1}/${results.length})`);
            }
            
            // 每3个结果延迟一下，让用户能看到渐进效果
            if (i > 0 && i % 3 === 0 && window.searchState.isSearching) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // 如果用户停止了搜索，就退出
            if (!window.searchState.isSearching) {
                console.log('用户停止搜索，中断显示');
                return;
            }
        }
    }
}

// 轮询获取搜索结果
async function pollForResults(keyword) {
    const maxAttempts = 20;
    const pollInterval = 2000;
    let attempts = 0;
    let lastTotalCount = 0;

    while (attempts < maxAttempts && window.searchState.isSearching) {
        attempts++;
        
        try {
            const response = await fetch(`${API_BASE}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    kw: keyword,
                    res: 'merge',
                    refresh: attempts === 1
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`轮询第${attempts}次，获得${data.total}个结果`);
            
            const previousTotal = currentResults.total;
            currentResults = mergeNewResults(currentResults, data);
            
            if (currentResults.total > previousTotal) {
                window.searchState.allResults = Object.values(currentResults.merged_by_type).flat();
                window.searchState.totalCount = currentResults.total;
                
                appendNewResults(data);
                
                showToast(`🔍 找到 ${currentResults.total} 个相关资源 (${attempts <= 5 ? '搜索中...' : '搜索完成'})`);
            }
            
            if (data.total === lastTotalCount && attempts > 3) {
                console.log('连续无新结果，停止搜索');
                break;
            }
            lastTotalCount = data.total;
            
        } catch (error) {
            console.error(`轮询第${attempts}次失败:`, error);
            if (attempts >= 3) break;
        }
        
        if (attempts < maxAttempts && window.searchState.isSearching) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }
    
    window.searchState.isSearching = false;
    restoreSearchButton();
    
    // 显示搜索完成状态
    const container = document.getElementById('results');
    const completedStatus = document.createElement('div');
    completedStatus.className = 'result-item';
    completedStatus.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        margin-bottom: 20px;
        border-radius: 10px;
    `;
    completedStatus.innerHTML = `
        <div class="result-title" style="color: white;">
            ✅ 搜索完成
        </div>
        <div class="result-meta" style="color: rgba(255,255,255,0.9);">
            共找到 <strong>${window.searchState.totalCount}</strong> 个相关资源
        </div>
    `;
    
    const firstChild = container.firstChild;
    if (firstChild) {
        container.insertBefore(completedStatus, firstChild);
    } else {
        container.appendChild(completedStatus);
    }
    
    showToast(`✅ 搜索完成，共找到 ${window.searchState.totalCount} 个相关资源`, 'success');
}

// 处理搜索
async function handleSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        showToast('请输入搜索关键词');
        return;
    }

    showLoading(true);
    const container = document.getElementById('results');
    container.innerHTML = '';
    
    if (!window.searchState) {
        window.searchState = {
            keyword: keyword,
            totalCount: 0,
            isSearching: true,
            allResults: []
        };
    } else {
        window.searchState.keyword = keyword;
        window.searchState.totalCount = 0;
        window.searchState.isSearching = true;
        window.searchState.allResults = [];
    }
    
    currentResults = {
        merged_by_type: {},
        total: 0
    };

    showToast('🔍 开始搜索...');

    try {
        console.log('开始搜索:', keyword);
        
        showSearchingState();
        await getSearchResultsAsync(keyword);
        
    } catch (error) {
        console.error('搜索错误:', error);
        showToast(`❌ 搜索失败: ${error.message}`);
        
        window.searchState.isSearching = false;
    } finally {
        showLoading(false);
    }
}

// 渲染搜索结果（按搜索顺序）
function renderResults(data) {
    const container = document.getElementById('results');
    
    // 首次渲染时清空容器，但保留搜索状态
    const hasSearchStatus = container.querySelector('#searching-status') || container.querySelector('.filter-header') || container.querySelector('.empty');
    if (!hasSearchStatus) {
        container.innerHTML = '';
    }
    const allLinks = [];

    // 收集所有链接（保持搜索顺序）
    if (data.merged_by_type) {
        for (const [type, links] of Object.entries(data.merged_by_type)) {
            if (links && links.length > 0) {
                for (const link of links) {
                    allLinks.push({
                        ...link,
                        type: type,
                        timestamp: Date.now()
                    });
                    totalCount++;
                }
            }
        }
    }

    if (totalCount === 0) {
        showNoResults();
        return;
    }

    showSearchStatus(totalCount);

    // 按搜索顺序显示结果（不分组）
    for (const link of allLinks) {
        const resultItem = createResultItem(link, link.type);
        container.appendChild(resultItem);
}
    
    // 更新currentResults
    currentResults = data;
}
function showSearchStatus(totalCount) {
    const container = document.getElementById('results');
    
    const oldStatus = document.getElementById('searching-status');
    if (oldStatus) {
        oldStatus.remove();
    }
    
    if (window.searchState && window.searchState.isSearching) {
        const statusItem = document.getElementById('searching-status');
        if (!statusItem) {
            const searchingDiv = document.createElement('div');
            searchingDiv.id = 'searching-status';
            searchingDiv.className = 'result-item';
            searchingDiv.style.cssText = `
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                color: white;
                text-align: center;
                margin-bottom: 20px;
                border-radius: 10px;
            `;
            searchingDiv.innerHTML = `
                <div class="result-title" style="color: white;">
                    🔍 正在搜索中...
                </div>
                <div class="result-meta" style="color: rgba(255,255,255,0.9);">
                    请稍等，正在为您查找更多资源...
                </div>
            `;
            
            if (container.firstChild) {
                container.insertBefore(searchingDiv, container.firstChild);
            } else {
                container.appendChild(searchingDiv);
            }
        }
    }

    updateSearchStats(totalCount);
}

// 创建结果项
function createResultItem(link, type) {
    const item = document.createElement('div');
    item.className = 'result-item';

    const isMagnet = type === 'magnet' || type === 'ed2k';
    const filename = link.note || link.title || `资源`;
    
    let sourceInfo = '';
    if (link.channel) {
        sourceInfo = `tg:${escapeHtml(link.channel)}`;
    } else if (link.source) {
        sourceInfo = escapeHtml(link.source);
    } else if (type) {
        sourceInfo = cloudTypeNames[type] || type;
    }

    item.innerHTML = `
        <div class="result-title">${escapeHtml(filename)}</div>
        <div class="result-link">
            <div class="link-box">
                <span class="link-url">${escapeHtml(link.url.substring(0, 80))}${link.url.length > 80 ? '...' : ''}</span>
                ${link.password ? `<span class="password">${escapeHtml(link.password)}</span>` : ''}
            </div>
            <div class="result-actions">
                <button class="btn btn-download" onclick="downloadDirect('${escapeJs(link.url)}', '${escapeJs(filename)}')">
                    🚀 一键下载
                </button>
                <button class="btn btn-secondary" onclick="openLink('${escapeJs(link.url)}')">
                    🔗 打开
                </button>
                <button class="btn btn-copy" onclick="copyLink('${escapeJs(link.url)}', '${escapeJs(link.password || '')}')">
                    📋 复制
                </button>
            </div>
        </div>
        <div class="result-meta">
            ${sourceInfo ? `来源: ${sourceInfo}` : ''}
            ${link.datetime ? ` · ${formatDate(link.datetime)}` : ''}
            ${type ? ` · ${cloudTypeNames[type] || type}` : ''}
        </div>
    `;

    return item;
}

// 更新统计信息
function updateSearchStats(count) {
    let statsElement = document.getElementById('search-stats');
    
    if (!statsElement) {
        statsElement = document.createElement('div');
        statsElement.id = 'search-stats';
        statsElement.className = 'stats';
        statsElement.style.cssText = `
            background: rgba(255,255,255,0.1);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            backdrop-filter: blur(10px);
            font-size: 16px;
        `;
    }
    
    statsElement.innerHTML = `
        找到 <span style="font-weight: bold; color: #4caf50;">${count}</span> 个相关资源
    `;
    
    const container = document.getElementById('results');
    const searchingStatus = container.querySelector('#searching-status');
    
    if (searchingStatus && searchingStatus.nextSibling) {
        container.insertBefore(statsElement, searchingStatus.nextSibling);
    } else if (container.firstChild) {
        container.insertBefore(statsElement, container.firstChild);
    } else {
        container.appendChild(statsElement);
    }
}

// 过滤器
function filterByCloud(type) {
    console.log('filterByCloud被调用，类型:', type);
    console.log('currentResults:', currentResults);
    
    if (!currentResults || !currentResults.merged_by_type) {
        showToast('⚠️ 请先进行搜索');
        return;
    }
    
    // 如果过滤类型没有变化，不需要重新处理
    if (currentFilter === type) {
        console.log('过滤类型未变化，跳过处理');
        return;
    }
    
    currentFilter = type;

    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.type === type);
    });

    const container = document.getElementById('results');
    const allResultItems = container.querySelectorAll('.result-item');
    
    if (type === 'all') {
        // 显示所有结果
        allResultItems.forEach(item => {
            item.style.display = 'block';
        });
        
        // 移除过滤标题
        const filterHeader = container.querySelector('.filter-header');
        if (filterHeader) {
            filterHeader.remove();
        }
        
        showToast('🔍 显示所有资源', 'success');
    } else {
        // 只显示指定类型的结果
        if (currentResults.merged_by_type[type]) {
            const links = currentResults.merged_by_type[type];
            
            // 创建过滤标题
            const filterHeader = document.createElement('div');
            filterHeader.className = 'filter-header';
            filterHeader.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
                font-weight: bold;
                font-size: 16px;
            `;
            filterHeader.innerHTML = `
                ${cloudTypeNames[type] || type}
                <span style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; margin-left: 10px; font-size: 14px;">
                    ${links.length} 个
                </span>
            `;
            
            container.appendChild(filterHeader);
            
            // 显示该类型的结果
            links.forEach(link => {
                const resultItem = createResultItem(link, type);
                container.appendChild(resultItem);
            });
            
            showToast(`🔍 显示${cloudTypeNames[type] || type}相关结果`, 'success');
        } else {
            showToast(`⚠️ 没有找到${cloudTypeNames[type] || type}相关结果`, 'warning');
        }
    }
    
    // 滚动到最上方
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 下载相关函数
async function downloadDirect(url, filename) {
    console.log('调用下载:', filename, url);
    
    try {
        if (url.startsWith('magnet:') || url.startsWith('ed2k:')) {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.click();
            showToast('🔗 已打开磁力链接');
        } else {
            window.open(url, '_blank');
            showToast('🔗 已在新标签页打开');
        }
    } catch (error) {
        console.error('下载失败:', error);
        showToast('❌ 下载失败');
    }
}

async function copyLink(url, password) {
    let text = url;
    if (password) {
        text += `\\n提取码: ${password}`;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast('✅ 已复制到剪贴板');
    } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('✅ 已复制到剪贴板');
        } catch (err) {
            showToast('❌ 复制失败，请手动复制');
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

function openLink(url) {
    window.open(url, '_blank');
}

// ==================== 初始化 ====================

// 初始化事件监听器
function initEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopSearch);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            filterByCloud(type);
        });
    });
}

// 移除广告和扩展元素
function removeAdsAndExtensions() {
    const adElements = document.querySelectorAll('[class*="ap-ext"], [class*="tanchuang"], [class*="tbcpall"]');
    adElements.forEach(element => {
        element.remove();
    });

    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        const className = element.className || '';
        if (typeof className === 'string' && (
            className.includes('ap-ext') || 
            className.includes('tanchuang') ||
            className.includes('tbcpall')
        )) {
            element.remove();
        }
    });

    setInterval(() => {
        const newAds = document.querySelectorAll('[class*="ap-ext"], [class*="tanchuang"]');
        newAds.forEach(element => {
            element.remove();
        });
        
        const toasts = document.querySelectorAll('.toast:not([data-internal="true"])');
        toasts.forEach(toast => {
            toast.remove();
        });
    }, 2000);
}

// 覆盖可能的全局showtest函数
window.showtest = function() {
    console.warn('Blocked showtest function call');
    return;
};

window.showTest = function() {
    console.warn('Blocked showTest function call');
    return;
};

window.ShowTest = function() {
    console.warn('Blocked ShowTest function call');
    return;
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('HTML初始化完成，端口8080，等待app.js...');
    
    try {
        removeAdsAndExtensions();
        initEventListeners();
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
        
        console.log('PanSou 页面初始化完成');
        
    } catch (error) {
        console.error('页面初始化失败:', error);
        showToast('❌ 页面初始化失败: ' + error.message);
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise错误:', e.reason);
});

console.log('app.js 加载完成');