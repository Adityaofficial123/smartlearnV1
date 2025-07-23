// Global variables
let currentUser = null;

// Navbar scroll effect
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('bg-white/95', 'backdrop-blur-sm');
    } else {
      navbar.classList.remove('bg-white/95', 'backdrop-blur-sm');
    }
  }
});

// Authentication UI
function updateAuthUI(user) {
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  
  if (user) {
    authButtons.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userName.textContent = user.displayName || user.email;
    currentUser = user;
  } else {
    authButtons.classList.remove('hidden');
    userInfo.classList.add('hidden');
    currentUser = null;
  }
}

// Show login modal
function showLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
}

// Hide login modal
function hideLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
}

// Google login
async function signInWithGoogle() {
  try {
    const result = await firebase.auth().signInWithPopup(googleProvider);
    console.log('User signed in:', result.user);
    hideLoginModal();
  } catch (error) {
    console.error('Error signing in:', error);
    alert('Error signing in with Google. Please try again.');
  }
}

// Logout
async function signOut() {
  try {
    await firebase.auth().signOut();
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Login button in navigation
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', showLoginModal);
  }
  
  // Google login button in modal
  const googleLoginBtn = document.getElementById('google-login');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', signInWithGoogle);
  }
  
  // Close modal button
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideLoginModal);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', signOut);
  }
  
  // Close modal when clicking outside
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.addEventListener('click', function(e) {
      if (e.target === loginModal) {
        hideLoginModal();
      }
    });
  }
});

// Authentication state listener
firebase.auth().onAuthStateChanged(function(user) {
  updateAuthUI(user);
  
  // Load featured courses on homepage
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    loadFeaturedCourses();
  }
});

// Load featured courses for homepage
async function loadFeaturedCourses() {
  try {
    const snapshot = await db.collection('courses')
      .where('featured', '==', true)
      .limit(3)
      .get();
    
    const featuredCoursesContainer = document.getElementById('featured-courses');
    if (!featuredCoursesContainer) return;
    
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    featuredCoursesContainer.innerHTML = courses.map(course => createFeaturedCourseCard(course)).join('');
  } catch (error) {
    console.error('Error loading featured courses:', error);
  }
}

// Create featured course card for homepage
function createFeaturedCourseCard(course) {
  const priceHTML = course.price === 0 
    ? '<span class="text-green-600 font-bold text-lg">Free</span>'
    : `<span class="text-blue-600 font-bold text-lg">$${course.price}</span>`;
    
  const ratingHTML = generateStarRating(course.rating);
  
  return `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
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
        
        <h3 class="text-xl font-bold mb-2 text-gray-900">${course.title}</h3>
        <p class="text-gray-600 mb-4 line-clamp-2">${course.description}</p>
        
        <div class="flex items-center mb-4">
          <div class="flex text-yellow-400 mr-2">${ratingHTML}</div>
          <span class="text-sm text-gray-600">${course.rating} (${course.reviews})</span>
        </div>
        
        <div class="flex items-center justify-between">
          ${priceHTML}
          <a href="course-details.html?id=${course.id}" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Learn More
          </a>
        </div>
      </div>
    </div>
  `;
}

// Utility function for star rating (if not already defined)
if (typeof generateStarRating === 'undefined') {
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
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
});

// Add animation classes on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fade-in');
    }
  });
}, observerOptions);

// Observe elements for animations
document.addEventListener('DOMContentLoaded', function() {
  const animateElements = document.querySelectorAll('.course-card, .feature-card');
  animateElements.forEach(el => observer.observe(el));
});