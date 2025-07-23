let allCourses = [];
let filteredCourses = [];
let currentFilter = 'all';
let currentSort = 'newest';

// DOM Elements
const coursesGrid = document.getElementById('courses-grid');
const loadingElement = document.getElementById('loading');
const noResultsElement = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterButtons = document.querySelectorAll('.filter-btn');

// Load courses from Firestore
async function loadCourses() {
  try {
    loadingElement.classList.remove('hidden');
    coursesGrid.classList.add('hidden');
    
    const snapshot = await db.collection('courses').get();
    allCourses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    filteredCourses = [...allCourses];
    applyFiltersAndSort();
    displayCourses();
    
    loadingElement.classList.add('hidden');
    coursesGrid.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading courses:', error);
    loadingElement.innerHTML = '<p class="text-red-600">Error loading courses. Please refresh the page.</p>';
  }
}

// Display courses
function displayCourses() {
  if (filteredCourses.length === 0) {
    coursesGrid.classList.add('hidden');
    noResultsElement.classList.remove('hidden');
    return;
  }
  
  noResultsElement.classList.add('hidden');
  coursesGrid.classList.remove('hidden');
  
  coursesGrid.innerHTML = filteredCourses.map(course => createCourseCard(course)).join('');
}

// Create course card HTML
function createCourseCard(course) {
  const priceHTML = course.price === 0 
    ? '<span class="text-green-600 font-bold text-lg">Free</span>'
    : `<span class="text-blue-600 font-bold text-lg">$${course.price}</span>`;
    
  const ratingHTML = generateStarRating(course.rating);
  
  return `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 course-card">
      <div class="relative">
        <img src="${course.image}" alt="${course.title}" class="w-full h-48 object-cover">
        <div class="absolute top-4 right-4">
          ${course.price === 0 ? '<span class="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">FREE</span>' : '<span class="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">PREMIUM</span>'}
        </div>
      </div>
      
      <div class="p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500">${course.category}</span>
          <span class="text-sm text-gray-500">${course.level}</span>
        </div>
        
        <h3 class="text-xl font-bold mb-2 text-gray-900 line-clamp-2">${course.title}</h3>
        <p class="text-gray-600 mb-4 line-clamp-3">${course.description}</p>
        
        <div class="flex items-center mb-4">
          <div class="flex text-yellow-400 mr-2">${ratingHTML}</div>
          <span class="text-sm text-gray-600">${course.rating} (${course.reviews} reviews)</span>
        </div>
        
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center text-sm text-gray-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            ${course.instructor}
          </div>
          <div class="flex items-center text-sm text-gray-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${course.duration}
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          ${priceHTML}
          <a href="course-details.html?id=${course.id}" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Learn More
          </a>
        </div>
        
        <div class="mt-3 text-xs text-gray-500 flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          ${course.students.toLocaleString()} students
        </div>
      </div>
    </div>
  `;
}

// Generate star rating HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHTML = '';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
  }
  
  // Half star
  if (hasHalfStar) {
    starsHTML += '<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<svg class="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
  }
  
  return starsHTML;
}

// Apply filters and sorting
function applyFiltersAndSort() {
  // Apply filters
  filteredCourses = allCourses.filter(course => {
    // Price filter
    if (currentFilter === 'free' && course.price !== 0) return false;
    if (currentFilter === 'paid' && course.price === 0) return false;
    
    // Search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      return course.title.toLowerCase().includes(searchTerm) ||
             course.instructor.toLowerCase().includes(searchTerm) ||
             course.category.toLowerCase().includes(searchTerm) ||
             course.description.toLowerCase().includes(searchTerm);
    }
    
    return true;
  });
  
  // Apply sorting
  switch (currentSort) {
    case 'newest':
      filteredCourses.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      break;
    case 'popular':
      filteredCourses.sort((a, b) => b.students - a.students);
      break;
    case 'rating':
      filteredCourses.sort((a, b) => b.rating - a.rating);
      break;
    case 'price-low':
      filteredCourses.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredCourses.sort((a, b) => b.price - a.price);
      break;
  }
}

// Event listeners
searchInput.addEventListener('input', function() {
  applyFiltersAndSort();
  displayCourses();
});

sortSelect.addEventListener('change', function() {
  currentSort = this.value;
  applyFiltersAndSort();
  displayCourses();
});

filterButtons.forEach(button => {
  button.addEventListener('click', function() {
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active', 'bg-blue-600', 'text-white'));
    filterButtons.forEach(btn => btn.classList.add('border-gray-300', 'hover:bg-gray-50'));
    
    this.classList.add('active', 'bg-blue-600', 'text-white');
    this.classList.remove('border-gray-300', 'hover:bg-gray-50');
    
    // Update filter
    currentFilter = this.id.replace('filter-', '');
    applyFiltersAndSort();
    displayCourses();
  });
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadCourses();
});