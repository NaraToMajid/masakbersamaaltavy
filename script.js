// Initialize Supabase Client dengan benar
const supabaseUrl = 'https://mqonelsoqyvrasrzrzfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xb25lbHNvcXl2cmFzcnpyemZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjEzOTQsImV4cCI6MjA4MTUzNzM5NH0.exHvN0BA3P71DcZbavZ0DMk8pUEpWQ6VCuH672wEdJ4';

// Membuat supabaseClient
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let currentUser = null;
let categories = [];
let recipes = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded dengan supabaseClient');
    setupEventListeners();
    checkSession();
});

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await login();
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await register();
        });
    }
}

async function checkSession() {
    try {
        const user = localStorage.getItem('masakita_user');
        if (user) {
            currentUser = JSON.parse(user);
            await loadMainPage();
        }
    } catch (error) {
        console.log('Error checking session:', error);
    }
}

// Navigation functions
function showAuth() {
    const landingPage = document.getElementById('landing-page');
    const authPage = document.getElementById('auth-page');
    
    if (landingPage && authPage) {
        landingPage.classList.remove('active');
        authPage.classList.add('active');
    }
}

function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0]?.classList.add('active');
        document.getElementById('login-form')?.classList.add('active');
    } else {
        tabs[1]?.classList.add('active');
        document.getElementById('register-form')?.classList.add('active');
    }
}

async function login() {
    const username = document.getElementById('login-username')?.value;
    const password = document.getElementById('login-password')?.value;

    if (!username || !password) {
        alert('Username dan password harus diisi!');
        return;
    }

    try {
        // Cek admin
        if (username === 'admin' && password === 'Rantauprapat123') {
            currentUser = { 
                username: 'admin', 
                password: 'Rantauprapat123',
                role: 'admin' 
            };
            localStorage.setItem('masakita_user', JSON.stringify(currentUser));
            await loadMainPage();
            return;
        }

        // Cek user biasa pakai supabaseClient
        const { data, error } = await supabaseClient
            .from('masakita_users')
            .select('*')
            .eq('username', username)
            .eq('password', password);

        if (error) {
            console.log('Login error:', error);
            // Fallback: user biasa tanpa DB
            currentUser = { 
                username: username, 
                password: password,
                role: 'user' 
            };
            localStorage.setItem('masakita_user', JSON.stringify(currentUser));
            await loadMainPage();
            return;
        }

        if (data && data.length > 0) {
            currentUser = data[0];
            localStorage.setItem('masakita_user', JSON.stringify(data[0]));
            await loadMainPage();
        } else {
            // User tidak ditemukan di DB, buat baru
            currentUser = { 
                username: username, 
                password: password,
                role: 'user' 
            };
            localStorage.setItem('masakita_user', JSON.stringify(currentUser));
            await loadMainPage();
        }
    } catch (error) {
        console.log('Login error:', error);
        // Fallback
        currentUser = { 
            username: username, 
            password: password,
            role: 'user' 
        };
        localStorage.setItem('masakita_user', JSON.stringify(currentUser));
        await loadMainPage();
    }
}

async function register() {
    const username = document.getElementById('register-username')?.value;
    const password = document.getElementById('register-password')?.value;

    if (!username || !password) {
        alert('Username dan password harus diisi!');
        return;
    }

    if (username.length < 3) {
        alert('Username minimal 3 karakter!');
        return;
    }

    if (password.length < 6) {
        alert('Password minimal 6 karakter!');
        return;
    }

    try {
        // Cek admin
        if (username === 'admin') {
            alert('Username admin tidak tersedia!');
            return;
        }

        // Insert user baru pakai supabaseClient
        const { data, error } = await supabaseClient
            .from('masakita_users')
            .insert([
                { 
                    username: username, 
                    password: password,
                    role: 'user' 
                }
            ])
            .select();

        if (error) {
            console.log('Register error:', error);
            // Fallback: simpan di local storage
            currentUser = { 
                username: username, 
                password: password,
                role: 'user' 
            };
            localStorage.setItem('masakita_user', JSON.stringify(currentUser));
            await loadMainPage();
            return;
        }

        if (data && data.length > 0) {
            currentUser = data[0];
            localStorage.setItem('masakita_user', JSON.stringify(data[0]));
            await loadMainPage();
        } else {
            // Fallback
            currentUser = { 
                username: username, 
                password: password,
                role: 'user' 
            };
            localStorage.setItem('masakita_user', JSON.stringify(currentUser));
            await loadMainPage();
        }
    } catch (error) {
        console.log('Register error:', error);
        
        // Fallback
        currentUser = { 
            username: username, 
            password: password,
            role: 'user' 
        };
        localStorage.setItem('masakita_user', JSON.stringify(currentUser));
        await loadMainPage();
    }
}

async function loadMainPage() {
    const authPage = document.getElementById('auth-page');
    const mainPage = document.getElementById('main-page');
    const adminMenu = document.getElementById('admin-menu');
    
    if (authPage) authPage.classList.remove('active');
    if (mainPage) mainPage.classList.add('active');
    
    // Show admin menu if admin
    if (adminMenu) {
        if (currentUser && (currentUser.username === 'admin' || currentUser.role === 'admin')) {
            adminMenu.style.display = 'flex';
        } else {
            adminMenu.style.display = 'none';
        }
    }
    
    await loadData();
    showSection('home');
}

function logout() {
    localStorage.removeItem('masakita_user');
    currentUser = null;
    
    const mainPage = document.getElementById('main-page');
    const landingPage = document.getElementById('landing-page');
    
    if (mainPage) mainPage.classList.remove('active');
    if (landingPage) landingPage.classList.add('active');
}

function showSection(section) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Cek apakah event ada
    if (window.event && window.event.target) {
        window.event.target.closest('.nav-item')?.classList.add('active');
    }

    // Show section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    const sectionMap = {
        'home': 'home-section',
        'categories': 'categories-section',
        'recipes': 'recipes-section',
        'admin': 'admin-section'
    };
    
    const sectionId = sectionMap[section];
    if (sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.add('active');
            
            // Load data sesuai section
            if (section === 'categories') loadCategories();
            if (section === 'recipes') loadAllRecipes();
            if (section === 'admin') loadAdminData();
        }
    }
}

// Data loading functions
async function loadData() {
    await loadCategories();
    await loadRecipes();
    updateHomePage();
}

async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('masakita_categories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.log('Error loading categories:', error);
            categories = [];
        } else {
            categories = data || [];
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = [];
    }
}

async function loadRecipes() {
    try {
        const { data, error } = await supabaseClient
            .from('masakita_recipes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.log('Error loading recipes:', error);
            recipes = [];
        } else {
            recipes = data || [];
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        recipes = [];
    }
}

function updateHomePage() {
    const latestRecipes = recipes.slice(0, 6);
    displayRecipes(latestRecipes, 'latest-recipes');
}

function displayRecipes(recipesToShow, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (recipesToShow.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada resep</p>';
        return;
    }

    container.innerHTML = recipesToShow.map(recipe => `
        <div class="recipe-card" onclick="showRecipeDetail('${recipe.id}')">
            <img src="${recipe.cover_url || 'https://via.placeholder.com/300x200?text=Resep'}" alt="${recipe.title}">
            <div class="recipe-card-content">
                <h3>${recipe.title}</h3>
                <p>${recipe.description ? recipe.description.substring(0, 100) + '...' : 'Tidak ada deskripsi'}</p>
            </div>
        </div>
    `).join('');
}

function loadCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada kategori</p>';
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}')">
            <img src="${category.image_url || 'https://via.placeholder.com/300x200?text=Kategori'}" alt="${category.name}">
            <div class="category-card-content">
                <h3>${category.name}</h3>
            </div>
        </div>
    `).join('');
}

function loadAllRecipes() {
    displayRecipes(recipes, 'all-recipes');
}

function searchRecipes() {
    const searchTerm = document.getElementById('search-recipes')?.value.toLowerCase() || '';
    const filtered = recipes.filter(recipe => 
        (recipe.title && recipe.title.toLowerCase().includes(searchTerm)) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchTerm))
    );
    displayRecipes(filtered, 'all-recipes');
}

async function showRecipeDetail(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('recipe-detail-section')?.classList.add('active');

    const container = document.getElementById('recipe-detail-content');
    if (!container) return;

    container.innerHTML = `
        <div class="recipe-detail">
            <img src="${recipe.cover_url || 'https://via.placeholder.com/800x400?text=Resep'}" alt="${recipe.title}">
            <h1>${recipe.title}</h1>
            <p>${recipe.description || ''}</p>
            
            <h2>Bahan-bahan:</h2>
            <div class="ingredients">
                <ul>
                    ${recipe.ingredients ? recipe.ingredients.split('\n').map(i => `<li>${i}</li>`).join('') : '<li>Tidak ada bahan</li>'}
                </ul>
            </div>
            
            <h2>Cara Membuat:</h2>
            <div class="steps">
                <ol>
                    ${recipe.steps ? recipe.steps.split('\n').map(s => `<li>${s}</li>`).join('') : '<li>Tidak ada langkah</li>'}
                </ol>
            </div>
        </div>
    `;
}

function showRecipes() {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('recipes-section')?.classList.add('active');
    loadAllRecipes();
}

function filterByCategory(categoryId) {
    const filtered = recipes.filter(r => r.category_id === categoryId);
    displayRecipes(filtered, 'all-recipes');
    showSection('recipes');
}

// Admin functions
function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }
    
    const tabContent = document.getElementById(`admin-${tab}`);
    if (tabContent) tabContent.classList.add('active');
}

async function loadAdminData() {
    await loadCategories();
    await loadRecipes();
    
    // Load categories for recipe form
    const categorySelect = document.getElementById('recipe-category');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Pilih Kategori</option>' +
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    // Display categories in admin list
    const categoriesList = document.getElementById('categories-admin-list');
    if (categoriesList) {
        categoriesList.innerHTML = categories.map(category => `
            <div class="admin-list-item">
                <div>
                    <h4>${category.name}</h4>
                </div>
                <div class="actions">
                    <button class="edit-btn" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Display recipes in admin list
    const recipesList = document.getElementById('recipes-admin-list');
    if (recipesList) {
        recipesList.innerHTML = recipes.map(recipe => `
            <div class="admin-list-item">
                <div>
                    <h4>${recipe.title}</h4>
                    <p>${recipe.description ? recipe.description.substring(0, 50) + '...' : 'Tidak ada deskripsi'}</p>
                </div>
                <div class="actions">
                    <button class="edit-btn" onclick="editRecipe('${recipe.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteRecipe('${recipe.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

async function addCategory() {
    const name = document.getElementById('category-name')?.value;
    const file = document.getElementById('category-image')?.files[0];

    if (!name) {
        alert('Nama kategori harus diisi!');
        return;
    }

    try {
        let imageUrl = null;

        if (file) {
            const fileName = `categories/${Date.now()}_${file.name}`;
            // Upload file menggunakan supabaseClient.storage
            const { error: uploadError } = await supabaseClient.storage
                .from('masakita-images')
                .upload(fileName, file);

            if (uploadError) {
                console.log('Upload error:', uploadError);
            } else {
                // Get public URL
                const { data } = supabaseClient.storage
                    .from('masakita-images')
                    .getPublicUrl(fileName);
                imageUrl = data.publicUrl;
            }
        }

        // Insert menggunakan supabaseClient
        const { error } = await supabaseClient
            .from('masakita_categories')
            .insert([{ 
                name: name, 
                image_url: imageUrl 
            }]);

        if (error) {
            console.log('Insert error:', error);
            alert('Gagal menambahkan kategori: ' + error.message);
            return;
        }

        alert('Kategori berhasil ditambahkan!');
        
        // Reset form
        const nameInput = document.getElementById('category-name');
        const imageInput = document.getElementById('category-image');
        if (nameInput) nameInput.value = '';
        if (imageInput) imageInput.value = '';
        
        await loadAdminData();
    } catch (error) {
        console.log('Error:', error);
        alert('Gagal menambahkan kategori: ' + error.message);
    }
}

async function addRecipe() {
    const categoryId = document.getElementById('recipe-category')?.value;
    const title = document.getElementById('recipe-title')?.value;
    const description = document.getElementById('recipe-description')?.value;
    const file = document.getElementById('recipe-cover')?.files[0];
    const ingredients = document.getElementById('recipe-ingredients')?.value;
    const steps = document.getElementById('recipe-steps')?.value;

    if (!categoryId || !title || !description || !ingredients || !steps) {
        alert('Semua field harus diisi!');
        return;
    }

    try {
        let coverUrl = null;

        if (file) {
            const fileName = `recipes/${Date.now()}_${file.name}`;
            // Upload file menggunakan supabaseClient.storage
            const { error: uploadError } = await supabaseClient.storage
                .from('masakita-images')
                .upload(fileName, file);

            if (uploadError) {
                console.log('Upload error:', uploadError);
            } else {
                // Get public URL
                const { data } = supabaseClient.storage
                    .from('masakita-images')
                    .getPublicUrl(fileName);
                coverUrl = data.publicUrl;
            }
        }

        // Insert menggunakan supabaseClient
        const { error } = await supabaseClient
            .from('masakita_recipes')
            .insert([{
                category_id: categoryId,
                title: title,
                description: description,
                cover_url: coverUrl,
                ingredients: ingredients,
                steps: steps
            }]);

        if (error) {
            console.log('Insert error:', error);
            alert('Gagal menambahkan resep: ' + error.message);
            return;
        }

        alert('Resep berhasil ditambahkan!');
        
        // Reset form
        const inputs = ['recipe-category', 'recipe-title', 'recipe-description', 'recipe-cover', 'recipe-ingredients', 'recipe-steps'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'file') {
                    el.value = '';
                } else {
                    el.value = '';
                }
            }
        });
        
        await loadAdminData();
    } catch (error) {
        console.log('Error:', error);
        alert('Gagal menambahkan resep: ' + error.message);
    }
}

async function uploadLogo() {
    const file = document.getElementById('logo-upload')?.files[0];

    if (!file) {
        alert('Pilih file logo terlebih dahulu!');
        return;
    }

    if (!file.name.toLowerCase().endsWith('.webp')) {
        alert('File harus berformat .webp!');
        return;
    }

    try {
        const fileName = `logo_${Date.now()}.webp`;
        
        // Upload file menggunakan supabaseClient.storage
        const { error: uploadError } = await supabaseClient.storage
            .from('masakita-images')
            .upload(fileName, file);

        if (uploadError) {
            console.log('Upload error:', uploadError);
            alert('Gagal mengupload logo: ' + uploadError.message);
            return;
        }

        // Get public URL
        const { data } = supabaseClient.storage
            .from('masakita-images')
            .getPublicUrl(fileName);

        // Update logo di semua tempat
        document.querySelectorAll('img[alt*="Logo"], img[alt*="Masakita"]').forEach(img => {
            img.src = data.publicUrl;
        });

        alert('Logo berhasil diupload!');
        
        const logoUpload = document.getElementById('logo-upload');
        if (logoUpload) logoUpload.value = '';
        
    } catch (error) {
        console.log('Error:', error);
        alert('Gagal mengupload logo: ' + error.message);
    }
}

async function deleteCategory(id) {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;

    try {
        const { error } = await supabaseClient
            .from('masakita_categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.log('Delete error:', error);
            alert('Gagal menghapus kategori: ' + error.message);
            return;
        }

        alert('Kategori berhasil dihapus!');
        await loadAdminData();
    } catch (error) {
        console.log('Error:', error);
        alert('Gagal menghapus kategori: ' + error.message);
    }
}

async function deleteRecipe(id) {
    if (!confirm('Yakin ingin menghapus resep ini?')) return;

    try {
        const { error } = await supabaseClient
            .from('masakita_recipes')
            .delete()
            .eq('id', id);

        if (error) {
            console.log('Delete error:', error);
            alert('Gagal menghapus resep: ' + error.message);
            return;
        }

        alert('Resep berhasil dihapus!');
        await loadAdminData();
    } catch (error) {
        console.log('Error:', error);
        alert('Gagal menghapus resep: ' + error.message);
    }
}

// Edit functions (placeholder)
function editCategory(id) {
    alert('Fitur edit sedang dalam pengembangan');
}

function editRecipe(id) {
    alert('Fitur edit sedang dalam pengembangan');
}
