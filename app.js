const finalMatrix = typeof databaseMatrix !== 'undefined' ? databaseMatrix : {};
const monthsNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// DOM Element Selectors
const yearSlider = document.getElementById('yearSlider');
const monthSlider = document.getElementById('monthSlider');
const categorySlider = document.getElementById('categorySlider');
const yearDisplay = document.getElementById('yearDisplay');
const monthDisplay = document.getElementById('monthDisplay');
const categoryDisplay = document.getElementById('categoryDisplay');
const contentYear = document.getElementById('contentYear');
const contentMonth = document.getElementById('contentMonth');
const contentCategory = document.getElementById('contentCategory');
const labelsContainer = document.getElementById('categoryLabelsList');
const outputBox = document.getElementById('outputBox');
const carouselTrack = document.getElementById('carouselTrack');
const carouselContainer = document.querySelector('.carousel-container');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselStatus = document.getElementById('carouselStatus');
const prevCategoryBtn = document.getElementById('prevCategoryBtn');
const nextCategoryBtn = document.getElementById('nextCategoryBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const pageBody = document.body;

let availableMonthsForYear = []; 
let currentCategoriesList = [];
let currentMediaFiles = [];
let carouselIndex = 0;

function initYearBounds() {
  const years = Object.keys(finalMatrix).map(Number).sort((a, b) => a - b);
  if (years.length > 0) {
    yearSlider.min = years[0];
    yearSlider.max = years[years.length - 1];
    yearSlider.value = years[0];
    yearSlider.disabled = false;
  } else {
    yearSlider.disabled = true;
  }
}

function handleYearChange() {
  const selectedYear = yearSlider.value;
  yearDisplay.textContent = selectedYear;
  availableMonthsForYear = finalMatrix[selectedYear] ? Object.keys(finalMatrix[selectedYear]).map(Number).sort((a, b) => a - b) : [];

  if (availableMonthsForYear.length === 0) {
    monthSlider.min = 0; monthSlider.max = 0; monthSlider.value = 0; monthSlider.disabled = true;
    monthDisplay.textContent = "No Data";
    monthDisplay.classList.add('empty');
    rebuildCategorySlider([]);
    renderSelections();
    return;
  }

  monthSlider.disabled = false;
  monthDisplay.classList.remove('empty');
  monthSlider.min = 0;
  monthSlider.max = availableMonthsForYear.length - 1;
  monthSlider.value = 0; 
  handleMonthChange();
}

function handleMonthChange() {
  const selectedYear = yearSlider.value;
  const targetMonthIndexInArray = parseInt(monthSlider.value) || 0;
  const actualMonthNum = availableMonthsForYear[targetMonthIndexInArray];
  if (!actualMonthNum) return;

  monthDisplay.textContent = monthsNames[actualMonthNum - 1];
  const foundCategories = Object.keys(finalMatrix[selectedYear][actualMonthNum] || {});
  rebuildCategorySlider(foundCategories);
  renderSelections();
}

function rebuildCategorySlider(categories) {
  labelsContainer.innerHTML = '';
  currentCategoriesList = categories;
  
  if (categories.length === 0) {
    categorySlider.max = 0; categorySlider.value = 0; categorySlider.disabled = true;
    labelsContainer.innerHTML = '<span class="category-item no-data">No categories found</span>';
    return;
  }

  const maxIndex = categories.length - 1;
  categorySlider.max = maxIndex;
  categorySlider.disabled = maxIndex <= 0;
  categorySlider.value = 0; 

  for (let i = 0; i <= maxIndex; i++) {
    const span = document.createElement('span');
    span.className = 'category-item';
    span.setAttribute('data-index', i);
    span.textContent = categories[i];
    span.addEventListener('click', () => {
      if (!categorySlider.disabled) { categorySlider.value = i; renderSelections(); }
    });
    labelsContainer.appendChild(span);
  }
}

// Fullscreen zoom functionality
let fullscreenZoomState = {
  element: null,
  scale: 1,
  minScale: 1,
  maxScale: 5,
  panX: 0,
  panY: 0
};

function handleFullscreenWheel(event) {
  if (!fullscreenZoomState.element) return;

  // Prevent page/browser default zooming
  try { event.preventDefault(); } catch (e) {}

  // Normalize delta to pixels
  let delta = event.deltaY;
  if (event.deltaMode === 1) delta *= 16; // DOM_DELTA_LINE ~ 16px
  else if (event.deltaMode === 2) delta *= 120; // DOM_DELTA_PAGE ~ 120px

  // Support pinch-to-zoom (often comes as ctrlKey + wheel)
  const isPinch = !!event.ctrlKey;

  // Sensitivity: make pinch less aggressive
  const baseSpeed = isPinch ? 0.02 : 0.1;

  // Negative deltaY = scroll up = zoom in
  const change = -delta / 120 * baseSpeed;

  const newScale = Math.min(Math.max(fullscreenZoomState.scale + change, fullscreenZoomState.minScale), fullscreenZoomState.maxScale);
  fullscreenZoomState.scale = newScale;

  if (fullscreenZoomState.scale === 1) {
    fullscreenZoomState.panX = 0;
    fullscreenZoomState.panY = 0;
  }

  updateFullscreenZoom();
}

function handleFullscreenZoomKeys(event) {
  if (!fullscreenZoomState.element) return;
  
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    fullscreenZoomState.scale = Math.min(fullscreenZoomState.scale + 0.2, fullscreenZoomState.maxScale);
    updateFullscreenZoom();
  } else if (event.key === '-') {
    event.preventDefault();
    fullscreenZoomState.scale = Math.max(fullscreenZoomState.scale - 0.2, fullscreenZoomState.minScale);
    if (fullscreenZoomState.scale === 1) {
      fullscreenZoomState.panX = 0;
      fullscreenZoomState.panY = 0;
    }
    updateFullscreenZoom();
  } else if (event.key === '0') {
    // Reset zoom
    event.preventDefault();
    fullscreenZoomState.scale = 1;
    fullscreenZoomState.panX = 0;
    fullscreenZoomState.panY = 0;
    updateFullscreenZoom();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    if (prevBtn) prevBtn.click();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    if (nextBtn) nextBtn.click();
  } else if (event.key === 'Escape') {
    // Exit fullscreen on Escape
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
}

function handleFullscreenPan(event) {
  if (!fullscreenZoomState.element || fullscreenZoomState.scale <= 1.2) return;
  
  // Only pan when middle mouse button is held or when significantly zoomed
  if (event.buttons !== 4 && fullscreenZoomState.scale <= 1.5) return;
  
  if (fullscreenZoomState.lastX && fullscreenZoomState.lastY) {
    const deltaX = event.clientX - fullscreenZoomState.lastX;
    const deltaY = event.clientY - fullscreenZoomState.lastY;
    
    fullscreenZoomState.panX += deltaX * 2;
    fullscreenZoomState.panY += deltaY * 2;
    
    updateFullscreenZoom();
  }
  
  fullscreenZoomState.lastX = event.clientX;
  fullscreenZoomState.lastY = event.clientY;
}

function updateFullscreenZoom() {
  if (!fullscreenZoomState.element) return;
  
  const scaleValue = fullscreenZoomState.scale.toFixed(1);
  fullscreenZoomState.element.setAttribute('data-zoom-level', scaleValue + 'x');
  
  const transform = `scale(${fullscreenZoomState.scale}) translate(${fullscreenZoomState.panX}px, ${fullscreenZoomState.panY}px)`;
  fullscreenZoomState.element.style.transform = transform;
  fullscreenZoomState.element.style.transformOrigin = 'center center';
  fullscreenZoomState.element.style.cursor = fullscreenZoomState.scale > 1 ? 'grab' : 'zoom-in';
}

function extractDayFromPath(path) {
  const match = String(path).match(/\d{4}-\d{2}-(\d{2})(?:--(\d{2}))?(?:-\[(\d+)\])?_/);
  if (!match) return null;
  const startDay = parseInt(match[1], 10);
  const endDay = match[2] ? parseInt(match[2], 10) : null;
  const eventNum = match[3] ? parseInt(match[3], 10) : null;
  
  if (endDay) return `${startDay}–${endDay}`;
  if (eventNum) return `${startDay} (${eventNum})`;
  return startDay;
}

function renderSelections() {
  const selectedYear = yearSlider.value;
  const targetMonthIndexInArray = parseInt(monthSlider.value) || 0;
  const actualMonthNum = availableMonthsForYear[targetMonthIndexInArray];
  const selectedMonthName = actualMonthNum ? monthsNames[actualMonthNum - 1] : "None";
  const hasCategories = currentCategoriesList.length > 0;
  const categoryIndex = hasCategories ? (parseInt(categorySlider.value) || 0) : null;
  const selectedCategory = categoryIndex !== null ? currentCategoriesList[categoryIndex] : "None";

  categoryDisplay.textContent = selectedCategory;
  
  if (!hasCategories) {
    categoryDisplay.classList.add('empty'); contentCategory.classList.add('empty'); outputBox.classList.add('empty');
    currentMediaFiles = [];
  } else {
    categoryDisplay.classList.remove('empty'); contentCategory.classList.remove('empty'); outputBox.classList.remove('empty');
    currentMediaFiles = finalMatrix[selectedYear][actualMonthNum][selectedCategory] || [];
  }

  const selectedDay = currentMediaFiles.length > 0 ? extractDayFromPath(currentMediaFiles[0]) : null;
  const displayMonth = selectedDay && actualMonthNum ? `${selectedDay} ${selectedMonthName}` : selectedMonthName;

  monthDisplay.textContent = displayMonth;
  contentYear.textContent = selectedYear; contentMonth.textContent = displayMonth; contentCategory.textContent = selectedCategory;

  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.toggle('active', categoryIndex !== null && item.getAttribute('data-index') == categoryIndex);
  });
  setupCarousel();
}

function setupCarousel() {
  if (!carouselTrack) return;

  // Pause and clean up any existing videos before removing nodes
  const prevVideos = carouselTrack.querySelectorAll('video');
  prevVideos.forEach(v => {
    try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {}
  });

  carouselTrack.innerHTML = '';
  carouselIndex = 0;

  if (!currentMediaFiles || currentMediaFiles.length === 0) {
    carouselTrack.innerHTML = '<span class="no-media-msg">No media files inside folder</span>';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (carouselStatus) carouselStatus.textContent = '0 / 0';
    return;
  }

  if (prevBtn) prevBtn.style.display = 'flex';
  if (nextBtn) nextBtn.style.display = 'flex';
  currentMediaFiles.forEach((src, idx) => {
    const isVideo = String(src).toLowerCase().endsWith('.mp4');
    const element = document.createElement(isVideo ? 'video' : 'img');
    if (isVideo) {
      element.controls = true;
      element.preload = 'metadata';
      element.setAttribute('playsinline', '');
      element.src = src;
    } else {
      element.src = src;
      element.alt = `Media ${idx + 1}`;
      element.loading = 'lazy';
      element.title = 'Click image for fullscreen';
      element.style.cursor = 'zoom-in';
      element.addEventListener('click', async () => {
        const fullscreenTarget = carouselContainer || element;
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else if (fullscreenTarget.requestFullscreen) {
            await fullscreenTarget.requestFullscreen();
          } else if (fullscreenTarget.webkitRequestFullscreen) {
            await fullscreenTarget.webkitRequestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen toggle failed', err);
        }
      });

    }
    element.className = 'carousel-item-media';
    element.classList.toggle('active', idx === 0);
    carouselTrack.appendChild(element);
  });
  updateCarouselUI();
}

function updateCarouselUI() {
  if (!carouselTrack) return;
  const items = carouselTrack.querySelectorAll('.carousel-item-media');
  if (!items || items.length === 0) {
    if (carouselStatus) carouselStatus.textContent = '0 / 0';
    return;
  }
  items.forEach((item, idx) => {
    const active = idx === carouselIndex;
    item.classList.toggle('active', active);
    if (item.tagName === 'VIDEO') {
      try {
        active ? item.play().catch(() => {}) : item.pause();
      } catch (e) {}
    }
  });
  if (document.fullscreenElement) {
    maintainFullscreenCarousel();
  }
  if (carouselStatus) carouselStatus.textContent = `${carouselIndex + 1} / ${currentMediaFiles.length}`;
}

function maintainFullscreenCarousel() {
  if (!carouselTrack) return;
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
  if (!fullscreenElement) return;

  const items = carouselTrack.querySelectorAll('.carousel-item-media');
  const current = items && items[carouselIndex];
  if (!current) return;

  if (fullscreenElement.classList.contains('carousel-container')) {
    if (current !== fullscreenZoomState.element) {
      if (fullscreenZoomState.element) {
        fullscreenZoomState.element.classList.remove('fullscreen-zoomed');
        fullscreenZoomState.element.style.transform = 'none';
        fullscreenZoomState.element.removeAttribute('data-zoom-level');
      }
      fullscreenZoomState.element = current;
      current.classList.add('fullscreen-zoomed');
      current.setAttribute('data-zoom-level', `${fullscreenZoomState.scale.toFixed(1)}x`);
      updateFullscreenZoom();
    }
    return;
  }

  if (current === fullscreenElement) return;

  try {
    if (current.requestFullscreen) {
      current.requestFullscreen().catch(() => {});
    } else if (current.webkitRequestFullscreen) {
      current.webkitRequestFullscreen();
    }
  } catch (e) {
    // ignore fullscreen switch failures
  }
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (!currentMediaFiles || currentMediaFiles.length === 0) return;
    carouselIndex = (carouselIndex === 0) ? currentMediaFiles.length - 1 : carouselIndex - 1;
    updateCarouselUI();
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (!currentMediaFiles || currentMediaFiles.length === 0) return;
    carouselIndex = (carouselIndex === currentMediaFiles.length - 1) ? 0 : carouselIndex + 1;
    updateCarouselUI();
  });
}

function navigateCategory(direction) {
  if (!categorySlider || currentCategoriesList.length === 0) return;
  const currentCategoryIndex = parseInt(categorySlider.value) || 0;
  const maxCategoryIndex = parseInt(categorySlider.max) || 0;

  if (direction === 'next') {
    if (currentCategoryIndex < maxCategoryIndex) {
      categorySlider.value = currentCategoryIndex + 1;
      renderSelections();
      return;
    }

    const currentMonthIndex = parseInt(monthSlider.value) || 0;
    const maxMonthIndex = parseInt(monthSlider.max) || 0;
    const currentYear = parseInt(yearSlider.value);
    const minYear = parseInt(yearSlider.min);
    const maxYear = parseInt(yearSlider.max);

    if (currentMonthIndex < maxMonthIndex) {
      monthSlider.value = currentMonthIndex + 1;
      handleMonthChange();
      return;
    }

    if (currentYear < maxYear) {
      yearSlider.value = currentYear + 1;
      handleYearChange();
      return;
    }

    yearSlider.value = minYear;
    handleYearChange();
    return;
  }

  if (direction === 'prev') {
    if (currentCategoryIndex > 0) {
      categorySlider.value = currentCategoryIndex - 1;
      renderSelections();
      return;
    }

    const currentMonthIndex = parseInt(monthSlider.value) || 0;
    const currentYear = parseInt(yearSlider.value);
    const minYear = parseInt(yearSlider.min);
    const maxYear = parseInt(yearSlider.max);

    if (currentMonthIndex > 0) {
      monthSlider.value = currentMonthIndex - 1;
      handleMonthChange();
      categorySlider.value = parseInt(categorySlider.max) || 0;
      renderSelections();
      return;
    }

    if (currentYear > minYear) {
      yearSlider.value = currentYear - 1;
      handleYearChange();
      monthSlider.value = parseInt(monthSlider.max) || 0;
      handleMonthChange();
      categorySlider.value = parseInt(categorySlider.max) || 0;
      renderSelections();
      return;
    }

    yearSlider.value = maxYear;
    handleYearChange();
    monthSlider.value = parseInt(monthSlider.max) || 0;
    handleMonthChange();
    categorySlider.value = parseInt(categorySlider.max) || 0;
    renderSelections();
  }
}

if (prevCategoryBtn) {
  prevCategoryBtn.addEventListener('click', () => navigateCategory('prev'));
}

if (nextCategoryBtn) {
  nextCategoryBtn.addEventListener('click', () => navigateCategory('next'));
}

yearSlider.addEventListener('input', handleYearChange);
monthSlider.addEventListener('input', handleMonthChange);
categorySlider.addEventListener('input', renderSelections);

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    pageBody.classList.toggle('sidebar-collapsed');
    const isCollapsed = pageBody.classList.contains('sidebar-collapsed');
    sidebarToggle.setAttribute('aria-label', isCollapsed ? 'Open menu' : 'Close menu');
    sidebarToggle.textContent = isCollapsed ? '☰' : '×';
  });
}

initYearBounds();
handleYearChange();

// Accessibility enhancements and keyboard navigation
if (carouselTrack && !carouselTrack.hasAttribute('tabindex')) {
  carouselTrack.setAttribute('tabindex', '0');
}
if (prevBtn) prevBtn.setAttribute('aria-label', 'Previous item');
if (nextBtn) nextBtn.setAttribute('aria-label', 'Next item');

function __handleCarouselKey(e) {
  const key = e.key || e.code;
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

  if (key === 'ArrowLeft' || key === 'ArrowLeft') {
    if (prevBtn) prevBtn.click();
  } else if (key === 'ArrowRight' || key === 'ArrowRight') {
    if (nextBtn) nextBtn.click();
  } else if (key === ' ' || key === 'Space' || key === 'Spacebar') {
    // Toggle play/pause for the currently active carousel item if it's a video
    try {
      e.preventDefault();
      if (!carouselTrack) return;
      const items = carouselTrack.querySelectorAll('.carousel-item-media');
      const current = items && items[carouselIndex];
      if (current && current.tagName === 'VIDEO') {
        if (current.paused) current.play().catch(() => {});
        else current.pause();
      }
    } catch (err) {}
  } else if (key === 'Home' || key === 'Home') {
    if (currentMediaFiles && currentMediaFiles.length > 0) { carouselIndex = 0; updateCarouselUI(); }
  } else if (key === 'End' || key === 'End') {
    if (currentMediaFiles && currentMediaFiles.length > 0) { carouselIndex = currentMediaFiles.length - 1; updateCarouselUI(); }
  }
}

document.addEventListener('keydown', __handleCarouselKey);
window.__carouselKeyboardInstalled = true;

// Listen for fullscreen changes on the document
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
  
  // Check if the carousel container or image is in fullscreen
  if (fullscreenElement && (fullscreenElement.classList.contains('carousel-item-media') || fullscreenElement.classList.contains('carousel-container'))) {
    // Entering fullscreen
    const target = fullscreenElement.classList.contains('carousel-container')
      ? fullscreenElement.querySelector('.carousel-item-media.active')
      : fullscreenElement;
    if (!target) return;
    fullscreenZoomState.element = target;
    fullscreenZoomState.scale = 1;
    fullscreenZoomState.panX = 0;
    fullscreenZoomState.panY = 0;
    
    target.classList.add('fullscreen-zoomed');
    target.setAttribute('data-zoom-level', '1x');
    target.style.transform = 'none';
    
    // Use capture phase (true) to intercept wheel events before browser default behavior
    document.addEventListener('wheel', handleFullscreenWheel, { passive: false, capture: true });
    document.addEventListener('keydown', handleFullscreenZoomKeys, { capture: true });
    document.addEventListener('mousemove', handleFullscreenPan, { capture: true });
    
    window.addEventListener('wheel', handleFullscreenWheel, { passive: false, capture: true });
    window.addEventListener('keydown', handleFullscreenZoomKeys, { capture: true });
    
    // Also add to the fullscreen element for better coverage using both capture and bubble phases
    target.addEventListener('wheel', handleFullscreenWheel, { passive: false, capture: true });
    target.addEventListener('wheel', handleFullscreenWheel, { passive: false, capture: false });
    target.addEventListener('keydown', handleFullscreenZoomKeys, { capture: true });
    target.addEventListener('keydown', handleFullscreenZoomKeys, { capture: false });
    target.addEventListener('mousemove', handleFullscreenPan, { capture: true });
    target.addEventListener('mousemove', handleFullscreenPan, { capture: false });
  } else {
    // Exiting fullscreen - clean up
    if (fullscreenZoomState.element) {
      const target = fullscreenZoomState.element;
      target.classList.remove('fullscreen-zoomed');
      target.style.transform = 'none';
      target.removeAttribute('data-zoom-level');
      
      document.removeEventListener('wheel', handleFullscreenWheel, { capture: true });
      document.removeEventListener('wheel', handleFullscreenWheel, { capture: false });
      document.removeEventListener('keydown', handleFullscreenZoomKeys, { capture: true });
      document.removeEventListener('keydown', handleFullscreenZoomKeys, { capture: false });
      document.removeEventListener('mousemove', handleFullscreenPan, { capture: true });
      document.removeEventListener('mousemove', handleFullscreenPan, { capture: false });
      
      window.removeEventListener('wheel', handleFullscreenWheel, { capture: true });
      window.removeEventListener('wheel', handleFullscreenWheel, { capture: false });
      window.removeEventListener('keydown', handleFullscreenZoomKeys, { capture: true });
      window.removeEventListener('keydown', handleFullscreenZoomKeys, { capture: false });
      
      if (fullscreenElement && fullscreenElement.classList.contains('carousel-container')) {
        const activeItem = fullscreenElement.querySelector('.carousel-item-media.active');
        if (activeItem) {
          activeItem.classList.remove('fullscreen-zoomed');
          activeItem.style.transform = 'none';
          activeItem.removeAttribute('data-zoom-level');
        }
      }
      
      target.removeEventListener('wheel', handleFullscreenWheel, { capture: true });
      target.removeEventListener('wheel', handleFullscreenWheel, { capture: false });
      target.removeEventListener('keydown', handleFullscreenZoomKeys, { capture: true });
      target.removeEventListener('keydown', handleFullscreenZoomKeys, { capture: false });
      target.removeEventListener('mousemove', handleFullscreenPan, { capture: true });
      target.removeEventListener('mousemove', handleFullscreenPan, { capture: false });
      
      fullscreenZoomState.element = null;
      fullscreenZoomState.scale = 1;
      fullscreenZoomState.panX = 0;
      fullscreenZoomState.panY = 0;
    }
  }
}
