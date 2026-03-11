// Initialize Supabase client
const supabaseUrl = 'https://mqonelsoqyvrasrzrzfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xb25lbHNvcXl2cmFzcnpyemZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjEzOTQsImV4cCI6MjA4MTUzNzM5NH0.exHvN0BA3P71DcZbavZ0DMk8pUEpWQ6VCuH672wEdJ4';

const supabaseclient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let currentUser = null;
let categories = [];
let recipes = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkSession();
    loadDefaultLogo();
});

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await login();
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await register();
    });
}

async function checkSession() {
    const user = localStorage.getItem('masakita_user');
    if (user) {
        currentUser = JSON.parse(user);
        await loadMainPage();
    }
}

// Navigation functions
function showAuth() {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('auth-page').classList.add('active');
}

function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabase
            .from('masakita_users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            alert('Username atau password salah!');
            return;
        }

        currentUser = data;
        localStorage.setItem('masakita_user', JSON.stringify(data));
        await loadMainPage();
    } catch (error) {
        alert('Terjadi kesalahan!');
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        // Check if username exists
        const { data: existingUser } = await supabase
            .from('masakita_users')
            .select('*')
            .eq('username', username)
            .single();

        if (existingUser) {
            alert('Username sudah digunakan!');
            return;
        }

        // Create new user
        const { data, error } = await supabase
            .from('masakita_users')
            .insert([
                { username, password, role: 'user' }
            ])
            .select()
            .single();

        if (error) throw error;

        currentUser = data;
        localStorage.setItem('masakita_user', JSON.stringify(data));
        await loadMainPage();
    } catch (error) {
        alert('Gagal mendaftar!');
    }
}

async function loadMainPage() {
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    
    // Show admin menu if admin
    if (currentUser.username === 'admin' && currentUser.password === 'Rantauprapat123') {
        document.getElementById('admin-menu').style.display = 'flex';
    }
    
    await loadData();
    showSection('home');
}

function logout() {
    localStorage.removeItem('masakita_user');
    currentUser = null;
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('landing-page').classList.add('active');
}

function showSection(section) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');

    // Show section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    switch(section) {
        case 'home':
            document.getElementById('home-section').classList.add('active');
            break;
        case 'categories':
            document.getElementById('categories-section').classList.add('active');
            loadCategories();
            break;
        case 'recipes':
            document.getElementById('recipes-section').classList.add('active');
            loadAllRecipes();
            break;
        case 'admin':
            document.getElementById('admin-section').classList.add('active');
            loadAdminData();
            break;
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
        const { data, error } = await supabase
            .from('masakita_categories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        categories = data || [];
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadRecipes() {
    try {
        const { data, error } = await supabase
            .from('masakita_recipes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        recipes = data || [];
    } catch (error) {
        console.error('Error loading recipes:', error);
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
            <img src="${recipe.cover_url || 'default-recipe.jpg'}" alt="${recipe.title}">
            <div class="recipe-card-content">
                <h3>${recipe.title}</h3>
                <p>${recipe.description.substring(0, 100)}...</p>
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
            <img src="${category.image_url || 'default-category.jpg'}" alt="${category.name}">
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
    const searchTerm = document.getElementById('search-recipes').value.toLowerCase();
    const filtered = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm)
    );
    displayRecipes(filtered, 'all-recipes');
}

async function showRecipeDetail(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('recipe-detail-section').classList.add('active');

    const container = document.getElementById('recipe-detail-content');
    container.innerHTML = `
        <div class="recipe-detail">
            <img src="${recipe.cover_url || 'default-recipe.jpg'}" alt="${recipe.title}">
            <h1>${recipe.title}</h1>
            <p>${recipe.description}</p>
            
            <h2>Bahan-bahan:</h2>
            <div class="ingredients">
                <ul>
                    ${recipe.ingredients.split('\n').map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
            
            <h2>Cara Membuat:</h2>
            <div class="steps">
                <ol>
                    ${recipe.steps.split('\n').map(s => `<li>${s}</li>`).join('')}
                </ol>
            </div>
        </div>
    `;
}

function showRecipes() {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('recipes-section').classList.add('active');
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
    
    event.target.classList.add('active');
    document.getElementById(`admin-${tab}`).classList.add('active');
}

async function loadAdminData() {
    await loadCategories();
    await loadRecipes();
    
    // Load categories for recipe form
    const categorySelect = document.getElementById('recipe-category');
    categorySelect.innerHTML = '<option value="">Pilih Kategori</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Display categories in admin list
    const categoriesList = document.getElementById('categories-admin-list');
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

    // Display recipes in admin list
    const recipesList = document.getElementById('recipes-admin-list');
    recipesList.innerHTML = recipes.map(recipe => `
        <div class="admin-list-item">
            <div>
                <h4>${recipe.title}</h4>
                <p>${recipe.description.substring(0, 50)}...</p>
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

async function addCategory() {
    const name = document.getElementById('category-name').value;
    const file = document.getElementById('category-image').files[0];

    if (!name) {
        alert('Nama kategori harus diisi!');
        return;
    }

    try {
        let imageUrl = null;

        if (file) {
            const fileName = `categories/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('masakita-images')
                .upload(fileName, file);

            if (!uploadError) {
                const { data } = supabase.storage
                    .from('masakita-images')
                    .getPublicUrl(fileName);
                imageUrl = data.publicUrl;
            }
        }

        const { error } = await supabase
            .from('masakita_categories')
            .insert([{ name, image_url: imageUrl }]);

        if (error) throw error;

        alert('Kategori berhasil ditambahkan!');
        document.getElementById('category-name').value = '';
        document.getElementById('category-image').value = '';
        await loadAdminData();
    } catch (error) {
        alert('Gagal menambahkan kategori!');
    }
}

async function addRecipe() {
    const categoryId = document.getElementById('recipe-category').value;
    const title = document.getElementById('recipe-title').value;
    const description = document.getElementById('recipe-description').value;
    const file = document.getElementById('recipe-cover').files[0];
    const ingredients = document.getElementById('recipe-ingredients').value;
    const steps = document.getElementById('recipe-steps').value;

    if (!categoryId || !title || !description || !ingredients || !steps) {
        alert('Semua field harus diisi!');
        return;
    }

    try {
        let coverUrl = null;

        if (file) {
            const fileName = `recipes/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('masakita-images')
                .upload(fileName, file);

            if (!uploadError) {
                const { data } = supabase.storage
                    .from('masakita-images')
                    .getPublicUrl(fileName);
                coverUrl = data.publicUrl;
            }
        }

        const { error } = await supabase
            .from('masakita_recipes')
            .insert([{
                category_id: categoryId,
                title,
                description,
                cover_url: coverUrl,
                ingredients,
                steps
            }]);

        if (error) throw error;

        alert('Resep berhasil ditambahkan!');
        document.getElementById('recipe-category').value = '';
        document.getElementById('recipe-title').value = '';
        document.getElementById('recipe-description').value = '';
        document.getElementById('recipe-cover').value = '';
        document.getElementById('recipe-ingredients').value = '';
        document.getElementById('recipe-steps').value = '';
        await loadAdminData();
    } catch (error) {
        alert('Gagal menambahkan resep!');
    }
}

async function uploadLogo() {
    const file = document.getElementById('logo-upload').files[0];

    if (!file) {
        alert('Pilih file logo terlebih dahulu!');
        return;
    }

    if (!file.name.endsWith('.webp')) {
        alert('File harus berformat .webp!');
        return;
    }

    try {
        const fileName = `logo_${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage
            .from('masakita-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('masakita-images')
            .getPublicUrl(fileName);

        // Update logo in all places
        document.querySelectorAll('img[alt*="Logo"]').forEach(img => {
            img.src = data.publicUrl;
        });

        alert('Logo berhasil diupload!');
        document.getElementById('logo-upload').value = '';
    } catch (error) {
        alert('Gagal mengupload logo!');
    }
}

async function deleteCategory(id) {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;

    try {
        const { error } = await supabase
            .from('masakita_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Kategori berhasil dihapus!');
        await loadAdminData();
    } catch (error) {
        alert('Gagal menghapus kategori!');
    }
}

async function deleteRecipe(id) {
    if (!confirm('Yakin ingin menghapus resep ini?')) return;

    try {
        const { error } = await supabase
            .from('masakita_recipes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Resep berhasil dihapus!');
        await loadAdminData();
    } catch (error) {
        alert('Gagal menghapus resep!');
    }
}

function loadDefaultLogo() {
    // Default logo handling
}
