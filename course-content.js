let currentUser = null;
let currentCourse = null;
let currentEnrollment = null;
let currentSection = null;

// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

// DOM Elements
const courseTitleElement = document.getElementById('course-title');
const courseProgressElement = document.getElementById('course-progress');
const courseSectionsElement = document.getElementById('course-sections');
const contentArea = document.getElementById('content-area');
const loadingElement = document.getElementById('loading');
const sectionTitleElement = document.getElementById('section-title');
const lecturesListElement = document.getElementById('lectures-list');
const notesListElement = document.getElementById('notes-list');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const videoDescription = document.getElementById('video-description');

// Authentication state listener
firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    updateAuthUI(user);
    
    if (user) {
        loadCourseContent();
    } else {
        window.location.href = 'my-courses.html';
    }
});

// Load course content
async function loadCourseContent() {
    if (!courseId || !currentUser) {
        window.location.href = 'my-courses.html';
        return;
    }

    try {
        // Get course details
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (!courseDoc.exists) {
            throw new Error('Course not found');
        }
        
        currentCourse = { id: courseDoc.id, ...courseDoc.data() };
        
        // Get enrollment details
        const enrollmentSnapshot = await db.collection('enrollments')
            .where('userId', '==', currentUser.uid)
            .where('courseId', '==', courseId)
            .get();
            
        if (enrollmentSnapshot.empty) {
            alert('You are not enrolled in this course');
            window.location.href = 'courses.html';
            return;
        }
        
        currentEnrollment = { id: enrollmentSnapshot.docs[0].id, ...enrollmentSnapshot.docs[0].data() };
        
        // Display course info
        courseTitleElement.textContent = currentCourse.title;
        courseProgressElement.textContent = `Progress: ${Math.round(currentEnrollment.progress || 0)}%`;
        
        // Load course sections
        loadCourseSections();
        
        loadingElement.classList.add('hidden');
        contentArea.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading course content:', error);
        alert('Error loading course content');
        window.location.href = 'my-courses.html';
    }
}

// Load course sections
async function loadCourseSections() {
    try {
        // Get course sections from Firestore
        const sectionsSnapshot = await db.collection('courseSections')
            .where('courseId', '==', courseId)
            .orderBy('order')
            .get();
        
        let sections = [];
        if (sectionsSnapshot.empty) {
            // Create sample sections if none exist
            sections = await createSampleSections();
        } else {
            sections = sectionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        
        displayCourseSections(sections);
        
    } catch (error) {
        console.error('Error loading sections:', error);
        // Create sample sections as fallback
        const sections = await createSampleSections();
        displayCourseSections(sections);
    }
}

// Create sample sections for demonstration
async function createSampleSections() {
    const sampleSections = [
        {
            title: "Day 1: Introduction & Setup",
            order: 1,
            lectures: [
                {
                    title: "Welcome to the Course",
                    duration: "10:30",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description: "Introduction to the course and what you'll learn"
                },
                {
                    title: "Environment Setup",
                    duration: "15:45",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description: "Setting up your development environment"
                }
            ],
            notes: [
                {
                    title: "Course Syllabus",
                    type: "PDF",
                    downloadUrl: "#",
                    description: "Complete course outline and schedule"
                },
                {
                    title: "Setup Guide",
                    type: "PDF",
                    downloadUrl: "#",
                    description: "Step-by-step installation guide"
                }
            ]
        },
        {
            title: "Day 2: Fundamentals",
            order: 2,
            lectures: [
                {
                    title: "Core Concepts",
                    duration: "20:15",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description: "Understanding the fundamental concepts"
                },
                {
                    title: "Practical Examples",
                    duration: "25:30",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description: "Hands-on examples and exercises"
                }
            ],
            notes: [
                {
                    title: "Fundamentals Cheat Sheet",
                    type: "PDF",
                    downloadUrl: "#",
                    description: "Quick reference for core concepts"
                },
                {
                    title: "Practice Exercises",
                    type: "ZIP",
                    downloadUrl: "#",
                    description: "Downloadable practice files"
                }
            ]
        },
        {
            title: "Day 3: Advanced Topics",
            order: 3,
            lectures: [
                {
                    title: "Advanced Techniques",
                    duration: "30:20",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description: "Advanced concepts and best practices"
                },
                {
                    title: "Real-world Project",
                    duration: "45:10",
                    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description: "Building a complete project from scratch"
                }
            ],
            notes: [
                {
                    title: "Advanced Guide",
                    type: "PDF",
                    downloadUrl: "#",
                    description: "Comprehensive guide to advanced topics"
                },
                {
                    title: "Project Source Code",
                    type: "ZIP",
                    downloadUrl: "#",
                    description: "Complete project files and resources"
                }
            ]
        }
    ];
    
    // Save sample sections to Firestore
    try {
        for (const section of sampleSections) {
            await db.collection('courseSections').add({
                ...section,
                courseId: courseId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error creating sample sections:', error);
    }
    
    return sampleSections;
}

// Display course sections in sidebar
function displayCourseSections(sections) {
    courseSectionsElement.innerHTML = sections.map((section, index) => `
        <div class="section-item border-b border-gray-200 pb-2 mb-2 last:border-b-0">
            <button onclick="selectSection(${index})" class="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors ${index === 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}">
                <div class="font-semibold">${section.title}</div>
                <div class="text-sm text-gray-500 mt-1">
                    ${section.lectures?.length || 0} lectures • ${section.notes?.length || 0} materials
                </div>
            </button>
        </div>
    `).join('');
    
    // Store sections globally and select first section
    window.courseSections = sections;
    if (sections.length > 0) {
        selectSection(0);
    }
}

// Select a section
function selectSection(index) {
    currentSection = window.courseSections[index];
    
    // Update active section in sidebar
    document.querySelectorAll('.section-item button').forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('bg-blue-100', 'text-blue-700');
            btn.classList.remove('text-gray-700');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-700');
            btn.classList.add('text-gray-700');
        }
    });
    
    // Update section title
    sectionTitleElement.textContent = currentSection.title;
    
    // Load section content
    loadSectionContent();
}

// Load section content (lectures and notes)
function loadSectionContent() {
    if (!currentSection) return;
    
    // Load lectures
    loadLectures();
    
    // Load notes
    loadNotes();
}

// Load lectures for current section
function loadLectures() {
    const lectures = currentSection.lectures || [];
    
    if (lectures.length === 0) {
        lecturesListElement.innerHTML = '<p class="text-gray-500 text-center py-8">No lectures available for this section.</p>';
        return;
    }
    
    lecturesListElement.innerHTML = lectures.map((lecture, index) => `
        <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h4 class="font-semibold text-lg mb-1">${lecture.title}</h4>
                    <p class="text-gray-600 text-sm mb-2">${lecture.description}</p>
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        ${lecture.duration}
                    </div>
                </div>
                <button onclick="playVideo(${index})" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 18h6"></path>
                    </svg>
                    Play
                </button>
            </div>
        </div>
    `).join('');
}

// Load notes for current section
function loadNotes() {
    const notes = currentSection.notes || [];
    
    if (notes.length === 0) {
        notesListElement.innerHTML = '<p class="text-gray-500 text-center py-8">No study materials available for this section.</p>';
        return;
    }
    
    notesListElement.innerHTML = notes.map((note, index) => `
        <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex items-center flex-1">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        ${getFileIcon(note.type)}
                    </div>
                    <div>
                        <h4 class="font-semibold text-lg mb-1">${note.title}</h4>
                        <p class="text-gray-600 text-sm">${note.description}</p>
                        <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">${note.type}</span>
                    </div>
                </div>
                <button onclick="downloadMaterial('${note.downloadUrl}', '${note.title}')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Download
                </button>
            </div>
        </div>
    `).join('');
}

// Get file icon based on type
function getFileIcon(type) {
    switch (type.toLowerCase()) {
        case 'pdf':
            return '📄';
        case 'zip':
            return '📦';
        case 'doc':
        case 'docx':
            return '📝';
        case 'ppt':
        case 'pptx':
            return '📊';
        default:
            return '📁';
    }
}

// Play video in modal
function playVideo(lectureIndex) {
    const lecture = currentSection.lectures[lectureIndex];
    if (!lecture) return;
    
    videoTitle.textContent = lecture.title;
    videoDescription.textContent = lecture.description;
    videoPlayer.src = lecture.videoUrl;
    videoModal.classList.remove('hidden');
    
    // Mark lecture as watched (update progress)
    updateProgress();
}

// Download study material
function downloadMaterial(url, title) {
    if (url === '#') {
        alert(`This is a demo. In a real application, "${title}" would be downloaded.`);
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update course progress
async function updateProgress() {
    try {
        const newProgress = Math.min((currentEnrollment.progress || 0) + 5, 100);
        const isCompleted = newProgress >= 100;
        
        await db.collection('enrollments').doc(currentEnrollment.id).update({
            progress: newProgress,
            completed: isCompleted,
            lastAccessed: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        currentEnrollment.progress = newProgress;
        courseProgressElement.textContent = `Progress: ${Math.round(newProgress)}%`;
        
        if (isCompleted) {
            alert('Congratulations! You have completed this course!');
        }
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// Tab switching
document.getElementById('tab-lectures').addEventListener('click', function() {
    switchTab('lectures');
});

document.getElementById('tab-notes').addEventListener('click', function() {
    switchTab('notes');
});

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    document.getElementById(`tab-${tabName}`).classList.add('active', 'border-blue-500', 'text-blue-600');
    document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-gray-500');
    
    // Show/hide content
    document.getElementById('lectures-content').classList.toggle('hidden', tabName !== 'lectures');
    document.getElementById('notes-content').classList.toggle('hidden', tabName !== 'notes');
}

// Close video modal
document.getElementById('close-video').addEventListener('click', function() {
    videoModal.classList.add('hidden');
    videoPlayer.src = '';
});

// Close modal when clicking outside
videoModal.addEventListener('click', function(e) {
    if (e.target === videoModal) {
        videoModal.classList.add('hidden');
        videoPlayer.src = '';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!courseId) {
        window.location.href = 'my-courses.html';
    }
});