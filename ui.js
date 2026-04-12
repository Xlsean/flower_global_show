/**
 * 全球名花地球仪 - UI 交互模块
 */

class FlowerUI {
  constructor(globeRenderer) {
    this.globe = globeRenderer;
    this.flowers = FLOWERS_DATA;
    this.filteredFlowers = [...this.flowers];
    this.selectedFlower = null;

    // 每朵花的本地上传图片缓存（flowerId -> objectURL）
    this.uploadedImages = new Map();

    // 本地 flowers/ 目录图片映射（flower.name -> 本地路径）
    // 预加载检测哪些花有本地图片
    this.localImages = new Map();
    this._preloadLocalImages();

    // 筛选状态
    this.filters = {
      search: '',
      region: '全部',
      month: null,
      category: '全部类别',
      country: '全部',
    };

    // 初始化各模块
    this.initSearch();
    this.initFilters();
    this.initFlowerList();
    this.initDetailCard();
    this.initTooltip();
    this.initSidePanel();
    this.initStatsBar();
    this.initBottomActions();
    this.initPetalEffect();

    // 设置地球仪事件回调
    this.globe.onMarkerClick = (flower, pos, e) => this.onMarkerClick(flower, pos, e);
    this.globe.onMarkerHover = (flower, pos) => this.onMarkerHover(flower, pos);
    this.globe.onMarkerLeave = () => this.onMarkerLeave();

    // 渲染初始列表
    this.applyFilters();
  }

  // ============================================================
  // 本地图片预加载
  // ============================================================

  /**
   * 预加载 flowers/ 目录下的本地图片。
   * 对每朵花，尝试按花名匹配 flowers/{name}.jpg / .webp / .png，
   * 命中后缓存到 this.localImages。
   */
  _preloadLocalImages() {
    const extensions = ['jpg', 'webp', 'png', 'jpeg'];
    const names = [...new Set(this.flowers.map(f => f.name))];
    names.forEach(name => {
      this._tryLoadLocalImage(name, extensions, 0);
    });
  }

  _tryLoadLocalImage(name, extensions, idx) {
    if (idx >= extensions.length) return;
    const path = `flowers/${name}.${extensions[idx]}`;
    const img = new Image();
    img.onload = () => {
      this.localImages.set(name, path);
      this._updateDetailImageIfNeeded(name, path);
    };
    img.onerror = () => {
      this._tryLoadLocalImage(name, extensions, idx + 1);
    };
    img.src = path;
  }

  /**
   * 如果详情卡片正在展示对应花朵，把图片替换为本地图片
   */
  _updateDetailImageIfNeeded(flowerName, localPath) {
    if (!this.selectedFlower || this.selectedFlower.name !== flowerName) return;
    const flowerId = this.selectedFlower.id;
    // 如果用户已手动上传了图片，不覆盖
    if (this.uploadedImages.has(flowerId)) return;
    const imgEl = document.getElementById(`detail-img-${flowerId}`);
    const placeholder = document.getElementById(`detail-img-placeholder-${flowerId}`);
    if (imgEl) {
      imgEl.src = localPath;
      imgEl.classList.add('loaded');
      if (placeholder) placeholder.style.display = 'none';
    }
  }

  // ============================================================
  // 搜索功能
  // ============================================================

  initSearch() {
    this.searchInput = document.getElementById('search-input');
    this.searchClear = document.querySelector('.search-clear');

    this.searchInput.addEventListener('input', (e) => {
      this.filters.search = e.target.value.trim();
      this.searchClear.style.display = this.filters.search ? 'flex' : 'none';
      this.applyFilters();
    });

    this.searchClear.addEventListener('click', () => {
      this.searchInput.value = '';
      this.filters.search = '';
      this.searchClear.style.display = 'none';
      this.applyFilters();
    });
  }

  // ============================================================
  // 筛选功能
  // ============================================================

  initFilters() {
    // 地区筛选
    const regionContainer = document.getElementById('region-filters');
    if (regionContainer) {
      REGIONS.forEach(region => {
        const chip = document.createElement('button');
        chip.className = 'filter-chip' + (region === '全部' ? ' active' : '');
        chip.textContent = region;
        chip.dataset.value = region;
        chip.addEventListener('click', () => {
          this.filters.region = region;
          regionContainer.querySelectorAll('.filter-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.value === region);
          });
          this.applyFilters();
        });
        regionContainer.appendChild(chip);
      });
    }

    // 月份筛选
    const monthContainer = document.getElementById('month-filters');
    if (monthContainer) {
      const allMonthChip = document.createElement('button');
      allMonthChip.className = 'month-chip active';
      allMonthChip.textContent = '全年';
      allMonthChip.style.gridColumn = 'span 2';
      allMonthChip.dataset.value = 'all';
      allMonthChip.addEventListener('click', () => {
        this.filters.month = null;
        monthContainer.querySelectorAll('.month-chip').forEach(c => c.classList.remove('active'));
        allMonthChip.classList.add('active');
        this.applyFilters();
      });
      monthContainer.appendChild(allMonthChip);

      MONTHS_CN.forEach((month, i) => {
        const chip = document.createElement('button');
        chip.className = 'month-chip';
        chip.textContent = month;
        chip.dataset.value = i + 1;
        chip.addEventListener('click', () => {
          this.filters.month = i + 1;
          monthContainer.querySelectorAll('.month-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.applyFilters();
        });
        monthContainer.appendChild(chip);
      });
    }

    // 国家筛选（可折叠）
    const countryToggle = document.getElementById('country-toggle');
    const countryWrap = document.getElementById('country-filters-wrap');
    const countryContainer = document.getElementById('country-filters');

    if (countryToggle && countryWrap) {
      countryToggle.addEventListener('click', () => {
        const collapsed = countryWrap.classList.toggle('collapsed');
        countryToggle.querySelector('.toggle-arrow').textContent = collapsed ? '▼' : '▲';
      });
    }

    if (countryContainer) {
      const countries = [...new Set(this.flowers.map(f => f.country))].sort((a, b) => a.localeCompare(b, 'zh'));

      const allChip = document.createElement('button');
      allChip.className = 'filter-chip active';
      allChip.textContent = '全部';
      allChip.dataset.value = '全部';
      allChip.addEventListener('click', () => {
        this.filters.country = '全部';
        countryContainer.querySelectorAll('.filter-chip').forEach(c => {
          c.classList.toggle('active', c.dataset.value === '全部');
        });
        this.applyFilters();
      });
      countryContainer.appendChild(allChip);

      countries.forEach(country => {
        const chip = document.createElement('button');
        chip.className = 'filter-chip country-chip';
        chip.textContent = country;
        chip.dataset.value = country;
        chip.addEventListener('click', () => {
          this.filters.country = country;
          countryContainer.querySelectorAll('.filter-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.value === country);
          });
          this.applyFilters();
        });
        countryContainer.appendChild(chip);
      });
    }
  }

  // ============================================================
  // 应用筛选
  // ============================================================

  applyFilters() {
    const { search, region, month, category, country } = this.filters;

    this.filteredFlowers = this.flowers.filter(flower => {
      // 搜索过滤
      if (search) {
        const keyword = search.toLowerCase();
        const matchName = flower.name.toLowerCase().includes(keyword);
        const matchNameEn = flower.nameEn.toLowerCase().includes(keyword);
        const matchCountry = flower.country.toLowerCase().includes(keyword);
        const matchBrief = flower.brief.toLowerCase().includes(keyword);
        if (!matchName && !matchNameEn && !matchCountry && !matchBrief) return false;
      }

      // 地区过滤
      if (region !== '全部' && flower.region !== region) return false;

      // 月份过滤
      if (month && !flower.bloomMonths.includes(month)) return false;

      // 类别过滤
      if (category && category !== '全部类别' && flower.category !== category) return false;

      // 国家过滤
      if (country && country !== '全部' && flower.country !== country) return false;

      return true;
    });

    this.renderFlowerList();
    this.updateGlobeMarkers();
    this.updateStats();
  }

  // ============================================================
  // 花卉列表
  // ============================================================

  initFlowerList() {
    this.flowerListContainer = document.getElementById('flowers-list');
  }

  renderFlowerList() {
    const container = this.flowerListContainer;
    if (!container) return;

    container.innerHTML = '';

    // 列表标头
    const header = document.createElement('div');
    header.className = 'flowers-list-header';
    header.textContent = `找到 ${this.filteredFlowers.length} 种花卉`;
    container.appendChild(header);

    if (this.filteredFlowers.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state fade-in';
      empty.innerHTML = `
        <div class="emoji">🌿</div>
        <p>没有找到匹配的花卉<br>尝试调整搜索条件</p>
      `;
      container.appendChild(empty);
      return;
    }

    this.filteredFlowers.forEach(flower => {
      const item = document.createElement('div');
      item.className = 'flower-list-item fade-in';
      item.dataset.id = flower.id;
      if (this.selectedFlower?.id === flower.id) {
        item.classList.add('active');
      }

      const colorStyle = `background: ${flower.colorHex || '#FFB7C5'}33; border: 2px solid ${flower.colorHex || '#FFB7C5'}66;`;

      const bloomStr = `${flower.bloomSeason}`;

      item.innerHTML = `
        <div class="flower-emoji-badge" style="${colorStyle}">
          ${flower.emoji || '🌸'}
        </div>
        <div class="flower-list-info">
          <div class="flower-list-name">${flower.name}</div>
          <div class="flower-list-meta">${flower.country} · ${bloomStr}</div>
        </div>
        <div class="bloom-indicator" style="background: ${flower.colorHex || '#FFB7C5'};"></div>
      `;

      item.addEventListener('click', () => {
        this.selectFlower(flower);
      });

      container.appendChild(item);
    });
  }

  // ============================================================
  // 选择花卉
  // ============================================================

  selectFlower(flower, pos) {
    this.selectedFlower = flower;

    // 更新列表选中状态
    document.querySelectorAll('.flower-list-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === flower.id);
    });

    // 将地球仪旋转到该花卉位置
    this.globe.rotateToFlower(flower);
    this.globe.highlightMarker(flower);

    // 计算显示位置
    let detailPos = pos;
    if (!detailPos) {
      // 延迟获取屏幕位置（等旋转完成）
      setTimeout(() => {
        const marker = this.globe.markers.find(m => m.flower.id === flower.id);
        if (marker && this.globe.isVisible(marker.mesh)) {
          const screenPos = this.globe.getScreenPosition(marker.mesh);
          this.showFlowerDetail(flower, screenPos);
        } else {
          this.showFlowerDetailCenter(flower);
        }
      }, 600);
    } else {
      this.showFlowerDetail(flower, pos);
    }
  }

  // ============================================================
  // 详情卡片
  // ============================================================

  // 处理本地图片上传
  handleImageUpload(flowerId, input) {
    const file = input.files && input.files[0];
    if (!file) return;

    // 释放上一次的 objectURL
    const prev = this.uploadedImages.get(flowerId);
    if (prev) URL.revokeObjectURL(prev);

    const url = URL.createObjectURL(file);
    this.uploadedImages.set(flowerId, url);

    // 直接更新当前卡片中的图片，不重新渲染整个卡片
    const imgEl = document.getElementById(`detail-img-${flowerId}`);
    const wrap = document.getElementById(`detail-img-wrap-${flowerId}`);
    const placeholder = document.getElementById(`detail-img-placeholder-${flowerId}`);

    if (imgEl) {
      imgEl.src = url;
      imgEl.style.display = '';
      imgEl.classList.add('loaded');
      if (placeholder) placeholder.style.display = 'none';
    } else if (wrap) {
      // 之前没有 img 元素，插入一个
      const img = document.createElement('img');
      img.className = 'detail-image loaded';
      img.id = `detail-img-${flowerId}`;
      img.referrerPolicy = 'no-referrer';
      img.src = url;
      img.alt = flowerId;
      wrap.insertBefore(img, wrap.firstChild);
      if (placeholder) placeholder.style.display = 'none';
    }

    // 重置 input，允许重复上传同一文件
    input.value = '';
  }

  initDetailCard() {
    this.detailCard = document.getElementById('flower-detail');
    this.detailClose = document.querySelector('.detail-close');

    if (this.detailClose) {
      this.detailClose.addEventListener('click', () => {
        this.hideFlowerDetail();
      });
    }

    // 点击空白处关闭
    document.addEventListener('click', (e) => {
      if (this.detailCard && !this.detailCard.contains(e.target)) {
        const clickedMarker = e.target.closest('[data-flower]');
        if (!clickedMarker && !e.target.closest('.flower-list-item')) {
          // 不在卡片、标记、列表内，可选择关闭
        }
      }
    });
  }

  showFlowerDetail(flower, pos) {
    const card = this.detailCard;
    if (!card) return;

    this.renderDetailCard(flower);

    // 计算卡片位置（确保不超出屏幕）
    const cardW = 340;
    const cardH = 500;
    const padding = 16;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // 侧边面板存在时，调整可用宽度
    const panelWidth = document.getElementById('side-panel')?.classList.contains('collapsed') ? 40 : 320;
    const availW = screenW - panelWidth - padding * 2;

    let x = pos ? pos.x + 20 : availW / 2;
    let y = pos ? pos.y - cardH / 2 : screenH / 2 - cardH / 2;

    // 边界检查
    if (x + cardW > availW) x = pos ? pos.x - cardW - 20 : availW / 2 - cardW / 2;
    if (x < padding) x = padding;
    if (y < 80) y = 80;
    if (y + cardH > screenH - padding) y = screenH - cardH - padding;

    card.style.left = x + 'px';
    card.style.top = y + 'px';
    card.style.right = 'auto';
    card.style.bottom = 'auto';

    // 显示动画
    card.classList.add('visible');
  }

  showFlowerDetailCenter(flower) {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const panelWidth = document.getElementById('side-panel')?.classList.contains('collapsed') ? 40 : 320;

    this.showFlowerDetail(flower, {
      x: (screenW - panelWidth) / 2 - 170,
      y: screenH / 2 - 200
    });
  }

  hideFlowerDetail() {
    if (this.detailCard) {
      this.detailCard.classList.remove('visible');
    }
    this.selectedFlower = null;

    // 清除高亮
    this.globe.markerMeshes.forEach(mesh => {
      mesh.scale.setScalar(1.0);
      if (mesh.userData.ring) {
        mesh.userData.ring.scale.setScalar(1.0);
      }
    });

    // 清除列表选中
    document.querySelectorAll('.flower-list-item').forEach(item => {
      item.classList.remove('active');
    });
  }

  renderDetailCard(flower) {
    const card = this.detailCard;
    if (!card) return;

    // 生成花期条
    const bloomBarHTML = Array.from({ length: 12 }, (_, i) => {
      const isActive = flower.bloomMonths.includes(i + 1);
      return `<div class="bloom-month ${isActive ? 'active' : ''}" title="${MONTHS_CN[i]}"></div>`;
    }).join('');

    // 生成颜色点
    const colorDotsHTML = (flower.flowerColors || []).map(color => {
      const colorMap = {
        '红色': '#E53935', '深红色': '#B71C1C', '粉色': '#E91E63', '深粉色': '#C2185B',
        '白色': '#F5F5F5', '黄色': '#FDD835', '金黄色': '#FFB300', '橙色': '#FF6D00',
        '紫色': '#7B1FA2', '蓝紫色': '#5C6BC0', '蓝色': '#1E88E5', '淡蓝色': '#90CAF9',
        '绿色': '#388E3C', '淡绿色': '#A5D6A7', '棕红色': '#795548', '珊瑚色': '#FF7043',
        '紫红色': '#AD1457'
      };
      const hex = colorMap[color] || '#CCCCCC';
      return `
        <div class="color-dot">
          <div class="color-dot-circle" style="background: ${hex};"></div>
          <span>${color}</span>
        </div>`;
    }).join('');

    // 图片区域（优先级：用户上传 > 本地 flowers/ 图片 > wikiImage）
    const uploadedSrc = this.uploadedImages.get(flower.id);
    const localSrc = this.localImages.get(flower.name);
    const imgSrc = uploadedSrc || localSrc || flower.wikiImage || '';
    const isLocal = !!(uploadedSrc || localSrc);
    const imageHTML = `
      <div class="detail-image-wrap" id="detail-img-wrap-${flower.id}">
        ${imgSrc ? `
          <img class="detail-image${isLocal ? ' loaded' : ''}" 
               id="detail-img-${flower.id}"
               src="${imgSrc}" alt="${flower.name}"
               referrerpolicy="no-referrer"
               onerror="this.style.display='none';document.getElementById('detail-img-placeholder-${flower.id}').style.display='flex'"
               ${!isLocal && flower.wikiImage ? `onload="this.classList.add('loaded')"` : ''} />
          <div class="detail-image-loading" id="detail-img-placeholder-${flower.id}" style="display:none">🌸</div>
        ` : `
          <div class="detail-image-loading" id="detail-img-placeholder-${flower.id}">🌸</div>
        `}
        <div class="detail-image-actions">
          <label class="upload-btn" title="上传本地图片">
            📷 上传图片
            <input type="file" accept="image/*" style="display:none"
              onchange="window._flowerUI.handleImageUpload('${flower.id}', this)">
          </label>
          ${flower.wikiUrl ? `<a class="detail-image-link" href="${flower.wikiUrl}" target="_blank" rel="noopener">🔗 维基百科</a>` : ''}
        </div>
      </div>`;

    card.innerHTML = `
      <div class="detail-header">
        <div class="detail-emoji">${flower.emoji || '🌸'}</div>
        <div class="detail-name">${flower.name}</div>
        <div class="detail-name-en">${flower.nameEn}</div>
        <div class="detail-badges">
          <span class="detail-badge badge-country">📍 ${flower.country}</span>
          <span class="detail-badge badge-season">🗓 ${flower.bloomSeason}</span>
          <span class="detail-badge badge-category">🌿 ${flower.category}</span>
        </div>
        <button class="detail-close" onclick="document.getElementById('flower-detail').classList.remove('visible')">✕</button>
      </div>
      ${imageHTML}
      <div class="detail-body">
        <div class="detail-section">
          <div class="detail-section-title">🌸 花卉简介</div>
          <div class="detail-section-content">${flower.brief}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">📅 花期分布</div>
          <div class="bloom-bar">${bloomBarHTML}</div>
          <div class="bloom-month-label">
            <span>1月</span><span>6月</span><span>12月</span>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">🎨 花朵颜色</div>
          <div class="color-dots">${colorDotsHTML}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">📖 观花指南</div>
          <div class="detail-section-content">${flower.bloomGuide}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">🗺 观赏地点</div>
          <div class="detail-section-content">${flower.viewingTips}</div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // Tooltip 提示
  // ============================================================

  initTooltip() {
    this.tooltip = document.getElementById('tooltip');
  }

  showTooltip(flower, pos) {
    if (!this.tooltip) return;
    this.tooltip.innerHTML = `
      <div class="tooltip-name">${flower.emoji || '🌸'} ${flower.name}</div>
      <div class="tooltip-info">${flower.country} · ${flower.bloomSeason}</div>
    `;
    this.tooltip.style.left = (pos.x + 12) + 'px';
    this.tooltip.style.top = (pos.y - 40) + 'px';
    this.tooltip.classList.add('visible');
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.classList.remove('visible');
  }

  // ============================================================
  // 侧边面板折叠
  // ============================================================

  initSidePanel() {
    const panel = document.getElementById('side-panel');
    const toggle = document.getElementById('panel-toggle');
    const icon = document.getElementById('panel-toggle-icon');

    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        if (icon) {
          icon.textContent = panel.classList.contains('collapsed') ? '◀' : '▶';
        }
      });
    }
  }

  // ============================================================
  // 统计信息
  // ============================================================

  initStatsBar() {
    this.updateStats();
  }

  updateStats() {
    const flowersCount = document.getElementById('stat-flowers');
    const regionsCount = document.getElementById('stat-regions');
    const countriesCount = document.getElementById('stat-countries');

    if (flowersCount) flowersCount.textContent = `🌸 ${this.filteredFlowers.length} 种花卉`;

    if (regionsCount) {
      const regions = new Set(this.filteredFlowers.map(f => f.region));
      regionsCount.textContent = `🌍 ${regions.size} 个大区`;
    }

    if (countriesCount) {
      const countries = new Set(this.filteredFlowers.map(f => f.country));
      countriesCount.textContent = `📍 ${countries.size} 个国家`;
    }
  }

  // ============================================================
  // 底部操作按钮
  // ============================================================

  initBottomActions() {
    const resetBtn = document.getElementById('btn-reset');
    const autoBtn = document.getElementById('btn-auto-rotate');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.globe.resetView();
        this.hideFlowerDetail();
      });
    }

    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        const isAuto = this.globe.autoRotate;
        this.globe.setAutoRotate(!isAuto);
        autoBtn.classList.toggle('active', !isAuto);
        autoBtn.textContent = !isAuto ? '⏸ 暂停旋转' : '▶ 自动旋转';
      });
    }
  }

  // ============================================================
  // 花瓣飘落效果
  // ============================================================

  initPetalEffect() {
    const container = document.getElementById('petals-container');
    if (!container) return;

    // 花瓣颜色调色板（粉/紫/白/浅黄）
    const colors = [
      '#FFB7C5', '#FF87B2', '#FFC1D6', '#EDD9FF',
      '#F8BBD9', '#FFD6E5', '#E1BEE7', '#FFF0F7',
      '#FFECB3', '#F3E5F5', '#FCE4EC', '#FFF9C4',
    ];
    // 三种动画变体
    const animations = ['petalDrift', 'petalDrift2', 'petalDrift3'];

    const createPetal = () => {
      const petal = document.createElement('div');
      petal.className = 'falling-petal';

      const shape = document.createElement('span');
      shape.className = 'petal-shape';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 8 + Math.random() * 14;
      shape.style.background = color;
      shape.style.width = size + 'px';
      shape.style.height = size * (0.6 + Math.random() * 0.5) + 'px';
      petal.appendChild(shape);

      petal.style.left = Math.random() * 100 + 'vw';
      const anim = animations[Math.floor(Math.random() * animations.length)];
      const duration = 8 + Math.random() * 10;
      petal.style.animationName = anim;
      petal.style.animationDuration = duration + 's';
      petal.style.animationDelay = Math.random() * 3 + 's';

      container.appendChild(petal);
      petal.addEventListener('animationend', () => petal.remove());
    };

    // 持续生成花瓣
    setInterval(createPetal, 1800);
    // 初始批量生成
    for (let i = 0; i < 8; i++) {
      setTimeout(createPetal, i * 300);
    }
  }

  // ============================================================
  // 更新地球仪标记
  // ============================================================

  updateGlobeMarkers() {
    this.globe.addMarkers(this.filteredFlowers);
  }

  // ============================================================
  // 地球仪事件回调
  // ============================================================

  onMarkerClick(flower, pos, e) {
    this.selectFlower(flower, pos);
  }

  onMarkerHover(flower, pos) {
    this.showTooltip(flower, pos);
  }

  onMarkerLeave() {
    this.hideTooltip();
  }

  // ============================================================
  // 随机跳转花卉
  // ============================================================

  jumpToRandom() {
    if (this.filteredFlowers.length === 0) return;
    const idx = Math.floor(Math.random() * this.filteredFlowers.length);
    this.selectFlower(this.filteredFlowers[idx]);
  }
}

// ============================================================
// 加载管理
// ============================================================

class LoadingManager {
  constructor() {
    this.loadingEl = document.getElementById('loading');
    this.loadingBar = document.querySelector('.loading-bar');
    this.loadingText = document.querySelector('.loading-text');
    this.progress = 0;
  }

  setProgress(value, text) {
    this.progress = value;
    if (this.loadingBar) {
      this.loadingBar.style.width = value + '%';
    }
    if (text && this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  hide() {
    if (this.loadingEl) {
      this.loadingEl.classList.add('hidden');
    }
  }
}

// ============================================================
// 平面世界地图视图
// ============================================================

class WorldMapView {
  constructor(flowerUI) {
    this.flowerUI = flowerUI;
    this.canvas = document.getElementById('world-map-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.flowers = FLOWERS_DATA;
    this.filteredFlowers = [...this.flowers];
    this.hoveredFlower = null;
    this.mapImage = null;
    this.mapReady = false;

    // 墨卡托投影参数
    this.padding = { top: 10, bottom: 10, left: 10, right: 10 };

    // 缩放与平移状态
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this._isPanning = false;
    this._panStart = { x: 0, y: 0 };

    if (this.canvas) {
      this.resize();
      this.loadMapImage();
      this.setupEvents();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    const container = document.getElementById('map-container');
    if (!container || !this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    // 用逻辑像素作为 canvas 尺寸，避免 DPR 坐标混乱
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    // 仅在像素比>1时通过 CSS 缩放实现清晰度
    this.canvas.style.width = container.clientWidth + 'px';
    this.canvas.style.height = container.clientHeight + 'px';
    // 重置 transform，不累加 scale
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.mapReady) this.render();
  }

  // 加载世界地形底图图像
  loadMapImage() {
    // 使用 NASA Blue Marble 地球纹理作为地形底图
    const terrainSources = [
      'https://unpkg.com/three-globe@2.30.0/example/img/earth-blue-marble.jpg',
      'https://cdn.jsdelivr.net/npm/three-globe@2.30.0/example/img/earth-blue-marble.jpg',
    ];

    const tryLoadImage = (sources, index) => {
      if (index >= sources.length) {
        // 所有图像源失败，用 Canvas 绘制降级
        this.mapReady = true;
        this.render();
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.mapImage = img;
        this.mapReady = true;
        this.render();
      };
      img.onerror = () => tryLoadImage(sources, index + 1);
      img.src = sources[index];
    };

    tryLoadImage(terrainSources, 0);
    this.mapReady = true;
    this.loadGeoJSON();
  }

  loadGeoJSON() {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(data => {
        this.topoData = data;
        this.render();
      })
      .catch(() => {
        // 使用内置简化路径
        this.render();
      });
  }

  // 经纬度 → 画布坐标（等距圆柱投影，含缩放/平移）
  project(lng, lat) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;
    const mapW = w - p.left - p.right;
    const mapH = h - p.top - p.bottom;

    // 基础投影（未缩放）
    const bx = p.left + ((lng + 180) / 360) * mapW;
    const by = p.top + ((90 - lat) / 180) * mapH;

    // 应用缩放（以画布中心为原点）
    const cx = w / 2;
    const cy = h / 2;
    const x = cx + (bx - cx) * this.scale + this.offsetX;
    const y = cy + (by - cy) * this.scale + this.offsetY;
    return { x, y };
  }

  // 画布坐标 → 经纬度（用于鼠标命中检测）
  unproject(mx, my) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;
    const mapW = w - p.left - p.right;
    const mapH = h - p.top - p.bottom;
    const cx = w / 2;
    const cy = h / 2;

    const bx = (mx - cx - this.offsetX) / this.scale + cx;
    const by = (my - cy - this.offsetY) / this.scale + cy;

    const lng = ((bx - p.left) / mapW) * 360 - 180;
    const lat = 90 - ((by - p.top) / mapH) * 180;
    return { lng, lat };
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    // 如果容器尺寸为0（初始隐藏状态），跳过渲染
    if (w === 0 || h === 0) return;

    const p = this.padding;
    const mapW = w - p.left - p.right;
    const mapH = h - p.top - p.bottom;

    // 背景（地图区域外）
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0d1b2a');
    bg.addColorStop(0.5, '#1a2e45');
    bg.addColorStop(1, '#0d1b2a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 绘制地形底图（NASA Blue Marble 图片）
    if (this.mapImage) {
      ctx.save();
      const cx = w / 2, cy = h / 2;
      ctx.translate(cx + this.offsetX, cy + this.offsetY);
      ctx.scale(this.scale, this.scale);
      ctx.translate(-cx, -cy);
      ctx.drawImage(this.mapImage, p.left, p.top, mapW, mapH);
      // 叠加轻微暗色滤镜，让标记和文字更清晰
      ctx.fillStyle = 'rgba(10, 20, 40, 0.2)';
      ctx.fillRect(p.left, p.top, mapW, mapH);
      ctx.restore();
    } else {
      // 图片未加载完成时使用 TopoJSON 或简化地图
      if (this.topoData) {
        this.drawTopoMap(ctx);
      } else {
        this.drawSimpleMap(ctx);
      }
    }

    // 绘制国界线（如果有 TopoJSON 数据）
    if (this.topoData && typeof topojson !== 'undefined') {
      this.drawCountryBorders(ctx);
    }

    // 地图边框
    ctx.strokeStyle = 'rgba(129, 194, 238, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.left, p.top, mapW, mapH);

    // 绘制经纬网格
    this.drawGrid(ctx);

    // 绘制花卉标记
    this.drawFlowerMarkers(ctx);
  }

  // 绘制国家边界线（半透明叠加在地形图上）
  drawCountryBorders(ctx) {
    const p = this.padding;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const mapW = w - p.left - p.right;
    const mapH = h - p.top - p.bottom;

    const objectKey = this.topoData.objects.countries
      ? 'countries'
      : Object.keys(this.topoData.objects)[0];
    const geojson = topojson.feature(this.topoData, this.topoData.objects[objectKey]);

    ctx.save();
    ctx.beginPath();
    ctx.rect(p.left, p.top, mapW, mapH);
    ctx.clip();

    geojson.features.forEach(feature => {
      const geom = feature.geometry;
      if (!geom) return;

      const polygons = geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : [];

      polygons.forEach(polygon => {
        polygon.forEach(ring => {
          if (ring.length < 3) return;
          ctx.beginPath();
          const first = this.project(ring[0][0], ring[0][1]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < ring.length; i++) {
            const pt = this.project(ring[i][0], ring[i][1]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
          ctx.strokeStyle = 'rgba(200, 220, 255, 0.25)';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        });
      });
    });

    ctx.restore();
  }

  drawTopoMap(ctx) {
    if (!this.topoData || typeof topojson === 'undefined') {
      this.drawSimpleMap(ctx);
      return;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;
    const mapW = w - p.left - p.right;
    const mapH = h - p.top - p.bottom;

    // 海洋背景
    const oceanGrad = ctx.createLinearGradient(p.left, p.top, p.left, p.top + mapH);
    oceanGrad.addColorStop(0, '#0a2540');
    oceanGrad.addColorStop(0.5, '#0e3a5f');
    oceanGrad.addColorStop(1, '#071d30');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(p.left, p.top, mapW, mapH);

    // 边框
    ctx.strokeStyle = 'rgba(129, 194, 238, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.left, p.top, mapW, mapH);

    // 解析 TopoJSON 为 GeoJSON
    const objectKey = this.topoData.objects.countries
      ? 'countries'
      : Object.keys(this.topoData.objects)[0];
    const geojson = topojson.feature(this.topoData, this.topoData.objects[objectKey]);

    // 陆地填充色
    const landColors = ['#2d5a27', '#336b2e', '#3a7a35', '#2f6630', '#3d7038'];

    // 裁剪到地图区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.left, p.top, mapW, mapH);
    ctx.clip();

    // 绘制每个国家/地区
    geojson.features.forEach((feature, idx) => {
      const color = landColors[idx % landColors.length];
      const geom = feature.geometry;
      if (!geom) return;

      const polygons = geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : [];

      polygons.forEach(polygon => {
        polygon.forEach(ring => {
          if (ring.length < 3) return;
          ctx.beginPath();
          const first = this.project(ring[0][0], ring[0][1]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < ring.length; i++) {
            const pt = this.project(ring[i][0], ring[i][1]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(100, 180, 100, 0.3)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      });
    });

    ctx.restore();
  }

  drawSimpleMap(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;
    const mapW = w - p.left - p.right;
    const mapH = h - p.top - p.bottom;

    // 海洋
    const oceanGrad = ctx.createLinearGradient(p.left, p.top, p.left, p.top + mapH);
    oceanGrad.addColorStop(0, '#0a2540');
    oceanGrad.addColorStop(0.5, '#0e3a5f');
    oceanGrad.addColorStop(1, '#071d30');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(p.left, p.top, mapW, mapH);

    // 边框
    ctx.strokeStyle = 'rgba(129, 194, 238, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.left, p.top, mapW, mapH);

    // 简化大陆轮廓（等距圆柱投影坐标）
    const continents = [
      // 亚欧大陆（简化）
      { color: '#2d5a27', points: [
        [25, 70],[60, 70],[80, 65],[100, 55],[130, 50],[145, 45],[150, 40],
        [145, 35],[140, 30],[130, 20],[120, 20],[110, 10],[100, 5],[95, 10],
        [80, 10],[70, 15],[60, 20],[50, 25],[40, 35],[35, 40],[30, 45],
        [25, 50],[20, 55],[25, 65],
      ]},
      // 非洲
      { color: '#3a6e34', points: [
        [15, 35],[30, 30],[40, 20],[45, 10],[50, 0],[45, -15],[40, -25],
        [35, -35],[25, -35],[18, -30],[12, -20],[10, -10],[10, 0],[15, 10],
        [10, 20],[15, 30],
      ]},
      // 北美洲
      { color: '#33613a', points: [
        [-170, 70],[-140, 70],[-100, 70],[-80, 70],[-70, 60],[-60, 50],
        [-65, 45],[-75, 40],[-80, 30],[-90, 25],[-105, 20],[-120, 25],
        [-130, 35],[-140, 50],[-155, 60],[-165, 65],
      ]},
      // 南美洲
      { color: '#3a6e34', points: [
        [-80, 10],[-70, 10],[-55, 5],[-50, -5],[-40, -10],[-35, -20],
        [-40, -35],[-50, -50],[-65, -55],[-75, -45],[-80, -30],[-80, -15],
        [-75, 0],
      ]},
      // 澳大利亚
      { color: '#4a7a3e', points: [
        [115, -20],[125, -15],[135, -12],[145, -15],[150, -20],[155, -25],
        [150, -35],[145, -38],[135, -35],[125, -30],[118, -25],
      ]},
      // 欧洲（单独）
      { color: '#2d5a27', points: [
        [-10, 35],[5, 35],[15, 45],[25, 45],[30, 55],[25, 60],[15, 60],
        [5, 55],[-5, 50],[-10, 45],
      ]},
      // 北欧斯堪的纳维亚
      { color: '#2d5a27', points: [
        [5, 57],[15, 57],[25, 65],[30, 70],[20, 72],[10, 65],
      ]},
    ];

    continents.forEach(({ color, points }) => {
      if (points.length < 3) return;
      ctx.beginPath();
      const first = this.project(points[0][0], points[0][1]);
      ctx.moveTo(first.x, first.y);
      points.slice(1).forEach(([lng, lat]) => {
        const pt = this.project(lng, lat);
        ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, p.top, 0, p.top + mapH);
      grad.addColorStop(0, color + 'cc');
      grad.addColorStop(1, color + '88');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 180, 100, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  drawGrid(ctx) {
    const p = this.padding;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.strokeStyle = 'rgba(129, 194, 238, 0.08)';
    ctx.lineWidth = 0.5;

    // 纬线
    for (let lat = -60; lat <= 80; lat += 30) {
      const pt = this.project(0, lat);
      ctx.beginPath();
      ctx.moveTo(p.left, pt.y);
      ctx.lineTo(w - p.right, pt.y);
      ctx.stroke();
      // 标注赤道
      if (lat === 0) {
        ctx.strokeStyle = 'rgba(129, 194, 238, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.left, pt.y);
        ctx.lineTo(w - p.right, pt.y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(129, 194, 238, 0.08)';
        ctx.lineWidth = 0.5;
      }
    }

    // 经线
    for (let lng = -150; lng <= 180; lng += 30) {
      const pt = this.project(lng, 0);
      ctx.beginPath();
      ctx.moveTo(pt.x, p.top);
      ctx.lineTo(pt.x, h - p.bottom);
      ctx.stroke();
    }
  }

  drawFlowerMarkers(ctx) {
    const flowers = this.filteredFlowers;
    const iconSize = Math.max(14, Math.min(28, 18 * this.scale));
    const hitRadius = Math.max(10, 14 * this.scale);

    flowers.forEach(flower => {
      const { lat, lng } = flower.location;
      const pt = this.project(lng, lat);
      const isHovered = this.hoveredFlower?.id === flower.id;
      const size = isHovered ? iconSize * 1.4 : iconSize;

      ctx.save();
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // hover 时加白色阴影高亮
      if (isHovered) {
        ctx.shadowColor = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = 8;
      }
      ctx.fillText(flower.emoji || '🌸', pt.x, pt.y);
      ctx.restore();

      // 记录碰撞半径（供 findFlowerAtPoint 使用）
      flower._lastPtX = pt.x;
      flower._lastPtY = pt.y;
      flower._hitR = hitRadius;

      // hover 显示名称标签
      if (isHovered) {
        const label = flower.name;
        ctx.font = `bold ${Math.max(11, 12 * this.scale)}px "Nunito", sans-serif`;
        const tw = ctx.measureText(label).width;
        const lx = pt.x + size * 0.7;
        const ly = pt.y - size * 0.4;
        const pad = 5, rh = 18, rr = 5;

        ctx.save();
        ctx.fillStyle = 'rgba(20, 8, 40, 0.88)';
        ctx.beginPath();
        ctx.moveTo(lx - pad + rr, ly - rh / 2);
        ctx.lineTo(lx + tw + pad - rr, ly - rh / 2);
        ctx.quadraticCurveTo(lx + tw + pad, ly - rh / 2, lx + tw + pad, ly - rh / 2 + rr);
        ctx.lineTo(lx + tw + pad, ly + rh / 2 - rr);
        ctx.quadraticCurveTo(lx + tw + pad, ly + rh / 2, lx + tw + pad - rr, ly + rh / 2);
        ctx.lineTo(lx - pad + rr, ly + rh / 2);
        ctx.quadraticCurveTo(lx - pad, ly + rh / 2, lx - pad, ly + rh / 2 - rr);
        ctx.lineTo(lx - pad, ly - rh / 2 + rr);
        ctx.quadraticCurveTo(lx - pad, ly - rh / 2, lx - pad + rr, ly - rh / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFD6E5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
        ctx.restore();
      }
    });
  }

  drawTitle(ctx) {
    const w = this.canvas.width;
    ctx.font = 'bold 14px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 214, 229, 0.7)';
    ctx.fillText('🌸 全球名花分布图  |  点击标记查看详情', w / 2, this.padding.top - 20);
  }

  setupEvents() {
    // 滚轮缩放（以鼠标位置为中心）
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;

      const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.max(1, Math.min(12, this.scale * delta));
      const ratio = newScale / this.scale;

      // 保持鼠标指向的地图点不变
      this.offsetX = mx - cx - (mx - cx - this.offsetX) * ratio;
      this.offsetY = my - cy - (my - cy - this.offsetY) * ratio;
      this.scale = newScale;

      this._clampOffset();
      this.render();
    }, { passive: false });

    // 拖拽平移
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this._isPanning = true;
      this._panStart = { x: e.clientX, y: e.clientY };
      this._panOffsetStart = { x: this.offsetX, y: this.offsetY };
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this._isPanning) {
        const dx = e.clientX - this._panStart.x;
        const dy = e.clientY - this._panStart.y;
        this.offsetX = this._panOffsetStart.x + dx;
        this.offsetY = this._panOffsetStart.y + dy;
        this._clampOffset();
        this.render();
        return;
      }
      // Hover 检测（非拖拽时）
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.handleMouseMove(mx, my, e);
    });

    window.addEventListener('mouseup', () => {
      if (this._isPanning) {
        this._isPanning = false;
        this.canvas.style.cursor = 'crosshair';
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (Math.abs(e.clientX - this._panStart?.x) > 4 || Math.abs(e.clientY - this._panStart?.y) > 4) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.handleClick(mx, my, e);
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (!this._isPanning) {
        this.hoveredFlower = null;
        this.render();
        this.flowerUI.hideTooltip();
      }
    });

    // 触摸缩放（双指捏合）
    let lastTouchDist = 0;
    let lastTouchMid = { x: 0, y: 0 };
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        lastTouchMid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        const mid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        const rect = this.canvas.getBoundingClientRect();
        const mx = (mid.x - rect.left) * (this.canvas.width / rect.width);
        const my = (mid.y - rect.top) * (this.canvas.height / rect.height);
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        const delta = dist / lastTouchDist;
        const newScale = Math.max(1, Math.min(12, this.scale * delta));
        const ratio = newScale / this.scale;
        this.offsetX = mx - cx - (mx - cx - this.offsetX) * ratio;
        this.offsetY = my - cy - (my - cy - this.offsetY) * ratio;
        this.scale = newScale;
        this._clampOffset();
        this.render();

        lastTouchDist = dist;
        lastTouchMid = mid;
      }
    }, { passive: false });
  }

  // 限制平移范围，防止拖出边界
  _clampOffset() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const maxX = (this.scale - 1) * w / 2;
    const maxY = (this.scale - 1) * h / 2;
    this.offsetX = Math.max(-maxX, Math.min(maxX, this.offsetX));
    this.offsetY = Math.max(-maxY, Math.min(maxY, this.offsetY));
  }

  findFlowerAtPoint(mx, my) {
    let closest = null;
    let minDist = Infinity;
    const baseRadius = Math.max(12, 16 * this.scale);
    this.filteredFlowers.forEach(flower => {
      const pt = this.project(flower.location.lng, flower.location.lat);
      const d = Math.hypot(pt.x - mx, pt.y - my);
      if (d < baseRadius && d < minDist) { minDist = d; closest = flower; }
    });
    return closest;
  }

  handleMouseMove(mx, my, e) {
    const flower = this.findFlowerAtPoint(mx, my);
    const prev = this.hoveredFlower;
    this.hoveredFlower = flower;

    if (flower) {
      this.canvas.style.cursor = 'pointer';
      this.flowerUI.showTooltip(flower, { x: e.clientX, y: e.clientY });
    } else {
      this.canvas.style.cursor = 'crosshair';
      this.flowerUI.hideTooltip();
    }

    if (flower?.id !== prev?.id) this.render();
  }

  handleClick(mx, my, e) {
    const flower = this.findFlowerAtPoint(mx, my);
    if (flower) {
      this.flowerUI.showFlowerDetailCenter(flower);
      this.flowerUI.selectedFlower = flower;
      document.querySelectorAll('.flower-list-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === flower.id);
      });
    }
  }

  updateFlowers(flowers) {
    this.filteredFlowers = flowers;
    this.render();
  }
}

